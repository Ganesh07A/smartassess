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
  
  // Track section-wise scores
  const sectionStats: Record<string, { score: number; maxMarks: number }> = {};

  // Clean up existing results if any (for idempotency)
  await prisma.questionResult.deleteMany({ where: { resultId } });
  await prisma.sectionResult.deleteMany({ where: { resultId } });

  // 1. Process each question
  const questionResultsData = [];

  for (const question of result.exam.questions) {
    const studentAnswer = answers[question.id];
    let score = 0;
    let status = 'INCORRECT';
    let selectedValue = null;
    let correctValue = null;

    if (question.type === 'MCQ') {
      const correctOpt = question.mcqOptions.find(o => o.isCorrect);
      correctValue = correctOpt?.id || null;
      selectedValue = studentAnswer?.optionId || null;

      if (correctOpt && selectedValue === correctOpt.id) {
        score = question.marks;
        status = 'CORRECT';
      }
    } else if (question.type === 'CODING') {
      const sourceCode = studentAnswer?.code || "";
      const languageId = studentAnswer?.languageId;
      selectedValue = sourceCode;
      
      // We can re-evaluate or use cached results if we store them in the JSON
      // For now, let's re-evaluate to be safe or if not present
      if (sourceCode) {
        const evaluation = await evaluateCodingSubmission(sourceCode, question.testCases, languageId);
        if (evaluation.totalCount > 0) {
          score = (evaluation.passedCount / evaluation.totalCount) * question.marks;
          status = evaluation.passedCount === evaluation.totalCount ? 'CORRECT' : (evaluation.passedCount > 0 ? 'PARTIAL' : 'INCORRECT');
        }
      }
    }

    totalScore += score;

    // Update section stats
    if (!sectionStats[question.type]) {
      sectionStats[question.type] = { score: 0, maxMarks: 0 };
    }
    sectionStats[question.type].score += score;
    sectionStats[question.type].maxMarks += question.marks;

    questionResultsData.push({
      resultId,
      questionId: question.id,
      type: question.type,
      selectedAnswer: selectedValue ? String(selectedValue) : null,
      correctAnswer: correctValue ? String(correctValue) : null,
      marks: Math.round(score),
      status,
    });
  }

  // 2. Save Question Results
  await prisma.questionResult.createMany({
    data: questionResultsData
  });

  // 3. Save Section Results
  const sectionResultsData = Object.entries(sectionStats).map(([type, stats]) => ({
    resultId,
    sectionType: type as any,
    score: Math.round(stats.score),
    maxMarks: stats.maxMarks,
  }));

  await prisma.sectionResult.createMany({
    data: sectionResultsData
  });

  // 4. Update Main Result with analytics
  const percentage = result.exam.totalMarks > 0 ? (totalScore / result.exam.totalMarks) * 100 : 0;
  const grade = calculateGrade(percentage);

  await prisma.result.update({
    where: { id: resultId },
    data: {
      totalScore: Math.round(totalScore),
      percentage,
      passed: percentage >= result.exam.passPercent,
      grade,
      status: 'GRADED'
    }
  });

  return { totalScore, grade, percentage };
}

/**
 * Calculates grade based on percentage
 */
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

/**
 * Global Rank & Percentile Calculation
 * Should be triggered after an exam is closed
 */
export async function calculateExamAnalytics(examId: string) {
  const results = await prisma.result.findMany({
    where: { examId, status: 'GRADED' },
    orderBy: { totalScore: 'desc' }
  });

  if (results.length === 0) return;

  const totalParticipants = results.length;

  for (let i = 0; i < results.length; i++) {
    const rank = i + 1;
    // Percentile = ((Total Participants - Rank) / Total Participants) * 100
    const percentile = ((totalParticipants - rank) / totalParticipants) * 100;

    await prisma.result.update({
      where: { id: results[i].id },
      data: {
        rank,
        percentile: parseFloat(percentile.toFixed(2))
      }
    });
  }
}
