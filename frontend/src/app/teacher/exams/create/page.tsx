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
  Plus, Calendar, Info, HelpCircle, ChevronRight, Upload,
  Download
} from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
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

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 60, totalMarks: 100, passPercent: 40 },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await examApi.create({
        ...data,
        startTime: data.startTime ? new Date(data.startTime).toISOString() : null,
        endTime:   data.endTime   ? new Date(data.endTime).toISOString()   : null,
      });
      toast.success('Exam created successfully!');
      router.push(`/teacher/exams/${res.data.id}/edit`);
    } catch (err: any) {
      toast.error(err.displayMessage ?? 'Failed to create exam');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/40">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen relative lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 lg:p-12 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-10">
            
            {/* Breadcrumbs & Title Section */}
            <div className="space-y-4">
               <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Link href="/teacher/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                  <ChevronRight className="w-3 h-3" />
                  <Link href="/teacher/exams" className="hover:text-blue-600 transition-colors">Exams</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-900">Create New</span>
               </nav>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create New Exam</h1>
            </div>

            {/* Main Single-Card Creator */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
               <div className="p-10 lg:p-16 space-y-16">
                  <div className="max-w-2xl">
                     <h2 className="text-2xl font-black text-slate-900 mb-2">Core Assessment Details</h2>
                     <p className="text-sm font-bold text-slate-400 leading-relaxed">
                        Fill in the basic configuration for your assessment. You'll be able to build your question bank in the next step.
                     </p>
                  </div>

                  <form id="create-exam-form" onSubmit={handleSubmit(onSubmit)} className="space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        {/* Title Section */}
                        <div className="md:col-span-2 space-y-3">
                           <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Exam Title</label>
                           <input
                              {...register('title')}
                              className={`w-full bg-slate-50/50 border-2 ${errors.title ? 'border-rose-100 focus:border-rose-200' : 'border-transparent focus:border-blue-100'} rounded-[1.5rem] py-5 px-8 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all`}
                              placeholder="e.g. Advanced Operating Systems Midterm"
                           />
                           {errors.title && <p className="text-xs text-rose-500 font-bold pl-2">{errors.title.message}</p>}
                        </div>

                        {/* Description Section */}
                        <div className="md:col-span-2 space-y-3">
                           <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Instructions / Description</label>
                           <textarea
                              {...register('description')}
                              rows={4}
                              className="w-full bg-slate-50/50 border-2 border-transparent focus:border-blue-100 rounded-[1.5rem] py-5 px-8 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all resize-none"
                              placeholder="Describe the assessment and provide any specific rules..."
                           />
                        </div>

                        {/* Middle Configuration Grid */}
                        <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Duration (Minutes)</label>
                           <div className="relative">
                              <input
                                 {...register('duration')}
                                 type="number"
                                 className="w-full bg-slate-50/50 border-2 border-transparent focus:border-blue-100 rounded-[1.5rem] py-5 px-8 text-base font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
                              />
                              <Clock className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Total Marks</label>
                           <div className="relative">
                              <input
                                 {...register('totalMarks')}
                                 type="number"
                                 className="w-full bg-slate-50/50 border-2 border-transparent focus:border-blue-100 rounded-[1.5rem] py-5 px-8 text-base font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
                              />
                              <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                           </div>
                        </div>

                        {/* Schedule Section */}
                        <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Access Window Opens</label>
                           <div className="relative">
                              <input
                                 {...register('startTime')}
                                 type="datetime-local"
                                 className="w-full bg-slate-50/50 border-2 border-transparent focus:border-blue-100 rounded-[1.5rem] py-5 px-8 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
                              />
                              <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Access Window Closes</label>
                           <div className="relative">
                              <input
                                 {...register('endTime')}
                                 type="datetime-local"
                                 className="w-full bg-slate-50/50 border-2 border-transparent focus:border-blue-100 rounded-[1.5rem] py-5 px-8 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all"
                              />
                              <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                           </div>
                        </div>
                     </div>

                     {/* Bulk Upload Teaser - STITCH Style Implementation */}
                     <div className="pt-8 pt-10 border-t border-slate-50">
                        <div className="bg-slate-50/50 rounded-[2.5rem] p-10 border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                           <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 mb-6 font-bold">
                              <Upload className="w-8 h-8" />
                           </div>
                           <h3 className="text-xl font-black text-slate-900 mb-2">Prefer Bulk Upload?</h3>
                           <p className="text-sm font-bold text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                              You'll have the option to drop your CSV/XLSX template in the next step to add up to 500 questions instantly.
                           </p>
                           <div className="flex items-center gap-4">
                              <button type="button" className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-[1rem] text-[11px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest">
                                 <Download className="w-4 h-4" /> Get Template
                              </button>
                           </div>
                        </div>
                     </div>

                     {/* Action Bar */}
                     <div className="pt-10 flex items-center justify-between">
                        <Link href="/teacher/exams" className="text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest pl-2">
                           Discard Draft
                        </Link>
                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                        >
                           {isSubmitting ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           ) : (
                              <>Create & Continue <ChevronRight className="w-5 h-5" /></>
                           )}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

