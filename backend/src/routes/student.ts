import { Router } from 'express';
import { requireAuth, requireStudent, resolveUser } from '../middleware/auth';
import { 
  getAssignedExams, 
  getExamDetails, 
  startAttempt, 
  saveExamProgress,
  reportViolation,
  submitExam,
  runCode
} from '../controllers/student';

const router = Router();

// All student routes require auth + user resolution + student role check
router.use(requireAuth, resolveUser, requireStudent);

router.get('/exams',          getAssignedExams);
router.get('/exams/:id',      getExamDetails);
router.post('/exams/:id/start',  startAttempt);
router.put('/exams/:id/save', saveExamProgress);
router.post('/exams/:id/violation', reportViolation);
router.post('/exams/:id/run',    runCode);
router.post('/exams/:id/submit', submitExam);

export default router;
