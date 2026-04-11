'use client';
import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, 
  Mail, Check, X, ShieldCheck 
} from 'lucide-react';
import { ExamAssignment, examApi } from '@/lib/api/examApi';
import toast from 'react-hot-toast';

interface StudentAssignmentProps {
  examId: string;
}

export function StudentAssignment({ examId }: StudentAssignmentProps) {
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAssignments = async () => {
    try {
      const res = await examApi.getAssignments(examId);
      setAssignments(res.data);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load assignments');
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [examId]);

  // For the MVP, we assume students are already registered.
  // In a real app, you might search for users not yet assigned.
  // For now, let's just show the assigned students and a placeholder for adding more.

  const totalAssigned = assignments.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Assigned Students ({totalAssigned})</h2>
        <button 
           disabled
           className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4" /> Invite via Email
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search assigned students..."
               className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all"
             />
           </div>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-400">No students assigned yet.</p>
            </div>
          ) : (
            assignments.filter(a => a.student.name.toLowerCase().includes(search.toLowerCase()) || a.student.email.toLowerCase().includes(search.toLowerCase())).map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-black text-xs">
                    {a.student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{a.student.name}</h4>
                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {a.student.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full">
                     <ShieldCheck className="w-3 h-3" />
                     <span className="text-[10px] font-black uppercase tracking-tight">Access Granted</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
         <h4 className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-2">
            <Check className="w-4 h-4" /> Quick Tip
         </h4>
         <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
            Students must be registered in the platform before you can assign them to this exam. Once assigned, they will see the exam in their student dashboard when it becomes active.
         </p>
      </div>
    </div>
  );
}
