"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Send, UploadCloud, Info, FileDown,
  Clock, Award, Percent, PlusCircle, FileUp,
  Search, Users, CheckCircle, XCircle, Zap, Target
} from "lucide-react";

import { examApi, Exam, type QuestionPayload } from "@/lib/api/examApi";
import { type Assessment, type AssessmentFormData, type QuestionDraft } from "@/types";
import { QuestionCard } from "@/components/ui/QuestionCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/* ── tiny uid ── */
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultQuestion(): QuestionDraft {
  return {
    tempId: uid(),
    order: 0,
    text: "",
    type: "MCQ",
    options: { a: "", b: "", c: "", d: "" },
    testCases: [],
    correctAnswer: "a",
    points: 5,
  };
}

interface AssessmentFormProps {
  initial?: Assessment;
}

export function AssessmentForm({ initial }: AssessmentFormProps) {
  const router = useRouter();

  // Basic Details
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState<string>(String(initial?.duration ?? "60"));
  const [startTime, setStartTime] = useState<string>(
    initial?.startTime ? new Date(initial.startTime).toISOString().slice(0, 16) : ""
  );
  const [endTime, setEndTime] = useState<string>(
    initial?.endTime ? new Date(initial.endTime).toISOString().slice(0, 16) : ""
  );
  const [negativeMarking, setNegativeMarking] = useState<boolean>(
    initial?.negativeMarking ?? false
  );
  const [passPercent, setPassPercent] = useState<number>(initial?.passPercent ?? 40);

  // Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initial?.questions?.map((q) => {
      // Map existing MCQ options back to a,b,c,d object if applicable
      const options = { a: "", b: "", c: "", d: "" };
      let correctAnswer = "a";
      if (q.type === 'MCQ' && q.mcqOptions) {
        q.mcqOptions.slice(0, 4).forEach((opt, idx) => {
          const key = ['a', 'b', 'c', 'd'][idx] as keyof typeof options;
          options[key] = opt.text;
          if (opt.isCorrect) correctAnswer = key;
        });
      }

      return {
        tempId: uid(),
        id: q.id, // Keep track of existing IDs
        order: q.order,
        text: q.text,
        type: q.type === 'CODING' ? 'CODE' : 'MCQ',
        options,
        testCases: q.testCases?.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isVisible: tc.isVisible })) ?? [],
        correctAnswer,
        points: q.marks,
      };
    }) ?? [defaultQuestion()]
  );

  // Student Assignment
  const [studentSearch, setStudentSearch] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);
  
  const { data: allStudents, isLoading: loadingStudents } = useSWR(
    ['students', showAllUsers],
    () => examApi.listStudents({ showAll: showAllUsers }).then(res => res.data)
  );
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Initialize selected students for edit mode
  useEffect(() => {
    if (initial?.id) {
       examApi.getAssignments(initial.id).then(res => {
         setSelectedStudents(res.data.map(a => a.studentId));
       });
    }
  }, [initial?.id]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initial;

  // ── Question helpers ────────────────────────────────────────────
  const addQuestion = () =>
    setQuestions((prev) => [...prev, { ...defaultQuestion(), order: prev.length }]);

  const updateQuestion = (tempId: string, updated: QuestionDraft) =>
    setQuestions((prev) => prev.map((q) => (q.tempId === tempId ? updated : q)));

  const deleteQuestion = (tempId: string) =>
    setQuestions((prev) => prev.filter((q) => q.tempId !== tempId).map((q, i) => ({ ...q, order: i })));

  const processImportedData = (data: any[]) => {
    const imported: QuestionDraft[] = data.map((row, idx) => {
      const type = (row.Type || row.type || "MCQ").toUpperCase() === "CODE" ? "CODE" : "MCQ";
      let testCases = [];
      try {
        if (row['Test Cases (JSON)'] || row.testCases) {
          testCases = JSON.parse(row['Test Cases (JSON)'] || row.testCases);
        }
      } catch (e) { console.error("Test Case Parse Err", e); }

      return {
        tempId: crypto.randomUUID(),
        order: questions.length + idx,
        text: row.Text || row.text || "Imported Question",
        type: type as "MCQ" | "CODE",
        options: {
          a: row['Option A'] || row.optionA || "",
          b: row['Option B'] || row.optionB || "",
          c: row['Option C'] || row.optionC || "",
          d: row['Option D'] || row.optionD || "",
        },
        testCases,
        correctAnswer: (row['Correct Answer'] || row.correctAnswer || "a").toLowerCase(),
        points: parseInt(row.Points || row.points || "5"),
      };
    });
    setQuestions(prev => [...prev, ...imported]);
    toast.success(`Successfully imported ${imported.length} questions!`);
  };

  const moveUp = (idx: number) =>
    setQuestions((prev) => {
      if (idx <= 0) return prev;
      const arr = [...prev];
      const tmp = arr[idx - 1]!;
      arr[idx - 1] = arr[idx]!;
      arr[idx] = tmp;
      return arr.map((q, i) => ({ ...q, order: i }));
    });

  const moveDown = (idx: number) =>
    setQuestions((prev) => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      const tmp = arr[idx]!;
      arr[idx] = arr[idx + 1]!;
      arr[idx + 1] = tmp;
      return arr.map((q, i) => ({ ...q, order: i }));
    });

  // ── Submit ──────────────────────────────────────────────────────
  async function handleSubmit(publish: boolean) {
    setError(null);
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (questions.length === 0) { toast.error("Add at least one question."); return; }

    const examPayload = {
      title: title.trim(),
      description: description.trim(),
      duration: parseInt(duration) || 60,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      endTime: endTime ? new Date(endTime).toISOString() : null,
      totalMarks: questions.reduce((sum, q) => sum + q.points, 0),
      passPercent,
      negativeMarking,
    };

    setSaving(true);
    try {
      let examId = initial?.id;

      if (isEdit && initial) {
        await examApi.update(initial.id, examPayload);
      } else {
        const created = await examApi.create(examPayload);
        examId = created.data.id;
      }

      if (!examId) throw new Error("No exam ID generated");

      // Sync Questions
      // To simplify, we'll clear current questions and bulk add new ones or update sequentially
      // But clearing might lose result data if results exist.
      // Better approach: Since this is "Unified", we assume the user is managing the set.
      // For now, let's use the bulk addition or individual updates.
      // Actually, let's use individual updates for existing and create for new.
      
      const questionPayloads: QuestionPayload[] = questions.map(q => ({
        type: q.type === 'CODE' ? 'CODING' : 'MCQ',
        text: q.text,
        marks: q.points,
        order: q.order,
        mcqOptions: q.type === 'MCQ' ? Object.entries(q.options)
          .filter(([_, text]) => text.trim())
          .map(([key, text]) => ({
            text,
            isCorrect: q.correctAnswer === key
          })) : undefined,
        testCases: q.type === 'CODE' ? q.testCases.map(tc => ({
          input: tc.input || "",
          expectedOutput: tc.expectedOutput || "",
          isVisible: tc.isVisible ?? true
        })) : undefined
      }));

      if (questionPayloads.length > 0) {
        await examApi.syncQuestions(examId, questionPayloads);
      }

      // Sync Assignments
      if (selectedStudents.length > 0) {
        await examApi.assignStudents(examId, selectedStudents);
      }

      if (publish) {
        await examApi.publish(examId);
        toast.success("Exam published successfully!");
      } else {
        toast.success("Draft saved successfully!");
      }

      router.push(`/teacher/exams`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assessment.");
      toast.error("Error saving assessment.");
    } finally {
      setSaving(false);
    }
  }

  // ── Import Logic etc (same as user provided) ─────────────────────
  // ... (keeping user's papaparse/xlsx logic) ...

  const filteredStudents = allStudents?.filter((s: any) => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-in fade-in duration-500 pb-32">
       {/* Error banner */}
       {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* ── Section 1: Assessment Identity ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 w-full"></div>
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                {isEdit ? "Update Assessment" : "Create Assessment"}
              </h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Configure core parameters and settings</p>
            </div>
            
            {isEdit && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Editing Mode</span>
                </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assessment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data Structures Midterm"
                className="w-full h-11 px-6 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-base font-bold text-slate-900"
              />
            </div>
            
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for students..."
                rows={2}
                className="w-full p-6 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Min)</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Marks</label>
              <div className="relative">
                <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <div className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-100 flex items-center font-black text-slate-500 text-sm">
                  {questions.reduce((sum, q) => sum + q.points, 0)} pts
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pass %</label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                 <input
                  type="number"
                  value={passPercent}
                  onChange={(e) => setPassPercent(parseInt(e.target.value) || 0)}
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Starts At</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-11 px-6 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ends At</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-11 px-6 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                  />
               </div>
            </div>

            <div className="md:col-span-3 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 transition-colors hover:border-slate-300">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${negativeMarking ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 tracking-tight">Negative Marking</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Deducts 1/4 marks for errors</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNegativeMarking(!negativeMarking)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${negativeMarking ? 'bg-rose-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${negativeMarking ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Question Curriculum ────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                 <Target className="h-4 w-4" />
              </div>
              <div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Curriculum Builder</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{questions.length} Challenges</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => {
                   const csvContent = "data:text/csv;charset=utf-8,Text,Type,Points,Option A,Option B,Option C,Option D,Correct Answer,Test Cases (JSON)\nSample MCQ,MCQ,5,Ans1,Ans2,Ans3,Ans4,a,\nSample Code,CODE,10,,,,,,\"[{'input':'1','output':'1','visible':true}]\"";
                   const encodedUri = encodeURI(csvContent);
                   const link = document.createElement("a");
                   link.setAttribute("href", encodedUri);
                   link.setAttribute("download", "template.csv");
                   document.body.appendChild(link);
                   link.click();
                   document.body.removeChild(link);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
              >
                 <FileDown className="h-3 w-3" />
                 Template
              </button>
              
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-sm cursor-pointer">
                 <FileUp className="h-3 w-3" />
                 Bulk Import
                 <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

                      if (isExcel) {
                        reader.onload = (evt) => {
                          const bstr = evt.target?.result;
                          const wb = XLSX.read(bstr, { type: 'binary' });
                          const wsname = wb.SheetNames[0];
                          const ws = wb.Sheets[wsname];
                          const data = XLSX.utils.sheet_to_json(ws);
                          processImportedData(data);
                        };
                        reader.readAsBinaryString(file);
                      } else {
                        Papa.parse(file, {
                          header: true,
                          skipEmptyLines: true,
                          complete: (results) => {
                            processImportedData(results.data);
                          }
                        });
                      }
                    }}
                 />
              </label>
           </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.tempId}
              question={q}
              index={idx}
              total={questions.length}
              onChange={(updated) => updateQuestion(q.tempId, updated)}
              onDelete={() => deleteQuestion(q.tempId)}
              onMoveUp={() => moveUp(idx)}
              onMoveDown={() => moveDown(idx)}
            />
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="font-black uppercase tracking-widest text-[10px]">Add Next Challenge</span>
          </button>
        </div>
      </div>

      {/* ── Section 3: Student Assignment ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                 <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Candidate Allocation</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select specific users for deployment</p>
              </div>
           </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                 <input 
                   type="text"
                   value={studentSearch}
                   onChange={(e) => setStudentSearch(e.target.value)}
                   placeholder="Search candidates..."
                   className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-900"
                 />
              </div>
              
              <button
                type="button"
                onClick={() => setShowAllUsers(!showAllUsers)}
                className={`h-11 px-4 rounded-xl border flex items-center gap-2 transition-all ${showAllUsers ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <Users className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  {showAllUsers ? 'All Residents' : 'Students Only'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
               {loadingStudents ? (
                 [1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />)
               ) : filteredStudents?.length === 0 ? (
                  <div className="col-span-full py-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                     <Users className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No candidates found</p>
                     <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase">Ask students to sign in to SmartAssess to appear here.</p>
                  </div>
               ) : filteredStudents?.map((student: any) => (
                 <button
                   key={student.id}
                   type="button"
                   onClick={() => setSelectedStudents(prev => 
                      prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]
                   )}
                   className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${selectedStudents.includes(student.id) ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                 >
                    <div className="min-w-0">
                       <p className="text-xs font-black text-slate-900 truncate">{student.name}</p>
                       <p className="text-[9px] font-bold text-slate-400 truncate">{student.email}</p>
                    </div>
                    {selectedStudents.includes(student.id) ? (
                       <CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />
                    ) : (
                       <div className="h-4 w-4 rounded-full border-2 border-slate-200 shrink-0" />
                    )}
                 </button>
              ))}
           </div>
           
           <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedStudents.length} Selected</p>
              <button 
                type="button" 
                onClick={() => setSelectedStudents(allStudents?.map((s: any) => s.id) || [])}
                className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
              >
                 Select All Residents
              </button>
           </div>
        </div>
      </div>

      {/* ── Section 4: Actions (Sticky Footer) ───────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-5xl z-50 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-4 px-3">
           <div className="hidden md:flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Configuration</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <span className="text-xs font-black text-slate-900">Validated</span>
              </div>
           </div>
           <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loadout</span>
              <span className="text-xs font-black text-slate-900">{questions.length} Items</span>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(false)}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-black text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            Draft Store
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <LoadingSpinner size="sm" className="border-white" /> : <Send className="h-3.5 w-3.5" />}
            {saving ? "Deploying..." : (isEdit ? "Update System" : "Go Live")}
          </button>
        </div>
      </div>
    </div>
  );
}
