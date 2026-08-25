# Deployment Guide — 100% Free Tier

## 1. Service-by-Service Deployment

| Service | Where | Free tier notes |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Unlimited personal projects, auto-deploy from GitHub |
| Node/Express backend | **Render** (Web Service, free plan) | Spins down after 15 min idle → ~30-50s cold start on first request |
| FastAPI AI service | **Render** or **Fly.io** | Same cold-start caveat; Fly.io has a small always-free allowance |
| PostgreSQL | **Supabase** | Free project: 500MB DB, pauses after 1 week of inactivity (just visit dashboard to resume) |
| File/PDF storage | **Supabase Storage** | Included in free project, or Cloudflare R2 (10GB free egress) |
| Redis (optional) | **Upstash** | Free tier, serverless Redis, good for rate limiting |

## 2. Environment Variables Checklist

**Backend (Node):**
```
DATABASE_URL=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=
AI_SERVICE_URL=
```

**AI Service (FastAPI):**
```
GROQ_API_KEY=
GEMINI_API_KEY=
DEEPGRAM_API_KEY=
JWT_SECRET=          # same secret to validate tokens issued by Node backend
DATABASE_URL=        # if it writes reports directly
```

**Frontend (Next.js):**
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

## 3. Keeping Free Backends "Warm" (optional but nice for demos)

Render/Fly free web services sleep after inactivity. Options:
- Use **cron-job.org** (free) to ping `/health` on your backend every 10 minutes
- Or just accept the cold start and mention it clearly in your README: *"First request may take ~30s to wake the free-tier server — please be patient on first load."* Recruiters respect honesty about infra trade-offs more than a broken silent demo.

## 4. Webhook URL Setup

Since Razorpay/Stripe webhooks need a **public HTTPS URL**, you must deploy the backend before you can fully test payments — you can't webhook to localhost.
- For local dev, use **ngrok** (free) or **Stripe CLI's `stripe listen`** to forward webhooks to your local machine temporarily.
- Once deployed to Render, update the webhook URL in the Razorpay/Stripe dashboard to the real Render URL.

## 5. Domain (optional, still free)

- Vercel gives a free `*.vercel.app` subdomain — perfectly fine for a portfolio project.
- If you want a custom domain, Freenom-style free domains are unreliable — better to skip a custom domain than deal with an unreliable one; `intervuai.vercel.app` looks fine on a resume.

## 6. Pre-Launch Checklist

- [ ] All env vars set in each platform's dashboard (never commit `.env` files)
- [ ] CORS configured on backend to allow only your Vercel frontend origin
- [ ] Webhook URLs updated to production URLs in gateway dashboards
- [ ] Test full flow end-to-end on the deployed (not local) URLs
- [ ] README includes: live link, architecture diagram, tech stack, known limitations, test card numbers for reviewers to try payments themselves
