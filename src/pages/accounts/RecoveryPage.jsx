// src/pages/accounts/RecoveryPage.jsx
import React, { useMemo, useState } from 'react';
import { HandCoins, AlertTriangle, CalendarX2, Wallet, MessageCircle, Search, Download, Plus } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import {
  formatCurrency,
  formatCompactCurrency,
  buildWhatsAppLink,
  exportToCSV,
} from '../../services/pharmaService';
import { AGING_BUCKETS, buildCustomerAging, sumBuckets, todayKey } from '../../services/commercialAnalytics';
import { TERRITORIES } from '../../data/commercialSeed';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import RecordPaymentModal from './RecordPaymentModal';

const BUCKET_COLORS = {
  notDue: 'bg-slate-300',
  d1_30: 'bg-amber-300',
  d31_60: 'bg-amber-500',
  d61_90: 'bg-orange-600',
  d90p: 'bg-rose-600',
};

const selectCls =
  'text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white';

function reminderMessage(row, company) {
  const c = row.customer;
  return [
    `Assalam-o-Alaikum ${c.contactPerson || c.name},`,
    '',
    `This is a payment reminder from ${company.tradeName || company.name}.`,
    `Outstanding balance: *${formatCurrency(row.outstanding)}*`,
    row.overdue > 0 ? `Overdue amount: *${formatCurrency(row.overdue)}* (oldest ${row.oldestDaysOverdue} days past due)` : '',
    '',
    'Kindly arrange payment at your earliest convenience. If already paid, please share the payment reference.',
    '',
    'Thank you.',
  ]
    .filter((line, i, arr) => line !== '' || arr[i - 1] !== '')
    .join('\n');
}

