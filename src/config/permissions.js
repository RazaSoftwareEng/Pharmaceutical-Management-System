// src/config/permissions.js
// Single source of truth for ERP roles and which modules each role may open.
// Used by the sidebar, the route guard, the dashboard and the settings matrix.

export const ROLES = [
  { name: 'Admin', desc: 'Owner / director — full access, user management' },
  { name: 'Inventory Manager', desc: 'Stock, batches, warehouses, purchasing' },
  { name: 'Sales Manager', desc: 'Orders, customers, sales team, recovery' },
  { name: 'Accountant', desc: 'Receivables, payables, expenses, reports' },
  { name: 'Storekeeper', desc: 'Goods receiving, stock counts, movements' },
];

export const ROLE_NAMES = ROLES.map((r) => r.name);

const ALL = ROLE_NAMES;
const A = 'Admin';
const IM = 'Inventory Manager';
const SM = 'Sales Manager';
const AC = 'Accountant';
const SK = 'Storekeeper';

// Route prefix -> roles allowed. The longest matching prefix wins.
export const ROUTE_ACCESS = {
  '/': ALL,
  '/medicines': [A, IM, SM, SK],
  '/batches': [A, IM, SK],
  '/inventory/stock': [A, IM, SM, SK],
  '/inventory/movements': [A, IM, SK],
  '/inventory/count': [A, IM, SK],
  '/warehouses': [A, IM],
  '/suppliers': [A, IM, AC],
  '/purchases/orders': [A, IM, AC],
  '/purchases/receiving': [A, IM, SK],
  '/customers': [A, SM, AC],
  '/sales/orders': [A, SM],
  '/sales/invoices': [A, SM, AC],
  '/sales/returns': [A, SM, IM],
  '/sales/team': [A, SM],
  '/accounts/recovery': [A, SM, AC],
  '/accounts/expenses': [A, AC],
  '/accounts': [A, AC],
  '/reports': [A, IM, SM, AC],
  '/employees': [A],
  '/notifications': ALL,
  '/settings': [A],
};

export function canAccess(role, path) {
  if (!role) return false;
  const match = Object.keys(ROUTE_ACCESS)
    .filter((prefix) => (prefix === '/' ? path === '/' : path === prefix || path.startsWith(`${prefix}/`)))
    .sort((a, b) => b.length - a.length)[0];
  // Unknown routes fall through to the router's redirect
  return match ? ROUTE_ACCESS[match].includes(role) : true;
}

// Which dashboard sections a role sees
export const canSeeFinancials = (role) => [A, SM, AC].includes(role);
export const canSeeInventory = (role) => [A, IM, SK, SM].includes(role);
