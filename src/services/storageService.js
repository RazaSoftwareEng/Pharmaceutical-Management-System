// src/services/storageService.js
import * as initialData from '../data/initialData';
import { enrichSeed } from '../data/commercialSeed';
import { BRAND_NAME, BRAND_LEGAL_NAME } from '../config/brand';

const STORAGE_PREFIX = 'pharmacore_erp_v3_';

// The demo dataset's most recent transaction day. Transaction dates are shifted
// so this day lands on "today", keeping dashboards and period filters populated.
const DEMO_ANCHOR_DATE = '2024-10-22';
const TRANSACTION_DATE_FIELDS = [
  'orderDate',
  'invoiceDate',
  'dueDate',
  'expectedDeliveryDate',
  'receivedDate',
  'date',
  'timestamp',
];
const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

function shiftDateString(value, offsetDays) {
  if (typeof value !== 'string' || !ISO_DATE_PREFIX.test(value)) return value;
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10) + value.slice(10);
}

function rebaseRecords(records, offsetDays) {
  return records.map((r) => {
    const copy = { ...r };
    TRANSACTION_DATE_FIELDS.forEach((f) => {
      if (f in copy) copy[f] = shiftDateString(copy[f], offsetDays);
    });
    return copy;
  });
}

/** Fresh demo dataset with transaction dates rebased to the current day. */
export function getSeedData() {
  // The app stamps new records with UTC dates (toISOString), so "today" is UTC here too.
  const todayUtc = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const offsetDays = Math.round((todayUtc - Date.parse(`${DEMO_ANCHOR_DATE}T00:00:00Z`)) / 86400000);

  return enrichSeed({
    companyProfile: initialData.initialCompanyProfile,
    warehouses: initialData.initialWarehouses,
    categories: initialData.initialCategories,
    units: initialData.initialUnits,
    medicines: initialData.initialMedicines,
    batches: initialData.initialBatches,
    suppliers: initialData.initialSuppliers,
    customers: initialData.initialCustomers,
    purchaseOrders: rebaseRecords(initialData.initialPurchaseOrders, offsetDays),
    salesOrders: rebaseRecords(initialData.initialSalesOrders, offsetDays),
    salesInvoices: rebaseRecords(initialData.initialSalesInvoices, offsetDays),
    salesReturns: rebaseRecords(initialData.initialSalesReturns, offsetDays),
    stockMovements: rebaseRecords(initialData.initialStockMovements, offsetDays),
    expenses: rebaseRecords(initialData.initialExpenses, offsetDays),
    payments: rebaseRecords(initialData.initialPayments, offsetDays),
    employees: initialData.initialEmployees,
    notifications: initialData.initialNotifications,
  }, todayUtc);
}

/**
 * Starting point for a real company: no transactions or master records, only
 * reference lists (categories, packaging units) and a blank company profile.
 */
export function getEmptyData() {
  const blankProfile = Object.fromEntries(Object.keys(initialData.initialCompanyProfile).map((k) => [k, '']));
  return {
    companyProfile: {
      ...blankProfile,
      name: BRAND_LEGAL_NAME,
      tradeName: BRAND_NAME,
      country: 'Pakistan',
      currency: 'PKR',
      currencySymbol: 'Rs.',
      gmpCertified: false,
      defaultTaxRate: 0,
    },
    categories: initialData.initialCategories,
    units: initialData.initialUnits,
    warehouses: [],
    medicines: [],
    batches: [],
    suppliers: [],
    customers: [],
    purchaseOrders: [],
    salesOrders: [],
    salesInvoices: [],
    salesReturns: [],
    stockMovements: [],
    expenses: [],
    payments: [],
    employees: [],
    notifications: [],
  };
}

export const storageService = {
  load(key, fallback) {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`Failed to read ${key} from localStorage, using initial mock data.`, e);
    }
    return fallback;
  },

  save(key, data) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage`, e);
    }
  },

  saveAll(data) {
    Object.entries(data).forEach(([key, value]) => this.save(key, value));
  },

  resetAll() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Failed to reset storage', e);
    }
  },

  loadAllInitial() {
    const seed = getSeedData();
    return Object.fromEntries(Object.entries(seed).map(([key, value]) => [key, this.load(key, value)]));
  },
};
