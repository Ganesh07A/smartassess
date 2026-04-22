'use client';

import { useState } from 'react';
import { studentApi } from '@/lib/api/studentApi';
import toast from 'react-hot-toast';
import { User, School, GraduationCap, ArrowRight } from 'lucide-react';

interface ProfileCompletionModalProps {
  user: any;
  onComplete: () => void;
}

export function ProfileCompletionModal({ user, onComplete }: ProfileCompletionModalProps) {
  const [prn, setPrn] = useState('');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const isComplete = user?.prn && user?.year && user?.department;
  if (isComplete) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prn || !year || !department) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await studentApi.updateProfile({ prn, year, department });
      toast.success('Profile updated successfully');
      onComplete();
    } catch (err: any) {
      toast.error(err.displayMessage || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">

      {/* MODAL */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200">

        {/* HEADER */}
        <div className="px-6 py-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Complete your profile
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Required for generating official marksheets and records
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* PRN */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              PRN
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
                placeholder="Enter PRN"
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* YEAR */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Academic Year
            </label>
            <div className="relative mt-1">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select year</option>
                <option value="FE">First Year (FE)</option>
                <option value="SE">Second Year (SE)</option>
                <option value="TE">Third Year (TE)</option>
                <option value="BE">Final Year (BE)</option>
              </select>
            </div>
          </div>

          {/* DEPARTMENT */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Department
            </label>
            <div className="relative mt-1">
              <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Engineering"
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* INFO */}
          <div className="bg-gray-50 border rounded-md p-3 text-xs text-gray-600">
            This information is used for generating official academic records.
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition disabled:opacity-70"
          >
            {loading ? 'Saving...' : (
              <span className="flex items-center justify-center gap-2">
                Save & Continue
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}