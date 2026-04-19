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
router.get('/performance', (req, res, next) => {
  const { getStudentPerformanceSelf } = require('../controllers/student');
  return getStudentPerformanceSelf(req, res, next);
});

router.get('/results/:submissionId', (req, res, next) => {
  const { getMySubmissionDetail } = require('../controllers/student');
  return getMySubmissionDetail(req, res, next);
});

export default router;
