// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';

// Page components
import DashboardPage from '../pages/dashboard/DashboardPage';
import MedicinesPage from '../pages/medicines/MedicinesPage';
import BatchesPage from '../pages/batches/BatchesPage';
import StockOverviewPage from '../pages/inventory/StockOverviewPage';
import StockMovementsPage from '../pages/inventory/StockMovementsPage';
import StockCountPage from '../pages/inventory/StockCountPage';
import WarehousesPage from '../pages/warehouses/WarehousesPage';
import SuppliersPage from '../pages/suppliers/SuppliersPage';
import PurchaseOrdersPage from '../pages/purchases/PurchaseOrdersPage';
import GoodsReceivingPage from '../pages/purchases/GoodsReceivingPage';
import CustomersPage from '../pages/customers/CustomersPage';
import SalesOrdersPage from '../pages/sales/SalesOrdersPage';
import SalesInvoicesPage from '../pages/sales/SalesInvoicesPage';
import SalesReturnsPage from '../pages/sales/SalesReturnsPage';
import AccountsPage from '../pages/accounts/AccountsPage';
import ExpensesPage from '../pages/accounts/ExpensesPage';
import ReportsPage from '../pages/reports/ReportsPage';
import EmployeesPage from '../pages/employees/EmployeesPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import SalesTeamPage from '../pages/sales/SalesTeamPage';
import RecoveryPage from '../pages/accounts/RecoveryPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="inventory/stock" element={<StockOverviewPage />} />
        <Route path="inventory/movements" element={<StockMovementsPage />} />
        <Route path="inventory/count" element={<StockCountPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="purchases/orders" element={<PurchaseOrdersPage />} />
        <Route path="purchases/receiving" element={<GoodsReceivingPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="sales/orders" element={<SalesOrdersPage />} />
        <Route path="sales/invoices" element={<SalesInvoicesPage />} />
        <Route path="sales/returns" element={<SalesReturnsPage />} />
        <Route path="sales/team" element={<SalesTeamPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="accounts/expenses" element={<ExpensesPage />} />
        <Route path="accounts/recovery" element={<RecoveryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
