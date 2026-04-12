import { Router } from 'express';
import { requireAuth, requireStudent } from '../middleware/auth';
import { 
  getAssignedExams, 
  getExamDetails, 
  startAttempt, 
  saveExamProgress,
  reportViolation,
  submitExam 
} from '../controllers/student';

const router = Router();

// All student routes require auth + student role (or higher)
router.use(requireAuth, requireStudent);

router.get('/exams',          getAssignedExams);
router.get('/exams/:id',      getExamDetails);
router.post('/exams/:id/start',  startAttempt);
router.put('/exams/:id/save', saveExamProgress);
router.post('/exams/:id/violation', reportViolation);
router.post('/exams/:id/submit', submitExam);

export default router;
