import { api } from '../api';

export const reportApi = {
  // Student Detailed PDF
  downloadStudentPDF: (resultId: string) =>
    api.get(`/api/reports/student/${resultId}/pdf`, { responseType: 'blob' }),

  // Exam Summary Excel
  downloadExamExcel: (examId: string) =>
    api.get(`/api/reports/exam/${examId}/excel`, { responseType: 'blob' }),
};
