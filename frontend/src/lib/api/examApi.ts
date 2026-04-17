// Updated: 2026-04-17T22:20:00Z
import { api } from '../api';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passPercent: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED';
  startTime?: string | null;
  endTime?: string | null;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  negativeMarking: boolean;
  _count?: {
    questions: number;
    results: number;
    assignments: number;
  };
}

export interface PaginatedExams {
  data: Exam[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateExamPayload {
  title: string;
  description?: string;
  duration: number;
  totalMarks: number;
  passPercent?: number;
  startTime?: string | null;
  endTime?: string | null;
  negativeMarking?: boolean;
}

export interface Question {
  id: string;
  examId: string;
  type: 'MCQ' | 'CODING';
  text: string;
  marks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  order: number;
  mcqOptions?: McqOption[];
  testCases?: TestCase[];
}

export interface McqOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
}

export interface TestCase {
  id: string;
  questionId: string;
  input: string;
  expectedOutput: string;
  isVisible: boolean;
}

export interface QuestionPayload {
  type: 'MCQ' | 'CODING';
  text: string;
  marks: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  order?: number;
  mcqOptions?: { text: string; isCorrect: boolean }[];
  testCases?: { input: string; expectedOutput: string; isVisible: boolean }[];
}

export interface ExamAssignment {
  id: string;
  examId: string;
  studentId: string;
  assignedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

export const examApi = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<PaginatedExams>('/api/teacher/exams', { params }),

  get: (id: string) =>
    api.get<Exam>(`/api/teacher/exams/${id}`),

  create: (payload: CreateExamPayload) =>
    api.post<Exam>('/api/teacher/exams', payload),

  update: (id: string, payload: Partial<CreateExamPayload>) =>
    api.put<Exam>(`/api/teacher/exams/${id}`, payload),

  delete: (id: string) =>
    api.delete(`/api/teacher/exams/${id}`),

  publish: (id: string) =>
    api.post<Exam>(`/api/teacher/exams/${id}/publish`),

  duplicate: (id: string) =>
    api.post<Exam>(`/api/teacher/exams/${id}/duplicate`),

  // Question Management
  addQuestion: (examId: string, payload: QuestionPayload) =>
    api.post<Question>(`/api/teacher/exams/${examId}/questions`, payload),

  addQuestionsBulk: (examId: string, questions: QuestionPayload[]) =>
    api.post<Question[]>(`/api/teacher/exams/${examId}/questions/bulk`, questions),

  syncQuestions: (examId: string, questions: QuestionPayload[]) =>
    api.put<Question[]>(`/api/teacher/exams/${examId}/questions`, questions),

  updateQuestion: (examId: string, qid: string, payload: Partial<QuestionPayload>) =>
    api.put<Question>(`/api/teacher/exams/${examId}/questions/${qid}`, payload),

  deleteQuestion: (id: string, qid: string) =>
    api.delete(`/api/teacher/exams/${id}/questions/${qid}`),

  // Student Assignments
  getAssignments: (examId: string) =>
    api.get<ExamAssignment[]>(`/api/teacher/exams/${examId}/assignments`),

  assignStudents: (examId: string, studentIds: string[]) =>
    api.post(`/api/teacher/exams/${examId}/assignments`, { studentIds }),

  listStudents: (params?: { search?: string; showAll?: boolean }) =>
    api.get<any[]>('/api/teacher/students', { params }),
};
