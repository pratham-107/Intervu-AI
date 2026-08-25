import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { testConnection } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'intervuai-backend',
    timestamp: new Date().toISOString()
  });
});

// Root API discovery
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to IntervuAI Core API',
    endpoints: {
      auth: '/api/auth',
      sessions: '/api/sessions',
      reports: '/api/reports',
      questions: '/api/questions',
      payments: '/api/payments'
    },
    version: '1.0.0'
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  console.error('[Backend Global Error]:', err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

app.listen(PORT, async () => {
  console.log(`[Backend] Server running on http://localhost:${PORT}`);
  await testConnection();
});
