// src/data/commercialSeed.js
import { calculateBonus } from '../services/pharmaService';
// Commercial layer of the demo dataset: sales team & territories, MRP and bonus
// schemes, more chemists, and ~6 months of sales history with invoices and
// collections. Generated with a fixed-seed PRNG so every reset gives the same data.

const DAY_MS = 86400000;

export const TERRITORIES = ['Islamabad / Rawalpindi', 'Lahore', 'Karachi', 'Peshawar / KPK'];

const SALES_REPS = [
  { id: 'EMP-006', fullName: 'Usman Tariq', phone: '+92 300 5550161', territory: 'Islamabad / Rawalpindi', monthlyTarget: 900000 },
  { id: 'EMP-007', fullName: 'Hira Javed', phone: '+92 321 5550172', territory: 'Lahore', monthlyTarget: 1200000 },
  { id: 'EMP-008', fullName: 'Kashif Memon', phone: '+92 333 5550183', territory: 'Karachi', monthlyTarget: 1100000 },
  { id: 'EMP-009', fullName: 'Bilal Afridi', phone: '+92 345 5550194', territory: 'Peshawar / KPK', monthlyTarget: 600000 },
];

const repForTerritory = (t) => SALES_REPS.find((r) => r.territory === t)?.id;

// Existing customers: territory, credit terms and how old their opening balance is
const CUSTOMER_COMMERCIALS = {
  'CUST-001': { territory: 'Islamabad / Rawalpindi', creditDays: 45, openingAgeDays: 38 },
  'CUST-002': { territory: 'Lahore', creditDays: 30, openingAgeDays: 72 },
  'CUST-003': { territory: 'Islamabad / Rawalpindi', creditDays: 30, openingAgeDays: 20 },
  'CUST-004': { territory: 'Peshawar / KPK', creditDays: 60, openingAgeDays: 118 },
  'CUST-005': { territory: 'Islamabad / Rawalpindi', creditDays: 15, openingAgeDays: 9 },
};

const NEW_CUSTOMERS = [
  { id: 'CUST-006', name: 'Noor Medical Store', type: 'Retail Pharmacy', territory: 'Lahore', address: 'Shop 12, Anarkali Bazar, Lahore', contactPerson: 'Muhammad Noor', phone: '+92 300 4410612', creditLimit: 600000, creditDays: 30 },
  { id: 'CUST-007', name: 'Indus Care Pharmacy (6 Outlets)', type: 'Pharmacy Chain', territory: 'Karachi', address: 'Block 5, Clifton, Karachi', contactPerson: 'Sadia Qureshi', phone: '+92 321 2250713', creditLimit: 2500000, creditDays: 45 },
  { id: 'CUST-008', name: 'Saddar Medicine Wholesalers', type: 'Distributor', territory: 'Karachi', address: 'Denso Hall, Saddar, Karachi', contactPerson: 'Haji Abdul Rehman', phone: '+92 333 2150814', creditLimit: 3500000, creditDays: 60 },
  { id: 'CUST-009', name: 'Frontier Health Pharmacy', type: 'Retail Pharmacy', territory: 'Peshawar / KPK', address: 'University Road, Peshawar', contactPerson: 'Imran Khattak', phone: '+92 345 9150915', creditLimit: 500000, creditDays: 30 },
  { id: 'CUST-010', name: 'Margalla Medicos', type: 'Retail Pharmacy', territory: 'Islamabad / Rawalpindi', address: 'F-10 Markaz, Islamabad', contactPerson: 'Zeeshan Abbasi', phone: '+92 312 5151016', creditLimit: 700000, creditDays: 30 },
  { id: 'CUST-011', name: 'Ravi General Hospital Pharmacy', type: 'Hospital', territory: 'Lahore', address: 'Johar Town, Lahore', contactPerson: 'Dr. Ayesha Butt', phone: '+92 42 35151117', creditLimit: 2000000, creditDays: 60 },
];

// Trade schemes ("10+1" = 1 free pack with every 10 billed)
const BONUS_SCHEMES = {
  'MED-001': { buyQty: 10, freeQty: 1 },
  'MED-002': { buyQty: 12, freeQty: 1 },
  'MED-003': { buyQty: 10, freeQty: 1 },
  'MED-005': { buyQty: 20, freeQty: 3 },
  'MED-009': { buyQty: 10, freeQty: 2 },
  'MED-010': { buyQty: 10, freeQty: 1 },
};

// Left out of the sales history so the demo shows slow-moving / dead stock
const SLOW_MOVING = new Set(['MED-011', 'MED-012']);

