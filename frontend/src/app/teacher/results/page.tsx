'use client';

import Link from 'next/link';
import useSWR from 'swr';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Filter,
  Download,
  BookOpen,
  Share,
  SearchX,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { examApi, Exam } from '@/lib/api/examApi';
import { useState, useMemo } from 'react';

export default function TeacherResultsOverviewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data, isLoading, error } = useSWR('/api/teacher/exams?limit=50', () =>
    examApi.list({ page: 1, limit: 50 }).then((r) => r.data),
  );

  // Derived stats
  const totalSubmissions = useMemo(() => {
    if (!data?.data) return 0;
    return data.data.reduce((acc: number, exam: Exam) => acc + (exam._count?.results ?? 0), 0);
  }, [data?.data]);

  const avgPassRate = useMemo(() => {
    if (!data?.data || data.data.length === 0) return 0;
    const total = data.data.reduce((acc: number, exam: Exam) => acc + (exam.passPercent ?? 0), 0);
    return Math.round(total / data.data.length);
  }, [data?.data]);

  const activeLeaderboards = data?.data?.length || 0;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 pt-8 pb-24 px-4 md:px-8 lg:ml-64 max-w-7xl mx-auto w-full">
          {/* Hero Title Section */}
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
              Results & Analytics
            </h2>
            <p className="text-on-surface-variant font-body">
              Monitor performance and generate deep-dive reports for your active cohorts.
            </p>
          </div>

          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-label font-bold text-primary uppercase">Active</span>
              </div>
              <p className="text-sm font-label text-slate-500 uppercase tracking-widest mb-1">Total Submissions</p>
              <h3 className="text-3xl font-headline font-black">{totalSubmissions}</h3>
            </div>
            
            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-label font-bold text-secondary uppercase">Stable</span>
              </div>
              <p className="text-sm font-label text-slate-500 uppercase tracking-widest mb-1">Avg. Pass Rate</p>
              <h3 className="text-3xl font-headline font-black">{avgPassRate}%</h3>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border-2 border-primary/5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-tertiary/10 text-tertiary rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-label text-slate-500 uppercase tracking-widest mb-1">Leaderboards Active</p>
              <h3 className="text-3xl font-headline font-black">{activeLeaderboards}</h3>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-error-container/20 p-4 rounded-2xl flex items-center gap-4 border border-error/10 mb-8">
              <AlertCircle className="w-6 h-6 text-error" />
              <p className="text-sm text-error font-medium">Failed to load analytics. Please try refreshing.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="ml-auto text-xs font-bold text-error uppercase font-label hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Main Exams Table */}
          <section className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden mb-12">
            <div className="p-8 border-b border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-xl font-headline font-bold">Exam Performance Catalog</h4>
                <p className="text-sm text-on-surface-variant font-body">Current semester assessment breakdown</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors font-semibold text-sm">
                  <Filter className="w-5 h-5" />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary hover:opacity-90 transition-opacity font-bold text-sm shadow-lg shadow-primary/20">
                  <Download className="w-5 h-5" />
                  Export All
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-8 py-4 text-[11px] font-label font-bold uppercase tracking-widest text-slate-500">Exam Title</th>
                    <th className="px-8 py-4 text-[11px] font-label font-bold uppercase tracking-widest text-slate-500">Submissions</th>
                    <th className="px-8 py-4 text-[11px] font-label font-bold uppercase tracking-widest text-slate-500">Total Marks</th>
                    <th className="px-8 py-4 text-[11px] font-label font-bold uppercase tracking-widest text-slate-500">Pass Rate</th>
                    <th className="px-8 py-4 text-[11px] font-label font-bold uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-8 py-4 text-[11px] font-label font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={6} className="px-8 py-4">
                            <div className="h-12 w-full bg-surface-container-high animate-pulse rounded-2xl"></div>
                          </td>
                        </tr>
                      ))
                    : data?.data?.map((exam: Exam) => (
                        <tr key={exam.id} className="hover:bg-surface-container-low/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold font-headline text-on-surface">{exam.title}</p>
                                <p className="text-xs text-slate-400 font-body">Code: EXAM-{exam.id.slice(0, 4).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-semibold text-on-surface">{exam._count?.results ?? 0}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-semibold text-on-surface">{exam.totalMarks}</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-primary">{exam.passPercent}%</span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: \`\${exam.passPercent}%\` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase font-label">
                              Active
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={`/api/teacher/exams/${exam.id}/results/export`} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                <Download className="w-5 h-5" />
                              </a>
                              <Link
                                href={`/teacher/exams/${exam.id}/results`}
                                className="px-4 py-2 bg-primary-container text-on-primary-container rounded-xl text-xs font-bold hover:scale-95 transition-transform inline-flex items-center gap-1"
                              >
                                Open <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              
              {!isLoading && (!data?.data || data.data.length === 0) && (
                <div className="bg-surface-container-low rounded-3xl p-12 m-4 text-center flex flex-col items-center border-2 border-dashed border-outline-variant">
                  <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center mb-6">
                    <SearchX className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-xl font-headline font-bold mb-2">No Exams Found</h4>
                  <p className="text-on-surface-variant max-w-sm mx-auto mb-8 font-body">
                    It looks like you don't have any inactive drafts for this cohort. New assessments will appear here once created.
                  </p>
                  <Link href="/teacher/exams" className="px-6 py-3 bg-white text-primary border border-primary/20 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                    Create Assessment
                  </Link>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

