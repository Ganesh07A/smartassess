'use client';
import { useTeacherStats } from '@/hooks/useTeacherStats';

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between group p-2 -m-2 rounded-2xl animate-pulse">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100" />
        <div>
          <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
          <div className="h-2 w-20 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 w-10 bg-gray-100 rounded mb-1 ml-auto" />
        <div className="w-16 h-1.5 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

const COLORS = [
  'bg-indigo-100 text-indigo-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600',
  'bg-rose-100 text-rose-600',
  'bg-blue-100 text-blue-600',
];

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function LivePerformance() {
  const { stats, isLoading } = useTeacherStats();
  const recent = stats?.recentActivity ?? [];

  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col transition-all">
      <div className="flex items-center justify-between mb-6 sm:mb-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-red-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Recent Submissions</h2>
        </div>
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-50 rounded-lg text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-100">
          Live
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 flex-1 pr-1 overflow-y-auto">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          : recent.length === 0
          ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-gray-300">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-semibold">No submissions yet</p>
            </div>
          )
          : recent.map((r, idx) => (
            <div key={idx} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 p-2 -m-2 rounded-2xl transition-all">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-sm sm:text-base font-bold relative group-hover:scale-105 transition-transform overflow-hidden shadow-sm ${COLORS[idx % COLORS.length]}`}>
                  {getInitials(r.studentName)}
                </div>
                <div className="max-w-[120px] sm:max-w-none">
                  <p className="text-xs sm:text-sm font-extrabold text-gray-900 leading-tight tracking-tight group-hover:text-blue-600 transition-colors truncate">
                    {r.studentName}
                  </p>
                  <p className="text-[9px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">{r.examTitle}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <p className="text-xs sm:text-sm font-black text-gray-900 leading-none mb-1 group-hover:text-blue-700 transition-colors">
                  {Math.round(r.score)}%
                </p>
                <div className="w-12 sm:w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 delay-300 ${
                      r.score >= 90 ? 'bg-emerald-500' : r.score >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${r.score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="mt-6 sm:mt-10 p-4 sm:p-5 bg-gray-50/80 rounded-xl sm:rounded-2xl border border-gray-100 border-dashed flex items-center justify-center transition-all hover:bg-white hover:border-blue-200 hover:shadow-lg cursor-pointer group text-center">
        <p className="text-xs sm:text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors italic">
          View full class analytics →
        </p>
      </div>
    </div>
  );
}
