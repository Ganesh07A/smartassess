import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#131b2e]/60 backdrop-blur-md transition-opacity" 
        onClick={onCancel}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(19,27,46,0.25)] border border-white/50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="p-8 sm:p-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <button 
              onClick={onCancel}
              className="p-2 text-[#777587] hover:text-[#131b2e] hover:bg-[#f2f3ff] rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#131b2e] tracking-tight">{title}</h3>
            <p className="text-sm font-medium text-[#464555] leading-relaxed">
              {message}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-[#777587] bg-[#f2f3ff] hover:bg-[#eaedff] rounded-2xl transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-white rounded-2xl transition-all shadow-lg ${
                isDestructive 
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-200' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-100'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
