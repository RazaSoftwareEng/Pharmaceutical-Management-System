// src/pages/dashboard/SetupChecklist.jsx
// Go-live checklist shown until a new company has entered its core data.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Rocket, X } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

const DISMISS_KEY = 'pharmacore_setup_dismissed';

export function getSetupSteps(data) {
  const p = data.companyProfile || {};
  return [
    {
      key: 'company',
      title: 'Company profile & licences',
      text: 'Name, address, NTN/STRN and DRAP drug licence — printed on every invoice.',
      done: Boolean(p.name && p.drugLicenseNumber),
      to: '/settings',
      cta: 'Open settings',
    },
    {
      key: 'warehouse',
      title: 'Add your warehouse',
      text: 'Where your stock is stored and dispatched from.',
      done: data.warehouses.length > 0,
      to: '/warehouses',
      cta: 'Add warehouse',
    },
    {
      key: 'medicines',
      title: 'Register your products',
      text: 'Medicines with TP, MRP, bonus scheme and reorder level.',
      done: data.medicines.length > 0,
      to: '/medicines',
      cta: 'Add medicines',
    },
    {
      key: 'stock',
      title: 'Enter opening stock',
      text: 'Batch number, expiry and quantity of what is on the shelves today.',
      done: data.batches.length > 0,
      to: '/batches',
      cta: 'Add opening stock',
    },
    {
      key: 'suppliers',
      title: 'Add suppliers',
      text: 'Manufacturers and vendors you buy from, with opening payables.',
      done: data.suppliers.length > 0,
      to: '/suppliers',
      cta: 'Add suppliers',
    },
    {
      key: 'customers',
      title: 'Add customers',
      text: 'Chemists, hospitals and distributors — with credit limit and opening balance.',
      done: data.customers.length > 0,
      to: '/customers',
      cta: 'Add customers',
    },
    {
      key: 'team',
      title: 'Set up your sales team',
      text: 'Mark employees as field salesmen with territory and monthly target.',
      done: data.employees.some((e) => e.isSalesRep),
      to: '/employees',
      cta: 'Add salesmen',
      optional: true,
    },
    {
      key: 'order',
      title: 'Book your first sales order',
      text: 'FEFO picks batches automatically and the invoice is generated.',
      done: data.salesOrders.length > 0,
      to: '/sales/orders',
      cta: 'New sales order',
    },
  ];
}

export default function SetupChecklist() {
  const { data, currentUserRole } = usePharma();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const steps = getSetupSteps(data);
  const required = steps.filter((s) => !s.optional);
  const doneCount = steps.filter((s) => s.done).length;
  const allRequiredDone = required.every((s) => s.done);
  if (allRequiredDone || dismissed || currentUserRole !== 'Admin') return null;

  const next = steps.find((s) => !s.done);

  return (
    <section className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-lg bg-teal-600 text-white grid place-items-center shrink-0">
            <Rocket className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Set up your company</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {doneCount} of {steps.length} steps done. Complete these once and the dashboard fills with your real numbers.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            try {
              localStorage.setItem(DISMISS_KEY, '1');
            } catch {
              // ignore
            }
          }}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white"
          aria-label="Hide setup checklist"
          title="Hide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 h-1.5 rounded-full bg-teal-100 overflow-hidden">
        <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((s, i) => {
          const isNext = next?.key === s.key;
          return (
            <li key={s.key}>
              <button
                onClick={() => navigate(s.to)}
                className={`group w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  isNext ? 'bg-white ring-2 ring-teal-500 shadow-sm' : 'bg-white/60 ring-1 ring-slate-200 hover:ring-teal-300'
                }`}
              >
                {s.done ? (
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                )}
                <span className="flex-1 min-w-0">
                  <span className={`block text-xs font-semibold ${s.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {i + 1}. {s.title}
                    {s.optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
                  </span>
                  {!s.done && <span className="block text-[11px] text-slate-500 mt-0.5">{s.text}</span>}
                </span>
                {!s.done && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {s.cta} <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
