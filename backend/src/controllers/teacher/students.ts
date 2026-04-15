// src/controllers/teacher/students.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

export async function getStudentList(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const search = (req.query.search as string)?.trim();
    const examId = req.query.examId as string;

    const where: any = { role: 'STUDENT' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        // If examId provided, show if already assigned
        examAssignments: examId ? {
          where: { examId },
          select: { id: true }
        } : false,
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    // Add isAssigned flag if examId provided
    const result = students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      isAssigned: examId 
        ? (s.examAssignments as any[])?.length > 0 
        : undefined,
    }));

    return res.json(result);
  } catch (err) {
    next(err);
  }
}