# API Design — IntervuAI

## 1. REST API (Node/Express backend)

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Email/password signup |
| POST | `/api/auth/login` | Email/password login → JWT |
| POST | `/api/auth/google` | OAuth callback |
| GET | `/api/auth/me` | Get current user profile |

### Sessions
| Method | Route | Description |
|---|---|---|
| GET | `/api/sessions/can-start` | Checks plan + usage limit before starting |
| POST | `/api/sessions` | Create a new session record, returns `session_id` + short-lived WS token |
| GET | `/api/sessions` | List user's past sessions (paginated) |
| GET | `/api/sessions/:id` | Get one session + its report |
| PATCH | `/api/sessions/:id/end` | Mark session ended, trigger report generation (proxies to AI service) |

### Reports
| Method | Route | Description |
|---|---|---|
| GET | `/api/reports/:sessionId` | Get feedback report |
| GET | `/api/reports/:sessionId/pdf` | Download PDF (Pro only, 403 if free) |

### Subscriptions & Payments
| Method | Route | Description |
|---|---|---|
| GET | `/api/subscription` | Current plan + status |
| POST | `/api/payments/create-order` | Create Razorpay order / Stripe checkout session |
| POST | `/api/payments/webhook` | Gateway webhook receiver (no auth, signature-verified) |
| POST | `/api/subscription/cancel` | Cancel at period end |

### Questions (proxied or direct to AI service)
| Method | Route | Description |
|---|---|---|
| POST | `/api/questions/generate` | role + difficulty (+ resume if Pro) → question list |

## 2. WebSocket API (FastAPI AI service)

**Endpoint:** `wss://ai.intervuai.app/ws/interview/{session_id}?token={short_lived_token}`

### Client → Server events
| Event | Payload | Description |
|---|---|---|
| `audio_chunk` | binary PCM frame | Streamed every ~250ms |
| `start_question` | `{ question_id }` | Signals which question is being answered |
| `end_session` | `{}` | User finishes the interview |

### Server → Client events
| Event | Payload | Description |
|---|---|---|
| `transcript_partial` | `{ text }` | Interim STT result |
| `transcript_final` | `{ text, question_id }` | Finalized chunk |
| `live_signal` | `{ filler_count, pace_wpm, silence_flag }` | Real-time coaching signal |
| `question` | `{ question_id, text }` | Next interview question from AI interviewer |
| `report_ready` | `{ session_id }` | Feedback generation complete, frontend fetches via REST |
| `error` | `{ message }` | Any pipeline failure |

## 3. Sample Request/Response

**POST `/api/sessions`**
```json
// Request
{ "role": "Frontend Developer", "difficulty": "medium" }

// Response
{
  "session_id": "b3f1...",
  "ws_token": "eyJhbGciOi...",
  "ws_url": "wss://ai.intervuai.app/ws/interview/b3f1..."
}
```

**GET `/api/reports/:sessionId`**
```json
{
  "overall_score": 78,
  "strengths": ["Clear structure in answers", "Good use of examples"],
  "areas_to_improve": ["Reduce filler words", "Slow down pace slightly"],
  "per_question_feedback": [
    {
      "question": "Tell me about a challenging project.",
      "feedback": "Good STAR structure but answer ran long.",
      "suggested_answer": "..."
    }
  ],
  "filler_word_count": 14,
  "avg_pace_wpm": 165
}
```

## 4. Webhook Payload Handling (Razorpay example)

```
POST /api/payments/webhook
Headers: X-Razorpay-Signature: <hmac>

1. Verify signature using webhook secret (reject if invalid → 400)
2. Check payments.gateway_payment_id not already processed (idempotency)
3. Switch on event type:
   - payment.captured → insert payment row, activate/renew subscription
   - subscription.cancelled → set subscriptions.status = 'canceled'
   - payment.failed → insert payment row with status 'failed', notify user
4. Return 200 quickly (gateway retries on non-2xx)
```
