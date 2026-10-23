// src/components/common/Badge.jsx
import React from 'react';

const BADGE_STYLES = {
  // Quality & Batches
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Near Expiry': 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
  Expired: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  Quarantined: 'bg-purple-50 text-purple-700 border-purple-200',
  Recalled: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',

  // Order & Invoice Statuses
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  'Pending Approval': 'bg-sky-50 text-sky-700 border-sky-200',
  Approved: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
  Received: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-slate-100 text-slate-500 border-slate-200 line-through',
  Processed: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Payment Statuses
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Partially Paid': 'bg-amber-50 text-amber-700 border-amber-200',
  Unpaid: 'bg-red-50 text-red-700 border-red-200',
  Overdue: 'bg-rose-100 text-rose-800 border-rose-300',

  // General Status
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  Danger: 'bg-red-50 text-red-700 border-red-200',
  Warning: 'bg-amber-50 text-amber-700 border-amber-200',
  Success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function Badge({ children, status, variant, className = '' }) {
  const resolvedStatus = status || children || 'Draft';
  const style = BADGE_STYLES[variant || resolvedStatus] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {children || status}
    </span>
  );
}
