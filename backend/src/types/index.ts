export interface User {
  id: string;
  email: string;
  password_hash?: string | null;
  full_name: string | null;
  auth_provider: 'email' | 'google';
  resume_text?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  gateway: 'razorpay' | 'stripe' | null;
  gateway_customer_id?: string | null;
  gateway_subscription_id?: string | null;
  current_period_start: string;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthJWTPayload {
  userId: string;
  email: string;
  plan?: 'free' | 'pro';
}

export interface AuthenticatedRequest extends Express.Request {
  user?: AuthJWTPayload;
}
