import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthJWTPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'intervuai_dev_secret_key_12345';

export interface AuthRequest extends Request {
  user?: AuthJWTPayload;
}

export const generateToken = (payload: AuthJWTPayload, expiresIn: string = '7d'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
};

export const generateWsToken = (sessionId: string, userId: string): string => {
  return jwt.sign({ sessionId, userId, type: 'ws_session' }, JWT_SECRET, { expiresIn: '1h' } as jwt.SignOptions);
};

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthJWTPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(403).json({ error: 'Invalid or expired token.' });
    return;
  }
};
