-- =====================================================================
-- PharmaCore ERP — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Each ERP collection is a table keyed by the app's business ID
-- (MED-001, BAT-..., SO-2024-101 ...). The full record lives in `data`
-- (jsonb) so the React business logic stays the single source of truth;
-- the most useful fields are exposed as generated columns so they can be
-- filtered, sorted and inspected in the Supabase Table Editor.
-- =====================================================================

-- ---------- Settings (company profile, categories, units) ----------
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---------- Master data ----------
create table if not exists public.warehouses (
  id          text primary key,
  data        jsonb not null,
  name        text generated always as (data->>'name') stored,
  code        text generated always as (data->>'code') stored,
  status      text generated always as (data->>'status') stored,
  created_at  timestamptz not null default clock_timestamp(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.medicines (
  id              text primary key,
  data            jsonb not null,
  name            text generated always as (data->>'name') stored,
  sku             text generated always as (data->>'sku') stored,
  category        text generated always as (data->>'category') stored,
  selling_price   numeric generated always as ((data->>'sellingPrice')::numeric) stored,
  min_stock_level numeric generated always as ((data->>'minStockLevel')::numeric) stored,
  status          text generated always as (data->>'status') stored,
  created_at      timestamptz not null default clock_timestamp(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.batches (
  id                 text primary key,
  data               jsonb not null,
  batch_number       text generated always as (data->>'batchNumber') stored,
  medicine_id        text generated always as (data->>'medicineId') stored,
  warehouse_id       text generated always as (data->>'warehouseId') stored,
  expiry_date        text generated always as (data->>'expiryDate') stored,
  available_quantity numeric generated always as ((data->>'availableQuantity')::numeric) stored,
  quality_status     text generated always as (data->>'qualityStatus') stored,
  created_at         timestamptz not null default clock_timestamp(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.suppliers (
  id                  text primary key,
  data                jsonb not null,
  name                text generated always as (data->>'name') stored,
  outstanding_balance numeric generated always as ((data->>'outstandingBalance')::numeric) stored,
  status              text generated always as (data->>'status') stored,
  created_at          timestamptz not null default clock_timestamp(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.customers (
  id                      text primary key,
  data                    jsonb not null,
  name                    text generated always as (data->>'name') stored,
  outstanding_receivables numeric generated always as ((data->>'outstandingReceivables')::numeric) stored,
  status                  text generated always as (data->>'status') stored,
  created_at              timestamptz not null default clock_timestamp(),
  updated_at              timestamptz not null default now()
);

create table if not exists public.employees (
  id          text primary key,
  data        jsonb not null,
  full_name   text generated always as (data->>'fullName') stored,
  status      text generated always as (data->>'status') stored,
  created_at  timestamptz not null default clock_timestamp(),
  updated_at  timestamptz not null default now()
);

-- ---------- Transactions ----------
create table if not exists public.purchase_orders (
  id            text primary key,
  data          jsonb not null,
  supplier_name text generated always as (data->>'supplierName') stored,
  order_date    text generated always as (data->>'orderDate') stored,
  grand_total   numeric generated always as ((data->>'grandTotal')::numeric) stored,
  status        text generated always as (data->>'status') stored,
  created_at    timestamptz not null default clock_timestamp(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id            text primary key,
  data          jsonb not null,
  customer_name text generated always as (data->>'customerName') stored,
  order_date    text generated always as (data->>'orderDate') stored,
  grand_total   numeric generated always as ((data->>'grandTotal')::numeric) stored,
  status        text generated always as (data->>'status') stored,
  created_at    timestamptz not null default clock_timestamp(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.sales_invoices (
  id             text primary key,
  data           jsonb not null,
  customer_name  text generated always as (data->>'customerName') stored,
  invoice_date   text generated always as (data->>'invoiceDate') stored,
  grand_total    numeric generated always as ((data->>'grandTotal')::numeric) stored,
  balance_due    numeric generated always as ((data->>'balanceDue')::numeric) stored,
  payment_status text generated always as (data->>'paymentStatus') stored,
  created_at     timestamptz not null default clock_timestamp(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.sales_returns (
  id            text primary key,
  data          jsonb not null,
  customer_name text generated always as (data->>'customerName') stored,
  return_date   text generated always as (data->>'date') stored,
  refund_amount numeric generated always as ((data->>'refundAmount')::numeric) stored,
  created_at    timestamptz not null default clock_timestamp(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id            text primary key,
  data          jsonb not null,
  movement_type text generated always as (data->>'type') stored,
  medicine_name text generated always as (data->>'medicineName') stored,
  batch_number  text generated always as (data->>'batchNumber') stored,
  quantity      numeric generated always as ((data->>'quantity')::numeric) stored,
  reference     text generated always as (data->>'reference') stored,
  created_at    timestamptz not null default clock_timestamp(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.expenses (
  id           text primary key,
  data         jsonb not null,
  category     text generated always as (data->>'category') stored,
  expense_date text generated always as (data->>'date') stored,
  amount       numeric generated always as ((data->>'amount')::numeric) stored,
  created_at   timestamptz not null default clock_timestamp(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.payments (
  id           text primary key,
  data         jsonb not null,
  payment_type text generated always as (data->>'type') stored,
  party_name   text generated always as (data->>'partyName') stored,
  payment_date text generated always as (data->>'date') stored,
  amount       numeric generated always as ((data->>'amount')::numeric) stored,
  created_at   timestamptz not null default clock_timestamp(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.notifications (
  id          text primary key,
  data        jsonb not null,
  title       text generated always as (data->>'title') stored,
  created_at  timestamptz not null default clock_timestamp(),
  updated_at  timestamptz not null default now()
);

-- ---------- Helpful indexes ----------
create index if not exists batches_medicine_idx   on public.batches (medicine_id);
create index if not exists batches_warehouse_idx  on public.batches (warehouse_id);
create index if not exists batches_expiry_idx     on public.batches (expiry_date);
create index if not exists sales_orders_date_idx  on public.sales_orders (order_date);
create index if not exists purchase_orders_date_idx on public.purchase_orders (order_date);

-- ---------- User profiles & roles ----------
-- One row per Supabase Auth user. The very first account to sign up becomes
-- Admin; everyone after that starts as Sales Manager until an Admin changes it
-- in Settings → Users & Roles.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'Sales Manager'
              check (role in ('Admin','Inventory Manager','Sales Manager','Accountant','Storekeeper')),
  designation text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles) then 'Sales Manager' else 'Admin' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for accounts created before this script was run
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, split_part(u.email, '@', 1),
       case when row_number() over (order by u.created_at) = 1
                 and not exists (select 1 from public.profiles) then 'Admin' else 'Sales Manager' end
from auth.users u
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin' and active);
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

alter table public.profiles enable row level security;
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
  for select to authenticated using (true);
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Row Level Security for ERP data ----------
-- Only signed-in, active users can read or write. Module-level permissions
-- (who can open which screen) are enforced in the app by role.
do $$
declare
  t text;
begin
  foreach t in array array[
    'app_settings','warehouses','medicines','batches','suppliers','customers',
    'employees','purchase_orders','sales_orders','sales_invoices','sales_returns',
    'stock_movements','expenses','payments','notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "erp_test_full_access" on public.%I', t);
    execute format('drop policy if exists "erp_active_users" on public.%I', t);
    execute format(
      'create policy "erp_active_users" on public.%I for all to authenticated using (public.is_active_user()) with check (public.is_active_user())',
      t
    );
  end loop;
end $$;
