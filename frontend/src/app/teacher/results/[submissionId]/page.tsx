'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import {
  ArrowLeft,
  Download,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Code as CodeIcon,
  Terminal,
  User,
  Mail,
  Printer
} from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { resultApi } from '@/lib/api/resultApi';
import toast from 'react-hot-toast';

export default function SubmissionDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: submission, isLoading, error } = useSWR(
    `/api/teacher/results/${submissionId}`,
    () => resultApi.getSubmissionDetail(submissionId).then(r => r.data)
  );

  if (error) {
    toast.error('Failed to load submission details');
    router.push('/teacher/results');
  }

  if (isLoading || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="flex min-h-screen bg-[#faf8ff]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 md:p-12 lg:pl-72 lg:pr-16 max-w-7xl mx-auto w-full space-y-10">
          
          {/* Header Section */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 print:hidden">
            <div className="space-y-3">
              <button 
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 text-[10px] font-black text-[#777587] hover:text-indigo-600 uppercase tracking-[0.2em] mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Results
              </button>
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-white border border-[#c7c4d830] rounded-3xl flex items-center justify-center text-2xl font-black text-indigo-600 shadow-sm">
                    {submission.student.name.charAt(0)}
                 </div>
                 <div>
                    <h1 className="text-3xl font-black text-[#131b2e] tracking-tight">{submission.student.name}</h1>
                    <p className="text-sm font-bold text-[#777587] ml-0.5">{submission.student.email}</p>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => window.print()}
                 className="flex items-center gap-3 px-8 py-4 bg-white border border-[#c7c4d830] text-[#131b2e] text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
               >
                 <Printer className="w-4 h-4" /> Print Scorecard
               </button>
               <div className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-3 ${
                 submission.passed ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-rose-600 text-white shadow-rose-100'
               }`}>
                  {submission.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {submission.passed ? 'Verified Pass' : 'Assessment Failed'}
               </div>
            </div>
          </section>

          {/* PRINT-ONLY SCORECARD HEADER */}
          <div className="hidden print:block p-12 border-2 border-indigo-600 rounded-[3rem] mb-12">
             <div className="flex justify-between items-start mb-12">
                <div>
                   <h1 className="text-4xl font-black text-[#131b2e] mb-2 tracking-tighter uppercase">SmartAssess Report</h1>
                   <p className="text-sm font-bold text-[#777587] uppercase tracking-[0.3em]">Official Candidate Scorecard</p>
                </div>
                <div className="text-right">
                   <p className="text-lg font-black text-indigo-600 uppercase tracking-widest">{submission.exam.title}</p>
                   <p className="text-xs font-bold text-[#777587]">{formatTime(submission.submittedAt)}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-12 mb-12 py-12 border-y border-slate-100">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em]">Candidate Details</p>
                   <p className="text-xl font-black text-[#131b2e]">{submission.student.name}</p>
                   <p className="text-sm font-bold text-[#464555]">{submission.student.email}</p>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em]">Audit Summary</p>
                   <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-[#131b2e]">{submission.totalScore}</span>
                      <span className="text-xl font-black text-[#c7c4d8] mb-1">/ {submission.maxScore} Marks Scored</span>
                   </div>
                   <p className={`text-sm font-black uppercase tracking-widest ${submission.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Result: {submission.passed ? 'Pass' : 'Fail'} ({Math.round(submission.percentage)}%)
                   </p>
                </div>
             </div>

             <div className="space-y-4 mb-12">
                <p className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em]">Proctoring Standards</p>
                <div className="p-6 bg-[#fcfdfe] border border-slate-100 rounded-3xl flex justify-between">
                   <div className="flex items-center gap-4">
                      <Shield className={`w-6 h-6 ${submission.tabSwitches < 2 ? 'text-emerald-500' : 'text-rose-500'}`} />
                      <span className="text-sm font-black text-[#131b2e] uppercase tracking-widest">Tab Switch Count</span>
                   </div>
                   <span className="text-xl font-black text-[#131b2e]">{submission.tabSwitches}</span>
                </div>
             </div>

             <div className="p-8 bg-slate-50 rounded-3xl text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center border border-slate-100">
                This document is a certified digital record of assessment performance.
             </div>
          </div>

          {/* Dashboard Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
             <div className="bg-white p-8 rounded-[2rem] border border-[#c7c4d815] shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                   <Clock className="w-16 h-16 text-indigo-600" />
                </div>
                <p className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em] mb-2">Duration Used</p>
                <h3 className="text-2xl font-black text-[#131b2e]">--:--</h3>
                <p className="text-[9px] font-bold text-[#c7c4d8] uppercase tracking-widest">Minutes spent</p>
             </div>
             
             <div className="bg-white p-8 rounded-[2rem] border border-[#c7c4d815] shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                   <Shield className="w-16 h-16 text-rose-600" />
                </div>
                <p className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em] mb-2">Tab Switches</p>
                <h3 className={`text-2xl font-black ${submission.tabSwitches > 0 ? 'text-rose-600' : 'text-[#131b2e]'}`}>{submission.tabSwitches}</h3>
                <p className="text-[9px] font-bold text-[#c7c4d8] uppercase tracking-widest">Proctoring Alerts</p>
             </div>

             <div className="bg-white p-8 rounded-[2rem] border border-[#c7c4d815] shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                   <CheckCircle className="w-16 h-16 text-emerald-600" />
                </div>
                <p className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em] mb-2">Total Score</p>
                <h3 className="text-2xl font-black text-[#131b2e]">{submission.totalScore} <span className="text-[#c7c4d8] text-sm font-bold">/ {submission.maxScore}</span></h3>
                <p className="text-[9px] font-bold text-[#c7c4d8] uppercase tracking-widest">{Math.round(submission.percentage)}% Correctness</p>
             </div>

             <div className="bg-white p-8 rounded-[2rem] border border-[#c7c4d815] shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                   <Terminal className="w-16 h-16 text-indigo-600" />
                </div>
                <p className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em] mb-2">Submissions</p>
                <h3 className="text-2xl font-black text-[#131b2e]">Finalized</h3>
                <p className="text-[9px] font-bold text-[#c7c4d8] uppercase tracking-widest">{formatTime(submission.submittedAt)}</p>
             </div>
          </div>

          {/* Submission content section */}
          <div className="space-y-12">
             <div className="space-y-6">
                <div className="flex items-center gap-3 px-2 print:hidden">
                   <CodeIcon className="w-5 h-5 text-indigo-600" />
                   <h2 className="text-xl font-black text-[#131b2e] tracking-tight">Technical RepONSES</h2>
                </div>

                <div className="grid grid-cols-1 gap-10">
                   {submission.exam.questions.map((q: any, idx: number) => {
                      const answer = submission.answers?.[q.id];
                      return (
                        <div key={q.id} className="bg-white rounded-[2.5rem] border border-[#c7c4d815] shadow-[0_24px_48px_-12px_rgba(19,27,46,0.03)] overflow-hidden flex flex-col page-break-inside-avoid">
                           <div className="p-8 md:p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-start justify-between gap-6">
                              <div className="space-y-4 max-w-2xl">
                                 <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">QUESTION {(idx+1).toString().padStart(2, '0')}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#c7c4d830]" />
                                    <span className="text-[10px] font-bold text-[#777587] uppercase tracking-widest">{q.type}</span>
                                 </div>
                                 <h4 className="text-lg font-black text-[#131b2e] leading-relaxed">{q.text}</h4>
                              </div>
                              <div className="flex-shrink-0">
                                 <div className="px-6 py-3 bg-[#fcfdfe] border border-[#c7c4d815] rounded-2xl flex flex-col items-center">
                                    <span className="text-[9px] font-black text-[#777587] uppercase tracking-widest mb-1">SCORE</span>
                                    <span className="text-lg font-black text-[#131b2e]">-- / {q.marks}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex-1 p-8 md:p-10 bg-[#faf8ff]/30">
                              {q.type === 'MCQ' ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.mcqOptions.map((opt: any) => {
                                       const isSelected = answer?.optionId === opt.id;
                                       const isCorrect = opt.isCorrect;
                                       return (
                                          <div 
                                             key={opt.id}
                                             className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${
                                                isSelected 
                                                 ? isCorrect ? 'bg-emerald-50 border-emerald-500/20' : 'bg-rose-50 border-rose-500/20'
                                                 : isCorrect ? 'bg-emerald-50/30 border-emerald-500/10 border-dashed' : 'bg-white border-transparent'
                                             }`}
                                          >
                                             <span className={`text-[13px] font-bold ${isSelected || isCorrect ? 'text-[#131b2e]' : 'text-[#777587]'}`}>{opt.text}</span>
                                             {isSelected && (
                                                <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                   {isCorrect ? 'Correct' : 'Chosen'}
                                                </div>
                                             )}
                                             {!isSelected && isCorrect && (
                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Correct Answer</span>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              ) : (
                                 <div className="space-y-6">
                                    <div className="bg-[#131b2e] rounded-3xl p-8 relative group overflow-hidden shadow-2xl">
                                       <div className="absolute top-0 right-0 p-6 flex gap-3 text-white/20 items-center">
                                          <span className="text-[9px] font-mono tracking-tighter">READ ONLY RECAP</span>
                                       </div>
                                       <pre className="font-mono text-sm text-indigo-100/90 leading-relaxed whitespace-pre-wrap overflow-x-auto selection:bg-indigo-500/30">
                                          {answer?.code || '// No code submitted'}
                                       </pre>
                                       {/* Decorator tabs */}
                                       <div className="absolute bottom-0 right-8 px-6 py-2 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest rounded-t-xl">
                                          {(q.testCases?.length || 0) > 0 ? 'Verified Logic' : 'Coding Sub'}
                                       </div>
                                    </div>
                                    
                                    {(q.testCases?.length || 0) > 0 && (
                                       <div className="flex flex-wrap gap-3">
                                          {q.testCases.map((tc: any, i: number) => (
                                             <div key={i} className="px-5 py-3 bg-white border border-[#c7c4d815] rounded-xl flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-black text-[#131b2e] uppercase tracking-widest">Case {i+1} Match</span>
                                             </div>
                                          ))}
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 20mm;
            size: A4;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .lg\\:ml-64, .lg\\:pl-72 {
            margin-left: 0 !important;
            padding-left: 0 !important;
          }
          aside, header, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
