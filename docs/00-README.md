# IntervuAI — Documentation Index

**IntervuAI** is an AI-powered mock interview coaching platform with real-time voice feedback and a paid subscription tier (Razorpay/Stripe). This folder contains the full planning documentation to build it as a portfolio-grade, resume-worthy SaaS project.

## How to use these docs

Read them in this order:

1. **[01-product-overview.md](./01-product-overview.md)** — What the product is, who it's for, core features, free vs. pro tier
2. **[02-architecture.md](./02-architecture.md)** — Tech stack, high-level architecture diagram, service breakdown
3. **[03-system-design.md](./03-system-design.md)** — Deep dive: real-time audio pipeline, AI feedback engine, scalability notes
4. **[04-database-schema.md](./04-database-schema.md)** — Full schema (Postgres/Supabase), relationships, indexes
5. **[05-api-design.md](./05-api-design.md)** — REST + WebSocket API contract, all routes and events
6. **[06-user-flow.md](./06-user-flow.md)** — End-to-end user journeys (signup → interview → feedback → upgrade)
7. **[07-payment-integration.md](./07-payment-integration.md)** — Razorpay/Stripe subscription flow, webhooks, plan enforcement
8. **[08-implementation-roadmap.md](./08-implementation-roadmap.md)** — Week-by-week build order, milestones
9. **[09-deployment-guide.md](./09-deployment-guide.md)** — 100% free-tier deployment across all services

## Project one-liner (for your resume/README)

> IntervuAI — a real-time AI mock interview platform with live speech analysis, LLM-generated feedback, and a full Stripe/Razorpay subscription billing system. Built with React, Node.js/FastAPI, WebSockets, and PostgreSQL.

## Suggested repo structure

```
intervuai/
├── frontend/          # React + Next.js
├── backend/           # Node.js/Express (API + auth + payments)
├── ai-service/        # FastAPI (WebSocket audio pipeline + LLM feedback)
├── docs/              # This folder
└── docker-compose.yml # Local dev orchestration
```
