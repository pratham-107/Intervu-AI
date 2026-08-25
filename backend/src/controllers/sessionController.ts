import { Response } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { AuthRequest, generateWsToken } from '../middleware/auth.js';

const createSessionSchema = z.object({
  role: z.string().min(2, 'Role must be at least 2 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  custom_topic: z.string().optional()
});

export const canStartSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const subResult = await query(
      `SELECT plan, status FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    const subscription = subResult.rows[0] || { plan: 'free', status: 'active' };

    if (subscription.plan === 'pro' && subscription.status === 'active') {
      res.status(200).json({ allowed: true, plan: 'pro' });
      return;
    }

    // Free tier: count completed or active sessions this calendar month
    const countRes = await query(
      `SELECT COUNT(*)::int as count 
       FROM interview_sessions 
       WHERE user_id = $1 AND started_at >= date_trunc('month', NOW())`,
      [userId]
    );

    const sessionCount = countRes.rows[0]?.count || 0;

    if (sessionCount >= 2) {
      res.status(403).json({
        allowed: false,
        reason: 'limit_reached',
        message: "You've reached your free limit of 2 interviews this month. Upgrade to Pro for unlimited access.",
        sessionsUsed: sessionCount,
        limit: 2,
        upgrade_url: '/pricing'
      });
      return;
    }

    res.status(200).json({
      allowed: true,
      plan: 'free',
      sessionsUsed: sessionCount,
      limit: 2
    });
  } catch (error: any) {
    console.error('[Session] canStart error:', error);
    res.status(500).json({ error: 'Internal server error checking session permissions.' });
  }
};

export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parseResult = createSessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const { role, difficulty } = parseResult.data;

    // Check usage limits
    const subResult = await query(
      `SELECT plan, status FROM subscriptions WHERE user_id = $1`,
      [userId]
    );
    const subscription = subResult.rows[0] || { plan: 'free', status: 'active' };

    if (subscription.plan !== 'pro') {
      const countRes = await query(
        `SELECT COUNT(*)::int as count 
         FROM interview_sessions 
         WHERE user_id = $1 AND started_at >= date_trunc('month', NOW())`,
        [userId]
      );
      const sessionCount = countRes.rows[0]?.count || 0;
      if (sessionCount >= 2) {
        res.status(403).json({
          reason: 'limit_reached',
          message: 'Free tier limit reached. Please upgrade to Pro.',
          upgrade_url: '/pricing'
        });
        return;
      }
    }

    // Insert session
    const sessionRes = await query(
      `INSERT INTO interview_sessions (user_id, role, difficulty, status, started_at)
       VALUES ($1, $2, $3, 'in_progress', NOW())
       RETURNING id, user_id, role, difficulty, status, started_at`,
      [userId, role, difficulty]
    );

    const session = sessionRes.rows[0];
    const wsToken = generateWsToken(session.id, userId);
    const wsBaseUrl = process.env.AI_SERVICE_WS_URL || 'ws://localhost:8000';
    const wsUrl = `${wsBaseUrl}/ws/interview/${session.id}?token=${wsToken}`;

    res.status(201).json({
      session_id: session.id,
      session,
      ws_token: wsToken,
      ws_url: wsUrl
    });
  } catch (error: any) {
    console.error('[Session] createSession error:', error);
    res.status(500).json({ error: 'Failed to create interview session.' });
  }
};

export const listSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await query(
      `SELECT 
         s.id, s.role, s.difficulty, s.status, s.started_at, s.ended_at, s.duration_seconds,
         r.overall_score, r.filler_word_count, r.avg_pace_wpm, r.pdf_url
       FROM interview_sessions s
       LEFT JOIN reports r ON s.id = r.session_id
       WHERE s.user_id = $1
       ORDER BY s.started_at DESC`,
      [userId]
    );

    res.status(200).json({
      sessions: result.rows
    });
  } catch (error: any) {
    console.error('[Session] listSessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
};

export const getSessionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const sessionRes = await query(
      `SELECT * FROM interview_sessions WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ error: 'Interview session not found.' });
      return;
    }

    const session = sessionRes.rows[0];

    const questionsRes = await query(
      `SELECT * FROM session_questions WHERE session_id = $1 ORDER BY question_order ASC`,
      [id]
    );

    const reportRes = await query(
      `SELECT * FROM reports WHERE session_id = $1`,
      [id]
    );

    res.status(200).json({
      session,
      questions: questionsRes.rows,
      report: reportRes.rows[0] || null
    });
  } catch (error: any) {
    console.error('[Session] getSessionById error:', error);
    res.status(500).json({ error: 'Failed to retrieve session.' });
  }
};

export const endSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { duration_seconds, questions, transcript_summary } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Mark session completed
    const updateRes = await query(
      `UPDATE interview_sessions 
       SET status = 'completed',
           ended_at = NOW(),
           duration_seconds = COALESCE($1, EXTRACT(EPOCH FROM (NOW() - started_at))::int)
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [duration_seconds || null, id, userId]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    const session = updateRes.rows[0];

    // If questions answered were sent, save them
    if (Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await query(
          `INSERT INTO session_questions (session_id, question_order, question_text, answer_transcript, answered_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [id, i + 1, q.question_text || q.text, q.answer_transcript || q.transcript || '']
        );
      }
    }

    res.status(200).json({
      message: 'Session ended successfully',
      session
    });
  } catch (error: any) {
    console.error('[Session] endSession error:', error);
    res.status(500).json({ error: 'Failed to end session.' });
  }
};
