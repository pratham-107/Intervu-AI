import { Router } from 'express';
import { getReportBySessionId, downloadPdfReport } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken as any);

router.get('/:sessionId', getReportBySessionId as any);
router.get('/:sessionId/pdf', downloadPdfReport as any);

export default router;
