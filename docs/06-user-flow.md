# User Flow — IntervuAI

## 1. New User — First Interview (Free Tier)

```
Landing page
   → "Try a free mock interview" CTA
   → Signup (email or Google)
   → Onboarding: pick role + difficulty
   → Pre-interview mic check screen
   → Live interview room
       - AI asks question (voice/text)
       - User answers (mic on)
       - Live transcript + filler-word/pace badges shown
       - Repeat for N questions (e.g., 5)
   → "End Interview" (manual or after last question)
   → Loading state: "Generating your feedback..."
   → Report page: score, strengths, per-question breakdown
   → Prompt: "You have 1 free interview left this month" OR
     "You've used your 2 free interviews — Upgrade to Pro"
```

## 2. Hitting the Free Limit → Upgrade Flow

```
User clicks "Start new interview" (3rd time this month)
   → GET /api/sessions/can-start → 403 limit_reached
   → Frontend shows upgrade modal (not a dead-end error)
   → "Upgrade to Pro — ₹299/month — Unlimited interviews + PDF reports"
   → Click "Upgrade"
   → POST /api/payments/create-order
   → Razorpay/Stripe Checkout opens (test mode — use test card)
   → Payment success
   → Webhook fires → backend activates subscription
   → Frontend polls/refetches subscription status
   → "You're now Pro!" → redirected back to start interview, no limit
```

## 3. Returning Pro User

```
Login
   → Dashboard: session history list + score trend chart
   → "Start new interview" — no limit check blocks them
   → Complete interview → detailed report (per-question + tone analysis)
   → "Download PDF" button now active
   → PDF generated server-side, downloaded
```

## 4. Cancel Subscription Flow

```
Dashboard → Settings → "Manage subscription"
   → "Cancel Plan"
   → POST /api/subscription/cancel (cancel_at_period_end = true)
   → UI shows: "Pro access continues until [date], then reverts to Free"
   → On period_end webhook/cron check → subscriptions.status = 'canceled', plan reverts
```

## 5. Screens Checklist (for frontend build order)

1. Landing / marketing page (with pricing section)
2. Signup / Login
3. Onboarding (role + difficulty picker)
4. Interview room (mic capture + live transcript + live signals)
5. Report page
6. Dashboard (history + trends)
7. Pricing / upgrade modal
8. Checkout (gateway-hosted or embedded)
9. Account settings (manage/cancel subscription)
