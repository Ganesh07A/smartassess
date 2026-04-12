import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { evaluateCodingSubmission } from '../services/judge0';

// Helper: resolve student DB id from Clerk ID
async function getStudentId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  return user?.id || null;
}

async function ensureEligibleExam(examId: string, studentId: string) {
  const assigned = await prisma.examAssignment.findUnique({
    where: { examId_studentId: { examId, studentId } }
  });

  if (!assigned) {
    return { error: { status: 403, message: 'You are not assigned to this exam' } };
  }

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) {
    return { error: { status: 404, message: 'Exam not found' } };
  }

  if (exam.status !== 'ACTIVE' && exam.status !== 'PUBLISHED') {
    return { error: { status: 400, message: 'Exam is not currently available' } };
  }

  return { exam };
}

async function ensureActiveAttempt(examId: string, studentId: string) {
  const result = await prisma.result.findFirst({
    where: { examId, studentId, status: 'IN_PROGRESS' }
  });

  if (!result) {
    return { error: { status: 400, message: 'No active attempt found' } };
  }

  return { result };
}

// ───────────────────────────────────────────────
// GET /api/student/exams
// ───────────────────────────────────────────────
export async function getAssignedExams(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await getStudentId(req.auth.userId);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const assignments = await prisma.examAssignment.findMany({
      where: { studentId },
      include: {
        exam: {
          include: {
            _count: { select: { questions: true } },
            results: {
              where: { studentId },
              select: { id: true, status: true, totalScore: true, passed: true }
            }
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    return res.json(assignments.map(a => ({
      ...a.exam,
      myResult: a.exam.results[0] || null
    })));
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// GET /api/student/exams/:id
// ───────────────────────────────────────────────
export async function getExamDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await getStudentId(req.auth.userId);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const eligibility = await ensureEligibleExam(req.params.id, studentId);
    if ('error' in eligibility) {
      return res.status(eligibility.error.status).json({ error: eligibility.error.message });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            mcqOptions: { select: { id: true, text: true } }, // Don't send isCorrect to student!
            testCases: { where: { isVisible: true }, select: { input: true, expectedOutput: true } }
          }
        }
      }
    });

    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    return res.json(exam);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// POST /api/student/exams/:id/start
// ───────────────────────────────────────────────
export async function startAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await getStudentId(req.auth.userId);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const eligibility = await ensureEligibleExam(req.params.id, studentId);
    if ('error' in eligibility) {
      return res.status(eligibility.error.status).json({ error: eligibility.error.message });
    }

    // Check if already started
    let result = await prisma.result.findFirst({
      where: { examId: req.params.id, studentId }
    });

    if (result) {
      if (result.status !== 'IN_PROGRESS') {
        return res.status(400).json({ error: 'Exam already submitted' });
      }
      return res.json(result);
    }

    result = await prisma.result.create({
      data: {
        examId: req.params.id,
        studentId,
        status: 'IN_PROGRESS',
        maxScore: eligibility.exam.totalMarks,
      }
    });

    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// PUT /api/student/exams/:id/save
// ───────────────────────────────────────────────
export async function saveExamProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await getStudentId(req.auth.userId);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const eligibility = await ensureEligibleExam(req.params.id, studentId);
    if ('error' in eligibility) {
      return res.status(eligibility.error.status).json({ error: eligibility.error.message });
    }

    const activeAttempt = await ensureActiveAttempt(req.params.id, studentId);
    if ('error' in activeAttempt) {
      return res.status(activeAttempt.error.status).json({ error: activeAttempt.error.message });
    }

    const { answers } = req.body;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers payload' });
    }

    const existingAnswers = (activeAttempt.result.answers as Record<string, unknown> | null) ?? {};
    const mergedAnswers = {
      ...existingAnswers,
      ...answers,
    };

    const updatedResult = await prisma.result.update({
      where: { id: activeAttempt.result.id },
      data: {
        answers: mergedAnswers,
      },
      select: {
        id: true,
        status: true,
        answers: true,
        tabSwitches: true,
      }
    });

    return res.json(updatedResult);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// POST /api/student/exams/:id/violation
// ───────────────────────────────────────────────
export async function reportViolation(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await getStudentId(req.auth.userId);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const eligibility = await ensureEligibleExam(req.params.id, studentId);
    if ('error' in eligibility) {
      return res.status(eligibility.error.status).json({ error: eligibility.error.message });
    }

    const activeAttempt = await ensureActiveAttempt(req.params.id, studentId);
    if ('error' in activeAttempt) {
      return res.status(activeAttempt.error.status).json({ error: activeAttempt.error.message });
    }

    const metadata = req.body?.metadata;
    const eventType = typeof req.body?.type === 'string' ? req.body.type : 'UNKNOWN';

    const existingLog = Array.isArray(activeAttempt.result.performanceLog)
      ? activeAttempt.result.performanceLog
      : [];

    const event = {
      type: eventType,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      at: new Date().toISOString(),
    };

    const updatedResult = await prisma.result.update({
      where: { id: activeAttempt.result.id },
      data: {
        tabSwitches: {
          increment: 1,
        },
        performanceLog: [...existingLog, event],
      },
      select: {
        id: true,
        tabSwitches: true,
        performanceLog: true,
      }
    });

    return res.json(updatedResult);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// POST /api/student/exams/:id/submit
// ───────────────────────────────────────────────
export async function submitExam(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = await getStudentId(req.auth.userId);
    if (!studentId) return res.status(404).json({ error: 'Student not found' });

    const eligibility = await ensureEligibleExam(req.params.id, studentId);
    if ('error' in eligibility) {
      return res.status(eligibility.error.status).json({ error: eligibility.error.message });
    }

    const activeAttempt = await ensureActiveAttempt(req.params.id, studentId);
    if ('error' in activeAttempt) {
      return res.status(activeAttempt.error.status).json({ error: activeAttempt.error.message });
    }

    const { answers, tabSwitches } = req.body;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers payload' });
    }

    // Grading Logic
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          include: { mcqOptions: true, testCases: true }
        }
      }
    });

    if (!exam) throw new Error('Exam vanished');

    let totalScoreRaw = 0;

    for (const question of exam.questions) {
      const studentAnswer = answers[question.id] as Record<string, unknown> | undefined;
      if (!studentAnswer || typeof studentAnswer !== 'object') continue;

      if (question.type === 'MCQ') {
        const correctOpt = question.mcqOptions.find(o => o.isCorrect);
        if (correctOpt && studentAnswer.optionId === correctOpt.id) {
          totalScoreRaw += question.marks;
        }
      } else if (question.type === 'CODING') {
        const sourceCode = typeof studentAnswer.code === 'string' ? studentAnswer.code : '';
        const evaluation = await evaluateCodingSubmission(sourceCode, question.testCases);
        if (evaluation.totalCount > 0) {
          totalScoreRaw += (evaluation.passedCount / evaluation.totalCount) * question.marks;
        }
      }
    }

    const totalScore = Math.round(totalScoreRaw);
    const percentage = exam.totalMarks > 0 ? (totalScore / exam.totalMarks) * 100 : 0;
    const passed = percentage >= exam.passPercent;

    const updatedResult = await prisma.result.update({
      where: { id: activeAttempt.result.id },
      data: {
        status: 'GRADED',
        totalScore,
        percentage,
        passed,
        answers,
        tabSwitches: tabSwitches || activeAttempt.result.tabSwitches,
        submittedAt: new Date()
      }
    });

    return res.json(updatedResult);
  } catch (err) {
    next(err);
  }
}
