'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Edit, Send, Copy, Trash2, Clock, Award,
  Users, FileText, CheckCircle, Code
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

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY:   'bg-emerald-50 text-emerald-600',
  MEDIUM: 'bg-amber-50 text-amber-600',
  HARD:   'bg-rose-50 text-rose-600',
};

export default function ExamViewPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const { data: exam, isLoading, mutate } = useSWR<any>(
    `/api/teacher/exams/${examId}`,
    () => examApi.get(examId).then((r) => r.data)
  );

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await examApi.publish(examId);
      toast.success('Exam published!');
      mutate();
    } catch {
      toast.error('Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this exam and all its data?')) return;
    try {
      await examApi.delete(examId);
      toast.success('Exam deleted');
      router.push('/teacher/exams');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f8f9fc] items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400 font-semibold">Exam not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={`flex-1 p-4 sm:p-6 lg:p-10 lg:ml-64`}>
          <div className="max-w-5xl mx-auto">

            {/* Breadcrumb + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Link href="/teacher/exams" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{exam.title}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[exam.status]}`}>
                      {exam.status}
                    </span>
                  </div>
                  {exam.description && (
                    <p className="text-sm text-gray-400 mt-1">{exam.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/teacher/exams/${examId}/edit`} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-blue-200 hover:text-blue-600 transition-all">
                  <Edit className="w-4 h-4" /> Edit
                </Link>
                {exam.status === 'DRAFT' && (
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {publishing ? 'Publishing…' : 'Publish'}
                  </button>
                )}
                <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Duration', value: `${exam.duration} min`, icon: Clock, color: 'text-blue-600 bg-blue-50' },
                { label: 'Total Marks', value: exam.totalMarks, icon: Award, color: 'text-amber-600 bg-amber-50' },
                { label: 'Questions', value: exam._count?.questions ?? 0, icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Submissions', value: exam._count?.results ?? 0, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.label}</p>
                    <p className="text-xl font-extrabold text-gray-900">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Questions */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Questions</h2>
                <Link
                  href={`/teacher/exams/${examId}/edit`}
                  className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
                >
                  + Add Questions
                </Link>
              </div>

              {exam.questions?.length === 0 ? (
                <div className="text-center py-12 text-gray-300">
                  <FileText className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-semibold text-gray-400">No questions yet</p>
                  <Link href={`/teacher/exams/${examId}/edit`} className="text-blue-600 text-sm hover:underline font-bold mt-2 inline-block">
                    Add your first question →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {exam.questions?.map((q: any, idx: number) => (
                    <div key={q.id} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-50 hover:border-blue-100 hover:bg-blue-50/20 transition-all group">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {q.type === 'MCQ'
                            ? <CheckCircle className="w-4 h-4 text-blue-400" />
                            : <Code className="w-4 h-4 text-indigo-400" />
                          }
                          <span className="text-xs font-bold text-gray-400 uppercase">{q.type}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${DIFFICULTY_STYLES[q.difficulty]}`}>
                            {q.difficulty}
                          </span>
                          <span className="ml-auto text-xs font-bold text-gray-500">{q.marks} pts</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{q.text}</p>
                        {q.type === 'MCQ' && q.mcqOptions?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {q.mcqOptions.map((opt: any) => (
                              <span key={opt.id} className={`text-xs px-2 py-1 rounded-lg font-medium ${opt.isCorrect ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-gray-50 text-gray-500'}`}>
                                {opt.text}
                              </span>
                            ))}
                          </div>
                        )}
                        {q.type === 'CODING' && (
                          <p className="text-xs text-gray-400 mt-1">{q.testCases?.length ?? 0} test cases</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
