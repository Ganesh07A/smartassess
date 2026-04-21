import React from 'react';
import { Terminal, Play, AlertCircle } from 'lucide-react';
import { CodingExecutionResult } from '@/lib/api/studentApi';

interface CodingViewProps {
  question: any;
  currentAnswer: { type: 'CODING', code: string; languageId: number } | undefined;
  onAnswerChange: (code: string, languageId: number) => void;
  isRunning: boolean;
  handleRunCode: () => void;
  executionResult: CodingExecutionResult | null;
  templates: Record<number, string>;
}

const LANGUAGES = [
  { id: 63, name: 'JavaScript', ext: '.js' },
  { id: 71, name: 'Python', ext: '.py' }
];

export function CodingView({ 
    question, currentAnswer, onAnswerChange, 
    isRunning, handleRunCode, executionResult, templates 
}: CodingViewProps) {
  
  const currentLanguageId = currentAnswer?.languageId || 63;
  const currentCode = currentAnswer?.code ?? templates[currentLanguageId];

  return (
    <div className="flex flex-col h-full bg-[#fcfcfd]">
        {/* Problem Description Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="px-2.5 py-0.5 bg-blue-100 text-primary text-xs font-bold rounded uppercase tracking-wide">Coding Question</span>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded uppercase tracking-wide">Points: {question.marks}</span>
                </div>
                
                {/* Question title removed to avoid duplication */}
                
                <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed space-y-4">
                    <p className="whitespace-pre-wrap">{question.text}</p>
                    
                    {!executionResult && question.testCases && question.testCases.length > 0 && (
                        <div className="mt-8 space-y-6">
                            {question.testCases.map((tc: any, idx: number) => (
                                <div key={idx}>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight mb-2">Example {idx + 1}:</h4>
                                    <div className="bg-gray-50 border border-neutral-border rounded-lg p-4 font-mono text-sm shadow-sm">
                                        <p><span className="text-gray-500">Input:</span> {tc.input}</p>
                                        <p><span className="text-gray-500">Output:</span> {tc.expectedOutput}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Execution Results Section inside scrollable top half */}
                {executionResult && (
                    <div className="mt-8 pt-8 border-t border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-sm border-l-4 border-indigo-500 pl-3 font-bold uppercase tracking-widest text-slate-700">Execution Results</span>
                            <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider ${executionResult.passedCount === executionResult.totalCount ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {executionResult.passedCount} / {executionResult.totalCount} Passed
                            </span>
                        </div>
                        <div className="space-y-4">
                            {executionResult.details.map((res: any, idx: number) => (
                                <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${res.passed ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className={`text-xs font-bold uppercase tracking-widest ${res.passed ? 'text-emerald-600' : 'text-rose-600'}`}>Test Case {idx + 1}</h4>
                                        {res.passed ? (
                                            <span className="text-xs font-bold text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded">PASSED</span>
                                        ) : (
                                            <span className="text-xs font-bold text-rose-500 bg-rose-100 px-2 py-0.5 rounded">FAILED</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Input</span>
                                            <pre className="p-2 bg-white rounded border border-slate-100 text-xs font-mono">{res.input || 'None'}</pre>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Expected</span>
                                            <pre className="p-2 bg-white rounded border border-slate-100 text-xs font-mono">{res.expectedOutput}</pre>
                                        </div>
                                    </div>
                                    {!res.passed && (
                                        <div className="mt-4 pt-4 border-t border-rose-100/50">
                                            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Actual Output</span>
                                            <pre className="p-2 bg-rose-50 rounded border border-rose-100 text-xs font-mono text-rose-700 whitespace-pre-wrap">{res.actualOutput ?? 'No output'}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Code Editor Section (Bottom Half) */}
        <div className="h-[450px] border-t border-neutral-border flex flex-col bg-background-dark sm:bg-white text-white sm:text-black">
            {/* Editor Toolbar */}
            <div className="h-12 border-b border-white/10 sm:border-neutral-border flex flex-col sm:flex-row sm:items-center justify-between px-4 bg-[#1e293b] sm:bg-gray-50/50 overflow-x-auto">
                <div className="flex items-center gap-4 min-w-max py-2 sm:py-0">
                    <div className="relative">
                        <select 
                            value={currentLanguageId}
                            onChange={(e) => {
                                const newLang = Number(e.target.value);
                                onAnswerChange(currentAnswer?.code || templates[newLang] || '', newLang);
                            }}
                            className="appearance-none bg-white text-black border border-neutral-border rounded px-3 py-1 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.id} value={lang.id}>{lang.name}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1.5 text-gray-400 pointer-events-none text-sm">expand_more</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 min-w-max py-2 sm:py-0 pb-2 sm:pb-0">
                    <button 
                        disabled={isRunning}
                        onClick={handleRunCode}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-white bg-primary hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
                    >
                        {isRunning ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><Play className="w-4 h-4" /> Run Code</>
                        )}
                    </button>
                </div>
            </div>

            {/* Code Area */}
            <div className="flex-1 flex overflow-hidden code-editor bg-[#111827]">
                {/* Line Numbers */}
                <div className="w-12 bg-[#1e293b] border-r border-white/10 flex flex-col items-center py-4 text-gray-500 text-xs select-none overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                        <span key={i} className="h-6 flex items-center leading-none">{i + 1}</span>
                    ))}
                </div>
                {/* Text Area */}
                <textarea 
                    spellCheck={false}
                    value={currentCode}
                    onChange={(e) => onAnswerChange(e.target.value, currentLanguageId)}
                    onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            const target = e.target as HTMLTextAreaElement;
                            const start = target.selectionStart;
                            const end = target.selectionEnd;
                            const value = target.value;
                            const newCode = value.substring(0, start) + '    ' + value.substring(end);
                            onAnswerChange(newCode, currentLanguageId);
                            setTimeout(() => {
                                target.selectionStart = target.selectionEnd = start + 4;
                            }, 0);
                        }
                    }}
                    className="flex-1 bg-transparent p-4 text-gray-100 font-mono text-sm outline-none resize-none leading-6 custom-scrollbar whitespace-nowrap"
                />
            </div>
        </div>
    </div>
  );
}
