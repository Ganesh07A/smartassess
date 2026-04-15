// src/hooks/useLiveExam.ts
'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export interface LiveSubmission {
  studentName: string;
  studentEmail: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  tabSwitches: number;
  submittedAt: string;
}

export interface LiveViolation {
  studentName: string;
  studentEmail: string;
  tabSwitches: number;
  violationType: string;
  at: string;
}

export function useLiveExam(examId: string) {
  const [submissions, setSubmissions] = useState<LiveSubmission[]>([]);
  const [violations, setViolations] = useState<LiveViolation[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!examId) return;

    // Get base URL
    const baseURL = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : 'http://localhost:4000';

    // Get Clerk token and connect
    async function connect() {
      const token = await (window as any).Clerk?.session?.getToken();
      if (!token) return;

      // SSE with auth token in URL (SSE doesn't support headers)
      const url = `${baseURL}/api/teacher/exams/${examId}/live?token=${token}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        setConnected(true);
        console.log('📡 Connected to live exam stream');
      });

      // Initial state (existing submissions)
      es.addEventListener('initial', (e) => {
        const data = JSON.parse(e.data);
        if (data.submissions) {
          setSubmissions(data.submissions);
        }
      });

      // New submission
      es.addEventListener('submission', (e) => {
        const data: LiveSubmission = JSON.parse(e.data);
        
        // Add to list
        setSubmissions(prev => [data, ...prev]);

        // Toast notification
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}
                          flex items-center gap-3 bg-white border 
                          border-green-100 shadow-xl rounded-2xl 
                          px-4 py-3 max-w-sm`}>
            <div className="p-2 bg-green-50 rounded-xl flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">
                {data.studentName} submitted!
              </p>
              <p className="text-xs font-semibold text-gray-400">
                Score: {data.totalScore}/{data.maxScore} 
                ({Math.round(data.percentage)}%) • 
                {data.passed ? '✅ Passed' : '❌ Failed'}
              </p>
            </div>
          </div>
        ), { duration: 5000 });
      });

      // Violation detected
      es.addEventListener('violation', (e) => {
        const data: LiveViolation = JSON.parse(e.data);

        // Add to violations list
        setViolations(prev => [{
          ...data,
          at: new Date().toISOString()
        }, ...prev]);

        // 🚨 Cheating toast
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}
                          flex items-center gap-3 bg-red-600
                          shadow-xl shadow-red-200 rounded-2xl 
                          px-4 py-3 max-w-sm border border-red-500`}>
            <div className="p-2 bg-red-500 rounded-xl flex-shrink-0 
                            animate-pulse">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase 
                            tracking-wide">
                ⚠️ CHEATING DETECTED!!
              </p>
              <p className="text-xs font-bold text-red-100 mt-0.5">
                {data.studentName} → Tab switched{' '}
                {data.tabSwitches} times!
              </p>
            </div>
          </div>
        ), { 
          duration: 8000,
          position: 'top-center'
        });
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconnect after 5s
        setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
      setConnected(false);
    };
  }, [examId]);

  return { submissions, violations, connected };
}