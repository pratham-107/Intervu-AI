# Database Schema — IntervuAI (PostgreSQL / Supabase)

## Entity Relationship Overview

```
users ──1:1── subscriptions
  │
  ├──1:N── interview_sessions ──1:1── reports
  │
  └──1:N── payments
```

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | default gen_random_uuid() |
| email | text, unique, not null | |
| password_hash | text | nullable if OAuth-only |
| full_name | text | |
| auth_provider | text | 'email' \| 'google' |
| resume_text | text | optional, for tailored questions (Pro) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users.id, unique | one active subscription record per user |
| plan | text | 'free' \| 'pro' |
| status | text | 'active' \| 'canceled' \| 'past_due' |
| gateway | text | 'razorpay' \| 'stripe' |
| gateway_customer_id | text | customer id from the gateway |
| gateway_subscription_id | text | subscription id from the gateway |
| current_period_start | timestamptz | |
| current_period_end | timestamptz | |
| cancel_at_period_end | boolean | default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `payments`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users.id | |
| subscription_id | uuid, FK → subscriptions.id, nullable | |
| gateway_payment_id | text, unique | idempotency key — prevents double-processing |
| amount | integer | in smallest currency unit (paise/cents) |
| currency | text | 'INR' \| 'USD' |
| status | text | 'created' \| 'captured' \| 'failed' \| 'refunded' |
| raw_payload | jsonb | store full webhook payload for debugging |
| created_at | timestamptz | |

### `interview_sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | also used as WebSocket session_id |
| user_id | uuid, FK → users.id | |
| role | text | e.g. 'Frontend Developer' |
| difficulty | text | 'easy' \| 'medium' \| 'hard' |
| status | text | 'in_progress' \| 'completed' \| 'abandoned' |
| started_at | timestamptz | |
| ended_at | timestamptz, nullable | |
| duration_seconds | integer, nullable | |

### `session_questions`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| session_id | uuid, FK → interview_sessions.id | |
| question_order | integer | |
| question_text | text | |
| answer_transcript | text | |
| answered_at | timestamptz | |

### `reports`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| session_id | uuid, FK → interview_sessions.id, unique | |
| overall_score | integer | 0–100 |
| strengths | jsonb | array of strings |
| areas_to_improve | jsonb | array of strings |
| per_question_feedback | jsonb | array of {question, feedback, suggested_answer} |
| filler_word_count | integer | |
| avg_pace_wpm | integer | |
| pdf_url | text, nullable | Pro tier only |
| created_at | timestamptz | |

## Indexes

```sql
CREATE INDEX idx_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_sessions_started_at ON interview_sessions(started_at DESC);
CREATE INDEX idx_payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE UNIQUE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

## Notes

- `payments.gateway_payment_id` has a unique constraint specifically to make webhook processing idempotent — if the same webhook fires twice (common with both Razorpay and Stripe), the insert fails silently or you check-before-insert, and you never double-count a payment.
- Free-tier usage counting can be derived (`COUNT(*) FROM interview_sessions WHERE user_id = ? AND started_at >= date_trunc('month', now())`) rather than stored as a separate counter — simpler and always accurate.
