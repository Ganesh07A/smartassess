import { api } from '../api';
import { Exam, Question } from './examApi';

export interface StudentExam extends Exam {
  myResult: {
    id: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
    totalScore: number;
    passed: boolean;
  } | null;
}

export interface ExamAttempt extends Exam {
  questions: Question[];
}

export interface StartAttemptResponse {
  id: string;
  status: 'IN_PROGRESS';
  examId: string;
}

export interface SubmissionPayload {
  answers: Record<string, any>;
  tabSwitches: number;
}

export const studentApi = {
  listExams: () =>
    api.get<StudentExam[]>('/api/student/exams'),

  getExam: (id: string) =>
    api.get<ExamAttempt>(`/api/student/exams/${id}`),

  startAttempt: (id: string) =>
    api.post<StartAttemptResponse>(`/api/student/exams/${id}/start`),

  submitExam: (id: string, payload: SubmissionPayload) =>
    api.post(`/api/student/exams/${id}/submit`, payload),
};
