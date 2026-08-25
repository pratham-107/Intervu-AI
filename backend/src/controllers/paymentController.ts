import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { query } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const getRazorpayInstance = () => {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

export const getSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const subRes = await query(
      `SELECT * FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    const subscription = subRes.rows[0] || { plan: 'free', status: 'active' };

    const countRes = await query(
      `SELECT COUNT(*)::int as count 
       FROM interview_sessions 
       WHERE user_id = $1 AND started_at >= date_trunc('month', NOW())`,
      [userId]
    );

    res.status(200).json({
      subscription,
      usage: {
        sessionsThisMonth: countRes.rows[0]?.count || 0,
        sessionLimit: subscription.plan === 'pro' ? 'unlimited' : 2,
        canStart: subscription.plan === 'pro' || (countRes.rows[0]?.count || 0) < 2
      }
    });
  } catch (error: any) {
    console.error('[Payment] getSubscription error:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription.' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currency = 'INR', plan = 'pro' } = req.body;
    const amount = currency === 'INR' ? 29900 : 499; // in smallest units (299 INR = 29900 paise, 4.99 USD = 499 cents)

    const rzp = getRazorpayInstance();

    if (rzp) {
      // Call official Razorpay SDK
      const order = await rzp.orders.create({
        amount,
        currency,
        receipt: `rcpt_${userId.slice(0, 8)}_${Date.now()}`,
        notes: {
          userId,
          plan
        }
      });

      res.status(200).json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID
      });
      return;
    }

    // Fallback if keys are not set up
    const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    res.status(200).json({
      order_id: mockOrderId,
      amount,
      currency,
      key_id: 'rzp_test_mock'
    });
  } catch (error: any) {
    console.error('[Payment] createOrder error:', error);
    res.status(500).json({ error: 'Failed to create payment order with Razorpay.' });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({ error: 'Missing payment identifiers.' });
      return;
    }

    // Verify cryptographic HMAC SHA256 signature if secret is present
    if (RAZORPAY_KEY_SECRET && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        res.status(400).json({ error: 'Payment signature verification failed.' });
        return;
      }
    }

    // Idempotent payment record
    await query(
      `INSERT INTO payments (user_id, gateway_payment_id, amount, currency, status, raw_payload)
       VALUES ($1, $2, $3, 'INR', 'captured', $4)
       ON CONFLICT (gateway_payment_id) DO NOTHING`,
      [userId, razorpay_payment_id, 29900, JSON.stringify(req.body)]
    );

    // Upgrade user subscription to pro
    const subRes = await query(
      `INSERT INTO subscriptions (user_id, plan, status, gateway, gateway_subscription_id, current_period_start, current_period_end)
       VALUES ($1, 'pro', 'active', 'razorpay', $2, NOW(), NOW() + INTERVAL '30 days')
       ON CONFLICT (user_id)
       DO UPDATE SET plan = 'pro', status = 'active', gateway = 'razorpay', gateway_subscription_id = $2, current_period_end = NOW() + INTERVAL '30 days', updated_at = NOW()
       RETURNING *`,
      [userId, razorpay_order_id]
    );

    res.status(200).json({
      success: true,
      message: 'Payment verified and Pro subscription activated!',
      subscription: subRes.rows[0]
    });
  } catch (error: any) {
    console.error('[Payment] verifyPayment error:', error);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = req.body;

    if (signature && RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');

      if (expectedSignature !== signature) {
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
      }
    }

    const event = body.event;
    const payload = body.payload?.payment?.entity || body.payload?.subscription?.entity;
    const gatewayPaymentId = payload?.id || `pay_${Date.now()}`;
    const email = payload?.email || payload?.notes?.email;

    const existingPayment = await query(
      `SELECT id FROM payments WHERE gateway_payment_id = $1`,
      [gatewayPaymentId]
    );

    if (existingPayment.rows.length > 0) {
      res.status(200).json({ received: true, note: 'Already processed (idempotent)' });
      return;
    }

    if (email) {
      const userRes = await query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
      if (userRes.rows.length > 0) {
        const userId = userRes.rows[0].id;

        if (event === 'payment.captured' || event === 'subscription.activated') {
          await query(
            `INSERT INTO payments (user_id, gateway_payment_id, amount, currency, status, raw_payload)
             VALUES ($1, $2, $3, $4, 'captured', $5)
             ON CONFLICT (gateway_payment_id) DO NOTHING`,
            [userId, gatewayPaymentId, payload?.amount || 29900, payload?.currency || 'INR', JSON.stringify(body)]
          );

          await query(
            `INSERT INTO subscriptions (user_id, plan, status, gateway, gateway_payment_id, current_period_start, current_period_end)
             VALUES ($1, 'pro', 'active', 'razorpay', $2, NOW(), NOW() + INTERVAL '30 days')
             ON CONFLICT (user_id)
             DO UPDATE SET plan = 'pro', status = 'active', current_period_end = NOW() + INTERVAL '30 days', updated_at = NOW()`,
            [userId, gatewayPaymentId]
          );
        } else if (event === 'subscription.cancelled') {
          await query(
            `UPDATE subscriptions SET status = 'canceled', cancel_at_period_end = true WHERE user_id = $1`,
            [userId]
          );
        }
      }
    }

    res.status(200).json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('[Payment Webhook] Error:', error);
    res.status(500).json({ error: 'Webhook processing error' });
  }
};

export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await query(
      `UPDATE subscriptions 
       SET cancel_at_period_end = true, updated_at = NOW() 
       WHERE user_id = $1`,
      [userId]
    );

    res.status(200).json({
      message: 'Your subscription will cancel at the end of the current billing cycle.'
    });
  } catch (error: any) {
    console.error('[Payment] cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription.' });
  }
};
