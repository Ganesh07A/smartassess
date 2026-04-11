"use client"
import { Sidebar } from '@/components/teacher/dashboard/Sidebar';
import { Header } from '@/components/teacher/dashboard/Header';
import { StatsCards } from '@/components/teacher/dashboard/StatsCards';
import { RecentExams } from '@/components/teacher/dashboard/RecentExams';
import { PerformanceTrends } from '@/components/teacher/dashboard/PerformanceTrends';
import { LivePerformance } from '@/components/teacher/dashboard/LivePerformance';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Top Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={`flex-1 p-4 sm:p-6 lg:p-10 overflow-auto bg-[#f8f9fc] transition-all duration-300 ${sidebarOpen ? 'blur-sm sm:blur-none' : ''} lg:ml-64`}>
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-400 tracking-wide uppercase italic">
                  Welcome back, here's what's happening with your classes.
                </p>
              </div>
              <Link
                href="/teacher/exams/create"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 active:scale-95 group w-full sm:w-auto"
              >
                <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                Create New Exam
              </Link>
            </div>


            {/* Quick Metrics Section */}
            <StatsCards />

            {/* Main Information Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
              {/* Primary Content: Analytics Trends & Recent Activity */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-10">
                <PerformanceTrends />
                <RecentExams />
              </div>

              {/* Secondary Content: Live Data Feed */}
              <div className="lg:col-span-1 h-full">
                <LivePerformance />
              </div>
            </div>
          </div>
          
          {/* Footer Branding */}
          <footer className="mt-20 pt-10 border-t border-gray-100/50 flex items-center justify-between opacity-50 transition-opacity hover:opacity-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">SmartAssess &copy; 2023 // All rights reserved</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest leading-none underline decoration-blue-200 underline-offset-4">Privacy Policy</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}