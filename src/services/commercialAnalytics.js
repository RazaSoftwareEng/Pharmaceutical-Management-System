// src/services/commercialAnalytics.js
// Recovery aging, sales-team performance and product analytics derived from ERP data.

const DAY_MS = 86400000;
export const AGING_BUCKETS = [
  { key: 'notDue', label: 'Not yet due' },
  { key: 'd1_30', label: '1–30 days' },
  { key: 'd31_60', label: '31–60 days' },
  { key: 'd61_90', label: '61–90 days' },
  { key: 'd90p', label: '90+ days' },
];

export const todayKey = () => new Date().toISOString().slice(0, 10);
const toMs = (d) => Date.parse(`${String(d).slice(0, 10)}T00:00:00Z`);
const addDays = (d, n) => new Date(toMs(d) + n * DAY_MS).toISOString().slice(0, 10);
export const daysBetween = (from, to) => Math.round((toMs(to) - toMs(from)) / DAY_MS);

const isRecognizedSale = (so) => so.status !== 'Draft' && so.status !== 'Cancelled';

function bucketFor(daysOverdue) {
  if (daysOverdue <= 0) return 'notDue';
  if (daysOverdue <= 30) return 'd1_30';
  if (daysOverdue <= 60) return 'd31_60';
  if (daysOverdue <= 90) return 'd61_90';
  return 'd90p';
}

const emptyBuckets = () => Object.fromEntries(AGING_BUCKETS.map((b) => [b.key, 0]));

/**
 * Receivable aging per customer. The customer's outstanding balance is the
 * source of truth: open invoice balances are aged by due date, any balance not
 * explained by invoices is aged from the opening-balance date, and unlinked
 * credits (general payments, returns) are applied to the oldest debt first.
 */
