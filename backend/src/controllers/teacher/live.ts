import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

// Store active SSE clients per exam
// Map<examId, Set<Response>>
const examClients = new Map<string, Set<Response>>();

// ─── SSE Stream ───────────────────────────────
export async function liveExamStream(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const examId = req.params.id as string;

    // SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Register client
    if (!examClients.has(examId)) {
      examClients.set(examId, new Set());
    }
    examClients.get(examId)!.add(res);

    console.log(`📡 Teacher connected to live stream: ${examId}`);

    // Send initial ping
    res.write(`event: connected\ndata: ${JSON.stringify({ 
      examId, 
      message: 'Connected to live stream' 
    })}\n\n`);

    // Send current state (who already submitted)
    const existing = await prisma.result.findMany({
      where: { 
        examId, 
        status: { in: ['SUBMITTED', 'GRADED'] } 
      },
      include: {
        student: { select: { name: true, email: true } }
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    if (existing.length > 0) {
      res.write(`event: initial\ndata: ${JSON.stringify({
        type: 'INITIAL_STATE',
        submissions: existing.map(r => ({
          studentName: r.student.name,
          studentEmail: r.student.email,
          totalScore: r.totalScore,
          maxScore: r.maxScore,
          percentage: r.percentage,
          passed: r.passed,
          tabSwitches: r.tabSwitches,
          submittedAt: r.submittedAt,
        }))
      })}\n\n`);
    }

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30_000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      examClients.get(examId)?.delete(res);
      if (examClients.get(examId)?.size === 0) {
        examClients.delete(examId);
      }
      console.log(`📡 Teacher disconnected from live stream: ${examId}`);
    });

  } catch (err) {
    next(err);
  }
}

// ─── Broadcast helpers ────────────────────────
export function broadcastToExam(examId: string, event: string, data: unknown) {
  const clients = examClients.get(examId);
  if (!clients || clients.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  });
}

// ─── Call these from student controller ───────
export function notifySubmission(data: {
  examId: string;
  studentName: string;
  studentEmail: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  tabSwitches: number;
  submittedAt: Date;
}) {
  broadcastToExam(data.examId, 'submission', {
    type: 'SUBMISSION',
    ...data,
  });
}

export function notifyViolation(data: {
  examId: string;
  studentName: string;
  studentEmail: string;
  tabSwitches: number;
  violationType: string;
}) {
  broadcastToExam(data.examId, 'violation', {
    type: 'VIOLATION',
    ...data,
  });
}