// src/components/common/Toast.jsx
import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

export default function ToastContainer() {
  const { toasts, removeToast } = usePharma();

  if (!toasts || toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-200 bg-white text-slate-800 shadow-lg',
    danger: 'border-rose-200 bg-white text-slate-800 shadow-lg',
    warning: 'border-amber-200 bg-white text-slate-800 shadow-lg',
    info: 'border-blue-200 bg-white text-slate-800 shadow-lg',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border transition-all transform translate-y-0 opacity-100 ${
            borderMap[toast.type] || borderMap.info
          }`}
        >
          {iconMap[toast.type] || iconMap.info}
          <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
