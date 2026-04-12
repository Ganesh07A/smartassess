'use client';
import { FileText, Users, Clock, Award, Target, TrendingUp } from 'lucide-react';
import { useTeacherStats } from '@/hooks/useTeacherStats';

function StatSkeleton() {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-100" />
        <div className="w-12 h-5 rounded-lg bg-gray-100" />
      </div>
      <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
      <div className="h-8 w-16 bg-gray-200 rounded" />
    </div>
  );
}

export function StatsCards() {
  const { stats, isLoading } = useTeacherStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Exams',
      value: stats?.totalExams ?? 0,
      growth: '+New',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      growth: 'Enrolled',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Active Exams',
      value: stats?.activeExams ?? 0,
      growth: 'Live',
      icon: Clock,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Average Score',
      value: `${stats?.avgScore ?? 0}%`,
      growth: 'All time',
      icon: Award,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Completion Rate',
      value: `${stats?.completionRate ?? 0}%`,
      growth: 'Assigned',
      icon: Target,
      color: 'bg-violet-50 text-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      {cards.map((stat) => (
        <div
          key={stat.label}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                stat.growth === 'Live'
                  ? 'bg-blue-100 text-blue-600 animate-pulse'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {stat.growth !== 'Live' && stat.growth !== 'Enrolled' && stat.growth !== 'All time' && (
                <TrendingUp className="w-3 h-3" />
              )}
              {stat.growth}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wide uppercase mb-1">
              {stat.label}
            </h3>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
