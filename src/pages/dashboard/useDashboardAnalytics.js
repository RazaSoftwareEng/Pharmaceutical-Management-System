// src/pages/dashboard/useDashboardAnalytics.js
// Derives every dashboard figure from live ERP data (no hardcoded series).
import { useMemo } from 'react';
import { evaluateBatchStatus, getDaysUntilExpiry, percentChange, formatCompactCurrency } from '../../services/pharmaService';
import {
  buildCustomerAging,
  buildDeadStock,
  buildRepPerformance,
  buildSalesRanking,
  sumBuckets,
} from '../../services/commercialAnalytics';

export const PERIODS = {
  week: { days: 7, label: '7D', name: 'last 7 days', bucket: 'day' },
  month: { days: 30, label: '30D', name: 'last 30 days', bucket: 'day' },
  quarter: { days: 90, label: '90D', name: 'last 90 days', bucket: 'week' },
};

const DAY_MS = 86400000;
const MONTHS_IN_TREND = 6;

// Dates in the ERP are 'YYYY-MM-DD' (UTC), so all arithmetic is done in UTC days.
const dayKey = (ms) => new Date(ms).toISOString().slice(0, 10);
const toMs = (dateStr) => Date.parse(`${String(dateStr).slice(0, 10)}T00:00:00Z`);
const shortLabel = (ms) =>
  new Date(ms).toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });

const isRecognizedSale = (so) => so.status !== 'Draft' && so.status !== 'Cancelled';
const isCommittedPurchase = (po) => po.status === 'Approved' || po.status === 'Completed';

