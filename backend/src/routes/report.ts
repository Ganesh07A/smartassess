import { Router } from 'express';
import { getStudentReportPDF, getStudentSlipPDF, getExamReportExcel } from '../controllers/reportController';
import { requireAuth, resolveUser } from '../middleware/auth';

const router = Router();

// All report routes require authentication and user resolution
router.use(requireAuth, resolveUser);

// Student Report PDF
router.get('/student/:resultId/pdf', getStudentReportPDF);
router.get('/student/:resultId/slip', getStudentSlipPDF);

// Exam Report Excel (Admin/Teacher only)
router.get('/exam/:examId/excel', getExamReportExcel);

export default router;
