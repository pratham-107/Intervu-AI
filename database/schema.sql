-- =============================================================================
-- IntervuAI Database Schema (PostgreSQL / Supabase)
-- =============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT,
    auth_provider TEXT NOT NULL DEFAULT 'email', -- 'email' | 'google'
    resume_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro'
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'canceled' | 'past_due'
    gateway TEXT, -- 'razorpay' | 'stripe'
    gateway_customer_id TEXT,
    gateway_subscription_id TEXT,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    gateway_payment_id TEXT UNIQUE NOT NULL, -- Idempotency key
    amount INTEGER NOT NULL, -- in smallest currency units (paise/cents)
    currency TEXT NOT NULL DEFAULT 'INR', -- 'INR' | 'USD'
    status TEXT NOT NULL DEFAULT 'created', -- 'created' | 'captured' | 'failed' | 'refunded'
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Interview Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed' | 'abandoned'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

-- 5. Session Questions Table
CREATE TABLE IF NOT EXISTS session_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    answer_transcript TEXT,
    answered_at TIMESTAMPTZ
);

-- 6. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL, -- 0-100
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    areas_to_improve JSONB NOT NULL DEFAULT '[]'::jsonb,
    per_question_feedback JSONB NOT NULL DEFAULT '[]'::jsonb,
    filler_word_count INTEGER DEFAULT 0,
    avg_pace_wpm INTEGER DEFAULT 0,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & quick queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON interview_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id ON session_questions(session_id);
