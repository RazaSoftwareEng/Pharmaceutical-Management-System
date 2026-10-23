# PharmaCore ERP — Enterprise Pharmaceutical Management System

An enterprise-grade, responsive Pharmaceutical Management System frontend application built with **React**, **Vite**, **Tailwind CSS**, and **React Router DOM**. Engineered for pharmaceutical manufacturing plants and distribution hubs, ensuring strict compliance with **WHO-cGMP**, **FEFO (First Expiry, First Out)** lot allocation, and drug authority traceability.

---

## 1. Technology Stack

- **Framework**: React 19 with Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Navigation**: React Router DOM v7
- **Iconography**: Lucide React (clean, consistent enterprise icons)
- **State Management**: Centralized React Context (`PharmaContext`) with simulated asynchronous service layer and `localStorage` persistence
- **Architecture**: Domain-driven, component-modular design with decoupled data and service tiers ready for seamless backend REST / GraphQL integration.

---

## 2. Key Modules & Functional Workflows

### 1. Executive Dashboard
- **8 Dynamic KPI Cards**: Total Medicines, Total Stock Quantity, Total Inventory Valuation, Today's Sales Revenue, Pending Purchase Orders, Low Stock Items, Near-Expiry Batches, and Outstanding Receivables.
- **Dynamic Time-Range Filter**: Switch seamlessly between `7 Days`, `This Month`, and `Quarter` to update sales throughput velocity and trend lines.
- **Interactive Visualizations**:
  - Revenue & Dispatch trend line/area chart with hover tooltips and dynamic period calculations.
  - Procurement vs. Sales monthly comparison bar chart.
  - Inventory breakdown by therapeutic category donut chart.
- **Operational Tables & Live Feeds**:
  - Chronological Recent Sales Dispatches.
  - Recent Purchase Orders table with status indicators.
  - Low stock reorder triggers table with one-click reordering.
  - High-priority expiring batch queues (FEFO audit).
  - Real-time Stock Movement Audit Stream recording lot deltas, facilities, and movements.

### 2. Medicines Formulary & Master Catalog
- Search by Brand Name, Active Generic API molecule, or SKU.
- Filter by therapeutic category and product status.
- Add / Edit medicine modals with comprehensive input validation.
- Detailed modal inspecting packaging units, storage temperatures, prescription requirements (Rx), profit margins, and associated lots in stock.

### 3. Batch & Expiry Management (FEFO Engine)
- Lot-level traceability: Batch number, manufacturing date, expiry date, days to expiration, received quantity, available units, unit cost, and facility location.
- **Quality Status Flags**: `Active`, `Near Expiry` (≤ 90 days), `Expired`, `Quarantined`, and `Recalled`.
- **Strict Compliance Safeguard**: Expired, Quarantined, and Recalled lots are **strictly blocked** from sales selection.
- Quality Assurance override controls for quarantine holds and regulatory recalls.

### 4. Inventory, Warehouses & Stock Movements
- **Stock Overview**: Real-time aggregated inventory with safety buffer indicators and reorder triggers.
- **Stock Movements Audit Trail**: Tamper-evident transaction logs capturing `Purchase receipt`, `Sales issue`, `Sales return`, `Adjustment`, and `Warehouse transfer` with timestamp, user, reference, and quantity delta.
- **Stock Adjustments**: Write-off breakage, audit count reconciliation, or laboratory quality sampling with formal remarks.
- **Cycle Stock Count Interface**: Dedicated `/inventory/count` auditing screen with physical vs system discrepancy variance calculator and automated variance adjustments.
- **Warehouses**: Manage multi-facility depots (Central Logistics Hub, Regional Distribution Depot, Bio-Cold Chain Storage) with capacity utilization tracking and inter-warehouse transfers.

### 5. Procurement & Purchasing (PO to GRN Workflow)
- **Purchase Order Workflow**: `Draft` → `Pending Approval` → `Approved` → `Goods Receiving` → `Completed`.
- Dual submission options: "Save as Draft" for work-in-progress requisitions, or "Submit PO for Approval".
- Draft PO management: Submit drafts for managerial approval anytime from the PO details modal.
- Multi-line item PO builder with real-time gross, discount, and tax calculations.
- Role-based authorization actions (Approve / Reject).
- **Goods Receiving Note (GRN)**: Accepts consignments against approved POs, assigns batch lot codes, records manufacturing and expiration dates, generates inventory batches, logs movement, and updates vendor payables.
- **Supplier Payables Ledger**: Full chronological ledger tab in supplier profiles showing accrued lot deliveries (Credits), payments (Debits), running balance, CSV export, and printable statements.

