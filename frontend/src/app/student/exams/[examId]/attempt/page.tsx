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

type AnswerValue =
  | { type: 'MCQ'; optionId: string }
  | { type: 'CODING'; code: string; languageId: number };

const LANGUAGES = [
  { id: 63, name: 'JavaScript', ext: '.js' },
  { id: 71, name: 'Python', ext: '.py' }
];

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
    const code = currentAnswer?.code || '';
    const languageId = currentAnswer?.languageId || 63;
    
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

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    // 1. Tab to 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      const newValue = before + '    ' + after;
      updateAnswer(currentQ.id, { 
        type: 'CODING', 
        code: newValue, 
        languageId: (answers[currentQ.id] as any)?.languageId || 63 
      });
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 4;
      }, 0);
      return;
    }

    // 2. Auto-pairing
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'"
    };

    if (pairs[e.key]) {
      e.preventDefault();
      const char = e.key;
      const closing = pairs[char];
      const before = value.substring(0, selectionStart);
      const middle = value.substring(selectionStart, selectionEnd);
      const after = value.substring(selectionEnd);
      const newValue = before + char + middle + closing + after;
      
      updateAnswer(currentQ.id, { 
        type: 'CODING', 
        code: newValue, 
        languageId: (answers[currentQ.id] as any)?.languageId || 63 
      });
      
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionEnd + 1;
      }, 0);
      return;
    }

    // 3. Smart Indent (Python/JS)
    if (e.key === 'Enter') {
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(lineStart, selectionStart);
      
      if (currentLine.trim().endsWith(':') || currentLine.trim().endsWith('{')) {
        e.preventDefault();
        const indentMatch = currentLine.match(/^\s*/);
        const currentIndent = indentMatch ? indentMatch[0] : '';
        const extraIndent = '    ';
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        const newValue = before + '\n' + currentIndent + extraIndent + after;
        
        updateAnswer(currentQ.id, { 
          type: 'CODING', 
          code: newValue, 
          languageId: (answers[currentQ.id] as any)?.languageId || 63 
        });
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + currentIndent.length + extraIndent.length;
        }, 0);
        return;
      }
    }
  };

  return (
    <div className={`h-screen bg-[#faf8ff] flex flex-col font-sans select-none selection:bg-indigo-100 selection:text-indigo-900 transition-all duration-700 overflow-hidden ${!isFullscreen ? 'filter blur-xl scale-[1.02]' : ''}`}>
      
      {/* Fullscreen Lock Overlay */}
      {!isFullscreen && isStarted && !isSubmittingRef.current && (
        <div className="fixed inset-0 z-[200] bg-[#131b2e]/80 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-[0_48px_96px_-12px_rgba(19,27,46,0.3)] border border-white/50 text-center space-y-8 animate-in zoom-in-95 duration-700">
             <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-12 h-12" />
             </div>
             <div className="space-y-3">
                <h2 className="text-2xl font-black text-[#131b2e] tracking-tight">Fullscreen Required</h2>
                <p className="text-sm font-medium text-[#464555] leading-relaxed">
                  To ensure academic integrity, this assessment must be taken in full-screen mode. Your progress has been paused.
                </p>
             </div>
             <button 
               onClick={toggleFullscreen}
               className="w-full py-5 bg-indigo-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
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
      {/* Premium Header Bar */}
      <header className="h-20 bg-white/80 backdrop-blur-3xl border-b border-[#c7c4d815] px-8 flex items-center justify-between sticky top-0 z-50">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Shield className="w-5 h-5 text-white" />
               </div>
               <div>
                  <h2 className="text-sm font-black text-[#131b2e] line-clamp-1 max-w-[240px] tracking-tight">{exam?.title}</h2>
                  <p className="text-[10px] font-black text-[#777587] uppercase tracking-widest">Secure Examination</p>
               </div>
            </div>
            
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all duration-500 ${
               timeLeft < 300 ? 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100 animate-pulse' : 'bg-[#f2f3ff] text-indigo-600'
            }`}>
               <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-600' : 'text-indigo-600'}`} /> 
               <span className="text-sm font-black tabular-nums tracking-tight">{formatTime(timeLeft)}</span>
            </div>
         </div>

         <div className="flex items-center gap-6">
             <div className="h-10 w-px bg-[#c7c4d830] hidden sm:block" />
             <div className="hidden sm:flex flex-col items-end">
               <p className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em] mb-0.5">Progress</p>
               <p className="text-xs font-black text-[#131b2e]">Question {currentQIndex + 1} <span className="text-[#c7c4d8]">/</span> {exam?.questions.length}</p>
             </div>
             <button 
               onClick={() => handleSubmit()}
               className="px-8 py-3.5 bg-[#131b2e] text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl hover:bg-[#283044] hover:shadow-[0_12px_24px_-8px_rgba(19,27,46,0.3)] transition-all duration-300"
             >
               Submit Exam
             </button>
         </div>
      </header>

      <div className="flex-1 flex flex-row-reverse overflow-hidden">
         {/* Premium Sidebar: Moved to Right Side */}
         <aside className="w-16 sm:w-80 border-l border-[#c7c4d815] hidden lg:flex flex-col bg-[#fcfdfe]">
            <div className="p-8">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-[#777587] uppercase tracking-[0.2em]">Navigation</h3>
                  <div className="px-2 py-0.5 bg-[#f2f3ff] rounded-lg">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tight">Part A</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-5 gap-3">
                 {exam?.questions.map((_, idx) => (
                   <button 
                     key={idx}
                     onClick={() => navigateToQ(idx)}
                     className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all duration-300 ${
                       currentQIndex === idx 
                        ? 'bg-indigo-600 text-white shadow-[0_8px_16px_-4px_rgba(79,70,229,0.4)] scale-110' 
                        : answers[exam!.questions[idx].id] 
                          ? 'bg-[#f2f3ff] text-indigo-600 border border-indigo-100' 
                          : 'bg-white text-[#777587] hover:bg-[#faf8ff] hover:text-[#131b2e] border border-[#c7c4d815]'
                     }`}
                   >
                     {(idx + 1).toString().padStart(2, '0')}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="mt-auto p-8 space-y-6">
               <div className="p-6 bg-white rounded-[2rem] border border-[#c7c4d815] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[10px] font-black text-[#777587] uppercase tracking-widest">Health & Security</p>
                     <div className={`w-2 h-2 rounded-full ${tabSwitches < 2 ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#464555]">Tab Switches</span>
                        <span className={`text-xs font-black ${tabSwitches > 0 ? 'text-rose-600' : 'text-[#777587]'}`}>{tabSwitches} / {SWITCH_LIMIT}</span>
                     </div>
                     <div className="w-full h-1.5 bg-[#f2f3ff] rounded-full overflow-hidden">
                        <div 
                           className={`h-full transition-all duration-1000 ${tabSwitches >= 2 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                           style={{ width: `${(tabSwitches / SWITCH_LIMIT) * 100}%` }} 
                        />
                     </div>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 px-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <span className="text-[10px] font-black text-[#777587] uppercase tracking-widest leading-none">Connection Stable</span>
               </div>
            </div>
         </aside>

          {/* Main Content: Focused Editorial Flow */}
          <main className="flex-1 overflow-hidden bg-[#faf8ff] flex flex-col">
            <div className="max-w-5xl mx-auto w-full h-full p-8 md:p-12 lg:p-16 flex flex-col space-y-12">
               
               {/* Question Section: Editorial Style - Smaller for fixed layout */}
               <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700 max-h-[25%] overflow-y-auto custom-scrollbar flex-shrink-0 pr-4">
                  <div className="flex items-center gap-4">
                     <span className="px-4 py-1.5 bg-white border border-[#c7c4d830] text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-sm">{currentQ.type}</span>
                     <span className="text-[10px] font-black text-[#777587] uppercase tracking-widest leading-none">{currentQ.marks} Marks Available</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-[#131b2e] leading-[1.2] tracking-tight">
                    {currentQ.text}
                  </h1>
               </div>

               {/* Interaction Section: Large Focused Cards */}
               <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 overflow-hidden flex flex-col lg:border lg:border-[#c7c4d815] lg:rounded-[2rem] lg:bg-white lg:shadow-xl lg:shadow-[#c7c4d808]">
                  {currentQ.type === 'MCQ' ? (
                    <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                      {currentQ.mcqOptions?.map((opt) => (
                        <button 
                          key={opt.id}
                          onClick={() => updateAnswer(currentQ.id, { type: 'MCQ', optionId: opt.id })}
                          className={`p-8 rounded-[2rem] border-2 text-left transition-all duration-300 flex items-start gap-6 group hover:translate-y-[-2px] ${
                            (answers[currentQ.id] as { type: 'MCQ'; optionId: string } | undefined)?.optionId === opt.id 
                             ? 'bg-white border-indigo-600 shadow-md' 
                             : 'bg-white border-[#f0f1f7] hover:border-[#c7c4d860]'
                          }`}
                        >
                           <div className={`mt-1 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                             (answers[currentQ.id] as { type: 'MCQ'; optionId: string } | undefined)?.optionId === opt.id 
                              ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-lg shadow-indigo-100' 
                              : 'border-[#c7c4d860] group-hover:border-indigo-200'
                           }`}>
                                {(answers[currentQ.id] as { type: 'MCQ'; optionId: string } | undefined)?.optionId === opt.id && <CheckCircle className="w-4 h-4 text-white" />}
                           </div>
                           <div className="space-y-1 flex-1">
                              <span className={`text-base font-black tracking-tight leading-snug transition-colors duration-300 ${
                                 (answers[currentQ.id] as { type: 'MCQ'; optionId: string } | undefined)?.optionId === opt.id ? 'text-[#131b2e]' : 'text-[#464555]'
                              }`}>
                                 {opt.text}
                              </span>
                           </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Fixed Layout: Results ABOVE, Editor BELOW */}
                      
                      {/* Test Cases / Execution Result Section - FIXED POSITION TOP */}
                      <div className="p-8 border-b border-[#c7c4d815] bg-[#fcfdfe] max-h-[40%] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-4 duration-700">
                        {executionResult ? (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                 <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Execution Report</h3>
                                 <p className="text-xs font-black text-[#131b2e]">Session Analysis Complete</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-black text-indigo-600">{executionResult.passedCount} / {executionResult.totalCount} Passed</span>
                                <div className="w-32 h-1.5 bg-[#f2f3ff] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.3)]" 
                                    style={{ width: `${(executionResult.passedCount / executionResult.totalCount) * 100}%` }} 
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {executionResult.details.map((res, idx) => (
                                <div key={idx} className="p-5 bg-white border border-[#c7c4d815] rounded-2xl hover:border-indigo-100 transition-all group">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${res.passed ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'bg-rose-50 text-rose-600 shadow-sm'}`}>
                                          {res.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                       </div>
                                       <span className="text-[10px] font-black text-[#131b2e] uppercase tracking-widest block">CASE {idx + 1}</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${res.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                      {res.status}
                                    </span>
                                  </div>

                                  {!res.passed && (
                                    <div className="space-y-3 mt-4 border-t border-[#c7c4d810] pt-4">
                                      <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-[#777587] uppercase tracking-widest">Expected</p>
                                        <pre className="p-3 bg-[#faf8ff] rounded-xl text-[10px] font-mono text-indigo-600 overflow-x-auto whitespace-pre-wrap">
                                          {res.expectedOutput || 'No output'}
                                        </pre>
                                      </div>
                                      <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-[#777587] uppercase tracking-widest">Actual</p>
                                        <pre className={`p-3 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap ${res.actualOutput === null ? 'bg-rose-50 text-rose-400 italic' : 'bg-rose-50/50 text-rose-600'}`}>
                                          {res.actualOutput ?? 'No output'}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {res.passed && (
                                    <div className="mt-2 text-[10px] font-bold text-emerald-600/60 font-mono pl-11">
                                      ✓ Output matched expectations
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                               <h3 className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em]">Required Test Cases</h3>
                               <div className="flex gap-1.5 opacity-20">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#131b2e]" />
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#131b2e]" />
                               </div>
                            </div>
                            {currentQ.testCases && currentQ.testCases.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 {currentQ.testCases.map((tc, idx) => (
                                   <div key={idx} className="p-5 bg-white border border-[#c7c4d815] rounded-2xl group">
                                      <div className="flex items-center gap-2 mb-3 text-[#777587]">
                                         <AlertCircle className="w-3 h-3" />
                                         <p className="text-[8px] font-black uppercase tracking-widest">Sample {idx+1}</p>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                         <div className="flex items-center justify-between">
                                            <span className="text-[7px] font-black text-[#c7c4d8] uppercase tracking-widest">In</span>
                                            <span className="text-[10px] font-mono text-[#131b2e] truncate max-w-[60%]">{tc.input || 'None'}</span>
                                         </div>
                                         <div className="flex items-center justify-between">
                                            <span className="text-[7px] font-black text-[#c7c4d8] uppercase tracking-widest">Out</span>
                                            <span className="text-[10px] font-mono text-indigo-600 font-bold truncate max-w-[60%]">{tc.expectedOutput}</span>
                                         </div>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Header for Editor */}
                      <div className="px-8 py-4 bg-white border-b border-[#c7c4d815] flex items-center justify-between flex-shrink-0">
                         <div className="flex items-center gap-6">
                            <div className="flex bg-[#f2f3ff] p-1 rounded-xl">
                              {LANGUAGES.map(lang => (
                                <button
                                  key={lang.id}
                                  onClick={() => {
                                    const existing = (answers[currentQ.id] as any);
                                    updateAnswer(currentQ.id, { 
                                      type: 'CODING', 
                                      code: existing?.code || '', 
                                      languageId: lang.id 
                                    });
                                  }}
                                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                    ((answers[currentQ.id] as any)?.languageId || 63) === lang.id 
                                      ? 'bg-white text-indigo-600 shadow-sm' 
                                      : 'text-[#777587] hover:text-[#131b2e]'
                                  }`}
                                >
                                  {lang.name}
                                </button>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-2">
                               <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                               <span className="text-[10px] font-black text-[#777587] uppercase tracking-[0.2em]">
                                 FILE.EXT: <span className="text-[#131b2e]">{LANGUAGES.find(l => l.id === ((answers[currentQ.id] as any)?.languageId || 63))?.ext}</span>
                               </span>
                            </div>
                         </div>
                         
                         <button 
                           disabled={isRunning}
                           onClick={handleRunCode}
                           className="flex items-center gap-2.5 px-6 py-2.5 bg-[#131b2e] hover:bg-[#283044] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-[#131b2e]/10"
                         >
                           {isRunning ? (
                             <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           ) : (
                             <><Play className="w-3 h-3" /> Execute Session</>
                           )}
                         </button>
                      </div>

                      {/* IDE Section - EXPANDED */}
                      <div className="flex-1 min-h-0 flex bg-[#131b2e] relative group">
                          {/* Gutter */}
                          <div className="w-12 bg-white/[0.02] border-r border-white/5 flex flex-col items-center pt-8 select-none flex-shrink-0">
                             {[...Array(30)].map((_, i) => (
                               <span key={i} className="text-[10px] font-mono text-white/20 h-[1.5rem] leading-relaxed">
                                 {(i + 1).toString().padStart(2, '0')}
                               </span>
                             ))}
                          </div>
                          <textarea 
                            spellCheck={false}
                            value={(answers[currentQ.id] as any)?.code || ''}
                            onKeyDown={handleEditorKeyDown}
                            onChange={(e) => {
                              const existing = (answers[currentQ.id] as any);
                              updateAnswer(currentQ.id, { 
                                type: 'CODING', 
                                code: e.target.value, 
                                languageId: existing?.languageId || 63 
                              });
                            }}
                            className="flex-1 bg-transparent p-8 pb-16 text-indigo-100 font-mono text-sm outline-none resize-none leading-[1.5rem] placeholder:text-white/10 selection:bg-indigo-500/40 overflow-y-auto custom-scrollbar"
                            placeholder="// Start typing your solution here..."
                          />
                          
                          {/* Hint Bar / Cheat Sheet */}
                          <div className="absolute bottom-6 right-8 left-20 px-6 py-3 bg-indigo-600/10 backdrop-blur-md border border-white/5 rounded-2xl flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                             <div className="flex items-center gap-6">
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Methods Hint:</span>
                                <div className="flex gap-4">
                                   <span className="text-[9px] font-mono text-white/40">sort()</span>
                                   <span className="text-[9px] font-mono text-white/40">map()</span>
                                   <span className="text-[9px] font-mono text-white/40">max()</span>
                                   <span className="text-[9px] font-mono text-white/40">min()</span>
                                </div>
                             </div>
                             <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">IDE v2.0 READY</span>
                          </div>
                      </div>
                    </div>
                  )}
               </div>

               {/* Premium Navigation Controls */}
               <div className="flex items-center justify-between pt-16 border-t border-[#c7c4d810] animate-in fade-in duration-1000">
                  <button 
                    disabled={currentQIndex === 0}
                    onClick={() => navigateToQ(currentQIndex - 1)}
                    className="flex items-center gap-3 text-[11px] font-black text-[#777587] hover:text-[#131b2e] disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-[0.2em] group"
                  >
                     <div className="w-10 h-10 rounded-full border border-[#c7c4d830] flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                        <ChevronLeft className="w-4 h-4" />
                     </div>
                     Previous
                  </button>
                  
                  <div className="flex gap-4">
                    {currentQIndex < exam!.questions.length - 1 ? (
                      <button 
                        onClick={() => navigateToQ(currentQIndex + 1)}
                        className="px-12 py-5 bg-white text-[#131b2e] border border-[#c7c4d840] text-xs font-black rounded-[2rem] shadow-[0_8px_24px_-8px_rgba(19,27,46,0.1)] hover:shadow-[0_12px_32px_-8px_rgba(19,27,46,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 uppercase tracking-widest"
                      >
                        Next Question <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleSubmit()}
                        className="px-16 py-5 bg-indigo-600 text-white text-xs font-black rounded-[2rem] shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 uppercase tracking-widest"
                      >
                        Finish & Submit <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
               </div>

            </div>
         </main>
      </div>

      {/* Premium Mobile Navigation */}
      <div className="lg:hidden h-24 bg-white/80 backdrop-blur-3xl border-t border-[#c7c4d815] px-8 flex items-center justify-between z-50">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#777587] uppercase tracking-widest">Question</span>
            <span className="text-sm font-black text-[#131b2e]">{currentQIndex+1} / {exam?.questions.length}</span>
         </div>
         <div className="flex gap-3">
            <button onClick={() => navigateToQ(Math.max(0, currentQIndex - 1))} className="w-12 h-12 bg-[#f2f3ff] text-indigo-600 rounded-2xl flex items-center justify-center active:scale-95 transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => navigateToQ(Math.min(exam!.questions.length - 1, currentQIndex + 1))} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-indigo-100"><ChevronRight className="w-5 h-5" /></button>
         </div>
      </div>

    </div>
  );
}
