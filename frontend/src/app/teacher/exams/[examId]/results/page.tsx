'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import {
  ArrowLeft,
  Download,
  Share,
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  MoreVertical,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  Mail
} from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { resultApi } from '@/lib/api/resultApi';
import { 
  exportExamLeaderboard, 
  exportStudentHistory, 
  exportToCSV 
} from '@/lib/exportUtils';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export default function ExamResultsPage() {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const { data: leaderboard, isLoading } = useSWR(
    `/api/teacher/exams/${examId}/results?page=${page}`,
    () => resultApi.getExamResults(examId, { page, limit: 100 }).then((r) => r.data),
  );

  const { data: analytics } = useSWR(
    `/api/teacher/exams/${examId}/analytics`,
    () => resultApi.getExamAnalytics(examId).then((r) => r.data),
  );

  const handleDownloadHistory = async (studentId: string, studentName: string, studentEmail: string) => {
    setIsFetchingHistory(true);
    const loadingToast = toast.loading("Generating professional history report...");
    try {
        const { data } = await resultApi.getStudentPerformance(studentId);
        if (!data || !data.submissions || data.submissions.length === 0) {
            toast.error("No performance history found.", { id: loadingToast });
            return;
        }
        
        exportStudentHistory({
            student: { name: studentName, email: studentEmail, id: studentId },
            submissions: data.submissions,
            teacherName: user?.fullName || undefined
        });
        toast.success("Report downloaded!", { id: loadingToast });
    } catch (error: any) {
        toast.error(error.displayMessage || "Failed to generate report.", { id: loadingToast });
    } finally {
        setIsFetchingHistory(false);
    }
  };

  const handleFullPDFExport = () => {
    if (!leaderboard || !analytics) return;
    const loadingToast = toast.loading("Generating class-wide PDF...");
    exportExamLeaderboard({
        examTitle: leaderboard.data[0]?.exam?.title || 'Assessment Report',
        analytics: analytics,
        students: leaderboard.data,
        teacherName: user?.fullName || undefined,
        createdAt: leaderboard.data[0]?.exam?.createdAt || undefined
    });
    toast.success("Class report generated!", { id: loadingToast });
  };

  const handleCSVExport = () => {
    if (!leaderboard) return;
    const loadingToast = toast.loading("Preparing CSV file...");
    const csvData = leaderboard.data.map((row: any, idx: number) => ({
        'Sr. No': idx + 1,
        'Student Name': row.student.name,
        'Email': row.student.email,
        'Score': row.totalScore,
        'Total Marks': row.maxScore,
        'Percentage': `${Math.round(row.percentage)}%`,
        'Status': row.passed ? 'PASSED' : 'FAILED',
        'Tab Switches': row.tabSwitches
    }));
    exportToCSV(csvData, `${leaderboard.data[0]?.exam?.title || 'Exam'}_Leaderboard`);
    toast.success("CSV Downloaded!", { id: loadingToast });
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 pt-4 md:pt-8 pb-12 px-4 md:pl-64 md:pr-12 max-w-7xl mx-auto w-full">
          {/* Desktop Title */}
          <section className="mb-8 hidden md:flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <Link
                href="/teacher/exams"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary mb-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Exams
              </Link>
              <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">Exam Leaderboard</h2>
              <p className="text-on-surface-variant font-body font-medium text-sm md:text-lg">Detailed result analytics for your exam</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCSVExport}
                className="tap-target px-6 py-3 flex items-center justify-center bg-surface-container-highest text-on-surface font-semibold rounded-xl hover:bg-surface-container-high transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                <span>Export CSV</span>
              </button>
              <button 
                onClick={handleFullPDFExport}
                className="tap-target px-6 py-3 flex items-center justify-center bg-primary text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform"
              >
                <Share className="w-4 h-4 mr-2" />
                <span>Print PDF Report</span>
              </button>
            </div>
          </section>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center justify-between mb-6">
            <Link href="/teacher/exams" className="p-2 text-primary hover:bg-slate-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold font-headline truncate">Exam Leaderboard</h1>
            <div className="flex gap-1">
                <button onClick={handleCSVExport} className="p-2 text-primary hover:bg-slate-100 rounded-full">
                    <Download className="w-5 h-5" />
                </button>
            </div>
          </div>

          {/* Metrics Horizontal Scroller on Mobile / Bento on Desktop */}
          <section className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 mb-8 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
            <div className="min-w-[160px] md:min-w-0 bg-surface-container-lowest p-5 md:p-6 rounded-3xl shadow-sm relative overflow-hidden group snap-center border border-outline-variant/10">
              <p className="font-label text-[10px] font-bold tracking-widest uppercase text-outline mb-1">Total Attempts</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-headline md:text-4xl font-bold text-on-surface">{analytics?.attempts ?? 0}</h3>
              </div>
            </div>

            <div className="min-w-[160px] md:min-w-0 bg-surface-container-lowest p-5 md:p-6 rounded-3xl shadow-sm relative overflow-hidden group snap-center border border-outline-variant/10">
              <p className="font-label text-[10px] font-bold tracking-widest uppercase text-outline mb-1">Pass Rate</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-headline md:text-4xl font-bold text-on-surface">{analytics?.passRate ?? 0}%</h3>
                <span className="text-emerald-600 font-bold text-xs mb-1">Completed</span>
              </div>
            </div>

            <div className="min-w-[160px] md:min-w-0 bg-surface-container-lowest p-5 md:p-6 rounded-3xl shadow-sm relative overflow-hidden group snap-center border border-outline-variant/10">
              <p className="font-label text-[10px] font-bold tracking-widest uppercase text-outline mb-1">Completion</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-headline md:text-4xl font-bold text-on-surface">{analytics?.completionRate ?? 0}%</h3>
              </div>
            </div>

            <div className="min-w-[160px] md:min-w-0 bg-surface-container-lowest p-5 md:p-6 rounded-3xl shadow-sm relative overflow-hidden group snap-center border border-tertiary/10">
              <p className="font-label text-[10px] font-bold tracking-widest uppercase text-tertiary mb-1">Avg Tabs</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-headline md:text-4xl font-bold text-on-surface">{analytics?.avgTabSwitches ?? 0}</h3>
                <span className="text-tertiary font-bold text-xs mb-1">Violations</span>
              </div>
            </div>
          </section>

          {/* Main List Container */}
          <section className="bg-surface-container-low md:rounded-3xl overflow-hidden p-0.5 md:p-1">
            <div className="bg-surface-container-lowest md:rounded-[1.25rem] overflow-hidden">
              {/* Toolbar */}
              <div className="px-4 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-outline-variant/10">
                <div className="flex items-center gap-2 md:gap-6">
                  <button className="tap-target flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low rounded-xl transition-colors">
                    <Filter className="w-5 h-5 text-primary" />
                    <span className="font-bold text-on-surface-variant text-sm md:text-base">Filter</span>
                  </button>
                  <div className="h-4 w-px bg-outline-variant hidden md:block"></div>
                  <div className="hidden md:flex items-center gap-2 cursor-pointer">
                    <span className="font-label text-[11px] font-semibold text-outline uppercase tracking-wider">Sort: Rank</span>
                    <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                  </div>
                </div>
                <div className="flex md:hidden gap-2">
                  <button className="tap-target p-2 text-primary hover:bg-primary/10 rounded-full">
                    <Search className="w-5 h-5" />
                  </button>
                  <button className="tap-target p-2 text-primary hover:bg-primary/10 rounded-full">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Leaderboard Table (Desktop Only) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="font-label text-[11px] font-bold tracking-widest uppercase text-outline bg-surface-container-low/20">
                      <th className="px-8 py-5">Rank</th>
                      <th className="px-4 py-5">Student</th>
                      <th className="px-4 py-5 text-center">Score</th>
                      <th className="px-4 py-5 text-center">Percentage</th>
                      <th className="px-4 py-5">Status</th>
                      <th className="px-4 py-5 text-center">Violations</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-8 py-5"><div className="w-10 h-10 bg-slate-100 rounded-full" /></td>
                            <td className="px-4 py-5"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                            <td className="px-4 py-5"><div className="h-4 w-12 bg-slate-100 rounded mx-auto" /></td>
                            <td className="px-4 py-5"><div className="h-4 w-12 bg-slate-100 rounded mx-auto" /></td>
                            <td className="px-4 py-5"><div className="h-6 w-16 bg-slate-100 rounded-full" /></td>
                            <td className="px-4 py-5"><div className="h-4 w-8 bg-slate-100 rounded mx-auto" /></td>
                            <td className="px-8 py-5 text-right"><div className="h-4 w-20 bg-slate-100 rounded ml-auto" /></td>
                          </tr>
                        ))
                      : leaderboard?.data.map((row: any) => (
                          <tr key={row.id} className="group hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setSelectedStudent(row)}>
                            <td className="px-8 py-5">
                              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-black shadow-lg shadow-primary/30">
                                {row.rank}
                              </div>
                            </td>
                            <td className="px-4 py-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ring-2 ${row.passed ? 'ring-primary' : 'ring-error'} ring-offset-2 bg-slate-200 text-slate-500 font-bold`}>
                                  {row.student.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold font-body text-on-surface">{row.student.name}</p>
                                  <p className="text-xs font-body text-on-surface-variant">{row.student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-5 text-center font-bold text-primary font-body">
                              {row.totalScore}/{row.maxScore}
                            </td>
                            <td className="px-4 py-5 text-center">
                              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold text-sm font-label">
                                {Math.round(row.percentage)}%
                              </span>
                            </td>
                            <td className="px-4 py-5">
                              {row.passed ? (
                                <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm font-label">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pass
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-error font-bold text-sm font-label">
                                  <span className="w-2 h-2 rounded-full bg-error"></span> Fail
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-5 text-center font-body font-semibold text-outline">
                              {row.tabSwitches > 0 ? (
                                <span className="text-error">{row.tabSwitches}</span>
                              ) : (
                                row.tabSwitches
                              )}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button 
                                className="text-primary font-bold text-sm font-label hover:underline underline-offset-4 ml-auto"
                                onClick={(e) => { e.stopPropagation(); setSelectedStudent(row); }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {/* Submission Cards (Mobile Only) */}
              <div className="md:hidden divide-y divide-outline-variant/10">
                {isLoading 
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4 animate-pulse bg-surface-container-lowest">
                         <div className="h-10 w-48 bg-slate-100 rounded mb-4" />
                         <div className="h-6 w-full bg-slate-100 rounded" />
                      </div>
                    ))
                  : leaderboard?.data.map((row: any) => (
                    <div 
                      key={row.id} 
                      className={`p-4 flex flex-col gap-4 active:bg-surface-container-low transition-colors ${!row.passed ? 'bg-error-container/5' : ''}`}
                      onClick={() => setSelectedStudent(row)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-lg overflow-hidden ring-2 ring-primary ring-offset-2">
                              {row.student.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary text-[10px] font-black flex items-center justify-center border-2 border-surface">
                              {row.rank}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold font-body text-on-surface leading-tight">{row.student.name}</h4>
                            <p className="text-xs text-on-surface-variant font-body">{row.totalScore}/{row.maxScore} • {Math.round(row.percentage)}%</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide font-label ${row.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-error-container text-on-error-container'}`}>
                          {row.passed ? 'Pass' : 'Fail'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center gap-4 text-outline font-body">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> --m</span>
                          <span className={`flex items-center gap-1 ${row.tabSwitches > 0 ? 'text-error' : ''}`}>
                            <ShieldAlert className="w-4 h-4" /> {row.tabSwitches}
                          </span>
                        </div>
                        <button className="tap-target py-1 px-3 text-primary font-bold text-xs uppercase tracking-widest font-label">Details</button>
                      </div>
                    </div>
                ))}
              </div>

              {/* Pagination */}
              {leaderboard && (
                <div className="px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-low/20">
                  <p className="text-sm text-on-surface-variant font-body font-medium">
                    Page <span className="font-bold text-on-surface">{leaderboard.pagination.page}</span> of {leaderboard.pagination.totalPages}
                  </p>
                  <div className="flex gap-1 md:gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="tap-target w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="tap-target w-10 h-10 rounded-xl bg-primary text-on-primary font-bold">{page}</button>
                    <button
                      onClick={() => setPage(p => Math.min(leaderboard.pagination.totalPages, p + 1))}
                      disabled={page >= leaderboard.pagination.totalPages || leaderboard.pagination.totalPages === 0}
                      className="tap-target w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Mobile / Screen Detail Modal Logic (Bottom Sheet representation) */}
      <div 
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${selectedStudent ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSelectedStudent(null)}
      />
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 transform transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] ${selectedStudent ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:fixed md:inset-0 md:-translate-y-0 md:bg-transparent md:pointer-events-none md:flex md:items-center md:justify-center'}`}
      >
        <div className={`md:bg-white md:p-8 md:rounded-3xl md:shadow-2xl md:max-w-md md:w-full md:pointer-events-auto md:transform md:transition-all ${selectedStudent ? 'md:scale-100 md:opacity-100' : 'md:scale-95 md:opacity-0 hidden'}`}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-4 md:hidden"></div>
          
          {selectedStudent && (
            <div className="px-6 pb-12 pt-4 md:p-0">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold overflow-hidden ring-4 ring-primary-fixed">
                  {selectedStudent.student.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black font-headline text-on-surface">{selectedStudent.student.name}</h3>
                  <p className="text-on-surface-variant font-body">{selectedStudent.student.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-surface-container-low p-4 rounded-2xl">
                  <p className="font-label text-[10px] font-bold text-outline uppercase mb-1">Final Score</p>
                  <p className="text-2xl font-bold font-headline text-primary">{selectedStudent.totalScore}/{selectedStudent.maxScore}</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl">
                  <p className="font-label text-[10px] font-bold text-outline uppercase mb-1">Pass Status</p>
                  <p className={`text-xl font-bold font-headline ${selectedStudent.passed ? 'text-emerald-600' : 'text-error'}`}>
                    {selectedStudent.passed ? 'PASSED' : 'FAILED'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link 
                  href={`/teacher/results/${selectedStudent.id}`}
                  className="flex justify-center items-center py-3 w-full bg-surface-container-highest text-on-surface font-bold font-body rounded-2xl hover:bg-surface-container-high transition-colors"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Full Submission
                </Link>
                
                <button 
                   className="flex justify-center items-center py-3 w-full bg-primary text-on-primary font-bold font-body rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
                   onClick={() => handleDownloadHistory(selectedStudent.student.id, selectedStudent.student.name, selectedStudent.student.email)}
                   disabled={isFetchingHistory}
                >
                  <History className="w-5 h-5 mr-2" />
                  {isFetchingHistory ? 'Preparing Report...' : 'Download Performance Report'}
                </button>

                <button 
                  className="flex justify-center items-center py-3 w-full text-error font-bold font-body rounded-2xl border border-error/20 hover:bg-error/5"
                  onClick={() => setSelectedStudent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
