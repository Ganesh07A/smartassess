import { api } from '../api';
import { Exam, Question } from './examApi';

export interface StudentExam extends Exam {
  myResult: {
    id: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
    totalScore: number;
    percentage: number;
    passed: boolean;
    tabSwitches: number;
    answers?: Record<string, unknown>;
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
  answers: Record<string, unknown>;
  tabSwitches: number;
}

export interface SaveProgressPayload {
  answers: Record<string, unknown>;
}

export interface ViolationPayload {
  type: 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface TestCaseOutcome {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  status: string;
  stderr: string | null;
  compileOutput: string | null;
}

export interface CodingExecutionResult {
  passedCount: number;
  totalCount: number;
  details: TestCaseOutcome[];
}

export const studentApi = {
  listExams: () =>
    api.get<StudentExam[]>('/api/student/exams'),

  getExam: (id: string) =>
    api.get<ExamAttempt>(`/api/student/exams/${id}`),

  startAttempt: (id: string) =>
    api.post<StartAttemptResponse>(`/api/student/exams/${id}/start`),

  saveProgress: (id: string, payload: SaveProgressPayload) =>
    api.put(`/api/student/exams/${id}/save`, payload),

  reportViolation: (id: string, payload: ViolationPayload) =>
    api.post(`/api/student/exams/${id}/violation`, payload),

  runCode: (examId: string, payload: { questionId: string; code: string }) =>
    api.post<CodingExecutionResult>(`/api/student/exams/${examId}/run`, payload),

  submitExam: (id: string, payload: SubmissionPayload) =>
    api.post(`/api/student/exams/${id}/submit`, payload),
};
