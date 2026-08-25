# Implementation Roadmap — IntervuAI

Estimated for a solo builder working part-time (~2-3 hrs/day). Adjust pace as needed — order matters more than exact timing.

## Phase 0 — Setup (Day 1-2)
- [ ] Create repos, folder structure (frontend / backend / ai-service)
- [ ] Set up Supabase project (Postgres + Storage)
- [ ] Set up free accounts: Groq, Gemini, Deepgram, Razorpay (test mode)
- [ ] Deploy empty "hello world" versions of all 3 services to Vercel/Render to validate the pipeline early

## Phase 1 — Auth & Core Backend (Day 3-6)
- [ ] `users` table + signup/login (JWT)
- [ ] Google OAuth
- [ ] `GET /api/auth/me`
- [ ] Basic protected-route middleware

## Phase 2 — Interview Session Core, No AI Yet (Day 7-10)
- [ ] `interview_sessions`, `session_questions` tables
- [ ] `POST /api/sessions`, `GET /api/sessions`, `PATCH /api/sessions/:id/end`
- [ ] Frontend: onboarding screen + basic interview room shell (no live audio yet, just static question list)

## Phase 3 — Real-Time Audio Pipeline (Day 11-16) — hardest part, budget the most time
- [ ] FastAPI WebSocket endpoint skeleton
- [ ] Client-side mic capture + 16kHz PCM downsampling (reuse logic pattern from your resume project)
- [ ] Wire to Deepgram live STT (or Web Speech API as free fallback)
- [ ] Live signal detection: filler words, WPM, silence gaps
- [ ] Frontend: live transcript + live badges UI

## Phase 4 — AI Question & Feedback Generation (Day 17-20)
- [ ] Question generation endpoint (Groq/Gemini), role + difficulty → 5 questions
- [ ] End-of-session feedback generation (structured JSON prompt)
- [ ] `reports` table + `GET /api/reports/:sessionId`
- [ ] Frontend: report page

## Phase 5 — Payments (Day 21-25)
- [ ] Razorpay/Stripe test account + subscription plan setup
- [ ] `subscriptions`, `payments` tables
- [ ] `POST /api/payments/create-order` + checkout UI
- [ ] Webhook endpoint + signature verification + idempotency
- [ ] Usage-limit middleware wired into session creation
- [ ] Upgrade modal + pricing page

## Phase 6 — Pro Features & Polish (Day 26-30)
- [ ] PDF report generation (Pro only)
- [ ] Dashboard with session history + score trend chart
- [ ] Resume-tailored question generation (Pro)
- [ ] Cancel-subscription flow
- [ ] Landing page copy + design pass (this matters a lot for first impressions)

## Phase 7 — Deploy, Test, Document (Day 31-33)
- [ ] Deploy all services (see 09-deployment-guide.md)
- [ ] End-to-end test: signup → free interview x2 → hit limit → upgrade (test card) → unlimited access → cancel
- [ ] Write a strong README with architecture diagram, live demo link, GIF/video walkthrough
- [ ] Add "Known limitations / free-tier caveats" section to README (cold starts, etc.) — shows maturity, not weakness

## Cut Scope If Short on Time (in priority order to drop)
1. Resume-tailored questions (keep generic role-based ones)
2. PDF export (keep in-app report only)
3. Google OAuth (email/password only)
4. Score trend charts (keep flat session list)
5. Dual gateway support (pick just Razorpay OR Stripe)

**Never cut:** the real-time audio pipeline or the payment webhook flow — those two are the entire point of this project.
