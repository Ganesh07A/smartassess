import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

export async function getTeacherStats(req: Request, res: Response, next: NextFunction) {
  try {
    const teacherClerkId = req.auth.userId;

    // Find the teacher's DB record
    const teacher = await prisma.user.findUnique({ where: { clerkId: teacherClerkId } });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const teacherId = teacher.id;

    const [totalExams, activeExams, recentResults, allResults, exams] = await Promise.all([
      // Total exams created by this teacher
      prisma.exam.count({ where: { teacherId } }),

      // Active (PUBLISHED + ACTIVE status) exams
      prisma.exam.count({ where: { teacherId, status: { in: ['PUBLISHED', 'ACTIVE'] } } }),

      // Recent 10 submissions
      prisma.result.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { exam: { teacherId }, status: 'SUBMITTED' },
        include: {
          student: { select: { name: true, email: true } },
          exam:    { select: { title: true } },
        },
      }),

      // All results for score calculation
      prisma.result.findMany({
        where: { exam: { teacherId }, status: 'SUBMITTED' },
        select: { percentage: true, studentId: true },
      }),

      prisma.exam.findMany({
        where: { teacherId },
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              assignments: true,
            },
          },
          results: {
            where: { status: { in: ['SUBMITTED', 'GRADED'] } },
            select: { studentId: true },
          },
        },
      }),
    ]);

    // Total unique students who submitted
    const uniqueStudents = new Set(allResults.map((r) => r.studentId)).size;

    // Average score
    const avgScore =
      allResults.length > 0
        ? Math.round(allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length)
        : 0;

    // Score distribution: bucket into 0-9, 10-19, ... 90-100
    const distribution = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${i * 10 + 9}`,
      count: allResults.filter((r) => r.percentage >= i * 10 && r.percentage < (i + 1) * 10).length,
    }));

    const completionByExam = exams.map((exam) => {
      const assignedCount = exam._count.assignments;
      const completedCount = new Set(exam.results.map((result) => result.studentId)).size;
      const completionRate = assignedCount > 0
        ? Math.round((completedCount / assignedCount) * 100)
        : 0;

      return {
        examId: exam.id,
        examTitle: exam.title,
        assignedCount,
        completedCount,
        completionRate,
      };
    });

    const assignedTotal = completionByExam.reduce((sum, exam) => sum + exam.assignedCount, 0);
    const completedTotal = completionByExam.reduce((sum, exam) => sum + exam.completedCount, 0);
    const completionRate = assignedTotal > 0
      ? Math.round((completedTotal / assignedTotal) * 100)
      : 0;

    return res.json({
      totalExams,
      totalStudents: uniqueStudents,
      activeExams,
      avgScore,
      completionRate,
      completionByExam,
      recentActivity: recentResults.map((r) => ({
        studentName: r.student.name,
        examTitle: r.exam.title,
        score: r.percentage,
        submittedAt: r.createdAt,
      })),
      scoreDistribution: distribution,
    });
  } catch (err) {
    next(err);
  }
}
