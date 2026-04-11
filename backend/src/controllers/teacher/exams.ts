import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { CreateExamSchema, UpdateExamSchema, QuestionSchema } from '../../validators/exam';

// Helper: resolve teacher DB id from Clerk ID
async function getTeacherId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  return user?.id ?? null;
}

// Helper: verify exam ownership
async function verifyOwnership(examId: string, teacherId: string) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return null;
  if (exam.teacherId !== teacherId) return false;
  return exam;
}

// ───────────────────────────────────────────────
// GET /api/teacher/exams  — paginated list
// ───────────────────────────────────────────────
export async function listExams(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = { teacherId };
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { questions: true, results: true, assignments: true } },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    return res.json({
      data: exams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// POST /api/teacher/exams  — create
// ───────────────────────────────────────────────
export async function createExam(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const data = CreateExamSchema.parse(req.body);

    const exam = await prisma.exam.create({
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime:   data.endTime   ? new Date(data.endTime)   : null,
        teacherId,
      },
    });

    return res.status(201).json(exam);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// GET /api/teacher/exams/:id  — single exam
// ───────────────────────────────────────────────
export async function getExam(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const exam = await verifyOwnership(req.params.id, teacherId);
    if (exam === null)  return res.status(404).json({ error: 'Exam not found' });
    if (exam === false) return res.status(403).json({ error: 'Forbidden' });

    const fullExam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { mcqOptions: true, testCases: true },
        },
        _count: { select: { results: true, assignments: true } },
      },
    });

    return res.json(fullExam);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// PUT /api/teacher/exams/:id  — update
// ───────────────────────────────────────────────
export async function updateExam(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const owned = await verifyOwnership(req.params.id, teacherId);
    if (owned === null)  return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    const data = UpdateExamSchema.parse(req.body);

    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime:   data.endTime   ? new Date(data.endTime)   : undefined,
      },
    });

    return res.json(exam);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// DELETE /api/teacher/exams/:id
// ───────────────────────────────────────────────
export async function deleteExam(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const owned = await verifyOwnership(req.params.id, teacherId);
    if (owned === null)  return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    await prisma.exam.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// POST /api/teacher/exams/:id/publish
// ───────────────────────────────────────────────
export async function publishExam(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const owned = await verifyOwnership(req.params.id, teacherId);
    if (owned === null)  return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });
    if (owned.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only DRAFT exams can be published' });
    }

    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: { status: 'PUBLISHED' },
    });

    return res.json(exam);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// POST /api/teacher/exams/:id/duplicate
// ───────────────────────────────────────────────
export async function duplicateExam(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const owned = await verifyOwnership(req.params.id, teacherId);
    if (owned === null)  return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    // Deep-clone exam with all questions
    const source = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { questions: { include: { mcqOptions: true, testCases: true } } },
    });

    const clone = await prisma.exam.create({
      data: {
        title: `${source!.title} (Copy)`,
        description: source!.description,
        duration: source!.duration,
        totalMarks: source!.totalMarks,
        passPercent: source!.passPercent,
        startTime: source!.startTime,
        endTime: source!.endTime,
        teacherId,
        status: 'DRAFT',
        questions: {
          create: source!.questions.map((q) => ({
            type: q.type,
            text: q.text,
            marks: q.marks,
            difficulty: q.difficulty,
            order: q.order,
            mcqOptions: { create: q.mcqOptions.map(({ text, isCorrect }) => ({ text, isCorrect })) },
            testCases:  { create: q.testCases.map(({ input, expectedOutput, isVisible }) => ({ input, expectedOutput, isVisible })) },
          })),
        },
      },
    });

    return res.status(201).json(clone);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// POST /api/teacher/exams/:id/questions
// ───────────────────────────────────────────────
export async function addQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const owned = await verifyOwnership(req.params.id, teacherId);
    if (owned === null)  return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    const data = QuestionSchema.parse(req.body);

    const question = await prisma.question.create({
      data: {
        examId: req.params.id,
        type: data.type,
        text: data.text,
        marks: data.marks,
        difficulty: data.difficulty,
        order: data.order,
        mcqOptions: data.type === 'MCQ' && data.mcqOptions ? {
          create: data.mcqOptions.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect }))
        } : undefined,
        testCases: data.type === 'CODING' && data.testCases ? {
          create: data.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isVisible: tc.isVisible }))
        } : undefined,
      },
      include: { mcqOptions: true, testCases: true },
    });

    return res.status(201).json(question);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// PUT /api/teacher/exams/:id/questions/:qid
// ───────────────────────────────────────────────
export async function updateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const owned = await verifyOwnership(req.params.id, teacherId);
    if (owned === null)  return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    const data = QuestionSchema.partial().parse(req.body);

    // Delete existing items if new ones are provided (MCQ/Coding)
    if (data.mcqOptions) {
      await prisma.mcqOption.deleteMany({ where: { questionId: req.params.qid } });
    }
    if (data.testCases) {
      await prisma.testCase.deleteMany({ where: { questionId: req.params.qid } });
    }

    const question = await prisma.question.update({
      where: { id: req.params.qid },
      data: {
        text: data.text,
        marks: data.marks,
        difficulty: data.difficulty,
        order: data.order,
        mcqOptions: data.mcqOptions ? {
          create: data.mcqOptions.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect }))
        } : undefined,
        testCases: data.testCases ? {
          create: data.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isVisible: tc.isVisible }))
        } : undefined,
      },
      include: { mcqOptions: true, testCases: true },
    });

    return res.json(question);
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// DELETE /api/teacher/exams/:id/questions/:qid
// ───────────────────────────────────────────────
export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const owned = await verifyOwnership(req.params.id, teacherId);
    if (owned === null)  return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    await prisma.question.delete({ where: { id: req.params.qid } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// POST /api/teacher/exams/:id/assignments (Bulk Assign)
// ───────────────────────────────────────────────
export async function assignStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const owned = await verifyOwnership(req.params.id, teacherId);
    if (owned === null)  return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    const { studentIds } = req.body; // Expect array of student DB IDs
    if (!Array.isArray(studentIds)) return res.status(400).json({ error: 'studentIds array is required' });

    const assignments = await Promise.all(
      studentIds.map(sid => 
        prisma.examAssignment.upsert({
          where: { examId_studentId: { examId: req.params.id, studentId: sid } },
          create: { examId: req.params.id, studentId: sid },
          update: {}, // Do nothing if already assigned
        })
      )
    );

    return res.json({ success: true, count: assignments.length });
  } catch (err) {
    next(err);
  }
}

// ───────────────────────────────────────────────
// GET /api/teacher/exams/:id/assignments
// ───────────────────────────────────────────────
export async function getAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherId = await getTeacherId(req.auth.userId);
    if (!teacherId) return res.status(404).json({ error: 'Teacher not found' });

    const owned = await verifyOwnership(req.params.id, teacherId);
    if (owned === null)  return res.status(404).json({ error: 'Exam not found' });
    if (owned === false) return res.status(403).json({ error: 'Forbidden' });

    const assignments = await prisma.examAssignment.findMany({
      where: { examId: req.params.id },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { assignedAt: 'desc' },
    });

    return res.json(assignments);
  } catch (err) {
    next(err);
  }
}

