'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Clock, CheckCircle, FileText, Settings,
  Eye, LayoutDashboard, Plus, Upload, Download
} from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { examApi } from '@/lib/api/examApi';

const schema = z.object({
  title:       z.string().min(3, 'At least 3 characters'),
  description: z.string().optional(),
  duration:    z.coerce.number().int().min(5).max(480),
  totalMarks:  z.coerce.number().int().positive(),
  passPercent: z.coerce.number().min(0).max(100),
  startTime:   z.string().optional(),
  endTime:     z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CreateExamPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('DETAILS');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    // @ts-ignore - mismatch between zod coercion and react-hook-form resolver types
    resolver: zodResolver(schema),
    defaultValues: { duration: 60, totalMarks: 100, passPercent: 40 },
  });


  const title       = watch('title') || 'New Exam';
  const duration    = watch('duration') || 60;
  const totalMarks  = watch('totalMarks') || 100;
  const passPercent = watch('passPercent') || 40;

  const dotGridBg = {
    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  };

  const onSubmit = async (data: FormData) => {
    try {
      const res = await examApi.create({
        ...data,
        startTime: data.startTime ? new Date(data.startTime).toISOString() : null,
        endTime:   data.endTime   ? new Date(data.endTime).toISOString()   : null,
      });
      toast.success('Exam created!');
      router.push(`/teacher/exams/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.displayMessage ?? 'Failed to create exam');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* Desktop Sidebar (Left Toolbox) */}
      <div className="hidden lg:block w-72 bg-white border-r border-slate-100 h-screen sticky top-0 overflow-y-auto z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">SmartAssess</span>
          </div>

          <div className="mb-10">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Exam Details</h3>
            <div className="space-y-3 px-1">
              <StatItem label="Title:" value={title.length > 20 ? title.slice(0, 20) + '…' : title} />
              <StatItem label="Duration:" value={`${duration} min`} />
              <StatItem label="Total Marks:" value={String(totalMarks)} />
              <StatItem label="Pass Score:" value={`${passPercent}%`} color="text-blue-600" />
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">After Creation</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed px-1">
              Once created, you'll be taken to the exam page where you can add MCQ and Coding questions.
            </p>
          </div>

          <Link href="/teacher/exams" className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Exams
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {duration} mins</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {totalMarks} marks</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/teacher/exams" className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Cancel
            </Link>
            <button
              form="create-exam-form"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><ArrowLeft className="w-3.5 h-3.5 rotate-180" /> Create Exam</>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-5 bg-white border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Link href="/teacher/exams" className="p-2 -ml-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-bold text-blue-900 tracking-tight">Create New Exam</h1>
          </div>
        </header>

        {/* Main Form Area */}
        <main className="flex-1 relative flex flex-col p-4 sm:p-6 lg:p-10" style={dotGridBg}>
          <form id="create-exam-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="max-w-2xl mx-auto w-full space-y-6 lg:mt-6 mb-24">

              {/* Basic Details */}
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8 lg:p-10 transition-all hover:border-blue-100">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Basic Information</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Exam Title *</label>
                    <input
                      {...register('title')}
                      className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      placeholder="e.g. Advanced Data Structures Midterm"
                    />
                    {errors.title && <p className="text-xs text-rose-500 mt-2 pl-1">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Description</label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3.5 px-5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                      placeholder="Optional instructions for students"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Duration (min) *</label>
                      <input
                        {...register('duration')}
                        type="number" min={5} max={480}
                        className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 text-center outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      {errors.duration && <p className="text-xs text-rose-500 mt-1">{errors.duration.message}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Total Marks *</label>
                      <input
                        {...register('totalMarks')}
                        type="number" min={1}
                        className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 text-center outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      {errors.totalMarks && <p className="text-xs text-rose-500 mt-1">{errors.totalMarks.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8 lg:p-10 transition-all hover:border-blue-100">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Settings</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Passing Score (%)</label>
                    <input
                      {...register('passPercent')}
                      type="number" min={0} max={100}
                      className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Start Time</label>
                      <input
                        {...register('startTime')}
                        type="datetime-local"
                        className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3.5 px-5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">End Time</label>
                      <input
                        {...register('endTime')}
                        type="datetime-local"
                        className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3.5 px-5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Submit */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Plus className="w-5 h-5" /> Create Exam</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-3 flex items-center justify-between z-40">
          <TabItem active={activeTab === 'DETAILS'} onClick={() => setActiveTab('DETAILS')} icon={LayoutDashboard} label="DETAILS" />
          <TabItem active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={Settings} label="SETTINGS" />
        </nav>
      </div>
    </div>
  );
}

function StatItem({ label, value, color = 'text-slate-800' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] font-bold text-slate-400">{label}</span>
      <span className={`text-[10px] font-black ${color}`}>{value}</span>
    </div>
  );
}

function TabItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center gap-1.5 py-1.5 transition-all ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-blue-50 shadow-sm' : ''}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[8px] font-black tracking-[0.1em]">{label}</span>
    </button>
  );
}
