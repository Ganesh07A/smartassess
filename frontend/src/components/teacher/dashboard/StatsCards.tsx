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
      <div className="grid grid-cols-1 sm:grid-cols-2
                      xl:grid-cols-5 gap-5 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Exams',
      value: stats?.totalExams ?? 0,
      suffix: '',
      subValue: `${stats?.activeExams ?? 0} active`,
      trend: '+New',
      trendValue: stats?.totalExams ?? 0,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-600',
      progress: null,
    },
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      suffix: '',
      subValue: 'Unique learners',
      trend: 'Enrolled',
      trendValue: stats?.totalStudents ?? 0,
      icon: Users,
      color: 'bg-violet-50 text-violet-600',
      iconBg: 'bg-violet-600',
      progress: null,
    },
    {
      label: 'Active Exams',
      value: stats?.activeExams ?? 0,
      suffix: '',
      subValue: 'Currently running',
      trend: 'Live',
      trendValue: stats?.activeExams ?? 0,
      icon: Clock,
      color: 'bg-emerald-50 text-emerald-600',
      iconBg: 'bg-emerald-600',
      progress: null,
    },
    {
      label: 'Average Score',
      value: stats?.avgScore ?? 0,
      suffix: '%',
      subValue: 'Across all exams',
      trend: 'All time',
      trendValue: stats?.avgScore ?? 0,
      icon: Award,
      color: 'bg-amber-50 text-amber-600',
      iconBg: 'bg-amber-500',
      progress: stats?.avgScore ?? 0,
    },
    {
      label: 'Completion Rate',
      value: stats?.completionRate ?? 0,
      suffix: '%',
      subValue: 'Of assigned exams',
      trend: 'Assigned',
      trendValue: stats?.completionRate ?? 0,
      icon: Target,
      color: 'bg-rose-50 text-rose-600',
      iconBg: 'bg-rose-500',
      progress: stats?.completionRate ?? 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2
                    xl:grid-cols-5 gap-5 mb-8">
      {cards.map((stat) => (
        <div
          key={stat.label}
          className="bg-white p-6 rounded-3xl border border-gray-100
                     shadow-sm hover:shadow-xl hover:-translate-y-1
                     transition-all duration-300 group relative
                     overflow-hidden"
        >
          {/* Background decoration - STATIC, never re-renders */}
          <div className={`absolute -right-4 -top-4 w-24 h-24
                          rounded-full opacity-[0.04] ${stat.iconBg}`} />

          {/* Icon + Badge - STATIC */}
          <div className="flex items-start justify-between mb-5">
            <div className={`p-3 rounded-2xl ${stat.color}
                            group-hover:scale-110 transition-transform
                            duration-300`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <TrendBadge value={stat.trendValue} label={stat.trend} />
          </div>

          {/* Label - STATIC */}
          <h3 className="text-[11px] font-black text-gray-400
                         tracking-widest uppercase mb-1">
            {stat.label}
          </h3>

          {/* ✅ ONLY THIS NUMBER ANIMATES */}
          <p className="text-3xl font-black text-gray-900
                        tracking-tight mb-1">
            <AnimatedNumber
              value={stat.value}
              suffix={stat.suffix}
              duration={800}
            />
          </p>

          {/* Sub label - STATIC */}
          <p className="text-[11px] font-semibold text-gray-400 mb-4">
            {stat.subValue}
          </p>

          {/* ✅ ONLY PROGRESS BAR WIDTH ANIMATES */}
          {stat.progress !== null && (
            <div className="w-full h-1.5 bg-gray-100 rounded-full
                            overflow-hidden">
              <div
                className={`h-full rounded-full ${stat.iconBg}`}
                style={{
                  width: `${Math.min(stat.progress, 100)}%`,
                  transition: 'width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}