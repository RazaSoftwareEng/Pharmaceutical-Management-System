// src/pages/sales/SalesInvoicesPage.jsx
import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  CreditCard,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import SalesInvoicePrintModal from './SalesInvoicePrintModal';

export default function SalesInvoicesPage() {
  const { data } = usePharma();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);

  const filteredInvoices = useMemo(() => {
    return data.salesInvoices.filter((inv) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.salesInvoices, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredInvoices.map((inv) => ({
      InvoiceNumber: inv.invoiceNumber,
      OrderNumber: inv.orderNumber,
      Customer: inv.customerName,
      InvoiceDate: inv.invoiceDate,
      DueDate: inv.dueDate,
      GrandTotal: inv.grandTotal,
      PaidAmount: inv.paidAmount,
      BalanceDue: inv.balanceDue,
      PaymentStatus: inv.paymentStatus,
    }));
    exportToCSV('Sales_Tax_Invoices_Register', rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Sales Invoices</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredInvoices.length} invoices
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Commercial tax invoices with regulatory batch trace, payment tracking, and print templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice #, order #, or customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Settlement Statuses</option>
              <option value="Unpaid">Unpaid Invoices</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Fully Settled</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>
              Outstanding Receivables:{' '}
              <span className="font-bold text-teal-700">
                {formatCurrency(
                  filteredInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0)
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedInvoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No sales invoices found"
            description="Invoices are automatically created when sales dispatch orders are confirmed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-3 font-semibold">Order Ref</th>
                  <th className="py-3 px-3 font-semibold">Customer Account</th>
                  <th className="py-3 px-3 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold">Due Date</th>
                  <th className="py-3 px-3 font-semibold text-right">Grand Total</th>
                  <th className="py-3 px-3 font-semibold text-right">Balance Due</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-500">{inv.orderNumber}</td>

                    <td className="py-3 px-3 font-medium text-slate-800">{inv.customerName}</td>

                    <td className="py-3 px-3 text-slate-500">{inv.invoiceDate}</td>

                    <td className="py-3 px-3 text-slate-600 font-medium">{inv.dueDate}</td>

                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(inv.balanceDue)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge status={inv.paymentStatus} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Printer}
                        onClick={() => setSelectedInvoiceForPrint(inv)}
                      >
                        Print Invoice
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredInvoices.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Invoice Print & Preview Modal */}
      <SalesInvoicePrintModal
        isOpen={!!selectedInvoiceForPrint}
        onClose={() => setSelectedInvoiceForPrint(null)}
        invoice={selectedInvoiceForPrint}
      />
    </div>
  );
}
