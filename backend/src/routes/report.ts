import { Router } from 'express';
import { getStudentReportPDF, getExamReportExcel } from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All report routes require authentication
router.use(requireAuth);

// Student Report PDF
router.get('/student/:resultId/pdf', getStudentReportPDF);

// Exam Report Excel (Admin/Teacher only)
router.get('/exam/:examId/excel', getExamReportExcel);

export default router;
