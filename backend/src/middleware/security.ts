import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

export const corsMiddleware = cors({
  origin: true, // Allow any origin for dev
  credentials: true,
});

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

export const compressionMiddleware = compression();

export const securityMiddleware = [
  corsMiddleware,
  helmetMiddleware,
  rateLimitMiddleware,
  compressionMiddleware,
];