### 6. Sales, Customers & Distribution
- **Customer Directory**: Hospitals, commercial pharmacy chains, clinics, and wholesale distributors with drug license validation and credit limit monitoring.
- **Customer Financial Ledger**: Full chronological statement tab tracking itemized Sales Invoices (Debits), Settlements (Credits), Credit Notes (Returns), and real-time running balance with CSV export and print capability.
- **Sales Order Creation**:
  - Validates stock availability before submission.
  - Automatically allocates eligible batches using **First Expiry, First Out (FEFO)**.
  - Displays real-time allocation breakdown to the dispatcher.
- **Sales Invoices**:
  - Generates commercial tax invoices with company letterhead, DRAP license numbers, customer STRN, itemized lot numbers, expiry dates, and pharmacist sign-off blocks.
  - Formatted for browser printing (`window.print()`).
- **Sales Returns**: Customer returns routed to either Quarantine Stock (for inspection) or Active Stock, with automatic credit note adjustments.

### 7. Accounts & Financial Settlements
- Customer Receivables Aging and Supplier Payables tracking.
- Record payment receipts against open sales invoices.
- Record disbursements against supplier purchase orders.
- Operational expenses logging (Cold-chain logistics, microbiology assays, warehouse utilities, security seals).

### 8. Reports & Analytics
- Selectable report engines:
  1. *Inventory Valuation Report* (Cost vs. Market Value)
  2. *Stock Movement Audit Log*
  3. *Batch Expiry & Critical Risk Analysis*
  4. *Low Stock Reorder Schedule*
  5. *Sales Performance & Invoicing Summary*
  6. *Procurement Requisition & Purchase History*
  7. *Customer Outstanding Receivables Aging*
  8. *Supplier Payables Ledger*
  9. *Estimated Gross Profit Analysis*
- One-click **Export to CSV** for all datasets.
- Formatted **Printable Report Schedules** matching official auditing standards.

### 9. Personnel & Governance
- Employee directory with departmental designations.
- **Simulated Role Switcher** (Admin, Inventory Manager, Sales Manager, Accountant, Storekeeper) with UI permission matrix.
- System settings for company profile, therapeutic categories, and units of measurement.
- Factory reset button to restore default demo state anytime.

---

## 3. Getting Started & Running Locally

### Prerequisites
- Node.js (v18.0.0 or higher; tested on Node.js v26)
- npm (v9.0.0 or higher)

### Installation
```bash
# Clone or navigate to the project directory
cd "d:/Programming/Ali/Pharmaceutical Management System"

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be live at `http://localhost:5173`.

