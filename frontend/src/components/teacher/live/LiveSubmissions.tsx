// src/components/teacher/live/LiveSubmissions.tsx
'use client';
import { useLiveExam, LiveSubmission } from '@/hooks/useLiveExam';
import { 
  Wifi, WifiOff, CheckCircle2, XCircle, 
  AlertTriangle, Trophy, Clock
} from 'lucide-react';

function SubmissionRow({ 
  sub, 
  index 
}: { 
  sub: LiveSubmission; 
  index: number 
}) {
  const scoreColor = sub.percentage >= 80 
    ? 'text-emerald-600' 
    : sub.percentage >= 60 
      ? 'text-blue-600' 
      : sub.percentage >= 40 
        ? 'text-amber-600' 
        : 'text-rose-600';

  const barColor = sub.percentage >= 80
    ? 'bg-emerald-500'
    : sub.percentage >= 60
      ? 'bg-blue-500'
      : sub.percentage >= 40
        ? 'bg-amber-500'
        : 'bg-rose-500';

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl
                    bg-white border border-gray-100 shadow-sm
                    animate-in slide-in-from-top-2 duration-500">
      {/* Rank */}
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center
                      justify-center text-sm font-black text-gray-400
                      flex-shrink-0">
        {index + 1}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center
                      justify-center text-sm font-black text-blue-600
                      flex-shrink-0">
        {sub.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-gray-900 truncate">
            {sub.studentName}
          </p>
          {sub.tabSwitches > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5
                            bg-amber-50 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-black text-amber-600">
                {sub.tabSwitches} switches
              </span>
            </div>
          )}
        </div>
        <p className="text-[11px] font-semibold text-gray-400">
          {sub.studentEmail}
        </p>

        {/* Score bar */}
        <div className="mt-2 w-full h-1 bg-gray-100 rounded-full
                        overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ 
              width: `${sub.percentage}%`,
              transition: 'width 1s ease-out'
            }}
          />
        </div>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <p className={`text-lg font-black ${scoreColor}`}>
          {sub.totalScore}
          <span className="text-xs text-gray-400 font-bold">
            /{sub.maxScore}
          </span>
        </p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          {sub.passed 
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
          <span className={`text-[10px] font-black
            ${sub.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
            {sub.passed ? 'PASSED' : 'FAILED'}
          </span>
        </div>
        <p className="text-[10px] text-gray-300 mt-0.5">
          {Math.round(sub.percentage)}%
        </p>
      </div>
    </div>
  );
}

export function LiveSubmissions({ examId }: { examId: string }) {
  const { submissions, violations, connected } = useLiveExam(examId);

  const passCount = submissions.filter(s => s.passed).length;
  const avgScore = submissions.length
    ? Math.round(
        submissions.reduce((sum, s) => sum + s.percentage, 0) 
        / submissions.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Live Submissions
          </h2>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">
            Real-time student activity
          </p>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl
          ${connected 
            ? 'bg-emerald-50 border border-emerald-100' 
            : 'bg-gray-50 border border-gray-100'}`}>
          {connected 
            ? <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            : <WifiOff className="w-3.5 h-3.5 text-gray-400" />}
          <span className={`text-[10px] font-black uppercase tracking-wider
            ${connected ? 'text-emerald-600' : 'text-gray-400'}`}>
            {connected ? 'Live' : 'Connecting...'}
          </span>
          {connected && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 
                             animate-pulse" />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100
                        text-center">
          <p className="text-2xl font-black text-gray-900">
            {submissions.length}
          </p>
          <p className="text-[10px] font-black text-gray-400 uppercase
                        tracking-wider mt-1">
            Submitted
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100
                        text-center">
          <p className="text-2xl font-black text-emerald-600">
            {passCount}
          </p>
          <p className="text-[10px] font-black text-gray-400 uppercase
                        tracking-wider mt-1">
            Passed
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100
                        text-center">
          <p className="text-2xl font-black text-blue-600">
            {avgScore}%
          </p>
          <p className="text-[10px] font-black text-gray-400 uppercase
                        tracking-wider mt-1">
            Avg Score
          </p>
        </div>
      </div>

      {/* Violations Alert */}
      {violations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-black text-red-700 uppercase
                          tracking-wide">
              Cheating Alerts ({violations.length})
            </p>
          </div>
          <div className="space-y-2">
            {violations.slice(0, 5).map((v, i) => (
              <div key={i} className="flex items-center gap-3 
                                      bg-white rounded-xl p-3
                                      border border-red-100">
                <AlertTriangle className="w-4 h-4 text-red-500 
                                          flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-black text-gray-900">
                    {v.studentName}
                  </p>
                  <p className="text-[10px] font-semibold text-red-500">
                    Tab switched {v.tabSwitches} times
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                  {new Date(v.at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="space-y-3">
        {submissions.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl
                          border border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-3xl
                            flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-black text-gray-400">
              Waiting for submissions...
            </p>
            <p className="text-xs font-medium text-gray-300 mt-1">
              Students who submit will appear here instantly
            </p>
          </div>
        ) : (
          <>
            {/* Leaderboard header */}
            <div className="flex items-center gap-2 px-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-black text-gray-400 uppercase
                            tracking-widest">
                Leaderboard
              </p>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            {submissions
              .sort((a, b) => b.percentage - a.percentage)
              .map((sub, index) => (
                <SubmissionRow key={index} sub={sub} index={index} />
              ))}
          </>
        )}
      </div>
    </div>
  );
}