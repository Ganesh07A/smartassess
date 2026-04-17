import { z } from 'zod';

export const McqOptionSchema = z.object({
  text:      z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean().default(false),
});

export const TestCaseSchema = z.object({
  input:          z.string(),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  isVisible:      z.boolean().default(true),
});

export const QuestionSchema = z.object({
  type:       z.enum(['MCQ', 'CODING']),
  text:       z.string().min(5, 'Question text must be at least 5 characters'),
  marks:      z.number().int().positive().default(5),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  order:      z.number().int().default(0),
  mcqOptions: z.array(McqOptionSchema).optional(),
  testCases:  z.array(TestCaseSchema).optional(),
});
export const BulkQuestionSchema = z.array(QuestionSchema).min(1, 'Must provide at least one question');

export const CreateExamSchema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().optional(),
  duration:    z.number().int().min(5, 'Minimum 5 minutes').max(480, 'Maximum 8 hours'),
  totalMarks:  z.number().int().positive('Total marks must be positive'),
  passPercent: z.number().min(0).max(100).default(40),
  startTime:   z.string().datetime().optional().nullable(),
  endTime:     z.string().datetime().optional().nullable(),
  negativeMarking: z.boolean().default(false),
});

export const UpdateExamSchema = CreateExamSchema.partial();

export type CreateExamInput = z.infer<typeof CreateExamSchema>;
export type UpdateExamInput = z.infer<typeof UpdateExamSchema>;
export type QuestionInput   = z.infer<typeof QuestionSchema>;