export function buildCustomerAging(data, today = todayKey()) {
  const repById = new Map(data.employees.map((e) => [e.id, e]));

  return data.customers
    .map((c) => {
      const outstanding = Math.max(0, c.outstandingReceivables || 0);
      const openInvoices = data.salesInvoices.filter((inv) => inv.customerId === c.id && (inv.balanceDue || 0) > 0);

      const debts = openInvoices.map((inv) => ({
        amount: inv.balanceDue,
        dueDate: inv.dueDate || addDays(inv.invoiceDate, c.creditDays || 30),
        ref: inv.invoiceNumber,
      }));
      const invoiced = debts.reduce((a, d) => a + d.amount, 0);
      const remainder = outstanding - invoiced;

      if (remainder > 0.5) {
        debts.push({
          amount: remainder,
          dueDate: c.openingBalanceDate ? addDays(c.openingBalanceDate, c.creditDays || 30) : '1970-01-01',
          ref: 'Opening balance',
        });
      } else if (remainder < -0.5) {
        // Credits not linked to an invoice settle the oldest debts first
        let credit = -remainder;
        debts.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
        for (const d of debts) {
          const used = Math.min(d.amount, credit);
          d.amount -= used;
          credit -= used;
          if (credit <= 0) break;
        }
      }

      const buckets = emptyBuckets();
      let oldestDaysOverdue = 0;
      debts.forEach((d) => {
        if (d.amount <= 0) return;
        const overdueDays = daysBetween(d.dueDate, today);
        buckets[bucketFor(overdueDays)] += d.amount;
        oldestDaysOverdue = Math.max(oldestDaysOverdue, overdueDays);
      });

      const payments = data.payments
        .filter((p) => p.type === 'Customer Payment' && p.partyId === c.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      const overdue = buckets.d1_30 + buckets.d31_60 + buckets.d61_90 + buckets.d90p;

      return {
        customer: c,
        rep: repById.get(c.salesRepId) || null,
        outstanding,
        overdue,
        buckets,
        oldestDaysOverdue,
        openInvoiceCount: openInvoices.length,
        lastPayment: payments[0] || null,
        creditUtilization: c.creditLimit ? (outstanding / c.creditLimit) * 100 : null,
      };
    })
    .sort((a, b) => b.overdue - a.overdue || b.outstanding - a.outstanding);
}

export function sumBuckets(rows) {
  const total = emptyBuckets();
  rows.forEach((r) => AGING_BUCKETS.forEach(({ key }) => (total[key] += r.buckets[key])));
  return total;
}

/** Month-to-date performance of every field salesman. `monthKey` is 'YYYY-MM'. */
export function buildRepPerformance(data, monthKey = todayKey().slice(0, 7), aging = null) {
  const agingRows = aging || buildCustomerAging(data);
  const repOfCustomer = new Map(data.customers.map((c) => [c.id, c.salesRepId]));

  return data.employees
    .filter((e) => e.isSalesRep)
    .map((rep) => {
      const orders = data.salesOrders.filter(
        (so) =>
          isRecognizedSale(so) &&
          String(so.orderDate).startsWith(monthKey) &&
          (so.salesRepId ?? repOfCustomer.get(so.customerId)) === rep.id
      );
      const sales = orders.reduce((a, so) => a + (so.grandTotal || 0), 0);
      const collections = data.payments
        .filter(
          (p) =>
            p.type === 'Customer Payment' &&
            String(p.date).startsWith(monthKey) &&
            (p.salesRepId ?? repOfCustomer.get(p.partyId)) === rep.id
        )
        .reduce((a, p) => a + (p.amount || 0), 0);
      const book = agingRows.filter((r) => r.customer.salesRepId === rep.id);

      return {
        rep,
        orders: orders.length,
        sales,
        target: rep.monthlyTarget || 0,
        achievement: rep.monthlyTarget ? (sales / rep.monthlyTarget) * 100 : null,
        collections,
        customers: book.length,
        outstanding: book.reduce((a, r) => a + r.outstanding, 0),
        overdue: book.reduce((a, r) => a + r.overdue, 0),
      };
    })
    .sort((a, b) => (b.achievement ?? -1) - (a.achievement ?? -1));
}

/** Product and customer ranking for sales on or after `fromDate`. */
export function buildSalesRanking(data, fromDate, warehouseId = 'ALL') {
  const medCost = new Map(data.medicines.map((m) => [m.id, m.purchasePrice || 0]));
  const batchCost = new Map(data.batches.map((b) => [b.id, b.purchaseCost]));
  const products = new Map();
  const customers = new Map();

  data.salesOrders
    .filter(
      (so) =>
        isRecognizedSale(so) &&
        so.orderDate >= fromDate &&
        (warehouseId === 'ALL' || so.warehouseId === warehouseId)
    )
    .forEach((so) => {
      const cust = customers.get(so.customerId) || { id: so.customerId, name: so.customerName, revenue: 0, orders: 0 };
      cust.revenue += so.grandTotal || 0;
      cust.orders += 1;
      customers.set(so.customerId, cust);

      (so.items || []).forEach((it) => {
        const p = products.get(it.medicineId) || {
          id: it.medicineId,
          name: it.medicineName,
          units: 0,
          bonusUnits: 0,
          revenue: 0,
          cost: 0,
        };
        const qty = Number(it.quantity) || 0;
        const net = qty * (Number(it.unitPrice) || 0) * (1 - (Number(it.discountPercent) || 0) / 100);
        p.units += qty;
        p.bonusUnits += Number(it.bonusQty) || 0;
        p.revenue += net;
        const allocs = it.allocatedBatches?.length ? it.allocatedBatches : [{ quantity: qty + (Number(it.bonusQty) || 0) }];
        allocs.forEach((a) => {
          p.cost += (Number(a.quantity) || 0) * (a.unitCost ?? batchCost.get(a.batchId) ?? medCost.get(it.medicineId) ?? 0);
        });
        products.set(it.medicineId, p);
      });
    });

  const productList = [...products.values()]
    .map((p) => ({ ...p, margin: p.revenue ? ((p.revenue - p.cost) / p.revenue) * 100 : null }))
    .sort((a, b) => b.revenue - a.revenue);
  const customerList = [...customers.values()].sort((a, b) => b.revenue - a.revenue);
  return { products: productList, customers: customerList };
}

/** Medicines holding stock that have not been sold in the last `days` days. */
export function buildDeadStock(data, medicineStockMap, days = 90) {
  const cutoff = addDays(todayKey(), -days);
  const lastSold = new Map();
  data.salesOrders.filter(isRecognizedSale).forEach((so) => {
    (so.items || []).forEach((it) => {
      if (!lastSold.has(it.medicineId) || lastSold.get(it.medicineId) < so.orderDate) lastSold.set(it.medicineId, so.orderDate);
    });
  });
  const value = new Map();
  data.batches.forEach((b) => {
    value.set(b.medicineId, (value.get(b.medicineId) || 0) + (b.availableQuantity || 0) * (b.purchaseCost || 0));
  });

  return data.medicines
    .filter((m) => (medicineStockMap[m.id] || 0) > 0 && (!lastSold.has(m.id) || lastSold.get(m.id) < cutoff))
    .map((m) => ({
      medicine: m,
      units: medicineStockMap[m.id] || 0,
      value: value.get(m.id) || 0,
      lastSold: lastSold.get(m.id) || null,
    }))
    .sort((a, b) => b.value - a.value);
}
