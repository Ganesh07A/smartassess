'use client';
import { Eye, Edit, MoreVertical, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { examApi, Exam } from '@/lib/api/examApi';

const fetcher = () => examApi.list({ limit: 5 }).then((r) => r.data);

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-blue-100 text-blue-600',
  ACTIVE:    'bg-emerald-100 text-emerald-600',
  CLOSED:    'bg-rose-100 text-rose-600',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT:     'Draft',
  PUBLISHED: 'Published',
  ACTIVE:    'Active',
  CLOSED:    'Closed',
};

function RowSkeleton() {
  return (
    <tr>
      <td className="py-5"><div className="h-4 w-40 bg-gray-100 rounded animate-pulse" /></td>
      <td className="py-5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
      <td className="py-5"><div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
      <td className="py-5 text-right"><div className="h-8 w-16 bg-gray-100 rounded ml-auto animate-pulse" /></td>
    </tr>
  );
}

export function RecentExams() {
  const { data, isLoading } = useSWR('/api/teacher/exams?limit=5', fetcher, {
    refreshInterval: 60_000,
  });

  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm col-span-1 lg:col-span-2 transition-all">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Recent Exams</h2>
        <Link
          href="/teacher/exams"
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 sm:px-4 py-2 rounded-xl transition-all"
        >
          View All
        </Link>
      </div>

      <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
        <table className="w-full min-w-[500px] sm:min-w-0">
          <thead>
            <tr className="border-b border-gray-100 italic text-left text-[10px] sm:text-xs uppercase tracking-widest text-gray-400">
              <th className="pb-4 font-semibold">Exam Name</th>
              <th className="pb-4 font-semibold">Created</th>
              <th className="pb-4 font-semibold">Status</th>
              <th className="pb-4 font-semibold text-right pr-2 sm:pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
              : data?.data.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <PlusCircle className="w-10 h-10 opacity-30" />
                      <p className="text-sm font-semibold">No exams yet</p>
                      <Link href="/teacher/exams/create" className="text-xs text-blue-600 hover:underline font-bold">
                        Create your first exam →
                      </Link>
                    </div>
                  </td>
                </tr>
              )
              : data?.data.map((exam: Exam) => (
                <tr key={exam.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 sm:py-5">
                    <span className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">
                      {exam.title}
                    </span>
                  </td>
                  <td className="py-4 sm:py-5 text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap">
                    {new Date(exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 sm:py-5">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap ${STATUS_STYLES[exam.status]}`}>
                      {STATUS_LABELS[exam.status]}
                    </span>
                  </td>
                  <td className="py-4 sm:py-5 text-right flex justify-end gap-1 sm:gap-2 pr-2 sm:pr-4">
                    <Link
                      href={`/teacher/exams/${exam.id}`}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all"
                    >
                      {exam.status === 'CLOSED' ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <Edit className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </Link>
                    <button className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
