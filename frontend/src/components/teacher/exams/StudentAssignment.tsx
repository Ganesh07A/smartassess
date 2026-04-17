'use client';
import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, 
  Mail, Check, X, ShieldCheck,
  UserCircle, ExternalLink
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

  const filteredAssignments = assignments.filter(a => 
    a.student.name.toLowerCase().includes(search.toLowerCase()) || 
    a.student.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-1">Assigned Candidates</h2>
          <p className="text-sm font-medium text-slate-400">Manage which students have access to this assessment.</p>
        </div>
        <button 
           disabled
           className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-400 text-xs font-black rounded-2xl cursor-not-allowed uppercase tracking-widest transition-all"
        >
          <UserPlus className="w-4 h-4" /> Batch Assign
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 bg-slate-50/50 border-b border-slate-200">
           <div className="relative max-w-md">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search candidates by name or email..."
               className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-medium focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all"
             />
           </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Candidates...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-slate-200" />
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2">No Candidates Assigned</h4>
              <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto mb-8">
                Currently, no students have been granted access to this exam.
              </p>
              <button 
                disabled
                className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                Assign Registered Students
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                   <tr>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-100 uppercase">
                            {a.student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{a.student.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Student ID: {a.student.id.slice(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-slate-500">{a.student.email}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end">
                           <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                             <ShieldCheck className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-black uppercase tracking-tight">Active Access</span>
                           </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex items-start gap-6 relative overflow-hidden group">
         <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600 shrink-0 relative z-10">
            <UserCircle className="w-6 h-6" />
         </div>
         <div className="relative z-10">
            <h4 className="text-sm font-black text-blue-900 mb-1">Assessment Distribution</h4>
            <p className="text-xs font-medium text-blue-700 leading-relaxed max-w-xl">
               Only assigned students will see this assessment in their dashboard. 
               You can revork access at any time before they start the attempt.
            </p>
         </div>
         <div className="absolute right-[-2%] bottom-[-20%] text-blue-600 opacity-[0.03] rotate-12">
            <Users className="w-48 h-48" />
         </div>
      </div>
    </div>
  );
}
