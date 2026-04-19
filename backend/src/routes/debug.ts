import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/state', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, clerkId: true, role: true }
    });
    
    const exams = await prisma.exam.findMany({
      select: { id: true, title: true, status: true }
    });
    
    const assignments = await prisma.examAssignment.findMany({
      include: {
        student: { select: { email: true, name: true } },
        exam: { select: { title: true } }
      }
    });
    
    res.json({
      users,
      exams,
      assignments: assignments.map(a => ({
        exam: a.exam.title,
        student: a.student.email,
        studentName: a.student.name,
        studentId: a.studentId
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fix-assignments', async (req, res) => {
  try {
    const studentEmail = 'suvarnkarganesh2@gmail.com';
    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    
    if (!student) {
      return res.status(404).json({ error: `Student ${studentEmail} not found` });
    }

    const publishedExams = await prisma.exam.findMany({
      where: { status: { in: ['PUBLISHED', 'ACTIVE'] } }
    });

    const results = [];
    for (const exam of publishedExams) {
      const assignment = await prisma.examAssignment.upsert({
        where: { examId_studentId: { examId: exam.id, studentId: student.id } },
        create: { examId: exam.id, studentId: student.id },
        update: {}
      });
      results.push({ exam: exam.title, assignmentId: assignment.id });
    }

    res.json({
      message: `Assigned ${studentEmail} to ${publishedExams.length} exams`,
      details: results
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
