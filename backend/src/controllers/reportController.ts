import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { generatePDF } from '../lib/pdfGenerator';
import { generateExcel } from '../lib/excelGenerator';

/**
 * Report Controller
 * Handles generation of PDF and Excel reports for students and exams.
 */

// 1. Student Detailed Report (PDF)
export async function getStudentReportPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const { resultId } = req.params;
    const userId = (req as any).userId; // From auth middleware

    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        student: true,
        exam: true,
        sectionResults: true,
      }
    });

    if (!result) return res.status(404).json({ error: 'Result not found' });

    // Access check: Only student themselves or teacher/admin can view
    if ((req as any).role === 'STUDENT' && result.studentId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const data = {
      generatedDate: new Date().toLocaleDateString(),
      studentName: result.student.name,
      studentEmail: result.student.email,
      studentPRN: result.student.prn || 'N/A',
      studentDept: result.student.department || 'N/A',
      examTitle: result.exam.title,
      examDate: result.submittedAt?.toLocaleDateString() || 'N/A',
      examDuration: result.exam.duration,
      tabSwitches: result.tabSwitches,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      percentage: result.percentage.toFixed(2),
      grade: result.grade || 'N/A',
      status: result.passed ? 'PASSED' : 'FAILED',
      sections: result.sectionResults.map(s => ({
        sectionType: s.sectionType,
        score: s.score,
        maxMarks: s.maxMarks
      }))
    };

    const pdfBuffer = await generatePDF('studentReport', data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Report_${result.student.name.replace(/\s+/g, '_')}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

// 2. Exam Summary Report (Excel)
export async function getExamReportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const { examId } = req.params;

    const results = await prisma.result.findMany({
      where: { examId, status: 'GRADED' },
      include: {
        student: { select: { name: true, email: true, prn: true, department: true } }
      },
      orderBy: { totalScore: 'desc' }
    });

    if (results.length === 0) return res.status(404).json({ error: 'No results found for this exam' });

    const flatData = results.map(r => ({
      Rank: r.rank || 'N/A',
      Name: r.student.name,
      Email: r.student.email,
      PRN: r.student.prn || 'N/A',
      Department: r.student.department || 'N/A',
      Score: r.totalScore,
      MaxMarks: r.maxScore,
      Percentage: r.percentage.toFixed(2) + '%',
      Grade: r.grade,
      Status: r.passed ? 'PASS' : 'FAIL',
      TabSwitches: r.tabSwitches,
      Percentile: r.percentile || 'N/A',
      SubmittedAt: r.submittedAt?.toLocaleString() || 'N/A'
    }));

    const excelBuffer = generateExcel(flatData, 'ExamResults');

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Exam_Results_${examId}.xlsx`,
    });

    return res.send(excelBuffer);
  } catch (err) {
    next(err);
  }
}
