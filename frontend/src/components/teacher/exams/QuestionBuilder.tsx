'use client';
import { useState } from 'react';
import { 
  Plus, Trash2, Edit2, Check, X, 
  GripVertical, HelpCircle, Code, 
  ChevronDown, ChevronUp 
} from 'lucide-react';
import { Question, QuestionPayload, examApi } from '@/lib/api/examApi';
import { BulkUpload } from './BulkUpload';
import toast from 'react-hot-toast';

interface QuestionBuilderProps {
  examId: string;
  initialQuestions: Question[];
  onUpdate: () => void;
}

export function QuestionBuilder({ examId, initialQuestions, onUpdate }: QuestionBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'BULK'>('MANUAL');
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [type, setType] = useState<'MCQ' | 'CODING'>('MCQ');
  const [text, setText] = useState('');
  const [marks, setMarks] = useState(5);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  
  // MCQ Specific
  const [mcqOptions, setMcqOptions] = useState<{ text: string; isCorrect: boolean }[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // Coding Specific
  const [testCases, setTestCases] = useState<{ input: string; expectedOutput: string; isVisible: boolean }[]>([
    { input: '', expectedOutput: '', isVisible: true },
  ]);

  const resetForm = () => {
    setText('');
    setMarks(5);
    setDifficulty('MEDIUM');
    setMcqOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
    setTestCases([{ input: '', expectedOutput: '', isVisible: true }]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (text.length < 5) {
      toast.error('Question text must be at least 5 characters');
      return;
    }

    const payload: QuestionPayload = {
      type,
      text,
      marks,
      difficulty,
      order: questions.length,
      mcqOptions: type === 'MCQ' ? mcqOptions.filter(o => o.text.trim()) : undefined,
      testCases: type === 'CODING' ? testCases.filter(t => t.expectedOutput.trim()) : undefined,
    };

    try {
      if (editingId) {
        await examApi.updateQuestion(examId, editingId, payload);
        toast.success('Question updated');
      } else {
        await examApi.addQuestion(examId, payload);
        toast.success('Question added');
      }
      resetForm();
      onUpdate();
    } catch (err: any) {
      toast.error(err.displayMessage ?? 'Failed to save question');
    }
  };

  const handleDelete = async (qid: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await examApi.deleteQuestion(examId, qid);
      toast.success('Question deleted');
      onUpdate();
    } catch (err: any) {
      toast.error('Failed to delete question');
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setType(q.type);
    setText(q.text);
    setMarks(q.marks);
    setDifficulty(q.difficulty);
    if (q.mcqOptions) setMcqOptions(q.mcqOptions.map(o => ({ text: o.text, isCorrect: o.isCorrect })));
    if (q.testCases) setTestCases(q.testCases.map(t => ({ input: t.input, expectedOutput: t.expectedOutput, isVisible: t.isVisible })));
    setIsAdding(true);
  };

  const handleBulkImport = async (parsedQuestions: QuestionPayload[]) => {
    if (!parsedQuestions.length) return;
    setIsUploading(true);
    try {
      await examApi.addQuestionsBulk(examId, parsedQuestions);
      toast.success(`${parsedQuestions.length} questions imported successfully!`);
      setActiveTab('MANUAL');
      onUpdate();
    } catch (err: any) {
      toast.error(err.displayMessage || 'Failed to import questions');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-100 mb-6">
        <button
          onClick={() => setActiveTab('MANUAL')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'MANUAL' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Manual Questions
        </button>
        <button
          onClick={() => setActiveTab('BULK')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'BULK' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Bulk Upload CSV
        </button>
      </div>

      {activeTab === 'BULK' ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <BulkUpload onImportQuestions={handleBulkImport} isUploading={isUploading} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Questions ({questions.length})</h2>
            {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            )}
          </div>

      {isAdding && (
        <div className="bg-white border-2 border-blue-100 rounded-[2rem] p-6 lg:p-8 space-y-6 shadow-xl shadow-blue-50/50">
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setType('MCQ')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${type === 'MCQ' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <HelpCircle className="w-4 h-4" /> MCQ
              </button>
              <button 
                onClick={() => setType('CODING')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${type === 'CODING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Code className="w-4 h-4" /> Coding
              </button>
            </div>
            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Question Text</label>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-2xl py-4 px-5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                placeholder="e.g. Which of the following is a balanced tree?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Marks</label>
                <input 
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3 px-5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Difficulty</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl py-3 px-5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {type === 'MCQ' ? (
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Options</label>
                {mcqOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const newOpts = [...mcqOptions];
                        newOpts[i].isCorrect = !newOpts[i].isCorrect;
                        setMcqOptions(newOpts);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${opt.isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      {opt.isCorrect && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <input 
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...mcqOptions];
                        newOpts[i].text = e.target.value;
                        setMcqOptions(newOpts);
                      }}
                      className="flex-1 bg-slate-100/50 border border-transparent focus:bg-white focus:border-blue-100 rounded-xl py-2.5 px-4 text-sm font-medium outline-none transition-all"
                      placeholder={`Option ${i+1}`}
                    />
                    {mcqOptions.length > 2 && (
                      <button onClick={() => setMcqOptions(mcqOptions.filter((_, idx) => idx !== i))} className="p-2 text-slate-300 hover:text-rose-500">
                        <Plus className="w-4 h-4 rotate-45" />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setMcqOptions([...mcqOptions, { text: '', isCorrect: false }])}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 pl-1"
                >
                  <Plus className="w-3 h-3" /> Add Option
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Test Cases</label>
                {testCases.map((tc, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-bold text-slate-400">Test Case #{i+1}</span>
                       <button onClick={() => setTestCases(testCases.filter((_, idx) => idx !== i))} className="p-1 text-slate-300 hover:text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        value={tc.input}
                        onChange={(e) => {
                          const newTcs = [...testCases];
                          newTcs[i].input = e.target.value;
                          setTestCases(newTcs);
                        }}
                        className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-blue-100"
                        placeholder="Input"
                      />
                      <input 
                        value={tc.expectedOutput}
                        onChange={(e) => {
                          const newTcs = [...testCases];
                          newTcs[i].expectedOutput = e.target.value;
                          setTestCases(newTcs);
                        }}
                        className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-blue-100"
                        placeholder="Expected Output"
                      />
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setTestCases([...testCases, { input: '', expectedOutput: '', isVisible: true }])}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 pl-1"
                >
                  <Plus className="w-3 h-3" /> Add Test Case
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              onClick={handleSave}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> {editingId ? 'Update Question' : 'Save Question'}
            </button>
            <button 
              onClick={resetForm}
              className="px-6 py-3 border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List of Questions */}
      <div className="space-y-4">
        {questions.length === 0 && !isAdding && (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <HelpCircle className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400 tracking-tight">No questions added yet.<br/><span className="text-[10px] font-medium">Click "Add Question" to get started.</span></p>
          </div>
        )}
        
        {questions.map((q, i) => (
          <div key={q.id} className="group bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
            <div className="flex items-start gap-4">
               <div className="mt-1 p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-400 transition-colors">
                 {q.type === 'MCQ' ? <HelpCircle className="w-4 h-4" /> : <Code className="w-4 h-4" />}
               </div>
               <div className="flex-1">
                 <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {i+1} • {q.marks} Marks • {q.difficulty}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(q)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(q.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                 </div>
                 <p className="text-sm font-bold text-slate-800 leading-relaxed mb-3">{q.text}</p>
                 
                 {q.type === 'MCQ' && q.mcqOptions && q.mcqOptions.length > 0 && (
                   <div className="grid grid-cols-2 gap-2">
                     {q.mcqOptions.map((opt, idx) => (
                       <div key={idx} className={`p-2 rounded-xl text-[10px] font-bold border ${opt.isCorrect ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                         {opt.text}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
}
