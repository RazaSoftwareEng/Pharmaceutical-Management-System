// src/pages/sales/SalesTeamPage.jsx
import React, { useMemo, useState } from 'react';
import { Target, TrendingUp, HandCoins, Trophy, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, formatCompactCurrency } from '../../services/pharmaService';
import { buildCustomerAging, buildRepPerformance, todayKey } from '../../services/commercialAnalytics';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

function monthOptions(count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    };
  });
}

// Share of the month elapsed, so achievement can be compared with "on pace"
function monthProgress(monthKey) {
  const today = todayKey();
  if (monthKey !== today.slice(0, 7)) return 100;
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return (Number(today.slice(8, 10)) / daysInMonth) * 100;
}

function achievementTone(pct, pace) {
  if (pct === null) return { bar: 'bg-slate-300', text: 'text-slate-500', label: 'No target' };
  if (pct >= 100) return { bar: 'bg-emerald-500', text: 'text-emerald-700', label: 'Target achieved' };
  if (pct >= pace * 0.9) return { bar: 'bg-teal-500', text: 'text-teal-700', label: 'On pace' };
  if (pct >= pace * 0.6) return { bar: 'bg-amber-500', text: 'text-amber-700', label: 'Behind pace' };
  return { bar: 'bg-rose-500', text: 'text-rose-700', label: 'At risk' };
}

export default function SalesTeamPage() {
  const { data } = usePharma();
  const navigate = useNavigate();
  const months = monthOptions();
  const [monthKey, setMonthKey] = useState(months[0].key);

  const aging = useMemo(() => buildCustomerAging(data), [data]);
  const team = useMemo(() => buildRepPerformance(data, monthKey, aging), [data, monthKey, aging]);
  const pace = monthProgress(monthKey);

  const totalSales = team.reduce((a, r) => a + r.sales, 0);
  const totalTarget = team.reduce((a, r) => a + r.target, 0);
  const totalCollections = team.reduce((a, r) => a + r.collections, 0);
  const leader = team.find((r) => r.sales > 0);

  // Territory roll-up
  const territories = Object.values(
    team.reduce((acc, r) => {
      const t = r.rep.territory || 'Unassigned';
      acc[t] = acc[t] || { territory: t, sales: 0, target: 0, collections: 0, outstanding: 0, overdue: 0 };
      acc[t].sales += r.sales;
      acc[t].target += r.target;
      acc[t].collections += r.collections;
      acc[t].outstanding += r.outstanding;
      acc[t].overdue += r.overdue;
      return acc;
    }, {})
  ).sort((a, b) => b.sales - a.sales);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Team & Targets</h1>
          <p className="text-xs text-slate-500 mt-1">
            Booking vs target, collections and outstanding book for every area sales manager.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {months.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => navigate('/employees')}>
            Manage team
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Team Sales"
          value={formatCompactCurrency(totalSales)}
          hint={formatCurrency(totalSales)}
          subtitle={`${team.reduce((a, r) => a + r.orders, 0)} orders booked`}
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Target Achievement"
          value={totalTarget ? `${((totalSales / totalTarget) * 100).toFixed(0)}%` : '—'}
          subtitle={`of ${formatCompactCurrency(totalTarget)} team target`}
          icon={Target}
          color="teal"
          progress={totalTarget ? (totalSales / totalTarget) * 100 : undefined}
        />
        <StatCard
          title="Collections"
          value={formatCompactCurrency(totalCollections)}
          hint={formatCurrency(totalCollections)}
          subtitle="Recovered from team customers"
          icon={HandCoins}
          color="emerald"
        />
        <StatCard
          title="Top Performer"
          value={leader ? leader.rep.fullName : '—'}
          subtitle={
            leader
              ? `${formatCompactCurrency(leader.sales)} · ${leader.achievement !== null ? `${leader.achievement.toFixed(0)}% of target` : 'no target'}`
              : 'No sales booked yet'
          }
          icon={Trophy}
          color="amber"
        />
      </section>

      {monthKey === months[0].key && (
        <p className="text-xs text-slate-500">
          {pace.toFixed(0)}% of the month has passed — reps at or above that share of target are on pace.
        </p>
      )}

      {/* Rep cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {team.length === 0 && (
          <p className="text-xs text-slate-400 col-span-full">
            No field salesmen yet. Mark employees as “Field salesman” in the Employee Directory.
          </p>
        )}
        {team.map((r) => {
          const tone = achievementTone(r.achievement, pace);
          return (
            <div key={r.rep.id} className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{r.rep.fullName}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {r.rep.territory || 'No territory'}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold whitespace-nowrap ${tone.text}`}>{tone.label}</span>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{formatCompactCurrency(r.sales)}</span>
                <span className="text-xs text-slate-500 tabular-nums">/ {formatCompactCurrency(r.target)}</span>
              </div>
              <div className="relative mt-2 h-2 rounded-full bg-slate-100 overflow-visible">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${Math.min(100, r.achievement ?? 0)}%` }}
                />
                {monthKey === months[0].key && (
                  <div className="absolute -top-1 h-4 w-0.5 bg-slate-400" style={{ left: `${pace}%` }} title="Expected pace" />
                )}
              </div>
              <p className={`mt-1.5 text-xs font-semibold tabular-nums ${tone.text}`}>
                {r.achievement !== null ? `${r.achievement.toFixed(0)}% of target` : 'No target set'}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs border-t border-slate-100 pt-3">
                <dt className="text-slate-500">Orders</dt>
                <dd className="text-right font-medium tabular-nums">{r.orders}</dd>
                <dt className="text-slate-500">Collected</dt>
                <dd className="text-right font-medium text-emerald-700 tabular-nums">{formatCompactCurrency(r.collections)}</dd>
                <dt className="text-slate-500">Customers</dt>
                <dd className="text-right font-medium tabular-nums">{r.customers}</dd>
                <dt className="text-slate-500">Outstanding</dt>
                <dd className="text-right font-medium tabular-nums">{formatCompactCurrency(r.outstanding)}</dd>
                <dt className="text-slate-500">Overdue</dt>
                <dd className={`text-right font-semibold tabular-nums ${r.overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {formatCompactCurrency(r.overdue)}
                </dd>
              </dl>

              {r.rep.phone && (
                <a
                  href={`tel:${r.rep.phone.replace(/\s/g, '')}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-teal-700 font-semibold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" /> {r.rep.phone}
                </a>
              )}
            </div>
          );
        })}
      </section>

      <Card title="Territory Summary" subtitle="Sales, target and collection position by region">
        <div className="overflow-x-auto -mx-5 -my-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-5 font-medium">Territory</th>
                <th className="py-2.5 px-3 font-medium text-right">Sales</th>
                <th className="py-2.5 px-3 font-medium text-right">Target</th>
                <th className="py-2.5 px-3 font-medium text-right">Achievement</th>
                <th className="py-2.5 px-3 font-medium text-right">Collected</th>
                <th className="py-2.5 px-3 font-medium text-right">Outstanding</th>
                <th className="py-2.5 px-5 font-medium text-right">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {territories.map((t) => (
                <tr key={t.territory} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-5 font-semibold text-slate-900">{t.territory}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatCompactCurrency(t.sales)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">{formatCompactCurrency(t.target)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                    {t.target ? `${((t.sales / t.target) * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700">{formatCompactCurrency(t.collections)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatCompactCurrency(t.outstanding)}</td>
                  <td className={`py-2.5 px-5 text-right tabular-nums ${t.overdue > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                    {formatCompactCurrency(t.overdue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
