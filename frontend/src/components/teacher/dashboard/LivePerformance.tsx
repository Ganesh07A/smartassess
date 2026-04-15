'use client';
import { useTeacherStats } from '@/hooks/useTeacherStats';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-600' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-rose-100', text: 'text-rose-600' },
  { bg: 'bg-blue-100', text: 'text-blue-600' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getScoreLabel(score: number) {
  if (score >= 80) return {
    text: 'Excellent',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  };
  if (score >= 60) return {
    text: 'Good',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  };
  if (score >= 40) return {
    text: 'Average',
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  };
  return {
    text: 'Below Avg',
    color: 'text-rose-600',
    bg: 'bg-rose-50'
  };
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-3 animate-pulse">
      <div className="w-11 h-11 rounded-2xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3.5 w-28 bg-gray-100 rounded mb-2" />
        <div className="h-2.5 w-20 bg-gray-100 rounded mb-2" />
        <div className="h-1.5 w-full bg-gray-100 rounded-full" />
      </div>
      <div className="text-right flex-shrink-0">
        <div className="h-4 w-10 bg-gray-100 rounded mb-1.5" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

export function LivePerformance() {
  const { stats, isLoading } = useTeacherStats();
  const recent = stats?.recentActivity ?? [];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm 
                    h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Pulse indicator */}
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full 
                               rounded-full bg-red-400 opacity-75 
                               animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full 
                               bg-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 
                             tracking-tight">
                Live Submissions
              </h2>
              <p className="text-[11px] font-semibold text-gray-400">
                Real-time student activity
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-red-50 rounded-xl border 
                          border-red-100">
            <span className="text-[10px] font-black text-red-500 
                             uppercase tracking-widest">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center 
                          h-full py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-3xl 
                            flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 
                         2v6a2 2 0 002 2h2a2 2 0 002-2zm0 
                         0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 
                         0a2 2 0 002 2h2a2 2 0 002-2m0 
                         0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 
                         2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-black text-gray-400">
              No submissions yet
            </p>
            <p className="text-xs font-medium text-gray-300 mt-1">
              Activity will appear here in real-time
            </p>
          </div>
        ) : (
          recent.map((r, idx) => {
            const color = COLORS[idx % COLORS.length];
            const scoreLabel = getScoreLabel(r.score);
            const scoreColor = getScoreColor(r.score);

            return (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 rounded-2xl 
                           hover:bg-gray-50 transition-all cursor-pointer 
                           group"
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-2xl flex items-center 
                                justify-center text-sm font-black 
                                flex-shrink-0 group-hover:scale-105 
                                transition-transform shadow-sm
                                ${color.bg} ${color.text}`}>
                  {getInitials(r.studentName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 
                                truncate group-hover:text-blue-600 
                                transition-colors">
                    {r.studentName}
                  </p>
                  <p className="text-[11px] font-bold text-gray-400 
                                truncate uppercase tracking-wide">
                    {r.examTitle}
                  </p>
                  {/* Score bar */}
                  <div className="mt-2 w-full h-1 bg-gray-100 
                                  rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreColor}`}
                      style={{
                        width: `${r.score}%`,
                        transition: 'width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                    />

                  </div>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">

                  <span className={`text-[10px] font-black px-2 py-0.5 
                                   rounded-full uppercase tracking-wide
                                   ${scoreLabel.bg} ${scoreLabel.color}`}>
                    {scoreLabel.text}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 sm:p-6 border-t border-gray-50">
        {/* Score Distribution */}
        {stats?.scoreDistribution && (
          <div className="mb-4">
            <p className="text-[10px] font-black text-gray-400 
                          uppercase tracking-widest mb-2">
              Score Distribution
            </p>
            <div className="flex items-end gap-1 h-12">
              {stats.scoreDistribution.map((bucket, i) => {
                const max = Math.max(
                  ...stats.scoreDistribution.map(b => b.count), 1
                );
                const height = bucket.count
                  ? Math.max((bucket.count / max) * 100, 8)
                  : 4;
                return (
                  <div
                    key={i}
                    className="flex-1 group/bar relative"
                    title={`${bucket.range}%: ${bucket.count} students`}
                  >
                    <div
                      className={`w-full rounded-t-sm transition-all 
                                  duration-500 cursor-pointer
                        ${i >= 7
                          ? 'bg-emerald-400 group-hover/bar:bg-emerald-500'
                          : i >= 4
                            ? 'bg-blue-400 group-hover/bar:bg-blue-500'
                            : 'bg-rose-300 group-hover/bar:bg-rose-400'
                        }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-bold text-gray-300">0%</span>
              <span className="text-[9px] font-bold text-gray-300">100%</span>
            </div>
          </div>
        )}

        {/* View Analytics Link */}
        <Link
          href="/teacher/results"
          className="flex items-center justify-center gap-2 w-full 
                     py-3 bg-gray-50 hover:bg-blue-50 rounded-2xl 
                     border border-gray-100 hover:border-blue-200 
                     transition-all group/link"
        >
          <span className="text-xs font-black text-gray-400 
                           group-hover/link:text-blue-600 
                           transition-colors uppercase tracking-wider">
            View Full Analytics
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 
                                   group-hover/link:text-blue-600 
                                   transition-colors" />
        </Link>
      </div>
    </div>
  );
}