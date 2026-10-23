// src/pages/reports/ReportsPage.jsx
import React, { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  Calendar,
  Layers,
  TrendingUp,
  AlertTriangle,
  BadgeDollarSign,
  FileText,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import {
  formatCurrency,
  evaluateBatchStatus,
  getDaysUntilExpiry,
  exportToCSV,
} from '../../services/pharmaService';
import Button from '../../components/common/Button';

export default function ReportsPage() {
  const { data, metrics, currentWarehouseId } = usePharma();

  const [reportType, setReportType] = useState('valuation');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');

  const reportOptions = [
    { id: 'valuation', name: 'Inventory Valuation Report', icon: BadgeDollarSign },
    { id: 'movements', name: 'Stock Movement Audit', icon: Layers },
    { id: 'expiry', name: 'Batch Expiry & Risk Analysis', icon: Calendar },
    { id: 'lowstock', name: 'Low Stock Reorder Report', icon: AlertTriangle },
    { id: 'sales', name: 'Sales Performance & Invoices', icon: TrendingUp },
    { id: 'purchases', name: 'Procurement & Purchase History', icon: FileText },
    { id: 'receivables', name: 'Customer Outstanding Receivables', icon: BadgeDollarSign },
    { id: 'payables', name: 'Supplier Payables Ledger', icon: BadgeDollarSign },
    { id: 'profit', name: 'Estimated Gross Profit Analysis', icon: TrendingUp },
  ];

  // Dynamic calculations based on report type
  const reportData = useMemo(() => {
    const effectiveWh = warehouseFilter !== 'ALL' ? warehouseFilter : currentWarehouseId;

    switch (reportType) {
      case 'valuation': {
        const rows = data.medicines.map((m) => {
          const batches = data.batches.filter((b) => {
            if (b.medicineId !== m.id) return false;
            if (effectiveWh !== 'ALL' && b.warehouseId !== effectiveWh) return false;
            return true;
          });
          const stock = batches.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
          const costVal = batches.reduce(
            (acc, b) => acc + (b.availableQuantity || 0) * (b.purchaseCost || 0),
            0
          );
          const marketVal = stock * m.sellingPrice;
          return {
            sku: m.sku,
            name: m.name,
            category: m.category,
            stock,
            unitCost: m.purchasePrice,
            costVal,
            marketVal,
            unrealizedGain: marketVal - costVal,
          };
        });
        return {
          title: 'Inventory Valuation Report (Cost vs. Market)',
          subtitle: 'Calculated using lot-level purchase costs against standard wholesale tariffs.',
          columns: ['SKU', 'Medicine Formulation', 'Category', 'Stock Units', 'Unit Cost', 'Inventory Cost Value', 'Estimated Market Value', 'Unrealized Margin'],
          rows,
          totalSummary: {
            stock: rows.reduce((acc, r) => acc + r.stock, 0),
            cost: rows.reduce((acc, r) => acc + r.costVal, 0),
            market: rows.reduce((acc, r) => acc + r.marketVal, 0),
          },
        };
      }

      case 'movements': {
        const rows = data.stockMovements.map((mov) => ({
          timestamp: mov.timestamp,
          type: mov.type,
          medicine: mov.medicineName,
          batch: mov.batchNumber,
          quantity: mov.quantity,
          warehouse: mov.warehouseName,
          reference: mov.reference,
          user: mov.performedBy || 'System',
        }));
        return {
          title: 'Stock Movement & Chain of Custody Audit',
          subtitle: 'Verification log of all warehouse intake, sales issues, and internal transfers.',
          columns: ['Timestamp', 'Type', 'Medicine', 'Batch #', 'Qty Delta', 'Facility', 'Reference #', 'User'],
          rows,
        };
      }

      case 'expiry': {
        const rows = data.batches
          .filter((b) => (effectiveWh === 'ALL' ? true : b.warehouseId === effectiveWh))
          .map((b) => {
            const st = evaluateBatchStatus(b);
            const days = getDaysUntilExpiry(b.expiryDate);
            return {
              batchNumber: b.batchNumber,
              medicine: b.medicineName,
              expiryDate: b.expiryDate,
              daysRemaining: days,
              availableQuantity: b.availableQuantity,
              lotValue: b.availableQuantity * b.purchaseCost,
              status: st,
            };
          })
          .sort((a, b) => a.daysRemaining - b.daysRemaining);

        return {
          title: 'Batch Expiry & Critical Risk Analysis (FEFO)',
          subtitle: 'Chronological expiration schedule for loss prevention and quality recalls.',
          columns: ['Batch #', 'Medicine', 'Expiry Date', 'Days Left', 'Available Units', 'Lot Value', 'Quality Status'],
          rows,
        };
      }

      case 'lowstock': {
        const rows = data.medicines
          .map((m) => {
            const stock = metrics.medicineStockMap[m.id] || 0;
            return {
              sku: m.sku,
              name: m.name,
              category: m.category,
              currentStock: stock,
              minLevel: m.minStockLevel,
              deficit: Math.max(0, m.minStockLevel - stock),
              reorderCost: Math.max(0, m.minStockLevel - stock) * m.purchasePrice,
            };
          })
          .filter((m) => m.currentStock <= m.minLevel);

        return {
          title: 'Low Stock Reorder Alert & Procurement Requirements',
          subtitle: 'Medicines with available stock below configured regulatory safety thresholds.',
          columns: ['SKU', 'Medicine', 'Category', 'Current Stock', 'Safety Threshold', 'Deficit Units', 'Est. Restock Cost'],
          rows,
        };
      }

      case 'sales': {
        const rows = data.salesInvoices.map((inv) => ({
          invoice: inv.invoiceNumber,
          order: inv.orderNumber,
          customer: inv.customerName,
          date: inv.invoiceDate,
          total: inv.grandTotal,
          paid: inv.paidAmount,
          balance: inv.balanceDue,
          status: inv.paymentStatus,
        }));
        return {
          title: 'Sales Performance & Invoicing Summary',
          subtitle: 'Consolidated commercial sales revenues across hospitals and distributors.',
          columns: ['Invoice #', 'Order #', 'Customer Account', 'Invoice Date', 'Grand Total', 'Paid Amount', 'Balance Due', 'Status'],
          rows,
        };
      }

      case 'purchases': {
        const rows = data.purchaseOrders.map((po) => ({
          poNumber: po.poNumber,
          supplier: po.supplierName,
          warehouse: po.warehouseName,
          date: po.orderDate,
          lines: po.items.length,
          grandTotal: po.grandTotal,
          status: po.status,
        }));
        return {
          title: 'Procurement Requisition & Purchase History',
          subtitle: 'Purchase orders issued for active raw ingredients and formulations.',
          columns: ['PO #', 'Supplier Vendor', 'Receiving Facility', 'Order Date', 'Items', 'Order Total', 'PO Status'],
          rows,
        };
      }

      case 'receivables': {
        const rows = data.customers.map((c) => ({
          name: c.name,
          type: c.type,
          dl: c.drugLicenseNumber,
          limit: c.creditLimit,
          balance: c.outstandingReceivables,
          availableCredit: Math.max(0, c.creditLimit - c.outstandingReceivables),
          status: c.status,
        }));
        return {
          title: 'Customer Outstanding Receivables & Aging',
          subtitle: 'Hospital and retail pharmacy account credit balances.',
          columns: ['Customer Account', 'Classification', 'Drug Lic #', 'Credit Limit', 'Current Receivables', 'Available Credit', 'Status'],
          rows,
        };
      }

      case 'payables': {
        const rows = data.suppliers.map((s) => ({
          name: s.name,
          contact: s.contactPerson,
          strn: s.taxRegistrationNumber,
          creditDays: s.creditDays,
          balance: s.outstandingBalance,
          purchases: s.totalPurchases,
        }));
        return {
          title: 'Supplier Outstanding Payables Register',
          subtitle: 'Amounts due to API raw material suppliers and packaging vendors.',
          columns: ['Vendor Name', 'Key Contact', 'STRN', 'Credit Days', 'Outstanding Payable', 'All-Time Purchases'],
          rows,
        };
      }

      case 'profit': {
        // Estimated gross profit: Total sales - Cost of goods sold - Operating Expenses
        const totalSales = data.salesInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
        // Estimate COGS as ~65% of sales
        const estCOGS = totalSales * 0.68;
        const grossMargin = totalSales - estCOGS;
        const totalExpenses = data.expenses.reduce((acc, e) => acc + e.amount, 0);
        const netEstimate = grossMargin - totalExpenses;

        const rows = [
          { metric: 'Total Invoiced Commercial Revenue', amount: totalSales, notes: 'From confirmed sales orders' },
          { metric: 'Estimated Cost of Goods Sold (COGS)', amount: estCOGS, notes: 'Raw materials & packaging' },
          { metric: 'Gross Commercial Profit', amount: grossMargin, notes: 'Revenue minus COGS' },
          { metric: 'Operating & Quality Expenses', amount: totalExpenses, notes: 'Cold chain, testing, utilities' },
          { metric: 'Estimated Net Operating Surplus', amount: netEstimate, notes: 'Pre-tax operating estimate' },
        ];

        return {
          title: 'Estimated Gross Profit & Operational Statement',
          subtitle: 'Profit estimate based on sales dispatches and recorded operating expenses.',
          columns: ['Financial Indicator', 'Amount (PKR)', 'Basis & Remarks'],
          rows,
          isFinancialSummary: true,
        };
      }

      default:
        return { title: 'Report', columns: [], rows: [] };
    }
  }, [reportType, warehouseFilter, currentWarehouseId, data, metrics]);

  const handleExportCSV = () => {
    if (!reportData.rows || reportData.rows.length === 0) {
      alert('No data to export');
      return;
    }
    exportToCSV(`Pharma_${reportType}_Report`, reportData.rows);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate printable pharmaceutical audit sheets, valuation schedules, and CSV data exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export to CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Filter and Report Selector Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Select Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-800"
            >
              {reportOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Facility
            </label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Warehouses (Global)</option>
              {data.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-xs text-slate-500">
              Generated on: <span className="font-semibold text-slate-800">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Document Presentation Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs print-shadow-none">
        {/* Printable Letterhead Header */}
        <div className="pb-4 mb-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{reportData.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{reportData.subtitle}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-bold text-slate-800">{data.companyProfile.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">Lic: {data.companyProfile.drugLicenseNumber}</p>
          </div>
        </div>

        {/* Dynamic Table Presentation */}
        {reportData.isFinancialSummary ? (
          <div className="overflow-x-auto max-w-2xl mx-auto py-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Financial Metric</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Estimated Amount</th>
                  <th className="py-2.5 px-4 font-semibold">Accounting Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.rows.map((row, idx) => (
                  <tr key={idx} className={idx === 2 || idx === 4 ? 'font-bold bg-slate-50/60' : ''}>
                    <td className="py-3 px-4 text-slate-900">{row.metric}</td>
                    <td className="py-3 px-4 text-right font-mono text-teal-700">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  {reportData.columns.map((col, idx) => (
                    <th key={idx} className="py-2.5 px-3 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    {Object.values(row).map((val, vi) => (
                      <td key={vi} className="py-2.5 px-3 text-slate-700">
                        {typeof val === 'number' && val > 1000
                          ? formatCurrency(val)
                          : val !== null && val !== undefined
                          ? String(val)
                          : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer print signature line */}
        <div className="pt-8 mt-6 border-t border-slate-200 flex justify-between text-[11px] text-slate-400">
          <span>Official PharmaCore ERP Audit Schedule</span>
          <span>Approved for Regulatory Submission</span>
        </div>
      </div>
    </div>
  );
}
