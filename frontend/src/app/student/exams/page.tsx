'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { 
  Search, Filter, BookOpen, Clock, 
  CheckCircle2, AlertCircle, ChevronRight,
  TrendingUp, Award, Calendar, ExternalLink,
  FileText
} from 'lucide-react';
import { studentApi, StudentExam } from '@/lib/api/studentApi';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';

export default function MyExamsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  const { data: exams, error, isLoading } = useSWR('student-exams', () => studentApi.listExams().then(res => res.data));

  const filteredExams = exams?.filter(ex => {
    const matchesSearch = ex.title.toLowerCase().includes(search.toLowerCase());
    const isCompleted = ex.myResult?.status === 'GRADED' || ex.myResult?.status === 'SUBMITTED';
    
    if (activeTab === 'active') return matchesSearch && !isCompleted;
    if (activeTab === 'completed') return matchesSearch && isCompleted;
    return matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 lg:ml-64 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">My Assessments</h1>
                <p className="text-slate-500 font-bold text-sm">Track your assigned exams, progress, and historical performance.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search exams..."
                    className="pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none w-full md:w-64 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats / Tabs */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-2 rounded-[2rem] border-2 border-slate-100 shadow-sm gap-2">
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <TabButton 
                  active={activeTab === 'all'} 
                  onClick={() => setActiveTab('all')} 
                  label="All Exams" 
                  count={exams?.length} 
                />
                <TabButton 
                  active={activeTab === 'active'} 
                  onClick={() => setActiveTab('active')} 
                  label="Active" 
                  count={exams?.filter(e => e.myResult?.status !== 'GRADED').length} 
                />
                <TabButton 
                  active={activeTab === 'completed'} 
                  onClick={() => setActiveTab('completed')} 
                  label="Completed" 
                  count={exams?.filter(e => e.myResult?.status === 'GRADED').length} 
                />
              </div>
            </div>

            {/* Main Content List */}
            {isLoading ? (
               <div className="space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}
               </div>
            ) : filteredExams?.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">No exams found</h3>
                  <p className="text-slate-400 font-bold text-sm">Try adjusting your filters or search term.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop List Header */}
                <div className="hidden md:grid grid-cols-12 gap-6 px-10 py-4 items-center">
                    <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment Detail</div>
                    <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</div>
                    <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Date</div>
                    <div className="col-span-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</div>
                </div>

                {filteredExams?.map((exam) => (
                  <ExamListItem key={exam.id} exam={exam} />
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2
        ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50'}
      `}
    >
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ExamListItem({ exam }: { exam: StudentExam }) {
  const result = exam.myResult;
  const isCompleted = result?.status === 'GRADED' || result?.status === 'SUBMITTED';
  const isInProgress = result?.status === 'IN_PROGRESS';
  const isClosed = exam.status === 'CLOSED';
  const showAsLocked = isClosed && !isCompleted;
  
  return (
    <div className={`group bg-white rounded-[2rem] border-2 border-slate-100 p-6 md:px-10 md:py-6 shadow-sm transition-all ${showAsLocked ? 'opacity-75 grayscale-[0.5]' : 'hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5'}`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Detail */}
        <div className="col-span-1 md:col-span-5 flex items-center gap-6">
            <div className={`hidden sm:flex w-14 h-14 rounded-2xl ${isCompleted ? 'bg-green-50 text-green-600' : showAsLocked ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'} items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                {isCompleted ? <Award className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
            </div>
            <div>
                <h3 className={`text-lg font-black tracking-tight leading-tight mb-1 transition-colors ${showAsLocked ? 'text-slate-500' : 'text-slate-900 group-hover:text-blue-600'}`}>
                    {exam.title}
                </h3>
                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {exam.duration}M</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {exam._count?.questions} Questions</span>
                </div>
            </div>
        </div>

        {/* Center: Performance */}
        <div className="col-span-1 md:col-span-2 text-center">
            {isCompleted && result ? (
                <div>
                   <p className={`text-xl font-black ${result.passed ? 'text-green-600' : 'text-rose-600'}`}>
                        {result.totalScore}<span className="text-slate-300 text-sm font-bold">/{exam.totalMarks}</span>
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Scored Points</p>
                </div>
            ) : (
                <div className="flex items-center justify-center gap-2 text-slate-300">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase">{showAsLocked ? 'N/A' : 'Pending'}</span>
                </div>
            )}
        </div>

        {/* Status / Date */}
        <div className="col-span-1 md:col-span-2 text-center">
            <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-1.5 shadow-sm
                ${isCompleted ? 'bg-green-500 text-white' : isInProgress ? 'bg-amber-500 text-white' : isClosed ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white'}`}>
                {isCompleted ? 'Graded' : isInProgress ? 'In Progress' : isClosed ? 'Time Expired' : 'Available'}
            </div>
            <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1.5">
                <Calendar className="w-3 h-3" /> {new Date(exam.createdAt).toLocaleDateString()}
            </p>
        </div>

        {/* Right: Actions */}
        <div className="col-span-1 md:col-span-3 text-right">
            {isCompleted ? (
                 <Link 
                    href={`/student/exams/${exam.id}/review/${result?.id}`}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all active:scale-[0.98] w-full"
                >
                    Review Responses <ChevronRight className="w-4 h-4" />
                </Link>
            ) : isClosed ? (
                <button 
                    disabled
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl text-xs font-black cursor-not-allowed w-full border-2 border-slate-200"
                >
                    Locked / Closed <ChevronRight className="w-4 h-4" />
                </button>
            ) : (
                <Link 
                    href={`/student/exams/${exam.id}/start`}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98] w-full"
                >
                    {isInProgress ? 'Resume' : 'Start Exam'} <ChevronRight className="w-4 h-4" />
                </Link>
            )}
        </div>

      </div>
    </div>
  );
}
