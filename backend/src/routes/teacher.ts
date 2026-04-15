import { Router } from 'express';
import { requireAuth, requireTeacher } from '../middleware/auth';
import { getTeacherStats } from '../controllers/teacher/stats';
import { getStudentList } from '../controllers/teacher/students';
import { liveExamStream, notifySubmission, notifyViolation } from '../controllers/teacher/live';
import {
  listExams,
  createExam,
  getExam,
  updateExam,
  deleteExam,
  publishExam,
  duplicateExam,
  addQuestion,
  addQuestionsBulk,
  updateQuestion,
  deleteQuestion,
  assignStudents,
  getAssignments,
} from '../controllers/teacher/exams';
import {
  listExamResults,
  getSubmissionDetail,
  getExamAnalytics,
  exportExamResults,
} from '../controllers/teacher/results';

const router = Router();

// All teacher routes require auth + teacher role
router.use(requireAuth, requireTeacher);

// Stats
router.get('/stats', getTeacherStats);

router.get("/students", getStudentList)

// Live SSE stream
router.get('/exams/:id/live', liveExamStream);

// Exam CRUD
router.get('/exams',             listExams);
router.post('/exams',            createExam);
router.get('/exams/:id',         getExam);
router.put('/exams/:id',         updateExam);
router.delete('/exams/:id',      deleteExam);
router.post('/exams/:id/publish',   publishExam);
router.post('/exams/:id/duplicate', duplicateExam);

// Question Management
router.post('/exams/:id/questions',      addQuestion);
router.post('/exams/:id/questions/bulk', addQuestionsBulk);
router.put('/exams/:id/questions/:qid',  updateQuestion);
router.delete('/exams/:id/questions/:qid', deleteQuestion);

// Student Assignments
router.get('/exams/:id/assignments',  getAssignments);
router.post('/exams/:id/assignments', assignStudents);

// Results & Analytics
router.get('/exams/:id/results',         listExamResults);
router.get('/results/:submissionId',     getSubmissionDetail);
router.get('/exams/:id/analytics',       getExamAnalytics);
router.get('/exams/:id/results/export',  exportExamResults);

export default router;
