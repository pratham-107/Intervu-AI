import { Response } from 'express';
import { query } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getReportBySessionId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify session belongs to user
    const sessionRes = await query(
      `SELECT * FROM interview_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    const reportRes = await query(
      `SELECT * FROM reports WHERE session_id = $1`,
      [sessionId]
    );

    if (reportRes.rows.length === 0) {
      res.status(404).json({ error: 'Report not generated yet for this session.' });
      return;
    }

    const questionsRes = await query(
      `SELECT * FROM session_questions WHERE session_id = $1 ORDER BY question_order ASC`,
      [sessionId]
    );

    res.status(200).json({
      report: reportRes.rows[0],
      session: sessionRes.rows[0],
      questions: questionsRes.rows
    });
  } catch (error: any) {
    console.error('[Report] getReport error:', error);
    res.status(500).json({ error: 'Failed to retrieve report.' });
  }
};

export const downloadPdfReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if user is Pro
    const subResult = await query(
      `SELECT plan, status FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    const subscription = subResult.rows[0] || { plan: 'free' };

    if (subscription.plan !== 'pro' || subscription.status !== 'active') {
      res.status(403).json({
        error: 'PDF report export is exclusive to Pro subscribers.',
        upgrade_url: '/pricing'
      });
      return;
    }

    const reportRes = await query(
      `SELECT r.*, s.role, s.difficulty, s.started_at, u.full_name, u.email
       FROM reports r
       JOIN interview_sessions s ON r.session_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE r.session_id = $1 AND s.user_id = $2`,
      [sessionId, userId]
    );

    if (reportRes.rows.length === 0) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    const data = reportRes.rows[0];

    // Return structured print/PDF payload
    res.status(200).json({
      success: true,
      data,
      download_url: `/api/reports/${sessionId}/export`
    });
  } catch (error: any) {
    console.error('[Report] downloadPdf error:', error);
    res.status(500).json({ error: 'Failed to export PDF.' });
  }
};
