import React from 'react';

interface QuestionPaletteProps {
  questions: any[];
  answers: Record<string, any>;
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function QuestionPalette({ questions, answers, currentIndex, onNavigate }: QuestionPaletteProps) {
  const answeredCount = Object.values(answers).filter(a => {
    if (a?.type === 'MCQ') return !!a.optionId;
    if (a?.type === 'CODING') return !!a.code?.trim();
    return false;
  }).length;
  
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="bg-white border text-left border-gray-200 rounded-xl p-4 lg:p-6 shadow-sm sticky top-4 lg:top-24 mt-8 lg:mt-0 lg:h-auto z-10 w-full mb-20 lg:mb-0">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">grid_view</span>
            Question Palette
        </h3>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-8 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-2">
                <div className="size-4 bg-status-answered rounded"></div>
                <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="size-4 border border-primary rounded ring-1 ring-primary/30"></div>
                <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="size-4 bg-status-not-visited border border-neutral-border rounded"></div>
                <span>Not Visited</span>
            </div>
        </div>

        {/* Palette Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2 max-h-[200px] lg:max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {questions.map((q, i) => {
                const isCurrent = i === currentIndex;
                const answer = answers[q.id];
                let isAnswered = false;
                if (answer) {
                  if (answer.type === 'MCQ') isAnswered = !!answer.optionId;
                  if (answer.type === 'CODING') {
                     // Check if it's not strictly empty
                     isAnswered = !!answer.code?.trim();
                  }
                }

                let btnClass = "size-10 flex items-center justify-center rounded text-sm font-bold transition-all ";
                if (isCurrent) {
                    btnClass += "border-2 border-primary bg-white text-primary ring-2 ring-primary/10";
                } else if (isAnswered) {
                    btnClass += "bg-status-answered text-white hover:opacity-90";
                } else {
                    btnClass += "bg-status-not-visited text-gray-600 border border-neutral-border hover:bg-gray-200";
                }

                return (
                    <button 
                       key={q.id} 
                       className={btnClass}
                       onClick={() => onNavigate(i)}
                    >
                        {i + 1}
                    </button>
                );
            })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-gray-400 gap-2">
            <span>Progress: {progressPercent}% Completed</span>
            <span>{answeredCount}/{questions.length} Answered</span>
        </div>
        
        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
        </div>
    </div>
  );
}
