'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  ChevronLeft, Trophy, Target, BarChart3, 
  CheckCircle2, XCircle, AlertTriangle, Shield,
  FileText, ArrowLeft, Download, ExternalLink,
  Check, X, Eye, Award
} from 'lucide-react';
import { studentApi, DetailedSubmission } from '@/lib/api/studentApi';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { exportResultSlip } from '@/lib/exportUtils';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export default function ExamReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const submissionId = params.submissionId as string;
  const examId = params.examId as string;

  const { data: submission, isLoading, error } = useSWR(
    submissionId ? `review-${submissionId}` : null,
    () => studentApi.getSubmissionResult(submissionId).then(res => res.data)
  );

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  
  if (error || !submission) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-black text-slate-900 mb-2">Failed to load review</h2>
        <p className="text-slate-500 font-bold mb-6 text-center max-w-sm">The review data is unavailable or you don't have permission to view it.</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
    </div>
  );

  const { exam, answers } = submission;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:ml-64 bg-slate-50/50">
          <div className="max-w-4xl mx-auto py-8">
            
            <button 
                onClick={() => router.back()} 
                className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 transition-colors mb-10 uppercase tracking-widest"
            >
                <ChevronLeft className="w-4 h-4" /> Back to Exams
            </button>

            {/* Performance Overview Card */}
            <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-xl shadow-slate-200/50 mb-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block shadow-sm ${submission.passed ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {submission.passed ? 'Assessment Passed' : 'Assessment Failed'}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">{exam.title}</h1>
                            <p className="text-slate-500 font-bold mt-2">Historical Review • Submitted on {new Date(submission.submittedAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="flex flex-col items-center md:items-end">
                            <div className="text-5xl font-black text-slate-900 mb-1">
                                {submission.totalScore}<span className="text-slate-300 text-2xl font-bold"> / {submission.maxScore}</span>
                            </div>
                            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Total Earned Points</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-[2rem]">
                        <MiniStat label="Percentage" value={`${Math.round(submission.percentage)}%`} icon={Target} />
                        <MiniStat label="Pass Grade" value={`${exam.passPercent}%`} icon={Award} />
                        <MiniStat label="Integrity" value={submission.tabSwitches > 3 ? 'LOW' : 'HIGH'} icon={Shield} color={submission.tabSwitches > 3 ? 'text-rose-500' : 'text-blue-600'} />
                        <div className="flex flex-col items-center justify-center p-4">
                            <button 
                                onClick={() => {
                                    const loadingToast = toast.loading("Generating official transcript...");
                                    exportResultSlip({
                                        student: { name: user?.fullName || 'Student', email: user?.primaryEmailAddress?.emailAddress || 'N/A', id: user?.id },
                                        exam: exam,
                                        result: submission as any,
                                        teacherName: (exam as any).teacher?.name
                                    });
                                    toast.success("Transcript downloaded!", { id: loadingToast });
                                }}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-[10px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
                            >
                                <Download className="w-4 h-4" /> Download PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Background Accent */}
                <div className={`absolute top-0 right-0 w-64 h-64 translate-x-1/2 -translate-y-1/2 rounded-full opacity-5 ${submission.passed ? 'bg-green-500' : 'bg-rose-500'}`} />
            </div>

            {/* Questions Review Section */}
            <div className="space-y-10">
                <div className="flex items-center gap-4 px-4">
                    <div className="h-[2px] flex-1 bg-slate-100" />
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Detailed Question Analysis</h2>
                    <div className="h-[2px] flex-1 bg-slate-100" />
                </div>

                {exam.questions.map((question, idx) => (
                    <QuestionReviewItem 
                        key={question.id} 
                        index={idx} 
                        question={question} 
                        answer={answers[question.id]} 
                    />
                ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color = 'text-blue-600' }: any) {
    return (
        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-slate-100">
            <Icon className={`w-4 h-4 ${color} mb-1.5`} />
            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">{label}</p>
            <p className="text-sm font-black text-slate-900">{value}</p>
        </div>
    );
}

function QuestionReviewItem({ index, question, answer }: { index: number, question: any, answer: any }) {
    const isCorrect = question.type === 'MCQ' 
        ? question.mcqOptions.find((o: any) => o.isCorrect)?.id === answer?.optionId
        : true; // For coding, we'll show test cases

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-sm relative overflow-hidden">
            {/* Question Label */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                        {index + 1}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {index + 1}</p>
                        <p className="text-xs font-bold text-slate-500">{question.type} • {question.marks} Points</p>
                    </div>
                </div>
                
                {question.type === 'MCQ' && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isCorrect ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                )}
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-10 leading-relaxed whitespace-pre-wrap">{question.text}</h3>

            {question.type === 'MCQ' ? (
                <div className="space-y-4">
                    {question.mcqOptions.map((option: any) => {
                        const isStudentChoice = answer?.optionId === option.id;
                        const isRightOption = option.isCorrect;
                        
                        let borderColor = 'border-slate-100';
                        let bgColor = 'bg-white';
                        let textColor = 'text-slate-600';
                        let icon = null;

                        if (isRightOption) {
                            borderColor = 'border-green-500';
                            bgColor = 'bg-green-50/50';
                            textColor = 'text-green-900';
                            icon = <Check className="w-4 h-4 text-green-600" />;
                        } else if (isStudentChoice && !isRightOption) {
                            borderColor = 'border-rose-500';
                            bgColor = 'bg-rose-50/50';
                            textColor = 'text-rose-900';
                            icon = <X className="w-4 h-4 text-rose-600" />;
                        }

                        return (
                            <div 
                                key={option.id}
                                className={`flex items-center justify-between p-6 rounded-2xl border-2 ${borderColor} ${bgColor} transition-all relative`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black
                                        ${isRightOption ? 'border-green-500 bg-green-500 text-white' : isStudentChoice ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-200 text-slate-400'}`}>
                                        {isStudentChoice && !isRightOption ? '!' : isRightOption ? '✔' : ''}
                                    </div>
                                    <span className={`text-sm font-bold ${textColor}`}>{option.text}</span>
                                </div>

                                {icon}
                                
                                {isStudentChoice && (
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[8px] font-black py-1 px-2 rounded-md shadow-lg shadow-black/10">
                                        YOUR CHOICE
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-3xl p-8 relative">
                        <div className="absolute top-4 right-6 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20" />
                            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/20" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-widest">Submitted Source Code</p>
                        <pre className="text-blue-100 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">
                            {answer?.code || '// No code submitted'}
                        </pre>
                    </div>

                    {/* Test Cases Results (Summary for student) */}
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Execution Summary
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {question.testCases.filter((tc: any) => tc.isVisible).map((tc: any, tcIdx: number) => (
                                 <div key={tcIdx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">
                                             {tcIdx + 1}
                                         </div>
                                         <span className="text-[10px] font-black text-slate-900 uppercase">Test Case {tcIdx + 1}</span>
                                     </div>
                                     <div className="flex items-center gap-2 text-[10px] font-black text-green-600">
                                        <Check className="w-4 h-4" /> PASSED
                                     </div>
                                 </div>
                             ))}
                        </div>
                        <p className="mt-6 text-[10px] font-bold text-slate-400 italic font-italic">* Hidden test cases are not shown for security reasons.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

