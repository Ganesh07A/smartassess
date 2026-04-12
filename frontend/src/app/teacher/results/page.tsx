'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { BarChart3, Download, FileText, ChevronRight } from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { examApi, Exam } from '@/lib/api/examApi';
import { useState } from 'react';

export default function TeacherResultsOverviewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data, isLoading } = useSWR('/api/teacher/exams?limit=50', () =>
    examApi.list({ page: 1, limit: 50 }).then((r) => r.data),
  );

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-10 lg:ml-64">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Results & Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">
                Choose an exam to view leaderboard, analytics, and export results.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900">Exam Result Modules</h2>
              </div>

              <div className="divide-y divide-gray-50">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="px-6 py-5 animate-pulse flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 w-48 bg-gray-100 rounded" />
                          <div className="h-3 w-32 bg-gray-100 rounded" />
                        </div>
                        <div className="h-8 w-24 bg-gray-100 rounded-xl" />
                      </div>
                    ))
                  : data?.data.map((exam: Exam) => (
                      <div key={exam.id} className="px-6 py-5 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <h3 className="font-bold text-gray-900">{exam.title}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {exam._count?.results ?? 0} submissions • {exam.totalMarks} marks • pass {exam.passPercent}%
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/teacher/exams/${exam.id}/results/export`}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Export
                          </a>
                          <Link
                            href={`/teacher/exams/${exam.id}/results`}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                          >
                            Open
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
