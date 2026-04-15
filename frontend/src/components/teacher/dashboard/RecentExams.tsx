'use client';
import {
  Eye, Edit, MoreVertical, PlusCircle,
  Trash2, Copy, ExternalLink, Users, FileText
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { useState, useRef, useEffect } from 'react';
import { examApi, Exam } from '@/lib/api/examApi';
import toast from 'react-hot-toast';
import { useTeacherStats } from '@/hooks/useTeacherStats';  

const fetcher = () => examApi.list({ limit: 5 }).then((r) => r.data);

const STATUS_CONFIG: Record<string, {
  bg: string;
  text: string;
  dot: string;
  label: string;
}> = {
  DRAFT: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    label: 'Draft'
  },
  PUBLISHED: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    label: 'Published'
  },
  ACTIVE: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    label: 'Active'
  },
  CLOSED: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    dot: 'bg-rose-400',
    label: 'Closed'
  },
};

// const { data, isLoading, mutate } = useSWR(
//   '/api/teacher/exams?limit=5',
//   fetcher,
//   {
//     refreshInterval: 5 * 60 * 1000, // ✅ every 5 minutes
//     revalidateOnFocus: false,        // ✅ no flash on click
//     dedupingInterval: 60_000,        // ✅ cache for 1 minute
//   }
// );

function RowSkeleton() {
  return (
    <tr>
      <td className="py-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse 
                          flex-shrink-0" />
          <div>
            <div className="h-3.5 w-36 bg-gray-100 rounded 
                            animate-pulse mb-1.5" />
            <div className="h-2.5 w-24 bg-gray-100 rounded 
                            animate-pulse" />
          </div>
        </div>
      </td>
      <td className="py-4 px-2">
        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
      </td>
      <td className="py-4 px-2">
        <div className="h-6 w-20 bg-gray-100 rounded-full 
                        animate-pulse" />
      </td>
      <td className="py-4 px-2">
        <div className="h-3 w-12 bg-gray-100 rounded animate-pulse 
                        ml-auto" />
      </td>
      <td className="py-4 px-2">
        <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse 
                        ml-auto" />
      </td>
    </tr>
  );
}

// Dropdown menu for exam actions
function ActionMenu({ exam, onDelete, onDuplicate }: {
  exam: Exam;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-400 hover:text-blue-600 
                   hover:bg-blue-50 rounded-xl transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl 
                        shadow-xl border border-gray-100 z-50 py-1.5 
                        overflow-hidden">
          <Link
            href={`/teacher/exams/${exam.id}`}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm 
                       font-semibold text-gray-700 hover:bg-gray-50 
                       transition-colors"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
            Open Exam
          </Link>
          <button
            onClick={() => { onDuplicate(exam.id); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 
                       text-sm font-semibold text-gray-700 
                       hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-4 h-4 text-gray-400" />
            Duplicate
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => { onDelete(exam.id); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 
                       text-sm font-semibold text-rose-600 
                       hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function RecentExams() {
  const { data, isLoading, mutate } = useSWR(
    '/api/teacher/exams?limit=5',
    fetcher,
    { refreshInterval: 60_000 }
  );

  async function handleDelete(id: string) {
    if (!confirm('Delete this exam? This cannot be undone.')) return;
    try {
      await examApi.delete(id);
      toast.success('Exam deleted');
      mutate();
    } catch {
      toast.error('Failed to delete exam');
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await examApi.duplicate(id);
      toast.success('Exam duplicated!');
      mutate();
    } catch {
      toast.error('Failed to duplicate exam');
    }
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 
                    shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            Recent Exams
          </h2>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Your latest created assessments
          </p>
        </div>
        <Link
          href="/teacher/exams"
          className="text-xs font-black text-blue-600 hover:bg-blue-50 
                     px-4 py-2 rounded-xl transition-all uppercase 
                     tracking-wider"
        >
          View All →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-4 text-left text-[10px] font-black 
                             text-gray-400 uppercase tracking-widest px-2">
                Exam
              </th>
              <th className="pb-4 text-left text-[10px] font-black 
                             text-gray-400 uppercase tracking-widest px-2">
                Created
              </th>
              <th className="pb-4 text-left text-[10px] font-black 
                             text-gray-400 uppercase tracking-widest px-2">
                Status
              </th>
              <th className="pb-4 text-right text-[10px] font-black 
                             text-gray-400 uppercase tracking-widest px-2">
                Students
              </th>
              <th className="pb-4 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))
            ) : !data?.data.length ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-3xl 
                                    flex items-center justify-center">
                      <PlusCircle className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-400">
                      No exams yet
                    </p>
                    <Link
                      href="/teacher/exams/create"
                      className="text-xs font-black text-blue-600 
                                 hover:underline"
                    >
                      Create your first exam →
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              data.data.map((exam: Exam) => {
                const cfg = STATUS_CONFIG[exam.status];
                return (
                  <tr
                    key={exam.id}
                    className="group hover:bg-gray-50/50 
                               transition-colors"
                  >
                    {/* Exam Info */}
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 
                                        flex items-center justify-center 
                                        flex-shrink-0 group-hover:bg-blue-100 
                                        transition-colors">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 
                                        group-hover:text-blue-600 
                                        transition-colors line-clamp-1">
                            {exam.title}
                          </p>
                          <p className="text-[11px] font-semibold 
                                        text-gray-400">
                            {exam._count?.questions ?? 0} questions •
                            {exam.duration}min
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-2">
                      <p className="text-xs font-semibold text-gray-500 
                                    whitespace-nowrap">
                        {new Date(exam.createdAt).toLocaleDateString(
                          'en-US',
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-2">
                      <div className={`inline-flex items-center gap-1.5 
                                      px-3 py-1 rounded-full ${cfg.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full 
                          ${cfg.dot}
                          ${exam.status === 'ACTIVE'
                            ? 'animate-pulse' : ''}`}
                        />
                        <span className={`text-[10px] font-black 
                                         uppercase tracking-wider 
                                         ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </td>

                    {/* Students Count */}
                    <td className="py-4 px-2 text-right">
                      <div className="flex items-center justify-end 
                                      gap-1 text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-black">
                          {exam._count?.assignments ?? 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-2">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/teacher/exams/${exam.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 
                                     hover:bg-blue-50 rounded-xl 
                                     transition-all"
                        >
                          {exam.status === 'CLOSED'
                            ? <Eye className="w-4 h-4" />
                            : <Edit className="w-4 h-4" />}
                        </Link>
                        <ActionMenu
                          exam={exam}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}