# System Design — IntervuAI

## 1. Real-Time Audio Pipeline

This is the technical heart of the project, similar to your resume's transcription project.

```
Browser Mic → MediaRecorder/AudioWorklet
   → downsample to 16kHz PCM (client-side)
   → WebSocket send (binary frames, ~250ms chunks)
   → FastAPI WebSocket handler
        → forward to Deepgram live STT (or Web Speech API fallback)
        → receive interim + final transcript chunks
        → run live signal detection on final chunks:
            - filler word count (um, uh, like, you know)
            - words-per-minute (rolling window)
            - silence gap detection (> 3s pause)
        → push {transcript_chunk, signals} back over WebSocket
   → Frontend updates transcript UI + live signal badges in real time
```

**Key engineering decisions to document in your README (interviewers love this):**
- Why WebSockets over polling: sub-second feedback needs a persistent connection
- Per-session isolated state (dict keyed by session_id, cleared on disconnect) — prevents cross-user data leakage, same pattern as your transcription project
- Client-side downsampling to reduce bandwidth before sending over the socket
- Reconnect/keep-alive handling for flaky connections

## 2. AI Feedback Engine

After the interview ends (all Q&A transcript collected):

```
Full transcript + question list
   → prompt template (structured, asks for JSON output)
   → LLM call (Groq for speed, or Gemini)
   → parse JSON response:
        {
          overall_score: 0-100,
          strengths: [...],
          areas_to_improve: [...],
          per_question_feedback: [
            { question, answer_summary, feedback, suggested_answer }
          ],
          filler_word_summary: {...},
          pace_summary: {...}
        }
   → store in `reports` table
   → (Pro tier only) generate PDF via a template
```

**Reliability notes:**
- Always instruct the LLM to return *only* valid JSON, and wrap parsing in try/catch with a retry-once fallback.
- Add a timeout + fallback message ("Report generation delayed, check back in a minute") so a slow LLM call never breaks the UX.

## 3. Usage-Limit Enforcement (Free vs Pro)

Middleware on the Node backend, runs before allowing a new interview session to start:

```
GET /api/sessions/can-start
  → look up user's plan (free/pro) and current billing period
  → count sessions this month (or check the pro flag)
  → if free AND count >= 2 → 403 { reason: "limit_reached", upgrade_url }
  → else → 200 { allowed: true }
```

This same pattern gates PDF export and full session history — check plan → allow/deny → frontend shows upgrade prompt on denial.

## 4. Scalability Notes (mention these even if you don't fully implement them — shows awareness)

- WebSocket connections are stateful — if scaled beyond one instance, would need sticky sessions or a shared pub/sub (Redis) to route audio to the right worker.
- LLM calls are the main latency/cost driver — could add response caching for repeated generic questions.
- Webhook idempotency (see payment doc) prevents duplicate-charge bugs under retries.

## 5. Security Considerations

- JWT auth on all REST routes; WebSocket connections authenticated via a short-lived token passed in the connection URL/query param, validated before accepting the socket.
- Webhook signature verification (Razorpay/Stripe both sign payloads — never trust an unverified webhook body).
- Rate-limit the question-generation and feedback endpoints to prevent abuse of your free LLM API quota.
- Never expose LLM/payment API keys to the frontend — all third-party calls go through your backend.

## 6. Failure Modes to Handle Gracefully

| Failure | Handling |
|---|---|
| STT provider down/rate-limited | Fallback to browser Web Speech API |
| LLM call times out | Retry once, then show "delayed" state, allow manual refresh |
| WebSocket drops mid-interview | Buffer locally, attempt reconnect, resume session by session_id |
| Webhook arrives twice | Check payment_id already processed before updating DB (idempotency key) |
| User's card fails (test mode) | Show clear error, keep them on free tier, no partial state |
