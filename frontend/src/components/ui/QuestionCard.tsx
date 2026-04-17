import React from 'react';
import { 
  Trash2, ChevronUp, ChevronDown, 
  HelpCircle, Code, GripVertical, 
  X, Check, Target, 
  Hash, Zap, Award
} from 'lucide-react';
import { type QuestionDraft } from '@/types';

interface QuestionCardProps {
  question: QuestionDraft;
  index: number;
  total: number;
  onChange: (updated: QuestionDraft) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function QuestionCard({
  question,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown
}: QuestionCardProps) {
  const update = (patch: Partial<QuestionDraft>) => onChange({ ...question, ...patch });

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col sm:flex-row">
      {/* Visual Indicator */}
      <div className={`w-1.5 h-full absolute left-0 top-0 ${question.type === 'CODE' ? 'bg-indigo-500' : 'bg-blue-500'}`} />

      {/* Slim Actions Sidebar */}
      <div className="w-full sm:w-14 bg-slate-50/50 flex flex-row sm:flex-col items-center justify-between p-3 border-b sm:border-b-0 sm:border-r border-slate-100">
        <div className="flex flex-row sm:flex-col items-center gap-1.5">
            <button 
                type="button"
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                title="Move Up"
            >
                <ChevronUp className="h-4 w-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                 <span className="text-[10px] font-bold text-slate-500">{index + 1}</span>
            </div>
            <button 
                type="button"
                onClick={onMoveDown}
                disabled={index === total - 1}
                className="p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                title="Move Down"
            >
                <ChevronDown className="h-4 w-4" />
            </button>
        </div>
        
        <button
            type="button"
            onClick={onDelete}
            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
            title="Delete Question"
        >
            <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-5 lg:p-7 space-y-6">
        {/* Header: Type & Marks */}
        <div className="flex items-center justify-between gap-4">
           <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                   type="button"
                   onClick={() => update({ type: 'MCQ' })}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${question.type === 'MCQ' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   <HelpCircle className="h-3.5 w-3.5" /> MCQ
                </button>
                <button
                   type="button"
                   onClick={() => update({ type: 'CODE' })}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${question.type === 'CODE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                   <Code className="h-3.5 w-3.5" /> CODE
                </button>
           </div>

           <div className="flex items-center gap-3 pr-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <input
                    type="number"
                    min={1}
                    value={question.points}
                    onChange={(e) => update({ points: parseInt(e.target.value) || 1 })}
                    className="w-10 bg-transparent border-none outline-none text-sm font-black text-slate-900 focus:ring-0 p-0 text-center"
                  />
              </div>
           </div>
        </div>

        {/* Question Area */}
        <div className="space-y-2">
            <textarea
                value={question.text}
                onChange={(e) => update({ text: e.target.value })}
                placeholder="Enter question statement..."
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 outline-none transition-all text-base font-semibold text-slate-800 leading-relaxed resize-none"
                rows={2}
            />
        </div>

        {/* Options / Test Cases */}
        <div className="">
            {question.type === 'MCQ' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['a', 'b', 'c', 'd'].map((key) => (
                        <div 
                            key={key} 
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${question.correctAnswer === key ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                            <button
                                type="button"
                                onClick={() => update({ correctAnswer: key })}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-all ${question.correctAnswer === key ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}
                            >
                                {key.toUpperCase()}
                            </button>
                            <input
                                type="text"
                                value={question.options[key as keyof typeof question.options]}
                                onChange={(e) => update({ options: { ...question.options, [key]: e.target.value } })}
                                placeholder={`Option ${key.toUpperCase()}`}
                                className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                            />
                            {question.correctAnswer === key && (
                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Award className="h-3.5 w-3.5 text-indigo-500" />
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Test Cases</h4>
                        </div>
                        <button
                            type="button"
                            onClick={() => update({ testCases: [...question.testCases, { input: '', expectedOutput: '', isVisible: true }] })}
                            className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800"
                        >
                            + Add Case
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {question.testCases.map((tc, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-400 capitalize">Case #{idx+1}</span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const n = [...question.testCases];
                                                n[idx].isVisible = !n[idx].isVisible;
                                                update({ testCases: n });
                                            }}
                                            className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${tc.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                                        >
                                            {tc.isVisible ? 'Public' : 'Hidden'}
                                        </button>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => update({ testCases: question.testCases.filter((_, i) => i !== idx) })}
                                        className="text-slate-300 hover:text-rose-500"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Input</label>
                                        <textarea
                                            value={tc.input}
                                            onChange={(e) => {
                                                const n = [...question.testCases];
                                                n[idx].input = e.target.value;
                                                update({ testCases: n });
                                            }}
                                            className="w-full p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-700 outline-none focus:border-indigo-400"
                                            rows={1}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Output</label>
                                        <textarea
                                            value={tc.expectedOutput}
                                            onChange={(e) => {
                                                const n = [...question.testCases];
                                                n[idx].expectedOutput = e.target.value;
                                                update({ testCases: n });
                                            }}
                                            className="w-full p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-700 outline-none focus:border-indigo-400"
                                            rows={1}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
