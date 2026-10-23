// src/services/cloudSyncService.js
// Supabase persistence layer. The ERP state is a set of collections (arrays of
// records with an `id`) plus a few settings values. Every collection maps to a
// table of shape (id text pk, data jsonb); settings go into `app_settings`.
import { supabase } from '../lib/supabaseClient';

// state key -> table name
export const COLLECTION_TABLES = {
  warehouses: 'warehouses',
  medicines: 'medicines',
  batches: 'batches',
  suppliers: 'suppliers',
  customers: 'customers',
  employees: 'employees',
  purchaseOrders: 'purchase_orders',
  salesOrders: 'sales_orders',
  salesInvoices: 'sales_invoices',
  salesReturns: 'sales_returns',
  stockMovements: 'stock_movements',
  expenses: 'expenses',
  payments: 'payments',
  notifications: 'notifications',
};

export const SETTINGS_KEYS = ['companyProfile', 'categories', 'units'];

const UPSERT_CHUNK = 500;

function assertClient() {
  if (!supabase) throw new Error('Supabase is not configured');
}

function raise(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

// Rows are written oldest-first so that `created_at desc` reproduces the
// newest-first ordering the UI relies on (arrays are prepended on create).
// Duplicate ids within one upsert are rejected by Postgres, so the newest
// record for an id wins.
function toRows(records) {
  const now = new Date().toISOString();
  const byId = new Map();
  [...records].reverse().forEach((r) => byId.set(r.id, r));
  return [...byId.values()].map((r) => ({ id: r.id, data: r, updated_at: now }));
}

async function upsertRows(table, records) {
  const rows = toRows(records);
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + UPSERT_CHUNK));
    raise(error, `Upsert into ${table} failed`);
  }
}

async function upsertSettings(entries) {
  const now = new Date().toISOString();
  const rows = entries.map(([key, value]) => ({ key, value, updated_at: now }));
  const { error } = await supabase.from('app_settings').upsert(rows);
  raise(error, 'Saving settings failed');
}

export const cloudSyncService = {
  /**
   * Loads every collection. Returns null when the database has never been
   * initialised (no settings and no rows), so the caller can set it up.
   */
  async fetchAll() {
    assertClient();
    const entries = Object.entries(COLLECTION_TABLES);
    const results = await Promise.all(
      entries.map(([, table]) =>
        supabase.from(table).select('data').order('created_at', { ascending: false })
      )
    );

    const out = {};
    results.forEach(({ data, error }, i) => {
      const [key, table] = entries[i];
      raise(error, `Loading ${table} failed`);
      out[key] = data.map((row) => row.data);
    });

    const { data: settings, error } = await supabase.from('app_settings').select('key, value');
    raise(error, 'Loading settings failed');
    settings.forEach(({ key, value }) => {
      out[key] = value;
    });

    // A database is "new" only if it was never initialised. An ERP with no
    // medicines yet is a real, valid state and must never trigger a re-seed.
    const neverInitialised = settings.length === 0 && Object.keys(COLLECTION_TABLES).every((k) => out[k].length === 0);
    if (neverInitialised) return null;

    // Settings rows may be missing on a partially seeded DB.
    out.companyProfile = out.companyProfile || {};
    out.categories = out.categories || [];
    out.units = out.units || [];
    return out;
  },

  /** Wipes every table and writes the given dataset. */
  async seed(dataset) {
    assertClient();
    await Promise.all(
      Object.values(COLLECTION_TABLES).map(async (table) => {
        const { error } = await supabase.from(table).delete().neq('id', '');
        raise(error, `Clearing ${table} failed`);
      })
    );
    for (const [key, table] of Object.entries(COLLECTION_TABLES)) {
      await upsertRows(table, dataset[key] || []);
    }
    await upsertSettings(SETTINGS_KEYS.map((k) => [k, dataset[k]]));
  },

  /**
   * Pushes the difference between two state snapshots. State updates are
   * immutable, so a record whose object identity changed was created or
   * edited; ids that disappeared were deleted.
   * Returns the number of rows written.
   */
  async pushDiff(prev, next) {
    assertClient();
    let written = 0;

    for (const [key, table] of Object.entries(COLLECTION_TABLES)) {
      const before = prev[key] || [];
      const after = next[key] || [];
      if (before === after) continue;

      const beforeById = new Map(before.map((r) => [r.id, r]));
      const changed = after.filter((r) => beforeById.get(r.id) !== r);
      const afterIds = new Set(after.map((r) => r.id));
      const removedIds = before.filter((r) => !afterIds.has(r.id)).map((r) => r.id);

      if (changed.length) {
        await upsertRows(table, changed);
        written += changed.length;
      }
      if (removedIds.length) {
        const { error } = await supabase.from(table).delete().in('id', removedIds);
        raise(error, `Deleting from ${table} failed`);
        written += removedIds.length;
      }
    }

    const changedSettings = SETTINGS_KEYS.filter((k) => prev[k] !== next[k]).map((k) => [k, next[k]]);
    if (changedSettings.length) {
      await upsertSettings(changedSettings);
      written += changedSettings.length;
    }

    return written;
  },
};