const RETAILER_MARGIN = 0.15; // MRP = TP / (1 - 15%)

// Deterministic PRNG (mulberry32)
function prng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
const round2 = (n) => Math.round(n * 100) / 100;

export function enrichSeed(seed, todayMs) {
  const rand = prng(20261023);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const between = (min, max) => min + Math.floor(rand() * (max - min + 1));

  // ---- Medicines: MRP + schemes ----
  const medicines = seed.medicines.map((m) => ({
    ...m,
    retailPrice: m.retailPrice ?? Math.round(m.sellingPrice / (1 - RETAILER_MARGIN)),
    bonusScheme: m.bonusScheme ?? BONUS_SCHEMES[m.id] ?? null,
  }));

  // ---- Sales team ----
  const employees = [
    ...seed.employees,
    ...SALES_REPS.map((r, i) => ({
      id: r.id,
      fullName: r.fullName,
      email: `${r.fullName.split(' ')[0].toLowerCase()}@pharmacore.com`,
      phone: r.phone,
      department: 'Commercial Sales & Distribution',
      designation: `Area Sales Manager — ${r.territory}`,
      role: 'Sales Manager',
      isSalesRep: true,
      territory: r.territory,
      monthlyTarget: r.monthlyTarget,
      joinDate: isoDay(todayMs - (400 + i * 170) * DAY_MS),
      status: 'Active',
    })),
  ];

  // ---- Customers ----
  const customers = [
    ...seed.customers.map((c) => {
      const extra = CUSTOMER_COMMERCIALS[c.id] || {};
      return {
        ...c,
        territory: extra.territory,
        salesRepId: repForTerritory(extra.territory),
        creditDays: extra.creditDays ?? 30,
        openingBalance: c.outstandingReceivables || 0,
        openingBalanceDate: isoDay(todayMs - (extra.openingAgeDays ?? 30) * DAY_MS),
      };
    }),
    ...NEW_CUSTOMERS.map((c, i) => ({
      ...c,
      drugLicenseNumber: `DL-RET-${2019 + (i % 5)}-${String(310 + i * 37)}`,
      email: '',
      taxRegistrationNumber: `NTN-${4100000 + i * 7919}-${i}`,
      salesRepId: repForTerritory(c.territory),
      outstandingReceivables: 0,
      openingBalance: 0,
      openingBalanceDate: null,
      status: 'Active',
    })),
  ];

  // ---- Sales history (5–180 days ago) ----
  const sellable = medicines.filter((m) => m.status === 'Active' && !SLOW_MOVING.has(m.id));
  const firstBatch = new Map();
  seed.batches.forEach((b) => {
    if (!firstBatch.has(b.medicineId)) firstBatch.set(b.medicineId, b);
  });
  const taxRate = seed.companyProfile.defaultTaxRate || 0;

  const orders = [];
  const invoices = [];
  const payments = [];
  const ORDER_COUNT = 70;

  for (let n = 0; n < ORDER_COUNT; n++) {
    const ageDays = between(5, 180);
    const orderMs = todayMs - ageDays * DAY_MS;
    const orderDate = isoDay(orderMs);
    const customer = pick(customers);
    const lineCount = between(1, 3);
    const chosen = new Set();
    const items = [];

    for (let l = 0; l < lineCount; l++) {
      const med = pick(sellable);
      if (chosen.has(med.id)) continue;
      chosen.add(med.id);
      const quantity = between(2, 20) * 10;
      const bonusQty = calculateBonus(med.bonusScheme, quantity);
      const discountPercent = pick([0, 0, 2, 3, 5]);
      const gross = quantity * med.sellingPrice;
      const net = gross * (1 - discountPercent / 100);
      const batch = firstBatch.get(med.id);
      items.push({
        medicineId: med.id,
        medicineName: med.name,
        genericName: med.genericName,
        sku: med.sku,
        quantity,
        bonusQty,
        unitPrice: med.sellingPrice,
        retailPrice: med.retailPrice,
        discountPercent,
        taxPercent: taxRate,
        total: round2(net * (1 + taxRate / 100)),
        allocatedBatches: [
          {
            batchId: batch?.id,
            batchNumber: batch?.batchNumber || 'N/A',
            expiryDate: batch?.expiryDate || '',
            warehouseId: batch?.warehouseId,
            quantity: quantity + bonusQty,
            unitCost: batch?.purchaseCost ?? med.purchasePrice,
          },
        ],
      });
    }

    const subtotal = round2(items.reduce((a, it) => a + it.quantity * it.unitPrice, 0));
    const discountAmount = round2(items.reduce((a, it) => a + (it.quantity * it.unitPrice * it.discountPercent) / 100, 0));
    const taxAmount = round2(((subtotal - discountAmount) * taxRate) / 100);
    const grandTotal = round2(subtotal - discountAmount + taxAmount);

    const ym = orderDate.slice(2, 4) + orderDate.slice(5, 7);
    const seq = String(n + 1).padStart(3, '0');
    const soNumber = `SO-${ym}-${seq}`;
    const invoiceNumber = `INV-${ym}-${seq}`;
    const warehouse = seed.warehouses[0];
    const dueMs = orderMs + (customer.creditDays || 30) * DAY_MS;

    // Older invoices are mostly settled; recent ones are still open
    let paidAmount = 0;
    if (ageDays > 75) paidAmount = rand() < 0.85 ? grandTotal : round2(grandTotal * 0.5);
    else if (ageDays > 35) paidAmount = rand() < 0.5 ? grandTotal : rand() < 0.5 ? round2(grandTotal * 0.4) : 0;
    else if (ageDays > 15) paidAmount = rand() < 0.25 ? grandTotal : 0;
    const balanceDue = round2(grandTotal - paidAmount);
    const paymentStatus = balanceDue <= 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid';

    orders.push({
      id: soNumber,
      soNumber,
      customerId: customer.id,
      customerName: customer.name,
      salesRepId: customer.salesRepId,
      territory: customer.territory,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      orderDate,
      status: 'Confirmed',
      paymentStatus,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      invoiceId: invoiceNumber,
      notes: '',
    });

    invoices.push({
      id: invoiceNumber,
      invoiceNumber,
      orderId: soNumber,
      orderNumber: soNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerTaxId: customer.taxRegistrationNumber || 'N/A',
      customerLicense: customer.drugLicenseNumber || '',
      customerAddress: customer.address || '',
      salesRepId: customer.salesRepId,
      invoiceDate: orderDate,
      dueDate: isoDay(dueMs),
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      paidAmount,
      balanceDue,
      paymentStatus,
      warehouseName: warehouse.name,
      items: items.map((it) => ({
        medicineName: it.medicineName,
        genericName: it.genericName,
        batchNumber: it.allocatedBatches[0].batchNumber,
        expiryDate: it.allocatedBatches[0].expiryDate,
        quantity: it.quantity,
        bonusQty: it.bonusQty,
        unitPrice: it.unitPrice,
        retailPrice: it.retailPrice,
        discountPercent: it.discountPercent,
        taxPercent: it.taxPercent,
        total: it.total,
      })),
    });

    if (paidAmount > 0) {
      const payMs = Math.min(todayMs - DAY_MS, orderMs + between(10, 50) * DAY_MS);
      payments.push({
        id: `PAY-H-${seq}`,
        type: 'Customer Payment',
        partyId: customer.id,
        partyName: customer.name,
        salesRepId: customer.salesRepId,
        date: isoDay(payMs),
        amount: paidAmount,
        paymentMethod: pick(['Online Bank Transfer', 'Cheque', 'Cash Collection']),
        referenceNumber: `REC-${ym}-${seq}`,
        invoiceReference: invoiceNumber,
        notes: 'Collected by area sales manager',
      });
    }

    // Unpaid history adds to the customer's receivable
    if (balanceDue > 0) {
      const c = customers.find((x) => x.id === customer.id);
      c.outstandingReceivables = round2((c.outstandingReceivables || 0) + balanceDue);
    }
  }

  const byDateDesc = (field) => (a, b) => (a[field] < b[field] ? 1 : a[field] > b[field] ? -1 : 0);
  orders.sort(byDateDesc('orderDate'));
  invoices.sort(byDateDesc('invoiceDate'));
  payments.sort(byDateDesc('date'));

  // Tag the original demo orders with their rep as well
  const repOf = new Map(customers.map((c) => [c.id, c.salesRepId]));
  const tagRep = (rec) => ({ ...rec, salesRepId: rec.salesRepId ?? repOf.get(rec.customerId) });

  return {
    ...seed,
    medicines,
    employees,
    customers,
    salesOrders: [...seed.salesOrders.map(tagRep), ...orders],
    salesInvoices: [...seed.salesInvoices.map(tagRep), ...invoices],
    payments: [...seed.payments.map((p) => ({ ...p, salesRepId: p.salesRepId ?? repOf.get(p.partyId) })), ...payments],
  };
}
