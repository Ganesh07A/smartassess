export type QuestionStatus = 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'SKIPPED';

export interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  marksObtained: number;
  maxMarks: number;
  status: QuestionStatus;
  isCoding: boolean;
}

export interface DetailedStudentResult {
  candidate: {
    name: string;
    email: string;
    prn: string;
  };
  assessment: {
    name: string;
    date: string;
    duration: string;
  };
  metrics: {
    totalScore: number;
    maxScore: number;
    percentile: number;
    integrityIndex: number;
  };
  questions: QuestionAnalysis[];
}
