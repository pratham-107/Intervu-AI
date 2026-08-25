import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

// Input Validation Schemas
const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters long').optional()
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email, password, full_name } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, full_name, auth_provider)
       VALUES ($1, $2, $3, 'email')
       RETURNING id, email, full_name, auth_provider, resume_text, created_at`,
      [normalizedEmail, passwordHash, full_name || null]
    );

    const newUser = userResult.rows[0];

    // Create default free subscription
    const subResult = await query(
      `INSERT INTO subscriptions (user_id, plan, status, current_period_start)
       VALUES ($1, 'free', 'active', NOW())
       RETURNING id, plan, status, current_period_start, current_period_end`,
      [newUser.id]
    );

    const subscription = subResult.rows[0];

    // Generate JWT
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      plan: subscription.plan
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        auth_provider: newUser.auth_provider,
        resume_text: newUser.resume_text
      },
      subscription
    });
  } catch (error: any) {
    console.error('[Auth] Signup error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const userResult = await query(
      `SELECT id, email, password_hash, full_name, auth_provider, resume_text, created_at 
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = userResult.rows[0];

    if (!user.password_hash) {
      res.status(400).json({ error: 'Please sign in using your OAuth provider.' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Get active subscription
    const subResult = await query(
      `SELECT id, plan, status, current_period_start, current_period_end, cancel_at_period_end 
       FROM subscriptions WHERE user_id = $1`,
      [user.id]
    );

    let subscription = subResult.rows[0];

    // If subscription record was missing, auto-create free tier
    if (!subscription) {
      const newSub = await query(
        `INSERT INTO subscriptions (user_id, plan, status, current_period_start)
         VALUES ($1, 'free', 'active', NOW())
         RETURNING id, plan, status, current_period_start, current_period_end, cancel_at_period_end`,
        [user.id]
      );
      subscription = newSub.rows[0];
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      plan: subscription.plan
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        auth_provider: user.auth_provider,
        resume_text: user.resume_text
      },
      subscription
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userResult = await query(
      `SELECT id, email, full_name, auth_provider, resume_text, created_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const user = userResult.rows[0];

    const subResult = await query(
      `SELECT id, plan, status, gateway, current_period_start, current_period_end, cancel_at_period_end 
       FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    const subscription = subResult.rows[0] || { plan: 'free', status: 'active' };

    // Get current month interview session count for usage calculation
    const sessionCountResult = await query(
      `SELECT COUNT(*)::int as count 
       FROM interview_sessions 
       WHERE user_id = $1 AND started_at >= date_trunc('month', NOW())`,
      [userId]
    );

    const sessionsThisMonth = sessionCountResult.rows[0]?.count || 0;

    res.status(200).json({
      user,
      subscription,
      usage: {
        sessionsThisMonth,
        sessionLimit: subscription.plan === 'pro' ? 'unlimited' : 2,
        canStartNewSession: subscription.plan === 'pro' || sessionsThisMonth < 2
      }
    });
  } catch (error: any) {
    console.error('[Auth] getMe error:', error);
    res.status(500).json({ error: 'Internal server error fetching user.' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { full_name, resume_text } = req.body;

    const result = await query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           resume_text = COALESCE($2, resume_text),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, full_name, auth_provider, resume_text, updated_at`,
      [full_name, resume_text, userId]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Auth] updateProfile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, full_name } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required for Google OAuth.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let userResult = await query(
      `SELECT id, email, full_name, auth_provider, resume_text, created_at 
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    let user;
    if (userResult.rows.length === 0) {
      // Create user with Google provider
      const newUserRes = await query(
        `INSERT INTO users (email, full_name, auth_provider)
         VALUES ($1, $2, 'google')
         RETURNING id, email, full_name, auth_provider, resume_text, created_at`,
        [normalizedEmail, full_name || 'Google User']
      );
      user = newUserRes.rows[0];

      // Create default free subscription
      await query(
        `INSERT INTO subscriptions (user_id, plan, status, current_period_start)
         VALUES ($1, 'free', 'active', NOW())`,
        [user.id]
      );
    } else {
      user = userResult.rows[0];
    }

    // Fetch subscription
    const subRes = await query('SELECT * FROM subscriptions WHERE user_id = $1', [user.id]);
    const subscription = subRes.rows[0] || { plan: 'free', status: 'active' };

    const token = generateToken({
      userId: user.id,
      email: user.email,
      plan: subscription.plan
    });

    res.status(200).json({
      message: 'Google login successful',
      token,
      user,
      subscription
    });
  } catch (error: any) {
    console.error('[Auth] Google OAuth error:', error);
    res.status(500).json({ error: 'Failed to complete Google authentication.' });
  }
};
