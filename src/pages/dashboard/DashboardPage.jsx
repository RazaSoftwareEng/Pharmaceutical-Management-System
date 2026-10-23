// src/pages/dashboard/DashboardPage.jsx
import React, { useState } from 'react';
import {
  Pill,
  TrendingUp,
  Clock,
  AlertTriangle,
  CalendarClock,
  Wallet,
  Landmark,
  Boxes,
  Percent,
  ShieldAlert,
  ChevronRight,
  Plus,
  ArrowRight,
  Database,
  HardDrive,
  PackageX,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, formatCompactCurrency } from '../../services/pharmaService';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import MiniAreaChart from '../../components/charts/MiniAreaChart';
import MiniBarChart from '../../components/charts/MiniBarChart';
import DonutChart from '../../components/charts/DonutChart';
import { PERIODS, useDashboardAnalytics } from './useDashboardAnalytics';
import { canSeeFinancials, canSeeInventory } from '../../config/permissions';
import { AGING_BUCKETS } from '../../services/commercialAnalytics';
import SetupChecklist from './SetupChecklist';

const MOVEMENT_STYLES = {
  'Purchase receipt': 'bg-teal-50 text-teal-700 ring-teal-600/20',
  'Sales issue': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'Sales return': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Warehouse transfer': 'bg-purple-50 text-purple-700 ring-purple-600/20',
  'Opening stock': 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

const ALERT_DOT = {
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  slate: 'bg-slate-400',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function trendProps(change) {
  if (change === null || change === undefined) return { trend: undefined };
  const rounded = Math.round(change * 10) / 10;
  if (rounded === 0) return { trend: '0%', trendType: 'flat' };
  return { trend: `${rounded > 0 ? '+' : ''}${rounded}%`, trendType: rounded > 0 ? 'up' : 'down' };
}

function OpsTile({ label, value, sub, icon: Icon, tone = 'slate', onClick }) {
  const toneCls = {
    slate: 'text-slate-900',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:-outline-offset-2"
    >
      <Icon className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-500 truncate">{label}</p>
        <p className={`text-lg font-bold leading-tight tabular-nums ${value > 0 ? toneCls : 'text-slate-900'}`}>
          {value}
        </p>
        {sub && <p className="text-[10px] text-slate-400 truncate">{sub}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
    </button>
  );
}

function TableShell({ head, children }) {
  return (
    <div className="overflow-x-auto -mx-5 -my-5">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
          <tr>
            {head.map(([label, align]) => (
              <th key={label} className={`py-2.5 px-5 font-medium ${align || ''}`}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-slate-400">
        {children}
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const { metrics, data, currentWarehouseId, dataSource, syncState, currentUserRole, currentUser } = usePharma();
  const showFinance = canSeeFinancials(currentUserRole);
  const showInventory = canSeeInventory(currentUserRole);
  const firstName = (currentUser?.fullName || '').replace(/^Dr\.?\s+/i, 'Dr. ').split(' ').slice(0, 2).join(' ');
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const a = useDashboardAnalytics({ data, metrics, warehouseId: currentWarehouseId, period });

  const warehouseName =
    currentWarehouseId === 'ALL'
      ? 'All depots'
      : data.warehouses.find((w) => w.id === currentWarehouseId)?.name || currentWarehouseId;
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const isCloud = dataSource === 'supabase';
  const marginTone =
    a.grossMarginPct === null ? 'slate' : a.grossMarginPct >= 25 ? 'emerald' : a.grossMarginPct >= 10 ? 'amber' : 'rose';

  return (
    <div className="space-y-6">
      {/* ===== Page header ===== */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{todayLabel}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-slate-200 px-2.5 py-1 text-slate-600">
              <Boxes className="w-3.5 h-3.5 text-slate-400" />
              {warehouseName}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ${
                isCloud
                  ? syncState.status === 'error'
                    ? 'bg-rose-50 text-rose-700 ring-rose-200'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-amber-50 text-amber-700 ring-amber-200'
              }`}
            >
              {isCloud ? <Database className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5" />}
              {isCloud
                ? syncState.status === 'error'
                  ? 'Supabase sync error'
                  : 'Live data · Supabase'
                : 'Local demo mode'}
            </span>
            <span className="inline-flex items-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200 px-2.5 py-1 font-medium">
              WHO-cGMP · FEFO enforced
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Reporting period"
            className="flex items-center bg-white ring-1 ring-slate-200 p-0.5 rounded-lg text-xs font-medium text-slate-600"
          >
            {Object.entries(PERIODS).map(([key, p]) => (
              <button
                key={key}
                role="tab"
                aria-selected={period === key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  period === key ? 'bg-teal-800 text-white shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => navigate('/sales/orders')}>
            New Sales Order
          </Button>
        </div>
      </section>

      <SetupChecklist />

      {/* ===== Attention banner ===== */}
      {a.alerts.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
            <ShieldAlert className="w-4 h-4" />
            Needs attention
          </div>
          <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {a.alerts.map((al) => (
              <li key={al.text}>
                <button
                  onClick={() => navigate(al.to)}
                  className="group flex w-full items-center gap-2 text-left text-xs text-slate-700 hover:text-slate-900"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ALERT_DOT[al.tone]}`} />
                  <span className="flex-1">{al.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ===== Financial KPIs ===== */}
      {showFinance && (
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Revenue"
          value={formatCompactCurrency(a.revenue)}
          hint={formatCurrency(a.revenue)}
          subtitle={
            a.orderCount
              ? `${a.orderCount} order${a.orderCount === 1 ? '' : 's'} · avg ${formatCompactCurrency(a.avgOrderValue)} · ${PERIODS[period].name}`
              : `No confirmed orders in the ${PERIODS[period].name}`
          }
          icon={TrendingUp}
          color="indigo"
          {...trendProps(a.revenueChange)}
          onClick={() => navigate('/sales/invoices')}
        />
        <StatCard
          title="Gross Margin"
          value={a.grossMarginPct === null ? '—' : `${a.grossMarginPct.toFixed(1)}%`}
          subtitle={
            a.grossMarginPct === null
              ? 'Appears once orders are confirmed'
              : `${formatCompactCurrency(a.grossProfit)} gross profit on FEFO batch cost`
          }
          icon={Percent}
          color={marginTone}
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="Inventory Value"
          value={formatCompactCurrency(metrics.totalInventoryValue)}
          hint={formatCurrency(metrics.totalInventoryValue)}
          subtitle={`${metrics.totalStockQuantity.toLocaleString()} units · ${a.activeBatchCount} active batches`}
          icon={Boxes}
          color="teal"
          onClick={() => navigate('/inventory/stock')}
        />
        <StatCard
          title="Receivables"
          value={formatCompactCurrency(metrics.totalReceivables)}
          hint={formatCurrency(metrics.totalReceivables)}
          subtitle={
            a.overdueInvoices.length
              ? `${formatCompactCurrency(a.overdueAmount)} overdue across ${a.overdueInvoices.length} invoice(s)`
              : `${a.openInvoiceCount} open invoice(s), none overdue`
          }
          icon={Wallet}
          color={a.overdueInvoices.length ? 'amber' : 'slate'}
          onClick={() => navigate('/accounts/recovery')}
        />
      </section>
      )}

      {/* ===== Operational health strip ===== */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-x divide-y xl:divide-y-0 divide-slate-100 overflow-hidden">
        <OpsTile label="Registered medicines" value={metrics.totalMedicines} icon={Pill} onClick={() => navigate('/medicines')} />
        <OpsTile label="Pending POs" value={metrics.pendingPOCount} sub="Awaiting approval" icon={Clock} tone="amber" onClick={() => navigate('/purchases/orders')} />
        <OpsTile label="Low stock" value={metrics.lowStockCount} sub="Below reorder level" icon={AlertTriangle} tone="rose" onClick={() => navigate('/inventory/stock')} />
        <OpsTile label="Near expiry" value={metrics.nearExpiryCount} sub="≤ 90 days" icon={CalendarClock} tone="purple" onClick={() => navigate('/batches')} />
        <OpsTile
          label="Expired / quarantined"
          value={metrics.expiredBatches.length + metrics.quarantinedBatches.length}
          sub={a.atRiskValue ? `${formatCompactCurrency(a.atRiskValue)} at risk` : 'Sales blocked'}
          icon={ShieldAlert}
          tone="rose"
          onClick={() => navigate('/batches')}
        />
        <OpsTile
          label="Supplier payables"
          value={formatCompactCurrency(metrics.totalPayables)}
          icon={Landmark}
          onClick={() => navigate('/accounts')}
        />
      </section>

      {/* ===== Charts row ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showFinance && (
        <Card
          title="Revenue Trend"
          subtitle={`${formatCurrency(a.revenue)} invoiced · ${PERIODS[period].name}${
            PERIODS[period].bucket === 'week' ? ' (weekly)' : ' (daily)'
          }`}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/sales/invoices')}>
              Invoices
            </Button>
          }
          className="lg:col-span-2"
        >
          <MiniAreaChart
            data={a.revenueSeries}
            height={240}
            emptyMessage={`No confirmed sales in the ${PERIODS[period].name}.`}
          />
        </Card>
        )}

        <Card
          className={showFinance ? '' : 'lg:col-span-3'}
          title="Stock by Therapeutic Class"
          subtitle="Available units per category"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/medicines')}>
              Catalog
            </Button>
          }
        >
          {a.categoryBreakdown.length ? (
            <DonutChart data={a.categoryBreakdown} height={240} />
          ) : (
            <p className="py-16 text-center text-xs text-slate-400">No stock on hand.</p>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showFinance && (
        <Card
          title="Sales vs Procurement"
          subtitle="Confirmed sales vs approved/received purchase orders, last 6 months"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
              Reports
            </Button>
          }
        >
          <MiniBarChart data={a.monthly} height={240} />
        </Card>
        )}

        <Card
          title="FEFO Expiry Queue"
          subtitle="Batches to dispatch or quarantine first, soonest expiry on top"
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/batches')}>
              All Batches
            </Button>
          }
        >
          {a.expiryQueue.length === 0 ? (
            <p className="py-16 text-center text-xs text-slate-400">No batches near expiry. </p>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {a.expiryQueue.slice(0, 6).map((b) => {
                const expired = b.daysLeft <= 0;
                const pct = expired ? 100 : Math.max(4, 100 - (b.daysLeft / 90) * 100);
                return (
                  <li key={b.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900">{b.batchNumber}</span>
                          <Badge status={b.status} />
                        </div>
                        <p className="text-slate-500 mt-0.5 truncate">{b.medicineName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-semibold tabular-nums ${expired ? 'text-rose-600' : 'text-slate-900'}`}>
                          {expired ? `Expired ${Math.abs(b.daysLeft)}d ago` : `${b.daysLeft} days left`}
                        </p>
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          {b.availableQuantity.toLocaleString()} units · {b.expiryDate}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${expired ? 'bg-rose-500' : b.daysLeft <= 30 ? 'bg-amber-500' : 'bg-purple-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      {/* ===== Commercial performance ===== */}
      {showFinance && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            title="Top Products"
            subtitle={`By net sales · ${PERIODS[period].name}`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
                Reports
              </Button>
            }
          >
            {a.topProducts.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-400">No sales in this period.</p>
            ) : (
              <ol className="space-y-3">
                {a.topProducts.map((p, i) => {
                  const share = a.topProducts[0].revenue ? (p.revenue / a.topProducts[0].revenue) * 100 : 0;
                  return (
                    <li key={p.id} className="text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-slate-400 tabular-nums">{i + 1}</span>
                          <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                          {formatCompactCurrency(p.revenue)}
                        </span>
                      </div>
                      <div className="ml-7 mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${share}%` }} />
                      </div>
                      <p className="ml-7 mt-1 text-[11px] text-slate-400 tabular-nums">
                        {p.units.toLocaleString()} units
                        {p.bonusUnits ? ` + ${p.bonusUnits.toLocaleString()} bonus` : ''}
                        {p.margin !== null ? ` · ${p.margin.toFixed(0)}% margin` : ''}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card
            title="Top Customers"
            subtitle={`By invoiced value · ${PERIODS[period].name}`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/customers')}>
                Customers
              </Button>
            }
          >
            {a.topCustomers.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-400">No sales in this period.</p>
            ) : (
              <ul className="divide-y divide-slate-100 -my-2">
                {a.topCustomers.map((c, i) => (
                  <li key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 min-w-0">
                      {i === 0 ? (
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <span className="w-4 text-center text-slate-400 tabular-nums shrink-0">{i + 1}</span>
                      )}
                      <span className="font-semibold text-slate-900 truncate">{c.name}</span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block font-semibold tabular-nums">{formatCompactCurrency(c.revenue)}</span>
                      <span className="block text-[11px] text-slate-400">{c.orders} order(s)</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Recovery Snapshot"
            subtitle={`${formatCompactCurrency(a.receivableTotal)} receivable by days overdue`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/accounts/recovery')}>
                Recovery
              </Button>
            }
          >
            <ul className="space-y-2.5">
              {AGING_BUCKETS.map((b) => {
                const v = a.agingTotals[b.key];
                const pct = a.receivableTotal ? (v / a.receivableTotal) * 100 : 0;
                return (
                  <li key={b.key} className="text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">{b.label}</span>
                      <span className={`font-semibold tabular-nums ${b.key === 'd90p' && v > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {formatCompactCurrency(v)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          b.key === 'notDue' ? 'bg-slate-400' : b.key === 'd90p' ? 'bg-rose-500' : b.key === 'd61_90' ? 'bg-orange-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      )}

      {(showFinance || showInventory) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showFinance && (
            <Card
              title="Sales Team This Month"
              subtitle="Booking vs monthly target"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/sales/team')}>
                  Team
                </Button>
              }
            >
              {a.team.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-400">No field salesmen set up.</p>
              ) : (
                <ul className="space-y-3.5">
                  {a.team.map((r) => (
                    <li key={r.rep.id} className="text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="font-semibold text-slate-900">{r.rep.fullName}</span>
                          <span className="text-slate-400"> · {r.rep.territory}</span>
                        </span>
                        <span className="tabular-nums whitespace-nowrap">
                          <strong>{formatCompactCurrency(r.sales)}</strong>
                          <span className="text-slate-400"> / {formatCompactCurrency(r.target)}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (r.achievement ?? 0) >= 100 ? 'bg-emerald-500' : (r.achievement ?? 0) >= 50 ? 'bg-teal-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, r.achievement ?? 0)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {showInventory && (
            <Card
              title="Slow-moving & Dead Stock"
              subtitle={`No sales in 90 days · ${formatCompactCurrency(a.deadStockValue)} tied up`}
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/stock')}>
                  Stock
                </Button>
              }
            >
              {a.deadStock.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-400">Every stocked product sold in the last 90 days.</p>
              ) : (
                <ul className="divide-y divide-slate-100 -my-2">
                  {a.deadStock.slice(0, 5).map((d) => (
                    <li key={d.medicine.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <span className="flex items-center gap-2 min-w-0">
                        <PackageX className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900 truncate">{d.medicine.name}</span>
                          <span className="block text-[11px] text-slate-400">
                            {d.lastSold ? `Last sold ${d.lastSold}` : 'Never sold'} · {d.units.toLocaleString()} units
                          </span>
                        </span>
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 shrink-0">{formatCompactCurrency(d.value)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </section>
      )}

      {/* ===== Transactions ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showFinance && (
        <Card
          title="Recent Sales Orders"
          subtitle="Dispatched with automatic FEFO allocation"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/sales/orders')}>
              All Orders
            </Button>
          }
        >
          <TableShell head={[['Order'], ['Customer'], ['Total', 'text-right'], ['Status', 'text-center']]}>
            {data.salesOrders.length === 0 ? (
              <EmptyRow colSpan={4}>No sales orders yet.</EmptyRow>
            ) : (
              data.salesOrders.slice(0, 5).map((so) => (
                <tr key={so.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-5">
                    <p className="font-mono font-semibold text-teal-700">{so.soNumber}</p>
                    <p className="text-[10px] text-slate-400">{so.orderDate}</p>
                  </td>
                  <td className="py-2.5 px-5 text-slate-700 font-medium truncate max-w-[180px]">{so.customerName}</td>
                  <td className="py-2.5 px-5 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatCurrency(so.grandTotal)}
                  </td>
                  <td className="py-2.5 px-5 text-center">
                    <Badge status={so.status} />
                  </td>
                </tr>
              ))
            )}
          </TableShell>
        </Card>
        )}

        <Card
          title="Recent Purchase Orders"
          subtitle="Procurement requisitions & delivery commitments"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/purchases/orders')}>
              All POs
            </Button>
          }
        >
          <TableShell head={[['PO'], ['Supplier'], ['Total', 'text-right'], ['Status', 'text-center']]}>
            {data.purchaseOrders.length === 0 ? (
              <EmptyRow colSpan={4}>No purchase orders yet.</EmptyRow>
            ) : (
              data.purchaseOrders.slice(0, 5).map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-5">
                    <p className="font-mono font-semibold text-teal-700">{po.poNumber}</p>
                    <p className="text-[10px] text-slate-400">{po.orderDate}</p>
                  </td>
                  <td className="py-2.5 px-5 text-slate-700 font-medium truncate max-w-[180px]">{po.supplierName}</td>
                  <td className="py-2.5 px-5 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatCurrency(po.grandTotal)}
                  </td>
                  <td className="py-2.5 px-5 text-center">
                    <Badge status={po.status} />
                  </td>
                </tr>
              ))
            )}
          </TableShell>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Reorder Triggers"
          subtitle="Medicines at or below minimum stock level"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/stock')}>
              Stock View
            </Button>
          }
        >
          <TableShell head={[['Medicine'], ['On hand', 'text-right'], ['Min level', 'text-right'], ['', 'text-right']]}>
            {metrics.lowStockItems.length === 0 ? (
              <EmptyRow colSpan={4}>All medicines are above their safety level.</EmptyRow>
            ) : (
              metrics.lowStockItems.slice(0, 5).map((item) => {
                const stock = metrics.medicineStockMap[item.id] || 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-5">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{item.sku}</p>
                    </td>
                    <td className="py-2.5 px-5 text-right font-bold text-rose-600 tabular-nums">{stock.toLocaleString()}</td>
                    <td className="py-2.5 px-5 text-right text-slate-500 tabular-nums">{item.minStockLevel.toLocaleString()}</td>
                    <td className="py-2.5 px-5 text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate('/purchases/orders')}>
                        Reorder
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </TableShell>
        </Card>

        <Card
          title="Stock Movement Log"
          subtitle="Receipts, sales issues, transfers and QA adjustments"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/movements')}>
              Full Log
            </Button>
          }
        >
          {data.stockMovements.length === 0 ? (
            <p className="py-16 text-center text-xs text-slate-400">No stock movements recorded.</p>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {data.stockMovements.slice(0, 6).map((mov) => {
                const positive = mov.quantity > 0;
                return (
                  <li key={mov.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`shrink-0 px-1.5 py-0.5 rounded ring-1 ring-inset text-[10px] font-semibold ${
                            MOVEMENT_STYLES[mov.type] || 'bg-rose-50 text-rose-700 ring-rose-600/20'
                          }`}
                        >
                          {mov.type}
                        </span>
                        <span className="font-semibold text-slate-900 truncate">{mov.medicineName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Lot <span className="font-mono text-slate-600">{mov.batchNumber}</span> · {mov.warehouseName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-mono font-bold tabular-nums ${positive ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {positive ? `+${mov.quantity}` : mov.quantity}
                      </p>
                      <p className="text-[10px] text-slate-400">{String(mov.timestamp).slice(0, 16)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
