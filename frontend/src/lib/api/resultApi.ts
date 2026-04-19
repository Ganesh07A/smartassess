import { api } from '../api';

export interface LeaderboardRow {
  rank: number;
  id: string;
  status: 'SUBMITTED' | 'GRADED' | 'IN_PROGRESS';
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  tabSwitches: number;
  submittedAt: string | null;
  student: {
    id: string;
    name: string;
    email: string;
  };
  exam: {
    id: string;
    title: string;
    totalMarks: number;
    passPercent: number;
  };
}

export interface PaginatedLeaderboard {
  data: LeaderboardRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExamAnalytics {
  examId: string;
  attempts: number;
  assignments: number;
  passCount: number;
  passRate: number;
  completionRate: number;
  avgScore: number;
  avgPercentage: number;
  avgTabSwitches: number;
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
}

export const resultApi = {
  getExamResults: (examId: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedLeaderboard>(`/api/teacher/exams/${examId}/results`, { params }),

  getSubmissionDetail: (submissionId: string) =>
    api.get(`/api/teacher/results/${submissionId}`),

  getExamAnalytics: (examId: string) =>
    api.get<ExamAnalytics>(`/api/teacher/exams/${examId}/analytics`),

  getStudentPerformance: (studentId: string) =>
    api.get<{ student: any; submissions: any[] }>(`/api/teacher/students/${studentId}/performance`),

  getExportUrl: (examId: string) => `/api/teacher/exams/${examId}/results/export`,
};
