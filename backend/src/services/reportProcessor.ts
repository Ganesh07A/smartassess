import prisma from '../lib/prisma';
import { evaluateCodingSubmission } from './judge0';

/**
 * Intelligent Layer: Post-Submission Result Processing
 * Parses JSON answers, populates QuestionResult & SectionResult tables, 
 * and updates overall Result statistics.
 */
export async function processResult(resultId: string) {
  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: {
      exam: {
        include: {
          questions: {
            include: { mcqOptions: true, testCases: true }
          }
        }
      }
    }
  });

  if (!result || !result.answers) {
    throw new Error('Result not found or no answers provided');
  }

  const answers = result.answers as Record<string, any>;
  let totalScore = 0;
  const sectionStats: Record<string, { score: number; maxMarks: number }> = {};

  // 1. Process each question and prepare data
  const questionResultsData: any[] = [];

  for (const question of result.exam.questions) {
    const studentAnswer = answers[question.id];
    let score = 0;
    let status: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'UNATTEMPTED' = 'UNATTEMPTED';
    let selectedValue = null;
    let correctValue = null;

    if (question.type === 'MCQ') {
      const correctOpt = question.mcqOptions.find(o => o.isCorrect);
      correctValue = correctOpt?.id || null;
      selectedValue = studentAnswer?.optionId || null;

      if (selectedValue) {
        if (correctOpt && selectedValue === correctOpt.id) {
          score = question.marks;
          status = 'CORRECT';
        } else {
          // Negative marking logic (1/4th deduction if enabled)
          if (result.exam.negativeMarking) {
            score = -(question.marks / 4);
          }
          status = 'INCORRECT';
        }
      }
    } else if (question.type === 'CODING') {
      const sourceCode = studentAnswer?.code || "";
      const languageId = studentAnswer?.languageId;
      selectedValue = sourceCode;
      
      if (sourceCode) {
        const evaluation = await evaluateCodingSubmission(sourceCode, question.testCases, languageId);
        if (evaluation.totalCount > 0) {
          score = (evaluation.passedCount / evaluation.totalCount) * question.marks;
          status = evaluation.passedCount === evaluation.totalCount 
            ? 'CORRECT' 
            : (evaluation.passedCount > 0 ? 'PARTIAL' : 'INCORRECT');
        }
      }
    }

    totalScore += score;

    // Section tracking
    const sType = question.type;
    if (!sectionStats[sType]) sectionStats[sType] = { score: 0, maxMarks: 0 };
    sectionStats[sType].score += score;
    sectionStats[sType].maxMarks += question.marks;

    questionResultsData.push({
      resultId,
      questionId: question.id,
      type: question.type,
      selectedAnswer: selectedValue ? String(selectedValue) : null,
      correctAnswer: correctValue ? String(correctValue) : null,
      marks: parseFloat(score.toFixed(2)),
      status,
    });
  }

  // 2. Wrap in Transaction for Idempotency
  await prisma.$transaction([
    prisma.questionResult.deleteMany({ where: { resultId } }),
    prisma.sectionResult.deleteMany({ where: { resultId } }),
    prisma.questionResult.createMany({ data: questionResultsData }),
    prisma.sectionResult.createMany({
      data: Object.entries(sectionStats).map(([type, stats]) => ({
        resultId,
        sectionType: type as any,
        score: parseFloat(stats.score.toFixed(2)),
        maxMarks: stats.maxMarks,
      }))
    })
  ]);

  // 3. Update Final Metrics
  const percentage = result.exam.totalMarks > 0 ? (totalScore / result.exam.totalMarks) * 100 : 0;
  const grade = calculateGrade(percentage);

  await prisma.result.update({
    where: { id: resultId },
    data: {
      totalScore: Math.max(0, parseFloat(totalScore.toFixed(2))), // Score can't be negative in total
      percentage: parseFloat(percentage.toFixed(2)),
      passed: percentage >= result.exam.passPercent,
      grade,
      status: 'GRADED'
    }
  });

  return { totalScore, grade, percentage };
}

/**
 * Assigns Rank and Percentile based on performance within an exam group
 */
export async function calculateExamAnalytics(examId: string) {
  const results = await prisma.result.findMany({
    where: { examId, status: 'GRADED' },
    orderBy: { totalScore: 'desc' }
  });

  if (results.length === 0) return;

  const total = results.length;
  
  const updates = results.map((res, index) => {
    const rank = index + 1;
    // Percentile = ((Total - Rank) / Total) * 100
    const percentile = ((total - rank) / total) * 100;
    
    return prisma.result.update({
      where: { id: res.id },
      data: {
        rank,
        percentile: parseFloat(percentile.toFixed(2))
      }
    });
  });

  await prisma.$transaction(updates);
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'O'; // Outstanding
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B+';
  if (percentage >= 50) return 'B';
  if (percentage >= 40) return 'P'; // Pass
  return 'F'; // Fail
}
