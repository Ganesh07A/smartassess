'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { examApi, Exam } from '@/lib/api/examApi';
import { AssessmentForm } from '@/features/assessments/AssessmentForm';

export default function UnifiedWorkspacePage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);

  const fetchData = async () => {
    try {
      const r = await examApi.get(examId);
      setExam(r.data);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load assessment');
      router.push('/teacher/exams');
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/40">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen relative lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 sm:p-10 lg:p-12 overflow-auto">
           <div className="max-w-7xl mx-auto">
              {exam && <AssessmentForm initial={exam} />}
           </div>
        </main>
      </div>
    </div>
  );
}
