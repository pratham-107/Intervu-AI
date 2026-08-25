# Product Overview — IntervuAI

## 1. Problem Statement

Job seekers preparing for technical/behavioral interviews have no easy way to practice out loud and get objective, real-time feedback on delivery — pacing, filler words, clarity, confidence — not just answer content. Most "AI interview" tools are either text-only chatbots or expensive enterprise products.

## 2. Solution

IntervuAI lets a user:
1. Pick a role/domain (e.g., "Frontend Developer", "Product Manager").
2. Do a **live voice mock interview** with an AI interviewer that asks role-relevant questions.
3. Get **real-time signals** during the session (filler-word count, pace, silence gaps).
4. Receive a **structured post-interview report**: strengths, weaknesses, per-question feedback, suggested improvements, and a downloadable PDF.
5. Track progress across sessions on a dashboard.

## 3. Target Users

- Final-year students / new grads preparing for placements
- Working professionals prepping for job switches
- Anyone who wants low-stakes interview practice before the real thing

## 4. Core Features (MVP)

| Feature | Description |
|---|---|
| Auth | Email/password + Google OAuth |
| Role selection | Pick a job role/domain, difficulty level |
| Live mock interview | Voice-based Q&A with AI interviewer, live transcription |
| Real-time coaching signals | Filler words, pace (WPM), long-pause detection |
| Post-session report | AI-generated structured feedback (strengths, gaps, sample better answers) |
| Session history dashboard | Past sessions, score trends over time |
| PDF export | Downloadable feedback report |

## 5. Pro Features (Paid — this is where payment integration lives)

| Feature | Free Tier | Pro Tier |
|---|---|---|
| Mock interviews / month | 2 | Unlimited |
| Feedback depth | Basic (overall score) | Detailed (per-question, tone analysis) |
| Question sets | Generic | Role + resume-tailored questions |
| PDF reports | ❌ | ✅ |
| Session history | Last 2 sessions | Full history + analytics |
| Priority AI model | Standard | Faster/better model |

Pricing suggestion (for demo purposes): ₹299/month or ₹2,499/year (India), $4.99/month (international) — doesn't matter since you'll run this in sandbox/test mode.

## 6. Why This Project Stands Out

- **Real-time systems** — not a wrapper around a chat API; involves live audio streaming, WebSockets, and session state management (you already have this skill from your transcription project).
- **Full billing lifecycle** — subscription creation, webhooks, upgrade/downgrade, usage-limit enforcement — this is what separates "student project" from "SaaS engineer."
- **AI used meaningfully** — feedback generation, tailored question generation, and (optionally) speech/tone analysis — not just "call GPT and print the response."
- **Demoable in under 2 minutes** on a call — record a 90-second mock interview, show the live signals, then the generated report, then flip to the pricing page and simulate an upgrade.

## 7. Success Metrics (for your own build tracking, not real users initially)

- End-to-end flow works: signup → free interview → hits limit → upgrade → unlimited access
- Live transcription latency under ~1s
- Feedback report generated within ~5s of interview ending
- Payment webhook correctly updates subscription status without manual DB edits
