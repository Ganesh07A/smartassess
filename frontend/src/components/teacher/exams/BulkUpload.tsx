import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet, X, ArrowRight } from 'lucide-react';
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
      toast.success('File parsed successfully!');
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

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setParsedQuestions(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-12 lg:p-20 border-3 border-dashed rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50/50 scale-[0.99] ring-8 ring-blue-50' 
            : 'border-slate-200 bg-slate-50/30 hover:bg-white hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-50/50'
        }`}
      >
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 ${
          isDragOver 
            ? 'bg-blue-600 text-white rotate-12 scale-110 shadow-xl shadow-blue-200' 
            : 'bg-white text-slate-400 shadow-sm border border-slate-100 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-600'
        }`}>
          <UploadCloud className="w-10 h-10" />
        </div>
        
        <div className="text-center">
           <p className="text-lg font-black text-slate-900 mb-2">
             {isDragOver ? 'Drop CSV here' : 'Select a CSV file to upload'}
           </p>
           <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto mb-8">
             Drag and drop your question spreadsheet here or click to browse.
           </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
           <a 
              href="/templates/questions_template.csv"
              download
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-xs font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download Sample Template
            </a>
        </div>

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
        <div className={`p-8 rounded-[2.5rem] border-2 animate-in zoom-in-95 duration-300 ${
          parsedQuestions.length > 0 
            ? 'bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-50' 
            : 'bg-amber-50 border-amber-100 shadow-xl shadow-amber-50'
        }`}>
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              parsedQuestions.length > 0 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              {parsedQuestions.length > 0 ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-lg font-black ${parsedQuestions.length > 0 ? 'text-emerald-900' : 'text-amber-900'}`}>
                  {parsedQuestions.length > 0 ? 'Ready for Import' : 'No valid data found'}
                </h4>
                <button onClick={clearFile} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <p className={`text-sm font-medium opacity-80 ${parsedQuestions.length > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {parsedQuestions.length > 0 
                  ? `We've detected ${parsedQuestions.length} valid questions in your file.` 
                  : 'We couldn\'t find any questions matching the required format.'}
              </p>
            </div>

            {parsedQuestions.length > 0 && (
              <button 
                disabled={isUploading}
                onClick={(e) => { e.stopPropagation(); onImportQuestions(parsedQuestions); }}
                className="hidden md:flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-95"
              >
                {isUploading ? 'Importing...' : 'Finalize Import'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {parsedQuestions.length > 0 && (
            <button 
              disabled={isUploading}
              onClick={(e) => { e.stopPropagation(); onImportQuestions(parsedQuestions); }}
              className="w-full mt-6 md:hidden flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
            >
              {isUploading ? 'Importing...' : `Import ${parsedQuestions.length} Questions`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
