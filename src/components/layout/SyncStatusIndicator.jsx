// src/components/layout/SyncStatusIndicator.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CloudCheck, CloudAlert, Loader2, HardDrive } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

const STATES = {
  local: { Icon: HardDrive, label: 'Local browser storage', cls: 'text-amber-700 bg-amber-50 ring-amber-200' },
  loading: { Icon: Loader2, label: 'Loading from Supabase…', cls: 'text-slate-600 bg-white ring-slate-200', spin: true },
  syncing: { Icon: Loader2, label: 'Saving to Supabase…', cls: 'text-slate-600 bg-white ring-slate-200', spin: true },
  synced: { Icon: CloudCheck, label: 'Synced · Supabase', cls: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  error: { Icon: CloudAlert, label: 'Sync error', cls: 'text-rose-700 bg-rose-50 ring-rose-200' },
};

export default function SyncStatusIndicator() {
  const { syncState } = usePharma();
  const s = STATES[syncState.status] || STATES.local;
  const title =
    syncState.status === 'error'
      ? syncState.error
      : syncState.lastSyncedAt
      ? `Last synced ${syncState.lastSyncedAt.toLocaleTimeString()}`
      : undefined;

  return (
    <Link
      to="/settings"
      state={{ tab: 'data' }}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 shadow-2xs hover:brightness-95 ${s.cls}`}
    >
      <s.Icon className={`w-3.5 h-3.5 ${s.spin ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{s.label}</span>
    </Link>
  );
}
