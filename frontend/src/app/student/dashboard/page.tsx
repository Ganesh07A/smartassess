// src/app/student/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  FileText, Clock, ChevronRight,
  CheckCircle2, AlertCircle, Calendar,
  BookOpen, Trophy, Activity, History
} from 'lucide-react';
import { studentApi, StudentExam } from '@/lib/api/studentApi';
import { reportApi } from '@/lib/api/reportApi';
import { exportStudentHistory, downloadBlob } from '@/lib/exportUtils';
import { ProfileCompletionModal } from '@/components/student/ProfileCompletionModal';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useUser();
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, performanceRes] = await Promise.all([
        studentApi.listExams(),
        studentApi.getPerformance()
      ]);
      setExams(examsRes.data);
      setDbUser(performanceRes.data.student);
    } catch (err: any) {
      toast.error(err.displayMessage || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPDF = async (resultId: string, examTitle: string) => {
    const loadingToast = toast.loading(`Generating professional marksheet for ${examTitle}...`);
    try {
      const res = await reportApi.downloadStudentPDF(resultId);
      const filename = `Report_${examTitle.replace(/\s+/g, '_')}.pdf`;
      downloadBlob(res.data as any, filename);
      toast.success("Marksheet downloaded!", { id: loadingToast });
    } catch (error: any) {
      toast.error(error.displayMessage || "Failed to generate PDF report", { id: loadingToast });
    }
  };

  const handleDownloadHistory = async () => {
    setIsFetchingHistory(true);
    const loadingToast = toast.loading("Generating your university-standard history...");
    try {
        const { data } = await studentApi.getPerformance();
        if (!data || !data.submissions || data.submissions.length === 0) {
            toast.error("No performance history found.", { id: loadingToast });
            return;
        }
        
        exportStudentHistory({
            student: { 
                name: user?.fullName || 'Student', 
                email: user?.primaryEmailAddress?.emailAddress || 'N/A',
                id: user?.id 
            },
            submissions: data.submissions,
            teacherName: "SmartAssess Academic Portal"
        });
        toast.success("History report downloaded!", { id: loadingToast });
    } catch (error: any) {
        toast.error(error.displayMessage || "Failed to generate performance report", { id: loadingToast });
    } finally {
        setIsFetchingHistory(false);
    }
  };

  const activeExams = exams.filter(e => 
    (e.status === 'ACTIVE' || e.status === 'PUBLISHED') && e.myResult?.status !== 'SUBMITTED' && e.myResult?.status !== 'GRADED'
  );
  const pastExams = exams.filter(e => 
    e.myResult?.status === 'GRADED' || 
    e.myResult?.status === 'SUBMITTED'
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      {/* Onboarding Modal */}
      {!loading && dbUser && (!dbUser.prn || !dbUser.year || !dbUser.department) && (
        <ProfileCompletionModal 
          user={dbUser} 
          onComplete={() => fetchData()} 
        />
      )}

      {/* Student Sidebar */}
      <StudentSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Student Header */}
        <StudentHeader 
          onMenuClick={() => setSidebarOpen(true)}
          userName={user?.firstName || 'Student'}
        />

        <main className="flex-1 p-4 sm:p-6 lg:ml-64">
          <div className="max-w-6xl mx-auto space-y-10">

            {/* Welcome Hero */}
            <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br 
                            from-blue-600 to-indigo-700 text-white 
                            overflow-hidden shadow-2xl shadow-blue-200">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-black tracking-tight mb-2">
                    Welcome back, {user?.firstName || 'Student'}! 👋
                  </h1>
                  <p className="text-blue-100 font-medium max-w-md">
                    You have {activeExams.length} active assessment
                    {activeExams.length !== 1 ? 's' : ''} waiting. 
                    Ready to excel?
                  </p>
                </div>
                <button 
                  onClick={handleDownloadHistory}
                  disabled={isFetchingHistory}
                  className="flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 
                             rounded-2xl text-sm font-black hover:bg-white/20 transition-all active:scale-[0.98]
                             disabled:opacity-50 min-w-[220px] justify-center"
                >
                   <History className="w-5 h-5 text-white" />
                   {isFetchingHistory ? 'Preparing Report...' : 'Performance Report'}
                </button>
              </div>
              <div className="absolute right-[-10%] bottom-[-20%] opacity-10">
                <FileText className="w-64 h-64" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 
                               flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {exams.length}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Total Assigned
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 
                               flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {pastExams.filter(e => e.myResult?.passed).length}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Passed
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 
                               flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {activeExams.length}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Active Now
                  </p>
                </div>
              </div>
            </div>

            {/* Active Exams */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <h2 className="text-xs font-black text-slate-400 
                               uppercase tracking-widest whitespace-nowrap">
                  Active Assessments
                </h2>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} 
                         className="h-48 bg-slate-100 animate-pulse 
                                    rounded-[2rem]" />
                  ))
                ) : activeExams.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-white 
                                  border border-slate-100 rounded-[2rem]">
                    <AlertCircle className="w-12 h-12 text-slate-300 
                                           mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">
                      No active exams at the moment.
                    </p>
                  </div>
                ) : (
                  activeExams.map(exam => (
                    <ExamCard key={exam.id} exam={exam} isActive />
                  ))
                )}
              </div>
            </section>

            {/* Past Exams */}
            {pastExams.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <h2 className="text-xs font-black text-slate-400 
                                 uppercase tracking-widest whitespace-nowrap">
                    Recent Activity
                  </h2>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 
                                divide-y divide-slate-50 overflow-hidden shadow-sm">
                  {pastExams.map(exam => (
                    <div key={exam.id}
                         className="p-6 flex flex-col sm:flex-row sm:items-center 
                                    justify-between hover:bg-slate-50 
                                    transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl 
                          ${exam.myResult?.passed 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-red-50 text-red-400'}`}>
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800">
                            {exam.title}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 
                                        mt-1 uppercase tracking-wider">
                            Score: {exam.myResult?.totalScore ?? 0}/
                            {exam.totalMarks} •{' '}
                            {exam.myResult?.passed 
                              ? '✅ Passed' 
                              : '❌ Failed'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {exam.myResult?.id && (
                          <button
                            onClick={() => handleDownloadPDF(exam.myResult!.id, exam.title)}
                            className="flex items-center gap-2 px-5 py-2.5 
                                       bg-blue-50 text-blue-600 text-xs 
                                       font-black rounded-xl hover:bg-blue-100 
                                       transition-all"
                          >
                            <FileText className="w-4 h-4" /> Marksheet
                          </button>
                        )}
                        <Link
                          href={`/student/exams/${exam.id}/results`}
                          className="flex items-center gap-2 px-5 py-2.5 
                                     bg-slate-100 text-slate-900 text-xs 
                                     font-black rounded-xl hover:bg-slate-200 
                                     transition-all"
                        >
                          View Details <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </main>
      </div>

    </div>
  );
}

// ─── Exam Card ────────────────────────────────
function ExamCard({ exam }: { exam: StudentExam; isActive?: boolean }) {
  const status = exam.myResult?.status || 'NOT_STARTED';
  const now = new Date();
  const startTime = exam.startTime ? new Date(exam.startTime) : null;
  const isTooEarly = startTime && now < startTime;
  const isFinished = status === 'SUBMITTED' || status === 'GRADED';
  const isDisabled = isTooEarly || isFinished;

  return (
    <div className={`group bg-white rounded-[2rem] p-8 border border-slate-100 
                    ${isDisabled ? 'opacity-80' : 'hover:shadow-2xl hover:shadow-blue-100/50'} transition-all 
                    relative overflow-hidden flex flex-col`}>
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl 
                        group-hover:bg-blue-600 group-hover:text-white 
                        transition-all duration-500">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 
                        text-blue-600 rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full ${isDisabled ? 'bg-orange-500' : 'bg-blue-600 animate-pulse'}`} />
          <span className={`text-[10px] font-black uppercase tracking-tight ${isDisabled ? 'text-orange-600' : 'text-blue-600'}`}>
            {isFinished ? 'Completed' : isTooEarly ? 'Upcoming' : 'Active Now'}
          </span>
        </div>
      </div>

      <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">
        {exam.title}
      </h3>
      <p className="text-xs font-medium text-slate-400 mb-6 line-clamp-2">
        {exam.description || 'No description provided.'}
      </p>

      <div className="mt-auto space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-[10px] 
                          font-bold text-slate-500">
            <Clock className="w-3.5 h-3.5" /> {exam.duration}m
          </div>
          <div className="flex items-center gap-2 text-[10px] 
                          font-bold text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            {exam.startTime
              ? new Date(exam.startTime).toLocaleDateString()
              : 'Open'}
          </div>
        </div>

        {isDisabled ? (
            <button
                disabled
                className="w-full py-4 bg-gray-100 text-gray-400 text-sm font-black 
                        rounded-2xl flex items-center justify-center gap-2 
                        transition-all"
            >
                {isFinished ? 'Already Submitted' : 'Starts ' + (exam.startTime ? new Date(exam.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '')}
            </button>
        ) : (
            <Link
            href={`/student/exams/${exam.id}/attempt`}
            className="w-full py-4 bg-blue-600 text-white text-sm font-black 
                        rounded-2xl flex items-center justify-center gap-2 
                        hover:bg-blue-700 shadow-lg shadow-blue-100 
                        transition-all active:scale-[0.98]"
            >
            {status === 'IN_PROGRESS' ? 'Resume Attempt' : 'Start Assessment'}
            <ChevronRight className="w-4 h-4" />
            </Link>
        )}
      </div>
    </div>
  );
}

// ─── Student Sidebar ──────────────────────────
function StudentSidebar({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void 
}) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white 
                         border-r border-slate-100 z-30 
                         transition-transform duration-300
                         ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                         lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center 
                            justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-900">SmartAssess</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1">
          <Link
            href="/student/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl 
                       bg-blue-50 text-blue-600 font-bold text-sm"
          >
            <Activity className="w-4 h-4" /> Dashboard
          </Link>
          <Link
            href="/student/exams"
            className="flex items-center gap-3 px-4 py-3 rounded-xl 
                       text-slate-600 hover:bg-slate-50 font-bold text-sm 
                       transition-colors"
          >
            <FileText className="w-4 h-4" /> My Exams
          </Link>
        </nav>
      </aside>
    </>
  );
}

// ─── Student Header ───────────────────────────
function StudentHeader({ 
  onMenuClick,
  userName
}: { 
  onMenuClick: () => void;
  userName: string;
}) {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-100 
                       px-4 sm:px-6 py-4 lg:ml-64">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition"
        >
          ☰
        </button>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">{userName}</p>
            <p className="text-xs text-slate-400">Student</p>
          </div>
          {user?.imageUrl && (
            <img
              src={user.imageUrl}
              alt={userName}
              className="w-9 h-9 rounded-xl object-cover"
            />
          )}
        </div>
      </div>
    </header>
  );
}