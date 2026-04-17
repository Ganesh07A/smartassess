// src/app/teacher/dashboard/page.tsx
"use client";
// import { useEffect } from 'react';
// import { useAuth } from "@clerk/nextjs";
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { StatsCards } from '@/components/teacher/dashboard/StatsCards';
import { RecentExams } from '@/components/teacher/dashboard/RecentExams';
import { PerformanceTrends } from '@/components/teacher/dashboard/PerformanceTrends';
import { LivePerformance } from '@/components/teacher/dashboard/LivePerformance';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { examApi } from '@/lib/api/examApi';
import Link from 'next/link';

export default function TeacherDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen relative">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={`flex-1 p-6 sm:p-10 lg:p-12 overflow-auto 
                         transition-all duration-500 
                         ${sidebarOpen ? 'blur-sm sm:blur-none' : ''} 
                         lg:ml-64`}>
          <div className="max-w-7xl mx-auto space-y-12">
            {/* Professional Welcome Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  Dashboard Overview
                </h1>
                <p className="text-sm sm:text-base font-bold text-slate-400 tracking-wide max-w-lg leading-relaxed">
                  Welcome back! Here's a snapshot of your current assessments and student performance.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await examApi.create({
                       title: 'Untitled Assessment',
                       duration: 60,
                       totalMarks: 100,
                    });
                    router.push(`/teacher/exams/${res.data.id}/edit`);
                  } catch (err: any) {
                    const msg = err.response?.data?.error || err.message || 'Unknown error';
                    console.error('Create Exam Error:', err);
                    toast.error(`Failed: ${msg}`);
                  }
                }}
                className="flex items-center justify-center gap-3 bg-blue-600 
                           hover:bg-blue-700 text-white px-8 py-5 
                           rounded-[2rem] font-black shadow-2xl 
                           shadow-blue-200 transition-all hover:-translate-y-1 
                           active:scale-95 group shrink-0"
              >
                <div className="p-1.5 bg-white/20 rounded-xl transition-colors group-hover:bg-white/30">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span>Create New Exam</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <StatsCards />

            {/* Main Activity Section - RECENT EXAMS & LIVE SUBMISSIONS TOGETHER */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
              <div className="xl:col-span-8">
                <RecentExams />
              </div>
              <div className="xl:col-span-4 h-full">
                <LivePerformance />
              </div>
            </div>

            {/* Assessment Trends - MOVED TO BOTTOM */}
            <div className="pt-4">
               <PerformanceTrends />
            </div>

            {/* Professional Footer */}
            <footer className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold">
                  S
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">SmartAssess Portal</p>
                  <p className="text-[11px] font-bold text-slate-400">© 2024 All rights reserved</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <Link href="#" className="text-[11px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Privacy</Link>
                <Link href="#" className="text-[11px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Terms</Link>
                <Link href="#" className="text-[11px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Support</Link>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}