export function useDashboardAnalytics({ data, metrics, warehouseId, period }) {
  return useMemo(() => {
    const { days, bucket } = PERIODS[period];
    const todayMs = toMs(new Date().toISOString());
    const startMs = todayMs - (days - 1) * DAY_MS;
    const prevStartMs = startMs - days * DAY_MS;
    const inWarehouse = (rec) => warehouseId === 'ALL' || rec.warehouseId === warehouseId;

    const sales = data.salesOrders.filter((so) => isRecognizedSale(so) && inWarehouse(so));
    const purchases = data.purchaseOrders.filter((po) => isCommittedPurchase(po) && inWarehouse(po));

    const inRange = (dateStr, from, to) => {
      const ms = toMs(dateStr);
      return ms >= from && ms <= to;
    };
    const periodSales = sales.filter((so) => inRange(so.orderDate, startMs, todayMs));
    const prevSales = sales.filter((so) => inRange(so.orderDate, prevStartMs, startMs - DAY_MS));

    const sum = (rows, f) => rows.reduce((acc, r) => acc + (Number(r[f]) || 0), 0);
    const revenue = sum(periodSales, 'grandTotal');
    const prevRevenue = sum(prevSales, 'grandTotal');

    // ---- Gross margin: net sales vs FEFO-allocated batch cost ----
    const batchCost = new Map(data.batches.map((b) => [b.id, b.purchaseCost]));
    const medCost = new Map(data.medicines.map((m) => [m.id, m.purchasePrice]));
    let netSales = 0;
    let cogs = 0;
    periodSales.forEach((so) => {
      netSales += (Number(so.subtotal) || 0) - (Number(so.discountAmount) || 0);
      (so.items || []).forEach((item) => {
        const allocs = item.allocatedBatches?.length ? item.allocatedBatches : [{ quantity: item.quantity }];
        allocs.forEach((a) => {
          const unitCost = a.unitCost ?? batchCost.get(a.batchId) ?? medCost.get(item.medicineId) ?? 0;
          cogs += (Number(a.quantity) || 0) * unitCost;
        });
      });
    });
    const grossMarginPct = netSales > 0 ? ((netSales - cogs) / netSales) * 100 : null;

    // ---- Revenue trend series ----
    const revenueSeries = [];
    const bucketDays = bucket === 'week' ? 7 : 1;
    for (let ms = startMs; ms <= todayMs; ms += bucketDays * DAY_MS) {
      const endMs = Math.min(todayMs, ms + (bucketDays - 1) * DAY_MS);
      const value = periodSales
        .filter((so) => inRange(so.orderDate, ms, endMs))
        .reduce((acc, so) => acc + (so.grandTotal || 0), 0);
      revenueSeries.push({
        label: shortLabel(ms),
        tooltipLabel: bucketDays > 1 ? `${shortLabel(ms)} – ${shortLabel(endMs)}` : shortLabel(ms),
        value,
      });
    }

    // ---- Monthly sales vs purchases (trailing months) ----
    const now = new Date();
    const monthly = [];
    for (let i = MONTHS_IN_TREND - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = d.toISOString().slice(0, 7);
      monthly.push({
        key,
        label: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        sales: sales.filter((so) => String(so.orderDate).startsWith(key)).reduce((a, so) => a + (so.grandTotal || 0), 0),
        purchases: purchases
          .filter((po) => String(po.receivedDate || po.orderDate).startsWith(key))
          .reduce((a, po) => a + (po.grandTotal || 0), 0),
      });
    }

    // ---- Receivables ageing ----
    const todayKey = dayKey(todayMs);
    const openInvoices = data.salesInvoices.filter((inv) => (inv.balanceDue || 0) > 0);
    const overdueInvoices = openInvoices.filter((inv) => inv.dueDate && inv.dueDate < todayKey);
    const overdueAmount = sum(overdueInvoices, 'balanceDue');

    // ---- Inventory health ----
    const scopedBatches = data.batches.filter(inWarehouse);
    const activeBatchCount = scopedBatches.filter(
      (b) => b.availableQuantity > 0 && evaluateBatchStatus(b) === 'Active'
    ).length;
    const atRiskValue = [...metrics.nearExpiryBatches, ...metrics.expiredBatches].reduce(
      (acc, b) => acc + (b.availableQuantity || 0) * (b.purchaseCost || 0),
      0
    );

    const expiryQueue = scopedBatches
      .filter((b) => {
        const st = evaluateBatchStatus(b);
        return (st === 'Near Expiry' || st === 'Expired') && b.availableQuantity > 0;
      })
      .map((b) => ({ ...b, status: evaluateBatchStatus(b), daysLeft: getDaysUntilExpiry(b.expiryDate) }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    // ---- Stock by category ----
    const categoryTotals = {};
    data.medicines.forEach((m) => {
      const stock = metrics.medicineStockMap[m.id] || 0;
      if (stock > 0) categoryTotals[m.category] = (categoryTotals[m.category] || 0) + stock;
    });
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([label, value]) => ({ label: label.split('&')[0].trim(), value }))
      .sort((a, b) => b.value - a.value);

    // ---- Commercial: ranking, dead stock, recovery, team ----
    const ranking = buildSalesRanking(data, dayKey(startMs), warehouseId);
    const deadStock = buildDeadStock(data, metrics.medicineStockMap, 90);
    const deadStockValue = deadStock.reduce((acc, d) => acc + d.value, 0);
    const aging = buildCustomerAging(data);
    const agingTotals = sumBuckets(aging);
    const team = buildRepPerformance(data, dayKey(todayMs).slice(0, 7), aging);

    // ---- Items needing attention ----
    const alerts = [];
    if (atRiskValue > 0)
      alerts.push({ tone: 'rose', text: `${formatCompactCurrency(atRiskValue)} of stock is expired or expiring within 90 days`, to: '/batches' });
    if (agingTotals.d90p > 0)
      alerts.push({ tone: 'rose', text: `${formatCompactCurrency(agingTotals.d90p)} receivable is more than 90 days overdue`, to: '/accounts/recovery' });
    if (metrics.expiredBatches.length)
      alerts.push({ tone: 'rose', text: `${metrics.expiredBatches.length} expired batch(es) still hold stock — move to quarantine`, to: '/batches' });
    if (metrics.quarantinedBatches.length)
      alerts.push({ tone: 'amber', text: `${metrics.quarantinedBatches.length} batch(es) quarantined or recalled awaiting QA disposition`, to: '/batches' });
    if (overdueInvoices.length)
      alerts.push({ tone: 'amber', text: `${overdueInvoices.length} invoice(s) past due date`, to: '/accounts/recovery' });
    if (metrics.lowStockCount)
      alerts.push({ tone: 'sky', text: `${metrics.lowStockCount} medicine(s) below reorder level`, to: '/inventory/stock' });
    if (metrics.pendingPOCount)
      alerts.push({ tone: 'slate', text: `${metrics.pendingPOCount} purchase order(s) awaiting approval`, to: '/purchases/orders' });

    return {
      revenue,
      revenueChange: percentChange(revenue, prevRevenue),
      orderCount: periodSales.length,
      avgOrderValue: periodSales.length ? revenue / periodSales.length : 0,
      grossMarginPct,
      grossProfit: netSales - cogs,
      revenueSeries,
      monthly,
      openInvoiceCount: openInvoices.length,
      overdueInvoices,
      overdueAmount,
      activeBatchCount,
      atRiskValue,
      expiryQueue,
      categoryBreakdown,
      alerts,
      topProducts: ranking.products.slice(0, 5),
      topCustomers: ranking.customers.slice(0, 5),
      deadStock,
      deadStockValue,
      agingTotals,
      receivableTotal: aging.reduce((acc, r) => acc + r.outstanding, 0),
      team,
    };
  }, [data, metrics, warehouseId, period]);
}
