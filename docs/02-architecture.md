# Architecture — IntervuAI

## 1. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (React), TypeScript, Redux Toolkit, TailwindCSS | Matches your resume stack; Next.js gives free Vercel hosting + SSR for a fast landing/pricing page |
| Core Backend (Auth, Payments, CRUD) | Node.js + Express.js | Matches resume stack; simplest for REST + webhook handling |
| AI/Realtime Service | Python FastAPI + WebSockets | Matches resume stack (you already built this pattern); Python has the best AI/audio libraries |
| Database | PostgreSQL (via Supabase) | Relational data (users, subscriptions, sessions) fits SQL well; Supabase free tier + built-in auth option |
| Cache (optional) | Redis (Upstash free tier) | Rate limiting, session state, WebSocket pub/sub if scaling |
| Speech-to-Text | Deepgram (free trial credits) or browser Web Speech API (100% free fallback) | Live transcription |
| LLM | Groq (Llama 3.3) + Gemini API (free tiers) | Question generation + feedback generation |
| Payments | Razorpay (India) or Stripe (global) — test/sandbox mode | Subscription billing |
| File/PDF storage | Supabase Storage or Cloudflare R2 | Store generated PDF reports |
| Hosting | Vercel (frontend), Render/Fly.io (backend + AI service) | All free tiers |

## 2. High-Level Architecture

```
┌─────────────────┐      HTTPS/REST      ┌──────────────────────┐
│                  │ ───────────────────▶│                       │
│   Next.js        │                      │   Node.js/Express     │
│   Frontend        │◀───────────────────│   (Auth, Users,        │
│   (Vercel)        │                      │    Payments, Sessions)│
│                  │                      │   (Render)            │
└────────┬─────────┘                      └───────────┬───────────┘
         │                                             │
         │ WebSocket (audio stream)                    │ SQL
         ▼                                             ▼
┌──────────────────────┐                    ┌─────────────────────┐
│  FastAPI AI Service   │                    │   PostgreSQL          │
│  (Render/Fly.io)      │                    │   (Supabase)           │
│  - Live STT pipeline  │                    └─────────────────────┘
│  - LLM question gen   │
│  - LLM feedback gen   │                    ┌─────────────────────┐
└──────────┬────────────┘                    │  Razorpay/Stripe      │
           │                                  │  (Test/Sandbox)       │
           ▼                                  └──────────┬────────────┘
┌──────────────────────┐                                 │
│ Deepgram / Groq /     │                    Webhook ─────┘
│ Gemini (external APIs)│                    (→ Node backend)
└──────────────────────┘
```

## 3. Service Responsibilities

### Frontend (Next.js)
- Landing page, pricing page, auth screens
- Interview room UI (mic capture, live transcript display, live signal indicators)
- Dashboard (session history, charts)
- Report viewer + PDF download
- Payment checkout UI (Razorpay Checkout.js / Stripe Elements)

### Core Backend (Node/Express)
- User auth (JWT, matches your resume experience)
- CRUD: sessions, reports, user profile
- Subscription/plan management + usage-limit middleware
- Payment order creation + **webhook receiver** (critical piece)
- Issues short-lived tokens to the AI service so it can validate a user is allowed to start a session

### AI Service (FastAPI)
- WebSocket endpoint: receives audio chunks, streams back live transcript + live signals (filler words, pace)
- On session end: sends full transcript to LLM → generates structured feedback JSON
- Question generation endpoint (given role + difficulty, optionally resume text)
- Stateless per-session (isolated state per WebSocket connection, like your transcription project)

## 4. Why Two Backends Instead of One

You could do it all in FastAPI or all in Node — but running **both** (like the diagram above) mirrors real-world microservice separation and doubles as a demonstration of both stacks on your resume (Node.js/Express AND Python/FastAPI, both listed in your skills). If you want to simplify for time, it's fully valid to merge these into a single FastAPI service — note that trade-off in your README.

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Live transcript latency | < 1.5s from speech to text on screen |
| Feedback generation time | < 8s after interview ends |
| Payment webhook processing | < 2s, idempotent (safe to receive twice) |
| Uptime (free tier caveat) | Cold start ok, document in README |
