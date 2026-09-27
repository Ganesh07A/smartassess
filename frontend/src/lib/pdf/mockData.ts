import { DetailedStudentResult } from '../../types/pdf';

export const mockDetailedResult: DetailedStudentResult = {
  candidate: {
    name: "Shivam Adik",
    email: "suvarnkarganesh2@gmail.com",
    prn: "23021121911013",
  },
  assessment: {
    name: "Demo Examination",
    date: "23 April 2026",
    duration: "20 Minutes",
  },
  metrics: {
    totalScore: 10,
    maxScore: 20,
    percentile: 85,
    integrityIndex: 98,
  },
  questions: [
    {
      questionId: "Q1",
      questionText: "What is the time complexity of binary search?",
      studentAnswer: "O(log n)",
      correctAnswer: "O(log n)",
      marksObtained: 2,
      maxMarks: 2,
      status: "CORRECT",
      isCoding: false,
    },
    {
      questionId: "Q2",
      questionText: "Which data structure uses LIFO?",
      studentAnswer: "Queue",
      correctAnswer: "Stack",
      marksObtained: 0,
      maxMarks: 2,
      status: "INCORRECT",
      isCoding: false,
    },
    {
      questionId: "Q3",
      questionText: "What does SQL stand for?",
      studentAnswer: "Structured Query Lang.",
      correctAnswer: "Structured Query Lang.",
      marksObtained: 2,
      maxMarks: 2,
      status: "CORRECT",
      isCoding: false,
    },
    {
      questionId: "Q4",
      questionText: "Which protocol is used for secure communication?",
      studentAnswer: "HTTPS",
      correctAnswer: "HTTPS",
      marksObtained: 2,
      maxMarks: 2,
      status: "CORRECT",
      isCoding: false,
    },
    {
      questionId: "Q5",
      questionText: "In React, what hook is used for side effects?",
      studentAnswer: "",
      correctAnswer: "useEffect",
      marksObtained: 0,
      maxMarks: 2,
      status: "SKIPPED",
      isCoding: false,
    },
    {
      questionId: "Q6",
      questionText: "Write a function to reverse a string.",
      studentAnswer: "function rev(str) { return str.split('')... }",
      correctAnswer: "const reverse = s => s.split('').reverse().join('');",
      marksObtained: 4,
      maxMarks: 10,
      status: "PARTIAL",
      isCoding: true,
    }
  ]
};
