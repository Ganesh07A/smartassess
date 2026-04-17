import { Exam, Question } from "@/lib/api/examApi";

export type QuestionDraft = {
  tempId: string;
  order: number;
  text: string;
  type: "MCQ" | "CODE";
  options: { a: string; b: string; c: string; d: string };
  testCases: { input: string; expectedOutput: string; isVisible: boolean }[];
  correctAnswer: string;
  points: number;
};

export type Assessment = Exam;

export type AssessmentFormData = {
  title: string;
  description: string;
  duration: number;
  startTime: string;
  endTime: string;
  negativeMarking: boolean;
  isPublished: boolean;
  questions: QuestionDraft[];
};
