import React from 'react';

interface MCQViewProps {
  question: any;
  currentAnswer: { type: 'MCQ', optionId: string } | undefined;
  index: number;
  total: number;
  onAnswerChange: (optionId: string) => void;
}

export function MCQView({ question, currentAnswer, index, total, onAnswerChange }: MCQViewProps) {
  return (
    <div className="bg-white border text-left border-gray-200 rounded-xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
            <span className="bg-blue-50 text-primary px-3 py-1 rounded-sm text-xs font-bold tracking-wider uppercase">
                Question {index + 1} of {total}
            </span>
            <div className="flex items-center gap-2 text-gray-400">
                <span className="material-symbols-outlined text-sm">info</span>
                <span className="text-xs">Multiple Choice Question</span>
            </div>
        </div>
        
        <h2 className="text-xl lg:text-2xl font-semibold leading-snug mb-8 text-gray-900 border-b pb-6 border-slate-100">
            {question.text}
        </h2>
        
        <div className="space-y-4">
            {question.options?.map((opt: any, i: number) => {
                const isSelected = currentAnswer?.optionId === opt.id;
                
                return (
                    <label key={opt.id} className="relative block cursor-pointer group">
                        <input 
                            className="peer hidden" 
                            name={`question-${question.id}`} 
                            type="radio" 
                            checked={isSelected}
                            onChange={() => onAnswerChange(opt.id)}
                        />
                        <div className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
                            isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-slate-100 bg-slate-50/50 hover:border-gray-200'
                        }`}>
                            <div className={`size-6 flex-shrink-0 flex items-center justify-center rounded-full border-2 transition-all ${
                                isSelected 
                                ? 'border-primary bg-primary' 
                                : 'border-gray-300 bg-white'
                            }`}>
                                <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                    {String.fromCharCode(65 + i)}
                                </span>
                            </div>
                            <span className="text-base font-medium text-gray-700">{opt.text}</span>
                        </div>
                    </label>
                );
            })}
        </div>
    </div>
  );
}
