"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { studentApi } from "@/lib/api/studentApi";
import toast from "react-hot-toast";
import { 
  UserCircle2, GraduationCap, Building2, 
  Fingerprint, ArrowRight, ShieldCheck,
  CheckCircle2, Sparkles
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    prn: "",
    year: "FE",
    department: "",
  });

  useEffect(() => {
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      }));
    }
  }, [isLoaded, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.prn || !formData.department) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await studentApi.completeOnboarding(formData);
      toast.success("Profile completed successfully!");
      router.push("/student/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="h-screen w-full flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3" />
            Profile Completion Required
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Finalize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Academic Profile</span>
          </h1>
          <p className="text-slate-400 font-medium">
            We need a few more details to generate your official reports and marksheets.
          </p>
        </div>

        <form 
          onSubmit={handleSubmit}
          className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500"
        >
          <div className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <UserCircle2 className="w-3 h-3 text-blue-400" />
                Full Legal Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full h-14 bg-slate-950/50 border border-slate-800 rounded-2xl px-6 text-white font-bold placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all group-hover:border-slate-700"
              />
            </div>

            {/* PRN / ID */}
            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Fingerprint className="w-3 h-3 text-blue-400" />
                University PRN / Student ID
              </label>
              <input
                type="text"
                value={formData.prn}
                onChange={(e) => setFormData({ ...formData, prn: e.target.value })}
                placeholder="e.g. 72101234G"
                className="w-full h-14 bg-slate-950/50 border border-slate-800 rounded-2xl px-6 text-white font-bold placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all group-hover:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Year */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <GraduationCap className="w-3 h-3 text-blue-400" />
                  Academic Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full h-14 bg-slate-950/50 border border-slate-800 rounded-2xl px-6 text-white font-bold appearance-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all group-hover:border-slate-700"
                >
                  <option value="FE" className="bg-slate-900">First Year (FE)</option>
                  <option value="SE" className="bg-slate-900">Second Year (SE)</option>
                  <option value="TE" className="bg-slate-900">Third Year (TE)</option>
                  <option value="BE" className="bg-slate-900">Final Year (BE)</option>
                </select>
              </div>

              {/* Department */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-blue-400" />
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. CSE, IT"
                  className="w-full h-14 bg-slate-950/50 border border-slate-800 rounded-2xl px-6 text-white font-bold placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all group-hover:border-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="border-white" />
              ) : (
                <>
                  Establish Identity
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 py-4 border-t border-slate-800/50">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Secured Connection
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Verified Profile
            </div>
          </div>
        </form>

        <p className="text-center mt-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
          SmartAssess Intelligence Network &copy; 2026
        </p>
      </div>
    </div>
  );
}
