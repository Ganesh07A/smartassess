'use client';
import { useState } from 'react';
import { 
  Plus, Trash2, Edit2, Check, X, 
  GripVertical, HelpCircle, Code, 
  ChevronDown, ChevronUp, FileSpreadsheet, Upload 
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Premium Tab Selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-full max-w-md">
        <button
          onClick={() => setActiveTab('MANUAL')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-[1rem] ${activeTab === 'MANUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Plus className="w-4 h-4" /> Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('BULK')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-[1rem] ${activeTab === 'BULK' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Upload className="w-4 h-4" /> Bulk Upload
        </button>
      </div>

      {activeTab === 'BULK' ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 lg:p-12 shadow-xl shadow-slate-200/40">
          <div className="max-w-xl mx-auto text-center mb-10">
             <h3 className="text-xl font-black text-slate-900 mb-2">Import Questions via CSV</h3>
             <p className="text-sm font-medium text-slate-400 leading-relaxed">
               Quickly add multiple questions by uploading a structured CSV file. 
               This is the fastest way to build comprehensive assessments.
             </p>
          </div>
          <BulkUpload onImportQuestions={handleBulkImport} isUploading={isUploading} />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Question Bank</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-1">{initialQuestions.length} Questions Saved</p>
            </div>
            {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-xs font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
              >
                <Plus className="w-4 h-4" /> New Question
              </button>
            )}
          </div>

      {isAdding && (
        <div className="bg-white border-2 border-blue-100 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-2xl shadow-blue-50/50 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button 
                onClick={() => setType('MCQ')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${type === 'MCQ' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <HelpCircle className="w-4 h-4" /> MCQ
              </button>
              <button 
                onClick={() => setType('CODING')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${type === 'CODING' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Code className="w-4 h-4" /> Coding
              </button>
            </div>
            <button onClick={resetForm} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Question Content</label>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-2xl py-5 px-6 text-sm font-medium text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
                placeholder="Compose your question here..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Points / Marks</label>
                <input 
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-center"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Difficulty Level</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none text-center"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {type === 'MCQ' ? (
              <div className="space-y-4 pt-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Answer Options</label>
                <div className="space-y-3">
                  {mcqOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <button 
                        onClick={() => {
                          const newOpts = [...mcqOptions];
                          newOpts[i].isCorrect = !newOpts[i].isCorrect;
                          setMcqOptions(newOpts);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all shrink-0 ${opt.isCorrect ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-300'}`}
                      >
                        <Check className={`w-5 h-5 transition-transform ${opt.isCorrect ? 'scale-110' : 'scale-90'}`} />
                      </button>
                      <input 
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...mcqOptions];
                          newOpts[i].text = e.target.value;
                          setMcqOptions(newOpts);
                        }}
                        className={`flex-1 bg-slate-50 border ${opt.isCorrect ? 'border-green-100 focus:border-green-200' : 'border-slate-100 focus:border-blue-100'} rounded-2xl py-4 px-6 text-sm font-medium outline-none transition-all`}
                        placeholder={`Choice ${i+1}`}
                      />
                      {mcqOptions.length > 2 && (
                        <button 
                          onClick={() => setMcqOptions(mcqOptions.filter((_, idx) => idx !== i))} 
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all scale-90"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setMcqOptions([...mcqOptions, { text: '', isCorrect: false }])}
                  className="flex items-center gap-2 px-6 py-3 text-xs font-black text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all mt-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Option
                </button>
              </div>
            ) : (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between pl-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Test Case Configuration</label>
                   <p className="text-[10px] font-bold text-slate-400">Add at least one test case</p>
                </div>
                
                <div className="space-y-4">
                  {testCases.map((tc, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-[2rem] space-y-5 border border-slate-100 relative group/tc">
                      <div className="flex items-center justify-between">
                         <div className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400">
                           CASE #{i+1}
                         </div>
                         <button 
                           onClick={() => setTestCases(testCases.filter((_, idx) => idx !== i))} 
                           className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Example Input</span>
                           <textarea 
                            value={tc.input}
                            rows={2}
                            onChange={(e) => {
                              const newTcs = [...testCases];
                              newTcs[i].input = e.target.value;
                              setTestCases(newTcs);
                            }}
                            className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-xs font-mono outline-none focus:ring-4 focus:ring-blue-50/50 resize-none"
                            placeholder="Stdin..."
                          />
                        </div>
                        <div className="space-y-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Output</span>
                           <textarea 
                            value={tc.expectedOutput}
                            rows={2}
                            onChange={(e) => {
                              const newTcs = [...testCases];
                              newTcs[i].expectedOutput = e.target.value;
                              setTestCases(newTcs);
                            }}
                            className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-xs font-mono outline-none focus:ring-4 focus:ring-blue-50/50 resize-none"
                            placeholder="Stdout..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setTestCases([...testCases, { input: '', expectedOutput: '', isVisible: true }])}
                  className="flex items-center gap-2 px-6 py-3 text-xs font-black text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Test Case
                </button>
              </div>
            )}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row gap-4 border-t border-slate-100">
            <button 
              onClick={handleSave}
              className="flex-[2] py-4 bg-blue-600 text-white text-sm font-black rounded-2xl shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Check className="w-5 h-5" /> {editingId ? 'Save Changes' : 'Confirm Question'}
            </button>
            <button 
              onClick={resetForm}
              className="flex-1 py-4 border border-slate-200 text-slate-500 text-sm font-black rounded-2xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List of Questions */}
      <div className="space-y-6">
        {questions.length === 0 && !isAdding && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] py-20 text-center animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
               <HelpCircle className="w-10 h-10 text-slate-300" />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">Build your Question Bank</h4>
            <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto leading-relaxed px-4">
              Your exam has no questions yet. Use manual entry or bulk upload to get started.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6">
          {questions.map((q, i) => (
            <div key={q.id} className="group bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
               
               <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shrink-0">
                    {q.type === 'MCQ' ? <HelpCircle className="w-6 h-6" /> : <Code className="w-6 h-6" />}
                  </div>
                  
                   <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                         <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-blue-100/50">Question {i+1}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">{q.marks} Points</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                              q.difficulty === 'EASY' ? 'text-emerald-600 bg-emerald-50' :
                              q.difficulty === 'MEDIUM' ? 'text-amber-600 bg-amber-50' :
                              'text-rose-600 bg-rose-50'
                            }`}>
                               {q.difficulty}
                            </span>
                         </div>
                         <div className="flex items-center gap-2 lg:opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button onClick={() => startEdit(q)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 rounded-xl transition-all shadow-sm hover:shadow-md">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(q.id)} className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 rounded-xl transition-all shadow-sm hover:shadow-md">
                              <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                      
                      <h5 className="text-lg font-bold text-slate-800 leading-relaxed mb-6 block xl:whitespace-normal">
                        {q.text}
                      </h5>
                      
                      {q.type === 'MCQ' && q.mcqOptions && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {q.mcqOptions.map((opt, idx) => (
                             <div key={idx} className={`flex items-center gap-3 px-5 py-3 rounded-[1.25rem] border transition-all ${opt.isCorrect ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800 shadow-sm shadow-emerald-50' : 'bg-slate-50/30 border-slate-100 text-slate-500 opacity-60'}`}>
                                <div className={`w-2 h-2 rounded-full ${opt.isCorrect ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`} />
                                <span className="text-xs font-bold leading-tight truncate">{opt.text}</span>
                             </div>
                           ))}
                        </div>
                      )}
                      
                      {q.type === 'CODING' && q.testCases && (
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                              <div className="p-1 bg-white rounded-md shadow-sm">
                                 <Check className="w-3 h-3 text-blue-600" />
                              </div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{q.testCases.length} Test Cases Integrated</span>
                           </div>
                           <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              Auto-evaluation ready
                           </div>
                        </div>
                      )}
                   </div>
               </div>
            </div>
          ))}
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
