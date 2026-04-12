'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowLeft, Download, Users, Trophy, CheckCircle2, AlertTriangle, LucideIcon } from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { resultApi } from '@/lib/api/resultApi';

export default function ExamResultsPage() {
  const { examId } = useParams<{ examId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: leaderboard, isLoading } = useSWR(
    `/api/teacher/exams/${examId}/results?page=${page}`,
    () => resultApi.getExamResults(examId, { page, limit: 20 }).then((r) => r.data),
  );

  const { data: analytics } = useSWR(
    `/api/teacher/exams/${examId}/analytics`,
    () => resultApi.getExamAnalytics(examId).then((r) => r.data),
  );

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-10 lg:ml-64">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Link
                  href="/teacher/results"
                  className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 mb-3"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Results
                </Link>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Exam Leaderboard</h1>
              </div>
              <a
                href={`/api/teacher/exams/${examId}/results/export`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Metric icon={Users} label="Attempts" value={analytics?.attempts ?? 0} />
              <Metric icon={Trophy} label="Pass Rate" value={`${analytics?.passRate ?? 0}%`} />
              <Metric icon={CheckCircle2} label="Completion" value={`${analytics?.completionRate ?? 0}%`} />
              <Metric icon={AlertTriangle} label="Avg Tab Switch" value={analytics?.avgTabSwitches ?? 0} />
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">%</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Violations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-8 bg-gray-100 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-100 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-10 bg-gray-100 rounded" /></td>
                        </tr>
                      ))
                    : leaderboard?.data.map((row) => (
                        <tr key={row.id}>
                          <td className="px-6 py-4 font-extrabold text-gray-700">#{row.rank}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{row.student.name}</p>
                            <p className="text-xs text-gray-500">{row.student.email}</p>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-700">
                            {row.totalScore}/{row.maxScore}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-700">{Math.round(row.percentage)}%</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                row.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {row.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{row.tabSwitches}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {leaderboard && leaderboard.pagination.totalPages > 1 && (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs text-gray-500 font-semibold">
                  Page {leaderboard.pagination.page} / {leaderboard.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(leaderboard.pagination.totalPages, p + 1))}
                  disabled={page >= leaderboard.pagination.totalPages}
                  className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-2xl font-extrabold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
