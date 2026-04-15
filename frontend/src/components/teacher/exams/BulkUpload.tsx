import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { QuestionPayload } from '@/lib/api/examApi';
import { parseQuestionsCSV } from '@/utils/csvParser';
import toast from 'react-hot-toast';

interface BulkUploadProps {
  onImportQuestions: (questions: QuestionPayload[]) => void;
  isUploading: boolean;
}

export function BulkUpload({ onImportQuestions, isUploading }: BulkUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<QuestionPayload[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Only CSV files are supported');
      return;
    }

    try {
      const questions = await parseQuestionsCSV(file);
      setParsedQuestions(questions);
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse CSV');
      setParsedQuestions(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          Upload multiple questions instantly using a CSV file.
        </p>
        <a 
          href="/templates/questions_template.csv"
          download
          className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" /> Download Template
        </a>
      </div>

      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-12 lg:p-16 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${isDragOver ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'}`}
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 shadow-sm'}`}>
          <UploadCloud className="w-8 h-8" />
        </div>
        <p className="text-base font-bold text-slate-800 mb-1">
          Drop your CSV file here
        </p>
        <p className="text-xs font-medium text-slate-400">
          or click to browse your files
        </p>
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
          }}
        />
      </div>

      {parsedQuestions !== null && (
        <div className={`p-4 rounded-2xl flex flex-col gap-4 border ${parsedQuestions.length > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex items-center gap-3">
            {parsedQuestions.length > 0 ? <CheckCircle className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-amber-600" />}
            <div>
              <p className={`text-sm font-bold ${parsedQuestions.length > 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                {parsedQuestions.length > 0 ? 'Looks Good!' : 'No valid questions found'}
              </p>
              <p className={`text-xs font-medium opacity-80 ${parsedQuestions.length > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {parsedQuestions.length > 0 ? `Successfully parsed ${parsedQuestions.length} ${parsedQuestions.length === 1 ? 'question' : 'questions'} ready for import.` : 'Check the CSV formatting and try again.'}
              </p>
            </div>
            {parsedQuestions.length > 0 && (
              <button 
                disabled={isUploading}
                onClick={() => onImportQuestions(parsedQuestions)}
                className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
              >
                {isUploading ? 'Importing...' : `Import ${parsedQuestions.length} Questions`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
