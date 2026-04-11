'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, Clock, ChevronRight, 
  CheckCircle2, AlertCircle, Calendar 
} from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { studentApi, StudentExam } from '@/lib/api/studentApi';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await studentApi.listExams();
        setExams(res.data);
      } catch (err) {
        toast.error('Failed to load your assessments');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const activeExams = exams.filter(e => e.status === 'ACTIVE');
  const pastExams = exams.filter(e => e.status !== 'ACTIVE');

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      {/* Reusing Sidebar/Header - ideally student would have their own, but sharing for MVP */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:ml-64">
           <div className="max-w-6xl mx-auto space-y-10">
             
             {/* Hero / Welcome */}
             <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden shadow-2xl shadow-blue-200">
                <div className="relative z-10">
                  <h1 className="text-3xl font-black tracking-tight mb-2">Welcome back!</h1>
                  <p className="text-blue-100 font-medium max-w-md">You have {activeExams.length} active assessments waiting for you. Ready to excel?</p>
                </div>
                <div className="absolute right-[-10%] bottom-[-20%] opacity-10">
                  <FileText className="w-64 h-64" />
                </div>
             </div>

             {/* Active Exams */}
             <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Assessments</h2>
                   <div className="h-px flex-1 bg-slate-100 mx-6 opacity-50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    [1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-[2rem]" />)
                  ) : activeExams.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white border border-slate-100 rounded-[2rem]">
                       <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                       <p className="text-sm font-bold text-slate-400">No active exams at the moment.</p>
                    </div>
                  ) : (
                    activeExams.map(exam => (
                      <ExamCard key={exam.id} exam={exam} isActive />
                    ))
                  )}
                </div>
             </section>

             {/* Past / Upcoming */}
             <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Activity</h2>
                   <div className="h-px flex-1 bg-slate-100 mx-6 opacity-50" />
                </div>
                
                <div className="bg-white rounded-[2rem] border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm">
                   {pastExams.map(exam => (
                     <div key={exam.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-2xl ${exam.myResult?.passed ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                              <CheckCircle2 className="w-6 h-6" />
                           </div>
                           <div>
                              <h3 className="text-sm font-black text-slate-800">{exam.title}</h3>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                {exam.myResult ? `Score: ${exam.myResult.totalScore}/${exam.totalMarks}` : 'Not Taken'}
                              </p>
                           </div>
                        </div>
                        {exam.myResult && (
                          <Link 
                            href={`/student/exams/${exam.id}/results`}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-900 text-xs font-black rounded-xl hover:bg-slate-200 transition-all"
                          >
                             View Details <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                     </div>
                   ))}
                </div>
             </section>

           </div>
        </main>
      </div>
    </div>
  );
}

function ExamCard({ exam, isActive }: { exam: StudentExam, isActive?: boolean }) {
  const status = exam.myResult?.status || 'NOT_STARTED';

  return (
    <div className="group bg-white rounded-[2rem] p-8 border border-slate-100 hover:shadow-2xl hover:shadow-blue-100/50 transition-all relative overflow-hidden flex flex-col">
       <div className="flex items-center justify-between mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
             <FileText className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
             <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-tight">Active Now</span>
          </div>
       </div>

       <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">{exam.title}</h3>
       <p className="text-xs font-medium text-slate-400 mb-6 line-clamp-2">{exam.description || 'No description provided.'}</p>

       <div className="mt-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <Clock className="w-3.5 h-3.5" /> {exam.duration}m duration
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <Calendar className="w-3.5 h-3.5" /> {exam.startTime ? new Date(exam.startTime).toLocaleDateString() : 'Available'}
             </div>
          </div>

          <Link 
            href={`/student/exams/${exam.id}/attempt`}
            className="w-full py-4 bg-blue-600 text-white text-sm font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
          >
             {status === 'IN_PROGRESS' ? 'Resume Attempt' : 'Start Assessment'}
             <ChevronRight className="w-4 h-4" />
          </Link>
       </div>
    </div>
  );
}
