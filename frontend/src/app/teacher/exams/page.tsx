'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import {
  Plus, Search, FileText, Trash2, Edit, Eye, Copy, Send,
  ChevronLeft, ChevronRight, Filter, Users, HelpCircle,
  Calendar, MoreVertical, ExternalLink
} from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { examApi, Exam } from '@/lib/api/examApi';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT:     { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  PUBLISHED: { label: 'Published', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  ACTIVE:    { label: 'Live Now', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CLOSED:    { label: 'Closed', bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
};

export default function ExamsHubPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const cacheKey = `/api/teacher/exams?page=${page}&search=${search}&status=${statusFilter}`;
  const { data, isLoading, mutate } = useSWR(cacheKey, () =>
    examApi.list({ page, limit: 12, search: search || undefined, status: statusFilter || undefined }).then((r) => r.data)
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) return;
    try {
      await examApi.delete(id);
      toast.success('Assessment deleted');
      mutate();
    } catch {
      toast.error('Failed to delete assessment');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await examApi.publish(id);
      toast.success('Assessment is now live!');
      mutate();
    } catch {
      toast.error('Failed to publish assessment');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/40">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen relative lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 sm:p-10 lg:p-12 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-10">
            
            {/* Professional Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Assessments Hub</h1>
                <p className="text-sm font-bold text-slate-400 tracking-wide uppercase">
                  Manage and monitor your exam library
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                 <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                    <input
                      type="text"
                      placeholder="Search exams..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-11 pr-6 py-3.5 bg-white border border-slate-100 rounded-[1.25rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-blue-50 outline-none w-full sm:w-64 transition-all"
                    />
                 </div>
                 
                 <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-6 py-3.5 bg-white border border-slate-100 rounded-[1.25rem] text-sm font-bold shadow-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer appearance-none"
                 >
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ACTIVE">Live</option>
                    <option value="CLOSED">Closed</option>
                 </select>

                 <button
                    onClick={async () => {
                      try {
                        const res = await examApi.create({
                           title: 'Untitled Assessment',
                           duration: 60,
                           totalMarks: 100,
                        });
                        router.push(`/teacher/exams/${res.data.id}/edit`);
                      } catch (err: any) {
                        const msg = err.response?.data?.error || err.message || 'Unknown error';
                        console.error('Create Exam Error:', err);
                        toast.error(`Failed: ${msg}`);
                      }
                    }}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-[1.25rem] font-black shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95 group"
                 >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Create Exam</span>
                 </button>
              </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 h-64 animate-pulse shadow-sm" />
                ))}
              </div>
            ) : data?.data.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
                 <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-8">
                    <FileText className="w-12 h-12" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 mb-2">No assessments found</h2>
                 <p className="text-slate-400 font-bold mb-10 max-w-sm mx-auto">Get started by creating your first professional assessment or import a template.</p>
                 <button 
                  onClick={async () => {
                    try {
                      const res = await examApi.create({
                         title: 'Untitled Assessment',
                         duration: 60,
                         totalMarks: 100,
                      });
                      router.push(`/teacher/exams/${res.data.id}/edit`);
                    } catch {
                      toast.error('Failed to create assessment');
                    }
                  }}
                  className="text-blue-600 font-black hover:underline uppercase tracking-widest text-xs"
                 >
                    Build your first exam →
                 </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {data?.data.map((exam: Exam) => (
                  <ExamCard 
                    key={exam.id} 
                    exam={exam} 
                    onDelete={() => handleDelete(exam.id)}
                    onPublish={() => handlePublish(exam.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {data && data.pagination.totalPages > 1 && (
               <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Showing {(page - 1) * 12 + 1} to {Math.min(page * 12, data.pagination.total)} of {data.pagination.total} assessments
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:text-blue-600 disabled:opacity-30 transition-all hover:shadow-lg active:scale-95"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-black text-slate-900 px-4">{page} / {data.pagination.totalPages}</span>
                    <button
                      disabled={page === data.pagination.totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:text-blue-600 disabled:opacity-30 transition-all hover:shadow-lg active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
               </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ExamCard({ exam, onDelete, onPublish }: { exam: Exam; onDelete: () => void; onPublish: () => void }) {
  const status = STATUS_CONFIG[exam.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden flex flex-col">
       <div className="p-8 space-y-6 flex-1">
          <div className="flex items-start justify-between">
             <div className="flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${status.bg} ${status.text}`}>
                   <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                   {status.label}
                </div>
             </div>
             <button onClick={onDelete} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                <Trash2 className="w-4 h-4" />
             </button>
          </div>

          <div>
             <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                {exam.title}
             </h3>
             <p className="text-xs font-bold text-slate-400 line-clamp-2 leading-relaxed h-8">
                {exam.description || 'No description provided.'}
             </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
             <div className="p-4 bg-slate-50/50 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                   <HelpCircle className="w-3 h-3" /> Questions
                </div>
                <p className="text-lg font-black text-slate-900">{exam._count?.questions ?? 0}</p>
             </div>
             <div className="p-4 bg-slate-50/50 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                   <Users className="w-3 h-3" /> Candidates
                </div>
                <p className="text-lg font-black text-slate-900">0</p>
             </div>
          </div>
       </div>

       <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modified</span>
             <span className="text-[11px] font-bold text-slate-600">{new Date(exam.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
             {exam.status === 'DRAFT' && (
                <button onClick={onPublish} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                   Go Live
                </button>
             )}
             <Link 
               href={`/teacher/exams/${exam.id}/edit`} 
               className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-black text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
             >
                <Edit className="w-3.5 h-3.5" />
                Manage
             </Link>
          </div>
       </div>
    </div>
  );
}