### Production Build
```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

### Connecting Supabase (real database)

Without configuration the app stores data in the browser (`localStorage`). To use a real Postgres database:

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Copy `.env.example` to `.env.local` and fill in **Project URL** and **anon public key** (Project Settings → API).
4. Restart `npm run dev`.

On first load, an empty database is seeded automatically with the demo dataset. Transaction dates are shifted so the latest demo activity falls on today. After that, every action (sales order, GRN, payment, stock adjustment, etc.) writes only the changed rows to Supabase. The status pill in the top bar shows the sync state. **Settings → Data & Cloud Sync** has buttons to reload from Supabase, push local data up after a failed sync, or re-seed the database.

How it is stored: each module has its own table (`medicines`, `batches`, `sales_orders`, …) keyed by the ERP id. The full record is in a `data jsonb` column, and key fields (batch number, expiry date, totals, status) are exposed as generated columns you can filter in the Table Editor. Company profile, categories and units are in `app_settings`.

**Login & roles.** Data is readable and writable only by signed-in, active users (Row Level Security). Users are created by the Admin in **Supabase Dashboard → Authentication → Users → Add user** (tick *Auto Confirm User*); there is no public sign-up on the login page. The **first account becomes Admin**; later accounts start as *Sales Manager*, and the Admin changes their role (or blocks them) in **Settings → Users & Roles**. If Supabase has "Confirm email" turned on, confirm the e-mail before signing in. Without Supabase, the login page offers one-click demo accounts for every role.

> If you ran an older `schema.sql`, run the latest one again. It is safe to re-run, and it replaces the old open "anon" policy with the logged-in-only policy.

### Commercial features for pharma distribution

- **Bonus schemes (e.g. 10+1):** set on the medicine, applied automatically on sales orders; FEFO allocates billed + free units.
- **TP / MRP:** trade price for invoicing, retail price shown on invoice, with retailer and own margin.
- **Credit control:** sales orders over a customer's credit limit are blocked unless an Admin approves.
- **Recovery & Aging:** customer-wise 0–30 / 31–60 / 61–90 / 90+ day buckets, salesman responsible, WhatsApp payment reminder.
- **Sales Team & Targets:** monthly target vs booking per area sales manager, collections, territory summary.
- **Invoices:** NTN/STRN, DRAP licence numbers, customer drug-sale licence, bonus column, Drugs Act warranty, send on WhatsApp.
- **Dashboard by role:** owners see revenue, margin, top products and customers, recovery and team; store staff see stock, expiry and dead stock.

---

## 4. Next Phase: Backend APIs & Database Entities

When connecting this frontend application to a production backend (e.g., Node.js / Go / Python Fast-API + PostgreSQL / MySQL), the following database schemas and RESTful / GraphQL endpoints will be integrated:

### Database Entities (Relational Schema)
1. **`medicines`**: `id`, `sku`, `name`, `generic_name`, `brand`, `category_id`, `dosage_form`, `strength`, `uom_id`, `purchase_price`, `selling_price`, `min_stock_level`, `max_stock_level`, `prescription_required`, `storage_condition`, `status`.
2. **`batches`**: `id`, `batch_number`, `medicine_id`, `mfg_date`, `expiry_date`, `quantity_received`, `available_quantity`, `purchase_cost`, `warehouse_id`, `quality_status` (`Active`, `Near Expiry`, `Expired`, `Quarantined`, `Recalled`).
3. **`warehouses`**: `id`, `name`, `code`, `type`, `temp_zone`, `address`, `manager`, `phone`, `email`, `capacity_sqft`, `has_cold_storage`, `status`.
4. **`suppliers`**: `id`, `name`, `contact_person`, `email`, `phone`, `tax_reg_no`, `ntn`, `address`, `credit_days`, `outstanding_balance`, `rating`, `status`.
5. **`customers`**: `id`, `name`, `type`, `drug_license_no`, `contact_person`, `email`, `phone`, `tax_reg_no`, `address`, `credit_limit`, `outstanding_receivables`, `status`.
6. **`purchase_orders`** & **`purchase_order_items`**: `id`, `po_number`, `supplier_id`, `warehouse_id`, `order_date`, `delivery_date`, `status`, `subtotal`, `tax`, `discount`, `grand_total`.
7. **`sales_orders`** & **`sales_order_items`** & **`sales_order_batch_allocations`**: `id`, `so_number`, `customer_id`, `warehouse_id`, `order_date`, `status`, `grand_total`, `allocated_batch_id`, `allocated_qty`.
8. **`sales_invoices`** & **`invoice_items`**: `id`, `invoice_number`, `order_id`, `customer_id`, `invoice_date`, `due_date`, `subtotal`, `tax`, `grand_total`, `paid_amount`, `balance_due`, `payment_status`.
9. **`stock_movements`**: `id`, `timestamp`, `type`, `medicine_id`, `batch_id`, `quantity`, `warehouse_id`, `reference_no`, `user_id`, `notes`.
10. **`payments`**: `id`, `type`, `party_id`, `party_type`, `date`, `amount`, `payment_method`, `ref_no`, `invoice_ref`.
11. **`expenses`**: `id`, `date`, `category`, `title`, `amount`, `payment_method`, `ref_no`, `approved_by`.

### Primary API Endpoints Required
- `GET /api/v1/medicines`, `POST /api/v1/medicines`, `PUT /api/v1/medicines/:id`, `DELETE /api/v1/medicines/:id`
- `GET /api/v1/batches`, `PATCH /api/v1/batches/:id/status` (Quality quarantine & recall)
- `GET /api/v1/inventory/overview`, `POST /api/v1/inventory/adjust`, `POST /api/v1/inventory/transfer`
- `GET /api/v1/procurement/orders`, `POST /api/v1/procurement/orders`, `PATCH /api/v1/procurement/orders/:id/approve`
- `POST /api/v1/procurement/orders/:id/receive` (Goods Receiving GRN with batch creation)
- `POST /api/v1/sales/orders` (With atomic database-level FEFO lot locking and transaction rollback)
- `GET /api/v1/sales/invoices/:id/pdf`
- `POST /api/v1/sales/returns`
- `POST /api/v1/payments/customer`, `POST /api/v1/payments/supplier`
- `GET /api/v1/reports/:reportType` (With streaming CSV/Excel download)

---

## 5. Design & Compliance Principles

- **Enterprise Aesthetic**: Professional slate, white, deep navy `#0f172a`, and clean clinical teal `#0d9488`.
- **Clean Density**: Information-dense tables with subtle borders, numeric alignments, and status indicators.
- **Responsiveness**: Fully responsive with mobile slide-out navigation drawers, responsive tables, and touch-friendly controls.
- **Traceability**: All inventory changes record who, what, when, and which batch lot was affected.
