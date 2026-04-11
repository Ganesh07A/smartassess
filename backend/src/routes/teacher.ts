import { Router } from 'express';
import { requireAuth, requireTeacher } from '../middleware/auth';
import { getTeacherStats } from '../controllers/teacher/stats';
import {
  listExams,
  createExam,
  getExam,
  updateExam,
  deleteExam,
  publishExam,
  duplicateExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  assignStudents,
  getAssignments,
} from '../controllers/teacher/exams';

const router = Router();

// All teacher routes require auth + teacher role
router.use(requireAuth, requireTeacher);

// Stats
router.get('/stats', getTeacherStats);

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
router.put('/exams/:id/questions/:qid',  updateQuestion);
router.delete('/exams/:id/questions/:qid', deleteQuestion);

// Student Assignments
router.get('/exams/:id/assignments',  getAssignments);
router.post('/exams/:id/assignments', assignStudents);

export default router;
