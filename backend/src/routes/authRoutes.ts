import { Router } from 'express';
import { signup, login, getMe, updateProfile, googleAuth } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authenticateToken as any, getMe as any);
router.patch('/profile', authenticateToken as any, updateProfile as any);

export default router;
