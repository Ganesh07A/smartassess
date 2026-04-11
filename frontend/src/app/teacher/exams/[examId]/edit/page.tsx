'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Save, Settings, 
  HelpCircle, Users, FileText 
} from 'lucide-react';

import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { examApi, Exam } from '@/lib/api/examApi';
import { QuestionBuilder } from '@/components/teacher/exams/QuestionBuilder';
import { StudentAssignment } from '@/components/teacher/exams/StudentAssignment';

const schema = z.object({
  title:       z.string().min(3, 'At least 3 characters'),
  description: z.string().optional(),
  duration:    z.coerce.number().int().min(5).max(480),
  totalMarks:  z.coerce.number().int().positive(),
  passPercent: z.coerce.number().min(0).max(100),
  startTime:   z.string().optional().nullable(),
  endTime:     z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export default function EditExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  
  // Tab State
  const initialTab = searchParams.get('tab') || 'DETAILS';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchData = async () => {
    try {
      const r = await examApi.get(examId);
      setExam(r.data);
      reset({
        title:       r.data.title,
        description: r.data.description ?? '',
        duration:    r.data.duration,
        totalMarks:  r.data.totalMarks,
        passPercent: r.data.passPercent,
        startTime:   r.data.startTime ? r.data.startTime.slice(0, 16) : '',
        endTime:     r.data.endTime   ? r.data.endTime.slice(0, 16)   : '',
      });
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load exam');
      router.push('/teacher/exams');
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  const onSubmit = async (data: FormData) => {
    try {
      await examApi.update(examId, {
        ...data,
        startTime: data.startTime ? new Date(data.startTime).toISOString() : null,
        endTime:   data.endTime   ? new Date(data.endTime).toISOString()   : null,
      });
      toast.success('Exam details updated!');
      await fetchData();
    } catch (err: any) {
      toast.error(err.displayMessage ?? 'Failed to update exam');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f8f9fc] items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const dotGridBg = {
    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={`flex-1 p-4 sm:p-6 lg:ml-64 relative`} style={dotGridBg}>
          <div className="max-w-4xl mx-auto">
            
            {/* Breadcrumb & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Link href={`/teacher/exams/${examId}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                   <h1 className="text-2xl font-black text-slate-900 tracking-tight">{exam?.title}</h1>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Exam Content & Access</p>
                </div>
              </div>
              
              <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                <TabButton active={activeTab === 'DETAILS'} onClick={() => setActiveTab('DETAILS')} icon={Settings} label="Settings" />
                <TabButton active={activeTab === 'QUESTIONS'} onClick={() => setActiveTab('QUESTIONS')} icon={HelpCircle} label="Questions" />
                <TabButton active={activeTab === 'ASSIGNMENTS'} onClick={() => setActiveTab('ASSIGNMENTS')} icon={Users} label="Students" />
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'DETAILS' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 sm:p-10 space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                          <FileText className="w-5 h-5" />
                       </div>
                       <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">General Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Exam Title *</label>
                        <input
                          {...register('title')}
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none border border-transparent focus:border-blue-100 transition-all"
                          placeholder="e.g. Advanced Algorithms Midterm"
                        />
                        {errors.title && <p className="text-xs text-rose-500 mt-2 pl-1 font-medium">{errors.title.message}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Description</label>
                        <textarea
                          {...register('description')}
                          rows={3}
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none border border-transparent focus:border-blue-100 transition-all resize-none"
                          placeholder="Optional description for students"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Duration (min) *</label>
                        <input
                          {...register('duration')}
                          type="number"
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none border border-transparent focus:border-blue-100 transition-all"
                        />
                        {errors.duration && <p className="text-xs text-rose-500 mt-2 pl-1 font-medium">{errors.duration.message}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Total Marks *</label>
                        <input
                          {...register('totalMarks')}
                          type="number"
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none border border-transparent focus:border-blue-100 transition-all"
                        />
                        {errors.totalMarks && <p className="text-xs text-rose-500 mt-2 pl-1 font-medium">{errors.totalMarks.message}</p>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Passing Score (%)</label>
                        <input
                          {...register('passPercent')}
                          type="number"
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none border border-transparent focus:border-blue-100 transition-all"
                        />
                      </div>
                      <div className="invisible hidden md:block" />

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Start Time</label>
                        <input
                          {...register('startTime')}
                          type="datetime-local"
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none border border-transparent focus:border-blue-100 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">End Time</label>
                        <input
                          {...register('endTime')}
                          type="datetime-local"
                          className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none border border-transparent focus:border-blue-100 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-[1.25rem] text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><Save className="w-4 h-4" /> Update Exam Details</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'QUESTIONS' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <QuestionBuilder 
                    examId={examId} 
                    initialQuestions={exam?.questions || []} 
                    onUpdate={fetchData}
                  />
                </div>
              )}

              {activeTab === 'ASSIGNMENTS' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <StudentAssignment examId={examId} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
      {label}
    </button>
  );
}
