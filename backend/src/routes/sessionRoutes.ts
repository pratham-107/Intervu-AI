import { Router } from 'express';
import {
  canStartSession,
  createSession,
  listSessions,
  getSessionById,
  endSession
} from '../controllers/sessionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All session routes are protected with JWT
router.use(authenticateToken as any);

router.get('/can-start', canStartSession as any);
router.post('/', createSession as any);
router.get('/', listSessions as any);
router.get('/:id', getSessionById as any);
router.patch('/:id/end', endSession as any);

export default router;
