// backend/server.ts
import 'dotenv-safe/config';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { securityMiddleware } from './src/middleware/security';
import { errorHandler } from './src/middleware/errorHandler';
import authRoutes from './src/routes/auth';
import teacherRoutes from './src/routes/teacher';
import studentRoutes from './src/routes/student';
import reportRoutes from './src/routes/report';

const app = express();

// ✅ Security first
app.use(securityMiddleware);

// ✅ Raw body for webhook BEFORE everything else
app.use('/api/auth/webhook', express.raw({ type: 'application/json' }));

// ✅ Clerk middleware
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
}));

// ✅ JSON parser
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth',    authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/reports', reportRoutes);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});