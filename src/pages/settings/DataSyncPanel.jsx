// src/pages/settings/DataSyncPanel.jsx
import React, { useState } from 'react';
import { CloudCheck, CloudAlert, HardDrive, RefreshCw, UploadCloud, DatabaseZap, Trash2 } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { supabaseProjectHost } from '../../lib/supabaseClient';
import { COLLECTION_TABLES } from '../../services/cloudSyncService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const ENV_SNIPPET = `VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>`;

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{children}</span>
    </div>
  );
}

function SetupGuide() {
  return (
    <Card
      title="Connect Supabase"
      subtitle="The ERP is running on local browser storage. Connect a Supabase project to persist data in a real Postgres database."
    >
      <ol className="space-y-4 text-xs text-slate-700">
        <li>
          <p className="font-semibold text-slate-900">1. Create the tables</p>
          <p className="mt-1 text-slate-500">
            In Supabase → SQL Editor, paste and run <code className="font-mono bg-slate-100 px-1 rounded">supabase/schema.sql</code>{' '}
            from this project.
          </p>
        </li>
        <li>
          <p className="font-semibold text-slate-900">2. Add your project keys</p>
          <p className="mt-1 text-slate-500">
            Create <code className="font-mono bg-slate-100 px-1 rounded">.env.local</code> in the project root (Project Settings → API):
          </p>
          <pre className="mt-2 bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-[11px] overflow-x-auto">{ENV_SNIPPET}</pre>
        </li>
        <li>
          <p className="font-semibold text-slate-900">3. Restart the dev server</p>
          <p className="mt-1 text-slate-500">
            Stop and re-run <code className="font-mono bg-slate-100 px-1 rounded">npm run dev</code>, then create an account on the
            login page — the first account becomes Admin. A new database starts empty, ready for your real data.
          </p>
        </li>
      </ol>
    </Card>
  );
}

export default function DataSyncPanel({ onRequestReset }) {
  const { dataSource, syncState, refreshFromCloud, pushAllToCloud, data } = usePharma();
  const [busy, setBusy] = useState(null);

  const counts = Object.keys(COLLECTION_TABLES).map((key) => [key, data[key]?.length || 0]);
  const totalRecords = counts.reduce((acc, [, n]) => acc + n, 0);

  if (dataSource !== 'supabase') {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SetupGuide />
        </div>
        <Card title="Current Source">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <HardDrive className="w-4 h-4" /> Local browser storage
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {totalRecords.toLocaleString()} records live only in this browser. Clearing site data or switching device loses them.
          </p>
        </Card>
      </div>
    );
  }

  const run = (key, fn) => async () => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const isError = syncState.status === 'error';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card
        title="Supabase Connection"
        subtitle="Every create, update and delete is written to Postgres as it happens."
        className="lg:col-span-2"
      >
        <div
          className={`flex items-start gap-3 rounded-lg px-3.5 py-3 ring-1 ${
            isError ? 'bg-rose-50 ring-rose-200' : 'bg-emerald-50 ring-emerald-200'
          }`}
        >
          {isError ? (
            <CloudAlert className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CloudCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <div className="text-xs">
            <p className={`font-semibold ${isError ? 'text-rose-800' : 'text-emerald-800'}`}>
              {isError ? 'Last sync failed' : 'Connected'}
            </p>
            <p className={isError ? 'text-rose-700 mt-0.5 break-all' : 'text-emerald-700 mt-0.5'}>
              {isError
                ? syncState.error
                : syncState.lastSyncedAt
                ? `Last synced at ${syncState.lastSyncedAt.toLocaleTimeString()}`
                : 'Waiting for first sync…'}
            </p>
            {isError && (
              <p className="text-rose-700 mt-1.5">
                Changes made since the error may not be in Supabase. Use “Push local data” to overwrite the database with what you
                see here, or “Reload” to discard local changes.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          <Row label="Project">
            <span className="font-mono">{supabaseProjectHost}</span>
          </Row>
          <Row label="Status">{syncState.status}</Row>
          <Row label="Records in app">{totalRecords.toLocaleString()}</Row>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={busy === 'reload'}
            disabled={!!busy}
            onClick={run('reload', () => refreshFromCloud())}
          >
            Reload from Supabase
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={UploadCloud}
            loading={busy === 'push'}
            disabled={!!busy}
            onClick={run('push', pushAllToCloud)}
          >
            Push local data
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} disabled={!!busy} onClick={() => onRequestReset('empty')}>
            Delete all data (start fresh)
          </Button>
          <Button variant="ghost" size="sm" icon={DatabaseZap} disabled={!!busy} onClick={() => onRequestReset('demo')}>
            Load demo data
          </Button>
        </div>
      </Card>

      <Card title="Tables" subtitle="Rows currently loaded per table">
        <div className="divide-y divide-slate-100 -my-2">
          {counts.map(([key, n]) => (
            <Row key={key} label={<span className="font-mono">{COLLECTION_TABLES[key]}</span>}>
              <span className="tabular-nums">{n.toLocaleString()}</span>
            </Row>
          ))}
        </div>
      </Card>
    </div>
  );
}
