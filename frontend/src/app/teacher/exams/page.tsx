'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import {
  Plus, Search, FileText, Trash2, Edit, Eye, Copy, Send,
  ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { examApi, Exam } from '@/lib/api/examApi';

const STATUS_STYLES: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-blue-100 text-blue-600',
  ACTIVE:    'bg-emerald-100 text-emerald-600',
  CLOSED:    'bg-rose-100 text-rose-600',
};

function ConfirmModal({ onConfirm, onCancel, title, message }: {
  onConfirm: () => void; onCancel: () => void; title: string; message: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-8">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-sm font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-200">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExamsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  const cacheKey = `/api/teacher/exams?page=${page}&search=${search}&status=${statusFilter}`;
  const { data, isLoading, mutate } = useSWR(cacheKey, () =>
    examApi.list({ page, limit: 20, search: search || undefined, status: statusFilter || undefined }).then((r) => r.data)
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await examApi.delete(deleteTarget);
      toast.success('Exam deleted');
      mutate();
    } catch {
      toast.error('Failed to delete exam');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishing(id);
    try {
      await examApi.publish(id);
      toast.success('Exam published!');
      mutate();
    } catch {
      toast.error('Failed to publish exam');
    } finally {
      setPublishing(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await examApi.duplicate(id);
      toast.success('Exam duplicated!');
      mutate();
    } catch {
      toast.error('Failed to duplicate exam');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {deleteTarget && (
        <ConfirmModal
          title="Delete Exam?"
          message="This will permanently delete the exam, all its questions, and results. This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={`flex-1 p-4 sm:p-6 lg:p-10 lg:ml-64 transition-all duration-300 ${sidebarOpen ? 'blur-sm sm:blur-none' : ''}`}>
          <div className="max-w-7xl mx-auto">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Exams</h1>
                <p className="text-sm text-gray-400 font-medium mt-1">
                  {data ? `${data.pagination.total} total exams` : 'Loading…'}
                </p>
              </div>
              <Link
                href="/teacher/exams/create"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                New Exam
              </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search exams…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none shadow-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="pl-10 pr-8 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none shadow-sm appearance-none cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-widest text-gray-400">
                      <th className="px-6 py-5 font-semibold">Exam Name</th>
                      <th className="px-6 py-5 font-semibold hidden md:table-cell">Duration</th>
                      <th className="px-6 py-5 font-semibold hidden md:table-cell">Questions</th>
                      <th className="px-6 py-5 font-semibold">Status</th>
                      <th className="px-6 py-5 font-semibold hidden lg:table-cell">Created</th>
                      <th className="px-6 py-5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-5"><div className="h-4 w-48 bg-gray-100 rounded" /></td>
                            <td className="px-6 py-5 hidden md:table-cell"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                            <td className="px-6 py-5 hidden md:table-cell"><div className="h-4 w-10 bg-gray-100 rounded" /></td>
                            <td className="px-6 py-5"><div className="h-6 w-20 bg-gray-100 rounded-full" /></td>
                            <td className="px-6 py-5 hidden lg:table-cell"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                            <td className="px-6 py-5"><div className="h-8 w-24 bg-gray-100 rounded-xl ml-auto" /></td>
                          </tr>
                        ))
                      : data?.data.length === 0
                      ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center">
                            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-semibold mb-2">No exams found</p>
                            <Link href="/teacher/exams/create" className="text-blue-600 text-sm font-bold hover:underline">
                              Create your first exam →
                            </Link>
                          </td>
                        </tr>
                      )
                      : data?.data.map((exam: Exam) => (
                        <tr key={exam.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{exam.title}</p>
                              {exam.description && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{exam.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 hidden md:table-cell text-sm font-medium text-gray-500">
                            {exam.duration} min
                          </td>
                          <td className="px-6 py-5 hidden md:table-cell text-sm font-medium text-gray-500">
                            {exam._count?.questions ?? 0}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[exam.status]}`}>
                              {exam.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 hidden lg:table-cell text-sm font-medium text-gray-400">
                            {new Date(exam.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/teacher/exams/${exam.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View">
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link href={`/teacher/exams/${exam.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit">
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button onClick={() => handleDuplicate(exam.id)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Duplicate">
                                <Copy className="w-4 h-4" />
                              </button>
                              {exam.status === 'DRAFT' && (
                                <button
                                  onClick={() => handlePublish(exam.id)}
                                  disabled={publishing === exam.id}
                                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50"
                                  title="Publish"
                                >
                                  {publishing === exam.id
                                    ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    : <Send className="w-4 h-4" />}
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteTarget(exam.id)}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
                  <p className="text-xs text-gray-400 font-medium">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-40 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                      className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 disabled:opacity-40 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
