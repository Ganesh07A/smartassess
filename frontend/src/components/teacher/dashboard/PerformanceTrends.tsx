'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import { useTeacherStats } from '@/hooks/useTeacherStats';

export function PerformanceTrends() {
  const [isMobile, setIsMobile] = useState(false);
  const { stats, isLoading } = useTeacherStats();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use real distribution data, filter out empty buckets for cleaner chart
  const data = stats?.scoreDistribution
    ?.filter((b) => b.count > 0)
    .map((b) => ({ name: b.range, score: b.count })) ?? [];

  const topCompletionExam = stats?.completionByExam
    ?.slice()
    .sort((a, b) => b.completionRate - a.completionRate)[0];

  // Fallback placeholder data if no submissions yet
  const chartData = data.length > 0 ? data : [
    { name: '0-9',   score: 0 },
    { name: '50-59', score: 0 },
    { name: '90-99', score: 0 },
  ];

  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden transition-all">
      <div className="flex flex-col sm:items-center sm:flex-row justify-between gap-4 mb-6 sm:mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Score Distribution</h2>
        <div className="text-xs font-semibold text-gray-400">
          {stats ? `${stats.totalStudents} submissions` : 'Loading…'}
        </div>
      </div>

      <div className="flex-1 min-h-[250px] sm:min-h-[320px] -ml-4 sm:-ml-6">
        {isLoading ? (
          <div className="w-full h-full bg-gray-50 animate-pulse rounded-2xl" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              id="performance-trends-chart"
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                dx={-5}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '12px' }}
                itemStyle={{ color: '#2563eb', fontWeight: 700, fontSize: '12px' }}
                wrapperStyle={{ outline: 'none' }}
                formatter={(v) => [`${v ?? 0} students`, 'Count']}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={isMobile ? 30 : 50}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === chartData.length - 1 ? '#2563eb' : '#bfdbfe'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6 sm:mt-10 p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl sm:rounded-2xl border border-blue-100 flex items-start gap-3 sm:gap-4 shadow-sm group">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200 transition-transform group-hover:scale-110">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-blue-900 leading-tight mb-1 tracking-tight">Performance Insight</h4>
          <p className="text-[10px] sm:text-xs text-blue-700/80 font-medium leading-relaxed">
            {stats && stats.avgScore > 0
              ? `Average score is ${stats.avgScore}% with ${stats.completionRate}% assignment completion${
                topCompletionExam
                  ? ` (best: ${topCompletionExam.examTitle} at ${topCompletionExam.completionRate}%).`
                  : '.'
              }`
              : 'No submissions yet. Assign and publish exams to see results here.'}
          </p>
        </div>
      </div>
    </div>
  );
}
