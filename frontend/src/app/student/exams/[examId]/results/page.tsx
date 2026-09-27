'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, ChevronLeft, Target, 
  BarChart3, CheckCircle, XCircle,
  FileText, Clock, AlertTriangle, Shield,
  Download
} from 'lucide-react';

import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { useUser } from '@clerk/nextjs';
import { studentApi, StudentExam } from '@/lib/api/studentApi';
import { exportResultSlip } from '@/lib/exportUtils';
import toast from 'react-hot-toast';

export default function ExamResultsPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [exam, setExam] = useState<StudentExam | null>(null);
  const [detailedSubmission, setDetailedSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await studentApi.listExams();
        const found = res.data.find(e => e.id === examId);
        if (found && found.myResult) {
          setExam(found);
          // Fetch detailed submission for the premium report
          const detailedRes = await studentApi.getSubmissionResult(found.myResult.id);
          setDetailedSubmission(detailedRes.data);
        } else {
          toast.error('No result found for this exam');
          router.push('/student/dashboard');
        }
      } catch (err) {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [examId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  const result = exam!.myResult!;
  const scoreColor = result.passed ? 'text-green-500' : 'text-rose-500';
  const bgColor = result.passed ? 'bg-green-50' : 'bg-rose-50';
  const borderColor = result.passed ? 'border-green-100' : 'border-rose-100';

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:ml-64 bg-slate-50/50">
           <div className="max-w-4xl mx-auto py-8">
              
              <Link href="/student/dashboard" className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 transition-colors mb-10">
                 <ChevronLeft className="w-4 h-4" /> Back to Dashboard
              </Link>

              {/* Score Overview Card */}
              <div className={`rounded-[3rem] border-2 ${bgColor} ${borderColor} p-10 md:p-14 text-center shadow-xl shadow-slate-200/50 relative overflow-hidden mb-12`}>
                 <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${result.passed ? 'bg-green-500' : 'bg-rose-500'} text-white shadow-2xl`}>
                       <Trophy className="w-10 h-10" />
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">
                       {result.passed ? 'Congratulations!' : 'Keep Practicing!'}
                    </h1>
                    <p className="text-slate-500 font-bold mb-10 max-w-sm mx-auto">
                       You scored <span className={scoreColor}>{result.totalScore}</span> out of {exam?.totalMarks} in your attempt on {exam?.title}.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
                       <ResultStat label="Percentage" value={`${(result.percentage ?? 0).toFixed(1)}%`} icon={Target} />
                       <ResultStat label="Points" value={result.totalScore} icon={BarChart3} />
                       <ResultStat label="Status" value={result.passed ? 'PASSED' : 'FAILED'} icon={result.passed ? CheckCircle : XCircle} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-10">
                      <button 
                        onClick={() => {
                          if (!detailedSubmission) return;
                          const loadingToast = toast.loading("Generating premium marksheet...");
                          try {
                            const { StudentReportGenerator } = require('@/lib/pdf/StudentReportGenerator');
                            const generator = new StudentReportGenerator();
                            
                            // Map DetailedSubmission to DetailedStudentResult
                            const reportData = {
                              candidate: {
                                name: user?.fullName || 'Student',
                                email: user?.primaryEmailAddress?.emailAddress || 'N/A',
                                prn: (user?.publicMetadata?.prn as string) || 'N/A',
                              },
                              assessment: {
                                name: detailedSubmission.exam.title,
                                date: new Date(detailedSubmission.submittedAt).toLocaleDateString(),
                                duration: `${detailedSubmission.exam.duration} Minutes`,
                              },
                              metrics: {
                                totalScore: detailedSubmission.totalScore,
                                maxScore: detailedSubmission.maxScore,
                                percentile: 85, // Placeholder for actual percentile
                                integrityIndex: 100 - (detailedSubmission.tabSwitches * 5),
                              },
                              questions: detailedSubmission.exam.questions.map((q: any) => {
                                const studentAnswer = detailedSubmission.answers[q.id];
                                // Basic scoring logic or use backend marks if available
                                const isCorrect = q.mcqOptions?.find((o: any) => o.isCorrect)?.text === studentAnswer;
                                
                                return {
                                  questionId: q.id.slice(-4).toUpperCase(),
                                  questionText: q.text,
                                  studentAnswer: typeof studentAnswer === 'string' ? studentAnswer : JSON.stringify(studentAnswer),
                                  correctAnswer: q.mcqOptions?.find((o: any) => o.isCorrect)?.text || 'N/A',
                                  marksObtained: isCorrect ? q.marks : 0,
                                  maxMarks: q.marks,
                                  status: isCorrect ? 'CORRECT' : (studentAnswer ? 'INCORRECT' : 'SKIPPED'),
                                  isCoding: q.type === 'CODING',
                                };
                              })
                            };

                            generator.downloadStudentReport(reportData, `Marksheet_${detailedSubmission.exam.title}.pdf`);
                            toast.success("Premium marksheet downloaded!", { id: loadingToast });
                          } catch (error) {
                            console.error(error);
                            toast.error("Failed to generate premium report", { id: loadingToast });
                          }
                        }}
                        className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all active:scale-[0.98] shadow-lg"
                      >
                         <Trophy className="w-5 h-5 text-emerald-400" /> Download Premium Marksheet
                      </button>

                      <button 
                        onClick={() => {
                          if (!exam || !exam.myResult) return;
                          const loadingToast = toast.loading("Generating official result slip...");
                          exportResultSlip({
                              student: { 
                                  name: user?.fullName || 'Student', 
                                  email: user?.primaryEmailAddress?.emailAddress || 'N/A',
                                  id: user?.id 
                              },
                              exam: exam,
                              result: exam.myResult,
                              teacherName: (exam as any).teacher?.name
                          });
                          toast.success("Result slip downloaded!", { id: loadingToast });
                        }}
                        className="flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-sm font-black hover:bg-white/30 transition-all active:scale-[0.98]"
                      >
                         <Download className="w-5 h-5" /> Formal Result
                      </button>
                    </div>
                 </div>
                 
                 {/* Decorative background circle */}
                 <div className={`absolute left-[-10%] top-[-20%] w-64 h-64 rounded-full opacity-10 ${result.passed ? 'bg-green-300' : 'bg-rose-300'}`} />
              </div>

              {/* Detailed Feedback (Placeholder) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden">
                 <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <FileText className="w-4 h-4" /> Exam Info
                    </h3>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">Passing Grade</span>
                          <span className="text-xs font-black text-slate-900">{exam?.passPercent}%</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">Questions Answered</span>
                          <span className="text-xs font-black text-slate-900">{Object.keys(result.answers || {}).length} / {exam?._count?.questions}</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Shield className="w-4 h-4" /> Integrity Report
                    </h3>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">Security Limit (Tab Switches)</span>
                          <span className="text-xs font-black text-slate-900">3 Switches</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">Actual Disruptions</span>
                          <span className={`text-xs font-black ${result.tabSwitches > 0 ? 'text-rose-500' : 'text-slate-900'}`}>{result.tabSwitches}</span>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </main>
      </div>


    </div>
  );
}

function ResultStat({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-inner flex flex-col items-center">
       <div className="p-3 bg-white rounded-xl shadow-sm mb-3">
          <Icon className="w-5 h-5 text-blue-600" />
       </div>
       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
       <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}
