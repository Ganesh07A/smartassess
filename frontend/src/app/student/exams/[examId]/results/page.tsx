'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, ChevronLeft, Target, 
  BarChart3, CheckCircle, XCircle,
  FileText, Clock, AlertTriangle, Shield
} from 'lucide-react';

import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { studentApi, StudentExam } from '@/lib/api/studentApi';
import toast from 'react-hot-toast';

export default function ExamResultsPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<StudentExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await studentApi.listExams();
        const found = res.data.find(e => e.id === examId);
        if (found && found.myResult) {
          setExam(found);
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
                       <ResultStat label="Percentage" value={`${result.percentage.toFixed(1)}%`} icon={Target} />
                       <ResultStat label="Points" value={result.totalScore} icon={BarChart3} />
                       <ResultStat label="Status" value={result.passed ? 'PASSED' : 'FAILED'} icon={result.passed ? CheckCircle : XCircle} />
                    </div>
                 </div>
                 
                 {/* Decorative background circle */}
                 <div className={`absolute left-[-10%] top-[-20%] w-64 h-64 rounded-full opacity-10 ${result.passed ? 'bg-green-300' : 'bg-rose-300'}`} />
              </div>

              {/* Detailed Feedback (Placeholder) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
