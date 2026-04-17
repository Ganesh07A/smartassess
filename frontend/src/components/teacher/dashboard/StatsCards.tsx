'use client';
import {
  FileText, Users, Clock, Award,
  Target, TrendingUp, Minus
} from 'lucide-react';
import { useTeacherStats } from '@/hooks/useTeacherStats';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

function StatSkeleton() {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100
                    shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-100" />
        <div className="w-16 h-6 rounded-lg bg-gray-100" />
      </div>
      <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
      <div className="h-9 w-20 bg-gray-200 rounded mb-3" />
      <div className="h-1.5 w-full bg-gray-100 rounded-full" />
    </div>
  );
}

function TrendBadge({
  value,
  label
}: {
  value: number | string;
  label: string
}) {
  const isLive = label === 'Live';
  const isPositive = typeof value === 'number' && value > 0;

  if (isLive) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1
                      bg-emerald-50 rounded-xl">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500
                         animate-pulse" />
        <span className="text-[10px] font-black text-emerald-600
                         uppercase tracking-wider">
          Live
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl
      ${isPositive
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-slate-50 text-slate-500'}`}>
      {isPositive
        ? <TrendingUp className="w-3 h-3" />
        : <Minus className="w-3 h-3" />}
      <span className="text-[10px] font-black uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export function StatsCards() {
  const { stats, isLoading } = useTeacherStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse h-44" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Exams',
      value: stats?.totalExams ?? 0,
      suffix: '',
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-600',
      description: 'Assessments created'
    },
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      suffix: '',
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      iconBg: 'bg-violet-600',
      description: 'Enrolled learners'
    },
    {
      label: 'Active Exams',
      value: stats?.activeExams ?? 0,
      suffix: '',
      icon: Clock,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-600',
      description: 'Currently running'
    },
    {
      label: 'Average Score',
      value: stats?.avgScore ?? 0,
      suffix: '%',
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-500',
      description: 'Overall proficiency'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
      {cards.map((stat) => (
        <div
          key={stat.label}
          className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="h-2 w-2 rounded-full bg-slate-100 group-hover:bg-blue-200 transition-colors" />
          </div>

          <div className="mt-6">
            <h3 className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1">
              {stat.label}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                <AnimatedNumber value={stat.value} duration={1000} />
              </span>
              <span className="text-xl font-black text-slate-900">{stat.suffix}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider italic opacity-0 group-hover:opacity-100 transition-opacity">
              {stat.description}
            </p>
          </div>
          
          {/* Subtle background decoration */}
          <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full ${stat.bg} opacity-0 group-hover:opacity-[0.15] transition-all duration-700 blur-3xl`} />
        </div>
      ))}
    </div>
  );
}