export default function RecoveryPage() {
  const { data } = usePharma();
  const [query, setQuery] = useState('');
  const [territory, setTerritory] = useState('ALL');
  const [repId, setRepId] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [payFor, setPayFor] = useState(null);

  const aging = useMemo(() => buildCustomerAging(data), [data]);
  const reps = data.employees.filter((e) => e.isSalesRep);
  const monthKey = todayKey().slice(0, 7);
  const collectedThisMonth = data.payments
    .filter((p) => p.type === 'Customer Payment' && String(p.date).startsWith(monthKey))
    .reduce((a, p) => a + (p.amount || 0), 0);

  const rows = aging.filter((r) => {
    if (r.outstanding <= 0) return false;
    if (overdueOnly && r.overdue <= 0) return false;
    if (territory !== 'ALL' && r.customer.territory !== territory) return false;
    if (repId !== 'ALL' && r.customer.salesRepId !== repId) return false;
    if (query && !r.customer.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totals = sumBuckets(rows);
  const totalOutstanding = rows.reduce((a, r) => a + r.outstanding, 0);
  const totalOverdue = rows.reduce((a, r) => a + r.overdue, 0);

  const handleExport = () =>
    exportToCSV(
      'recovery_aging',
      rows.map((r) => ({
        Customer: r.customer.name,
        Territory: r.customer.territory || '',
        Salesman: r.rep?.fullName || '',
        Phone: r.customer.phone || '',
        Outstanding: r.outstanding.toFixed(2),
        ...Object.fromEntries(AGING_BUCKETS.map((b) => [b.label, r.buckets[b.key].toFixed(2)])),
        'Oldest overdue (days)': r.oldestDaysOverdue,
        'Credit limit': r.customer.creditLimit || '',
        'Last payment': r.lastPayment ? `${r.lastPayment.date} (${r.lastPayment.amount})` : '',
      }))
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recovery & Aging</h1>
          <p className="text-xs text-slate-500 mt-1">
            Who owes how much, for how long, and which salesman is responsible for collecting it.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => setPayFor(rows[0]?.customer.id || data.customers[0]?.id)}>
            Record Payment
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Receivable"
          value={formatCompactCurrency(totalOutstanding)}
          hint={formatCurrency(totalOutstanding)}
          subtitle={`${rows.length} customer account(s)`}
          icon={Wallet}
          color="slate"
        />
        <StatCard
          title="Overdue"
          value={formatCompactCurrency(totalOverdue)}
          hint={formatCurrency(totalOverdue)}
          subtitle={
            totalOutstanding ? `${((totalOverdue / totalOutstanding) * 100).toFixed(0)}% of receivables are past due` : 'Nothing outstanding'
          }
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="90+ Days (Critical)"
          value={formatCompactCurrency(totals.d90p)}
          hint={formatCurrency(totals.d90p)}
          subtitle="Highest risk of bad debt"
          icon={CalendarX2}
          color="rose"
        />
        <StatCard
          title="Collected This Month"
          value={formatCompactCurrency(collectedThisMonth)}
          hint={formatCurrency(collectedThisMonth)}
          subtitle="All customer receipts, month to date"
          icon={HandCoins}
          color="emerald"
        />
      </section>

      {/* Aging distribution */}
      <Card title="Aging Profile" subtitle="Receivables by days past due date">
        {totalOutstanding > 0 ? (
          <>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
              {AGING_BUCKETS.map((b) =>
                totals[b.key] > 0 ? (
                  <div
                    key={b.key}
                    className={BUCKET_COLORS[b.key]}
                    style={{ width: `${(totals[b.key] / totalOutstanding) * 100}%` }}
                    title={`${b.label}: ${formatCurrency(totals[b.key])}`}
                  />
                ) : null
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {AGING_BUCKETS.map((b) => (
                <div key={b.key} className="text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className={`w-2.5 h-2.5 rounded-sm ${BUCKET_COLORS[b.key]}`} />
                    {b.label}
                  </div>
                  <p className="mt-1 font-bold text-slate-900 tabular-nums">{formatCompactCurrency(totals[b.key])}</p>
                  <p className="text-[11px] text-slate-400 tabular-nums">
                    {((totals[b.key] / totalOutstanding) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-xs text-slate-400">No outstanding receivables for this filter.</p>
        )}
      </Card>

      {/* Customer table */}
      <Card
        title="Customer-wise Recovery"
        subtitle="Sorted by overdue amount — chase the top of this list first"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customer"
                className={`${selectCls} pl-8 w-44`}
              />
            </div>
            <select value={territory} onChange={(e) => setTerritory(e.target.value)} className={selectCls}>
              <option value="ALL">All territories</option>
              {TERRITORIES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select value={repId} onChange={(e) => setRepId(e.target.value)} className={selectCls}>
              <option value="ALL">All salesmen</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              Overdue only
            </label>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-5 -my-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-5 font-medium">Customer</th>
                <th className="py-2.5 px-3 font-medium">Salesman</th>
                <th className="py-2.5 px-3 font-medium text-right">Outstanding</th>
                {AGING_BUCKETS.map((b) => (
                  <th key={b.key} className="py-2.5 px-3 font-medium text-right whitespace-nowrap">
                    {b.label}
                  </th>
                ))}
                <th className="py-2.5 px-3 font-medium">Credit used</th>
                <th className="py-2.5 px-3 font-medium">Last payment</th>
                <th className="py-2.5 px-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No customers match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const wa = buildWhatsAppLink(r.customer.phone, reminderMessage(r, data.companyProfile));
                  const util = r.creditUtilization;
                  return (
                    <tr key={r.customer.id} className="hover:bg-slate-50/70 align-top">
                      <td className="py-3 px-5">
                        <p className="font-semibold text-slate-900">{r.customer.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {r.customer.territory || '—'} · {r.customer.creditDays ?? 30}-day terms
                        </p>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{r.rep?.fullName || 'Unassigned'}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCompactCurrency(r.outstanding)}
                      </td>
                      {AGING_BUCKETS.map((b) => (
                        <td
                          key={b.key}
                          className={`py-3 px-3 text-right tabular-nums whitespace-nowrap ${
                            r.buckets[b.key] <= 0
                              ? 'text-slate-300'
                              : b.key === 'd90p'
                              ? 'text-rose-600 font-semibold'
                              : b.key === 'notDue'
                              ? 'text-slate-600'
                              : 'text-amber-700'
                          }`}
                        >
                          {r.buckets[b.key] > 0 ? formatCompactCurrency(r.buckets[b.key], '') : '—'}
                        </td>
                      ))}
                      <td className="py-3 px-3 w-28">
                        {util === null ? (
                          <span className="text-slate-400">No limit</span>
                        ) : (
                          <>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full ${util > 100 ? 'bg-rose-500' : util > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, util)}%` }}
                              />
                            </div>
                            <p className={`mt-1 text-[11px] tabular-nums ${util > 100 ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                              {util.toFixed(0)}%
                            </p>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {r.lastPayment ? (
                          <>
                            <p>{r.lastPayment.date}</p>
                            <p className="text-[11px] text-slate-400">{formatCompactCurrency(r.lastPayment.amount)}</p>
                          </>
                        ) : (
                          'Never'
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={MessageCircle}
                            disabled={!wa}
                            title={wa ? 'Send payment reminder on WhatsApp' : 'No phone number on file'}
                            onClick={() => window.open(wa, '_blank', 'noopener')}
                          >
                            Remind
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setPayFor(r.customer.id)}>
                            Receive
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {payFor && (
        <RecordPaymentModal key={payFor} isOpen onClose={() => setPayFor(null)} mode="customer" initialPartyId={payFor} />
      )}
    </div>
  );
}
