'use client';

import React from 'react';
import { StudentReportGenerator } from '../../lib/pdf/StudentReportGenerator';
import { mockDetailedResult } from '../../lib/pdf/mockData';
import { FileDown, ShieldCheck } from 'lucide-react';

export const DownloadButtons: React.FC = () => {
  const handleDownloadStudent = () => {
    const generator = new StudentReportGenerator();
    generator.downloadStudentReport(
      mockDetailedResult, 
      `Result_${mockDetailedResult.candidate.prn}_Premium.pdf`
    );
  };

  const handleDownloadOfficial = () => {
    const generator = new StudentReportGenerator();
    generator.downloadOfficialRecord(
      mockDetailedResult, 
      `Official_Record_${mockDetailedResult.candidate.prn}.pdf`
    );
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md mx-auto my-10">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-2">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Result Engine</h3>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Verified Marksheet & Analysis</p>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 leading-relaxed mb-2">
        Download your official academic records for <strong>{mockDetailedResult.candidate.name}</strong>. These reports are digitally signed and authenticated.
      </p>
      
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={handleDownloadStudent}
          className="group relative flex items-center justify-between gap-2 px-5 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-gray-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <FileDown className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <span className="block text-sm">Download Premium Report</span>
              <span className="block text-[10px] text-gray-400 font-normal uppercase">Verified Student Dashboard Format</span>
            </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </button>

        <button
          onClick={handleDownloadOfficial}
          className="flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-100 rounded-xl font-semibold transition-all active:scale-[0.98]"
        >
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <div className="text-left">
            <span className="block text-sm text-gray-900">Official Teacher Record</span>
            <span className="block text-[10px] text-gray-400 font-normal uppercase">Standard Tabular Format</span>
          </div>
        </button>
      </div>
      
      <div className="mt-2 text-center">
        <p className="text-[10px] text-gray-400 font-medium">Ref: user_3COTvegZ2AFQi2QqcayEcCHPLqY</p>
      </div>
    </div>
  );
};
