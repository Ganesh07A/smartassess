import { api } from '../api';

export interface TeacherStats {
  totalExams: number;
  totalStudents: number;
  activeExams: number;
  avgScore: number;
  recentActivity: {
    studentName: string;
    examTitle: string;
    score: number;
    submittedAt: string;
  }[];
  scoreDistribution: {
    range: string;
    count: number;
  }[];
}

export const statsApi = {
  get: () => api.get<TeacherStats>('/api/teacher/stats'),
};
