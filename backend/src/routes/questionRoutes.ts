import { Router } from 'express';
import { generateQuestions } from '../controllers/questionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/generate', authenticateToken as any, generateQuestions as any);

export default router;
