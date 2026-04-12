'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !isLoaded) return;
    
    setLoading(true);
    try {
      await api.post('/api/auth/set-role', { role });
      
      if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (error) {
      console.error('Failed to set role:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-2">Welcome to SmartAssess</h1>
        <p className="text-gray-600 text-center mb-8">Choose your role to get started</p>
        
        <div className="space-y-4">
          <button
            onClick={() => setRole('teacher')}
            className={`w-full p-4 border-2 rounded-lg text-left transition ${
              role === 'teacher' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Teacher</div>
            <div className="text-sm text-gray-500">Create and manage exams</div>
          </button>
          
          <button
            onClick={() => setRole('student')}
            className={`w-full p-4 border-2 rounded-lg text-left transition ${
              role === 'student' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Student</div>
            <div className="text-sm text-gray-500">Take exams and view results</div>
          </button>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading || !isLoaded}
          className="w-full mt-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}