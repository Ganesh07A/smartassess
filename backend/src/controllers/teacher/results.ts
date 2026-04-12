import { NextFunction, Request, Response } from 'express';
import prisma from '../../lib/prisma';

async function getTeacherId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  return user?.id ?? null;
}

async function assertExamOwnership(examId: string, teacherId: string) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return null;
  if (exam.teacherId !== teacherId) return false;
  return exam;
}

export async function listExamResults(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const examId = req.params.id;
    const owned = await assertExamOwnership(examId, teacherId);
    if (owned === null) return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
    const search = (req.query.search as string | undefined)?.trim();

    const where: any = {
      examId,
      status: { in: ['SUBMITTED', 'GRADED'] },
    };

    if (search) {
      where.student = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, rows] = await Promise.all([
      prisma.result.count({ where }),
      prisma.result.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { totalScore: 'desc' },
          { percentage: 'desc' },
          { submittedAt: 'asc' },
        ],
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
          exam: {
            select: { id: true, title: true, totalMarks: true, passPercent: true },
          },
        },
      }),
    ]);

    const data = rows.map((row, idx) => ({
      rank: (page - 1) * limit + idx + 1,
      id: row.id,
      status: row.status,
      totalScore: row.totalScore,
      maxScore: row.maxScore,
      percentage: row.percentage,
      passed: row.passed,
      tabSwitches: row.tabSwitches,
      submittedAt: row.submittedAt,
      student: row.student,
      exam: row.exam,
    }));

    return res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSubmissionDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const submissionId = req.params.submissionId;
    const submission = await prisma.result.findUnique({
      where: { id: submissionId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        exam: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: { mcqOptions: true, testCases: true },
            },
          },
        },
      },
    });

    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.exam.teacherId !== teacherId) return res.status(403).json({ error: 'Forbidden' });

    return res.json(submission);
  } catch (err) {
    next(err);
  }
}

export async function getExamAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const examId = req.params.id;
    const owned = await assertExamOwnership(examId, teacherId);
    if (owned === null) return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    const [results, assignments] = await Promise.all([
      prisma.result.findMany({
        where: { examId, status: { in: ['SUBMITTED', 'GRADED'] } },
        select: {
          totalScore: true,
          percentage: true,
          passed: true,
          tabSwitches: true,
          studentId: true,
        },
      }),
      prisma.examAssignment.count({ where: { examId } }),
    ]);

    const attempts = results.length;
    const passCount = results.filter((r) => r.passed).length;
    const avgScore = attempts
      ? Number((results.reduce((sum, r) => sum + r.totalScore, 0) / attempts).toFixed(2))
      : 0;
    const avgPercentage = attempts
      ? Number((results.reduce((sum, r) => sum + r.percentage, 0) / attempts).toFixed(2))
      : 0;
    const avgTabSwitches = attempts
      ? Number((results.reduce((sum, r) => sum + r.tabSwitches, 0) / attempts).toFixed(2))
      : 0;
    const passRate = attempts ? Math.round((passCount / attempts) * 100) : 0;
    const completionRate = assignments ? Math.round((attempts / assignments) * 100) : 0;

    const scoreDistribution = Array.from({ length: 10 }, (_, i) => {
      const min = i * 10;
      const max = i === 9 ? 100 : i * 10 + 9;
      const count = results.filter((r) => r.percentage >= min && r.percentage <= max).length;
      return { range: `${min}-${max}`, count };
    });

    return res.json({
      examId,
      attempts,
      assignments,
      passCount,
      passRate,
      completionRate,
      avgScore,
      avgPercentage,
      avgTabSwitches,
      scoreDistribution,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportExamResults(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const examId = req.params.id;
    const owned = await assertExamOwnership(examId, teacherId);
    if (owned === null) return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    const rows = await prisma.result.findMany({
      where: { examId, status: { in: ['SUBMITTED', 'GRADED'] } },
      orderBy: [{ totalScore: 'desc' }, { submittedAt: 'asc' }],
      include: {
        student: { select: { name: true, email: true } },
      },
    });

    const header = [
      'Rank',
      'Student Name',
      'Student Email',
      'Score',
      'Max Score',
      'Percentage',
      'Passed',
      'Tab Switches',
      'Submitted At',
    ];

    const csvRows = rows.map((row, index) => [
      String(index + 1),
      row.student.name,
      row.student.email,
      String(row.totalScore),
      String(row.maxScore),
      String(Number(row.percentage.toFixed(2))),
      row.passed ? 'Yes' : 'No',
      String(row.tabSwitches),
      row.submittedAt?.toISOString() || '',
    ]);

    const escapeCsv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const content = [header, ...csvRows]
      .map((columns) => columns.map(escapeCsv).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${owned.title.replace(/\s+/g, '_').toLowerCase()}_results.csv"`,
    );
    return res.send(content);
  } catch (err) {
    next(err);
  }
}
