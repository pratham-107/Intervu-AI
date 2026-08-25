import { Router } from 'express';
import {
  getSubscription,
  createOrder,
  verifyPayment,
  handleWebhook,
  cancelSubscription
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/webhook', handleWebhook);

router.get('/subscription', authenticateToken as any, getSubscription as any);
router.post('/create-order', authenticateToken as any, createOrder as any);
router.post('/verify', authenticateToken as any, verifyPayment as any);
router.post('/subscription/cancel', authenticateToken as any, cancelSubscription as any);

export default router;
