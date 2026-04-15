'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Clock, Shield, 
  ChevronLeft, ChevronRight, CheckCircle, 
  Terminal
} from 'lucide-react';
import { studentApi, ExamAttempt } from '@/lib/api/studentApi';
import toast from 'react-hot-toast';

type AnswerValue =
  | { type: 'MCQ'; optionId: string }
  | { type: 'CODING'; code: string };

export default function ExamAttemptPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  
  const [exam, setExam] = useState<ExamAttempt | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  
  // Proctoring
  const [tabSwitches, setTabSwitches] = useState(0);
  const SWITCH_LIMIT = 3;

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
    if (!autoSubmit && !confirm('Are you sure you want to submit?')) return;
    
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
      if (!document.fullscreenElement) {
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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-blue-100 border border-slate-100 text-center space-y-8">
           <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">{exam?.title}</h1>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                This assessment is proctored. You must stay in fullscreen mode and avoid switching tabs. 
                Exiting the tab more than {SWITCH_LIMIT} times will lead to automatic termination.
              </p>
           </div>
           <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Duration</p>
                 <p className="text-sm font-bold text-slate-800">{exam?.duration} Minutes</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Questions</p>
                 <p className="text-sm font-bold text-slate-800">{exam?.questions.length} Items</p>
              </div>
           </div>
           <button 
             onClick={startExam}
             className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
           >
             Start Proctored Exam <ChevronRight className="w-5 h-5" />
           </button>
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
    <div className="min-h-screen bg-white flex flex-col font-sans select-none">
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-white sticky top-0 z-30">
         <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-slate-800 line-clamp-1 max-w-[200px]">{exam?.title}</h2>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 ${timeLeft < 300 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
               <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)} Left
            </div>
         </div>

         <div className="flex items-center gap-3">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
               Question {currentQIndex + 1} of {exam?.questions.length}
             </div>
             <button 
               onClick={() => handleSubmit()}
               className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
             >
               Submit Exam
             </button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         {/* Left: Question Navigation */}
         <aside className="w-16 sm:w-64 border-r border-slate-100 hidden lg:flex flex-col bg-slate-50/50">
            <div className="p-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Navigation</h3>
               <div className="grid grid-cols-4 gap-2">
                 {exam?.questions.map((_, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setCurrentQIndex(idx)}
                     className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                       currentQIndex === idx 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110' 
                        : answers[exam!.questions[idx].id] 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
                     }`}
                   >
                     {idx + 1}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="mt-auto p-6 space-y-4">
               <div className="p-4 bg-white rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Warnings</p>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-700">Tab Switches</span>
                     <span className={`text-xs font-black ${tabSwitches > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{tabSwitches}/3</span>
                  </div>
               </div>
            </div>
         </aside>

         {/* Main Content: Split Pane or Single View */}
         <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 bg-[#fcfdfe]">
            <div className="max-w-5xl mx-auto space-y-10">
               
               {/* Question Section */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase">{currentQ.type}</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase">{currentQ.marks} Marks</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                    {currentQ.text}
                  </h1>
               </div>

               {/* Interaction Section */}
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {currentQ.type === 'MCQ' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQ.mcqOptions?.map((opt) => (
                        <button 
                          key={opt.id}
                          onClick={() => updateAnswer(currentQ.id, { type: 'MCQ', optionId: opt.id })}
                          className={`p-6 rounded-[1.5rem] border-2 text-left transition-all flex items-center gap-4 ${
                            (answers[currentQ.id] as { type: 'MCQ'; optionId: string } | undefined)?.optionId === opt.id 
                             ? 'bg-blue-50 border-blue-600 shadow-lg shadow-blue-50' 
                             : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                             (answers[currentQ.id] as { type: 'MCQ'; optionId: string } | undefined)?.optionId === opt.id ? 'bg-blue-600 border-blue-600' : 'border-slate-200'
                           }`}>
                              {(answers[currentQ.id] as { type: 'MCQ'; optionId: string } | undefined)?.optionId === opt.id && <CheckCircle className="w-4 h-4 text-white" />}
                           </div>
                           <span className="text-sm font-bold tracking-tight">{opt.text}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-900 border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
                         <div className="h-12 bg-slate-800 border-b border-white/5 flex items-center px-6 justify-between">
                            <div className="flex items-center gap-2">
                               <Terminal className="w-4 h-4 text-green-400" />
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Editor</span>
                            </div>
                            <div className="flex gap-1.5">
                               <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                               <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                               <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                            </div>
                         </div>
                         <textarea 
                           spellCheck={false}
                           value={(answers[currentQ.id] as { type: 'CODING'; code: string } | undefined)?.code || ''}
                           onChange={(e) => updateAnswer(currentQ.id, { type: 'CODING', code: e.target.value })}
                           className="flex-1 bg-transparent p-8 text-white font-mono text-sm outline-none resize-none leading-relaxed placeholder:text-slate-700"
                           placeholder="// Type your code solution here..."
                         />
                      </div>
                      
                      {currentQ.testCases && currentQ.testCases.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                           {currentQ.testCases.map((tc, idx) => (
                             <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Test Case {idx+1}</p>
                                <div className="space-y-1">
                                   <p className="text-[10px] text-slate-500 font-medium">Input: <span className="font-bold text-slate-900">{tc.input}</span></p>
                                   <p className="text-[10px] text-slate-500 font-medium">Output: <span className="font-bold text-slate-900">{tc.expectedOutput}</span></p>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  )}
               </div>

               {/* Navigation Buttons */}
               <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                  <button 
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                    className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                     <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button 
                    onClick={() => {
                      if (currentQIndex === exam!.questions.length - 1) {
                        handleSubmit();
                      } else {
                        setCurrentQIndex(prev => prev + 1);
                      }
                    }}
                    className="px-10 py-4 bg-slate-900 text-white text-xs font-black rounded-2xl shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
                  >
                    {currentQIndex === exam!.questions.length - 1 ? 'Finish Exam' : 'Next Question'}
                  </button>
               </div>

            </div>
         </main>
      </div>

      {/* Mobile Nav Overlay (Footer) */}
      <div className="lg:hidden h-20 border-t border-slate-100 px-6 flex items-center justify-between bg-white text-xs font-bold text-slate-500">
         <span>Q{currentQIndex+1} / {exam?.questions.length}</span>
         <div className="flex gap-2">
            <button onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))} className="p-3 bg-slate-50 rounded-xl"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentQIndex(prev => Math.min(exam!.questions.length - 1, prev + 1))} className="p-3 bg-slate-50 rounded-xl"><ChevronRight className="w-4 h-4" /></button>
         </div>
      </div>

    </div>
  );
}
