# Payment Integration — IntervuAI

## 1. Gateway Choice

Use **Razorpay** if targeting Indian recruiters/companies, **Stripe** if targeting global/remote roles. Both offer full-featured **test/sandbox modes** — no real money, no cost, ever, during development.

You can also implement both behind a shared internal interface (`PaymentProvider`) — a small but real signal of good abstraction design if you want the extra polish.

## 2. Razorpay Integration (recommended primary)

### Setup
- Create a free Razorpay account → switch to **Test Mode**
- Get `key_id` and `key_secret` (test keys)
- Create a **Subscription Plan** in Razorpay dashboard (or via API): e.g. "IntervuAI Pro — ₹299/month"
- Set up a webhook endpoint in the dashboard pointing to your deployed backend URL + a webhook secret

### Flow
```
1. Frontend: user clicks "Upgrade"
2. Backend: POST /api/payments/create-order
     - Razorpay API: subscriptions.create({ plan_id, customer_notify: 1 })
     - Return subscription_id + key_id to frontend
3. Frontend: open Razorpay Checkout widget with subscription_id
4. User pays with TEST card (e.g. 4111 1111 1111 1111, any future expiry/CVV)
5. Razorpay sends webhook: subscription.activated / payment.captured
6. Backend webhook handler:
     - Verify signature (HMAC SHA256 using webhook secret)
     - Look up user via customer_id / notes field you attached at creation
     - Upsert subscriptions row (status='active', plan='pro', period dates)
     - Insert payments row (idempotent on gateway_payment_id)
7. Frontend polls GET /api/subscription until status flips to 'active', then unlocks Pro UI
```

### Signature verification (Node.js)
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return expected === signature;
}
```

## 3. Stripe Integration (alternative / global)

### Setup
- Create free Stripe account → stays in **Test Mode** by default until you activate live keys
- Create a Product + recurring Price ($4.99/month) in dashboard
- Use Stripe CLI locally to forward webhooks during development: `stripe listen --forward-to localhost:5000/api/payments/webhook`

### Flow
```
1. Backend: POST /api/payments/create-order
     - stripe.checkout.sessions.create({ mode: 'subscription', line_items: [{price, quantity:1}], success_url, cancel_url })
2. Frontend redirects to Stripe-hosted Checkout page
3. User pays with test card 4242 4242 4242 4242
4. Stripe sends webhook: checkout.session.completed, invoice.paid
5. Backend verifies via stripe.webhooks.constructEvent(payload, sig, endpointSecret)
6. Upsert subscription + payment rows, same as Razorpay flow
```

## 4. Usage-Limit Enforcement Middleware (Node/Express)

```javascript
async function enforcePlanLimit(req, res, next) {
  const sub = await getSubscription(req.user.id);
  if (sub.plan === 'pro' && sub.status === 'active') return next();

  const count = await countSessionsThisMonth(req.user.id);
  if (count >= 2) {
    return res.status(403).json({
      reason: 'limit_reached',
      message: 'Free plan limit reached. Upgrade to continue.',
      upgrade_url: '/pricing'
    });
  }
  next();
}
```

## 5. Idempotency — Why It Matters (and how to demo you understand it)

Payment gateways **retry webhooks** if your endpoint doesn't respond 200 fast enough, or on network issues. If you naively "insert a payment + activate subscription" on every webhook call, a retried webhook could double-activate or duplicate records.

**Fix:** before processing, check if `gateway_payment_id` already exists in the `payments` table (unique constraint). If it does, return 200 immediately without reprocessing. This is a great talking point in interviews.

## 6. Testing Checklist

- [ ] Successful payment → subscription activates, free-tier limit disappears
- [ ] Failed test payment → user stays on free tier, clear error shown
- [ ] Webhook fired twice manually (replay from dashboard) → no duplicate DB rows
- [ ] Cancel subscription → access continues till period end, then reverts
- [ ] Free user hits 2-session limit → blocked with upgrade prompt, not a silent failure
