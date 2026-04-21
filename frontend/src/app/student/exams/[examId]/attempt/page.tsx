'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Clock, Shield, 
  ChevronLeft, ChevronRight, CheckCircle, 
  Terminal, Play, AlertCircle, XCircle
} from 'lucide-react';
import { studentApi, ExamAttempt, CodingExecutionResult } from '@/lib/api/studentApi';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { MCQView } from '@/components/student/exam/MCQView';
import { CodingView } from '@/components/student/exam/CodingView';
import { QuestionPalette } from '@/components/student/exam/QuestionPalette';

type AnswerValue =
  | { type: 'MCQ'; optionId: string }
  | { type: 'CODING'; code: string; languageId: number };

const LANGUAGES = [
  { id: 63, name: 'JavaScript', ext: '.js' },
  { id: 71, name: 'Python', ext: '.py' }
];

const TEMPLATES: Record<number, string> = {
  63: "function solution() {\n    // Write your code here\n    \n}",
  71: "def solution():\n    # Write your code here\n    pass"
};

export default function ExamAttemptPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  
  const [exam, setExam] = useState<ExamAttempt | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  
  // Code Execution
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodingExecutionResult | null>(null);
  
  // Proctoring
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const SWITCH_LIMIT = 3;

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autosaveRef = useRef<NodeJS.Timeout | null>(null);
  const violationLockRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const answersRef = useRef<Record<string, AnswerValue>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await studentApi.getExam(examId);
      setExam(res.data);
      setTimeLeft(res.data.duration * 60);
      setLoading(false);
    } catch {
      toast.error('Failed to load exam');
      router.push('/student/dashboard');
    }
  }, [examId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fullscreen enforcement
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.error('Fullscreen request failed');
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (!autoSubmit && !showSubmitModal) {
      setShowSubmitModal(true);
      return;
    }
    
    setShowSubmitModal(false);
    
    try {
      isSubmittingRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (autosaveRef.current) clearInterval(autosaveRef.current);
      await studentApi.submitExam(examId, { answers: answersRef.current, tabSwitches });
      if (document.fullscreenElement) document.exitFullscreen();
      toast.success('Exam submitted successfully!');
      router.push(`/student/dashboard`);
    } catch {
      toast.error('Failed to submit exam');
      isSubmittingRef.current = false;
    }
  }, [examId, router, tabSwitches]);

  const startExam = async () => {
    try {
      await studentApi.startAttempt(examId);
      setIsStarted(true);
      toggleFullscreen();
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error('Failed to start attempt');
    }
  };

  // Tab Switch Detection
  useEffect(() => {
    if (!isStarted) return;

    const handleViolation = async (
      type: 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'UNKNOWN',
      metadata: Record<string, unknown> = {}
    ) => {
      if (violationLockRef.current) return;
      violationLockRef.current = true;

      try {
        const res = await studentApi.reportViolation(examId, { type, metadata });
        const updatedCount = res.data?.tabSwitches ?? 0;
        setTabSwitches(updatedCount);

        if (updatedCount >= SWITCH_LIMIT) {
          handleSubmit(true);
          toast.error('Limit exceeded. Exam terminated.');
        } else {
          toast.error(`Warning: Tab switch detected (${updatedCount}/${SWITCH_LIMIT})`, { icon: '⚠️' });
        }
      } catch {
        toast.error('Failed to report proctoring violation');
      } finally {
        violationLockRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void handleViolation('TAB_SWITCH', { visibilityState: document.visibilityState });
      }
    };

    const handleFullscreenChange = () => {
      if (isSubmittingRef.current) return;
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        void handleViolation('FULLSCREEN_EXIT', { reason: 'fullscreenchange' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isStarted, examId, handleSubmit]);

  const updateAnswer = (qid: string, val: AnswerValue) => {
    setAnswers(prev => {
      const next = { ...prev, [qid]: val };
      answersRef.current = next;
      return next;
    });
  };

  const handleRunCode = async () => {
    const currentQ = exam!.questions[currentQIndex];
    if (currentQ.type !== 'CODING') return;

    const currentAnswer = (answers[currentQ.id] as { type: 'CODING'; code: string; languageId: number } | undefined);
    const languageId = currentAnswer?.languageId || 63;
    const code = currentAnswer?.code || TEMPLATES[languageId] || '';
    
    if (!code.trim()) {
      toast.error('Code cannot be empty');
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);
    try {
      const res = await studentApi.runCode(examId, { 
        questionId: currentQ.id, 
        code, 
        languageId 
      });
      setExecutionResult(res.data);
      if (res.data.passedCount === res.data.totalCount) {
        toast.success(`All ${res.data.totalCount} test cases passed!`, { icon: '🚀' });
      } else {
        toast.error(`Passed ${res.data.passedCount}/${res.data.totalCount} test cases.`);
      }
    } catch {
      toast.error('Code execution failed. Please check Judge0 connection.');
    } finally {
      setIsRunning(false);
    }
  };

  const navigateToQ = (idx: number) => {
    setCurrentQIndex(idx);
    setExecutionResult(null);
  };

  useEffect(() => {
    if (!isStarted) return;

    autosaveRef.current = setInterval(async () => {
      if (Object.keys(answersRef.current).length === 0) return;

      try {
        await studentApi.saveProgress(examId, { answers: answersRef.current });
      } catch {
        toast.error('Autosave failed. Please check your connection.');
      }
    }, 30000);

    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [isStarted, examId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6 selection:bg-indigo-100 selection:text-indigo-900">
        <div className="max-w-2xl w-full bg-white rounded-[3rem] p-12 shadow-[0_32px_64px_-16px_rgba(19,27,46,0.06)] border border-white/50 text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
              <Shield className="w-12 h-12" />
           </div>
           <div className="space-y-4">
              <h1 className="text-3xl font-black text-[#131b2e] tracking-tight">{exam?.title}</h1>
              <p className="text-base font-medium text-[#464555] max-w-md mx-auto leading-relaxed">
                Welcome to your secure assessment environment. This session is proctored to ensure academic integrity.
              </p>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-[#f2f3ff] rounded-3xl group hover:bg-[#eaedff] transition-colors duration-300">
                 <div className="flex items-center gap-3 mb-2 text-indigo-600">
                    <Clock className="w-5 h-5" />
                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">Duration</span>
                 </div>
                 <p className="text-lg font-black text-[#131b2e] text-left">{exam?.duration} min</p>
              </div>
              <div className="p-6 bg-[#f2f3ff] rounded-3xl group hover:bg-[#eaedff] transition-colors duration-300">
                 <div className="flex items-center gap-3 mb-2 text-indigo-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">Items</span>
                 </div>
                 <p className="text-lg font-black text-[#131b2e] text-left">{exam?.questions.length} questions</p>
              </div>
           </div>

           <div className="pt-4">
              <button 
                onClick={startExam}
                className="w-full py-6 bg-gradient-to-br from-[#392cc1] to-[#534ad9] text-white text-base font-black rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(57,44,193,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(57,44,193,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-3"
              >
                Begin Assessment <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-xs font-bold text-[#777587] mt-6 tracking-wide">
                Secure Mode will activate upon entry
              </p>
           </div>
        </div>
      </div>
    );
  }

  const currentQ = exam!.questions[currentQIndex];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`h-screen bg-background-light flex flex-col font-sans select-none transition-all duration-700 overflow-hidden ${!isFullscreen ? 'filter blur-xl scale-[1.02]' : ''}`}>
      
      {/* Fullscreen Lock Overlay */}
      {!isFullscreen && isStarted && !isSubmittingRef.current && (
        <div className="fixed inset-0 z-[200] bg-background-dark/80 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-[0_48px_96px_-12px_rgba(19,27,46,0.3)] border border-white/50 text-center space-y-8 animate-in zoom-in-95 duration-700">
             <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-12 h-12" />
             </div>
             <div className="space-y-3">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Fullscreen Required</h2>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  To ensure academic integrity, this assessment must be taken in full-screen mode. Your progress has been paused.
                </p>
             </div>
             <button 
               onClick={toggleFullscreen}
               className="w-full py-5 bg-primary text-white text-sm font-black rounded-2xl shadow-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
             >
               Resume Examination <Shield className="w-5 h-5" />
             </button>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showSubmitModal}
        title="Finish & Submit?"
        message="Once submitted, you will not be able to change your answers. Are you sure you want to finalize your assessment?"
        confirmLabel="Submit Exam"
        onConfirm={() => handleSubmit(true)}
        onCancel={() => setShowSubmitModal(false)}
      />

      {/* Top Navbar */}
      <header className="h-16 border-b border-neutral-border px-6 flex flex-shrink-0 items-center justify-between bg-white z-50">
        <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                <span className="material-symbols-outlined text-2xl">terminal</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight truncate max-w-[150px] sm:max-w-sm">{exam?.title} - Student Assessment</h1>
        </div>
        <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                <span className="material-symbols-outlined text-xl">timer</span>
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
            <div className="h-8 w-[1px] bg-neutral-border hidden sm:block"></div>
            <button 
                onClick={() => handleSubmit()}
                className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm hidden sm:block"
            >
                Submit Exam
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Problem & Editor / MCQ View (70%) */}
        <section className="w-full lg:w-[70%] flex flex-col overflow-y-auto lg:overflow-hidden bg-[#fcfcfd]">
            {currentQ.type === 'MCQ' ? (
                <div className="p-4 lg:p-8 flex-1 overflow-y-auto custom-scrollbar">
                    <MCQView 
                        question={currentQ}
                        currentAnswer={answers[currentQ.id] as { type: 'MCQ', optionId: string }}
                        index={currentQIndex}
                        total={exam!.questions.length}
                        onAnswerChange={(optionId) => updateAnswer(currentQ.id, { type: 'MCQ', optionId })}
                    />
                </div>
            ) : (
                <CodingView 
                    question={currentQ}
                    currentAnswer={answers[currentQ.id] as { type: 'CODING', code: string, languageId: number }}
                    onAnswerChange={(code, languageId) => updateAnswer(currentQ.id, { type: 'CODING', code, languageId })}
                    isRunning={isRunning}
                    executionResult={executionResult}
                    handleRunCode={handleRunCode}
                    templates={TEMPLATES}
                />
            )}
        </section>
        
        {/* Right Side: Question Palette (30%) */}
        <aside className="w-full lg:w-[30%] flex flex-col bg-white border-t lg:border-t-0 lg:border-l border-neutral-border overflow-hidden">
            <QuestionPalette 
                questions={exam!.questions}
                answers={answers}
                currentIndex={currentQIndex}
                onNavigate={navigateToQ}
            />
        </aside>
      </main>

      {/* Bottom Navigation Footer */}
      <footer className="h-16 flex-shrink-0 border-t border-neutral-border px-6 flex items-center justify-between bg-white z-[60]">
        <button 
            disabled={currentQIndex === 0}
            onClick={() => navigateToQ(currentQIndex - 1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
            <span className="material-symbols-outlined">chevron_left</span>
            <span className="hidden sm:inline">Previous</span>
        </button>
        <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg border border-status-marked text-status-marked font-semibold hover:bg-purple-50 transition-colors">
                <span className="material-symbols-outlined">bookmark</span>
                <span className="hidden sm:inline">Mark for Review</span>
            </button>
            <button 
                onClick={() => {
                    if (currentQIndex < exam!.questions.length - 1) navigateToQ(currentQIndex + 1);
                    else handleSubmit();
                }}
                className="flex items-center gap-2 px-6 sm:px-8 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
            >
                {currentQIndex < exam!.questions.length - 1 ? 'Save & Next' : 'Finish'}
                <span className="material-symbols-outlined">chevron_right</span>
            </button>
        </div>
      </footer>
    </div>
  );
}
