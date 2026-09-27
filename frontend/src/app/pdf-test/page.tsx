import React from 'react';
import { DownloadButtons } from '../../components/pdf/DownloadButtons';

export default function PDFTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">SmartAssess Report Engine</h1>
        <p className="text-gray-600">This is a development preview page to test the PDF generation functionality.</p>
      </div>
      
      <DownloadButtons />
      
      <div className="mt-8 text-center text-xs text-gray-400">
        <p>Ensure your local dev server is running (<code>npm run dev</code>)</p>
        <p className="mt-1">Then visit: <code className="bg-gray-100 px-1 rounded">http://localhost:3000/pdf-test</code></p>
      </div>
    </div>
  );
}
