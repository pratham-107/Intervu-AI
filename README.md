# IntervuAI — AI-Powered Voice Mock Interview SaaS

> A real-time AI mock interview platform featuring live speech analytics (filler words, pacing, long pauses), intelligent LLM-driven feedback scoring, and a complete subscription billing tier (Razorpay / Stripe).

---

## 🏗️ Architecture Overview

IntervuAI follows a modern decoupled microservices architecture:

- **Frontend (`/frontend`):** Next.js (App Router), TypeScript, TailwindCSS, Web Audio API / MediaRecorder (16kHz PCM audio streaming).
- **Core Backend (`/backend`):** Node.js, Express, JWT Authentication, PostgreSQL (Supabase), Razorpay/Stripe subscriptions & idempotent webhook receiver.
- **AI / Real-time Service (`/ai-service`):** Python FastAPI, WebSockets, Deepgram Speech-to-Text streaming, live heuristic speech analytics, Groq (Llama 3.3) & Gemini feedback engine.
- **Database (`/database`):** PostgreSQL relational schema on Supabase (`users`, `subscriptions`, `payments`, `interview_sessions`, `session_questions`, `reports`).

---

## 📁 Repository Structure

```
Intervu_AI/
├── frontend/          # Next.js 14+ React Client
├── backend/           # Node.js / Express Core REST API
├── ai-service/        # Python FastAPI WebSocket & LLM Service
├── database/          # PostgreSQL Schema & Migrations
├── docs/              # Detailed Technical Specifications & System Design
│   ├── 01-product-overview.md
│   ├── 02-architecture.md
│   ├── 03-system-design.md
│   ├── 04-database-schema.md
│   ├── 05-api-design.md
│   ├── 06-user-flow.md
│   ├── 07-payment-integration.md
│   ├── 08-implementation-roadmap.md
│   └── 09-deployment-guide.md
└── docker-compose.yml # Local development orchestration
```

---

## 🚀 Quick Start (Local Setup)

### 1. Database Setup
1. Create a free project on [Supabase](https://supabase.com/).
2. Run the SQL script found in [`database/schema.sql`](./database/schema.sql) in the Supabase SQL Editor.

### 2. Backend Service
```bash
cd backend
npm install
cp .env.example .env
# Fill in your Supabase connection string and Razorpay test credentials
npm run dev
```

### 3. AI Service
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows (or source venv/bin/activate on Mac/Linux)
pip install -r requirements.txt
cp .env.example .env
# Fill in your Groq / Gemini / Deepgram API keys
uvicorn main:app --reload --port 8000
```

### 4. Frontend Application
```bash
cd frontend
npm install
npm run dev
```

---

## 📜 Documentation Index
Check the [`docs/`](./docs/) directory for detailed system design, API contracts, database schema, payment flow diagrams, and the full step-by-step roadmap.
