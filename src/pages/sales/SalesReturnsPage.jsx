// src/pages/sales/SalesReturnsPage.jsx
import React, { useState, useMemo } from 'react';
import { RotateCcw, Plus, Search, Filter, ShieldAlert, Download } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import CreateSalesReturnModal from './CreateSalesReturnModal';

export default function SalesReturnsPage() {
  const { data } = usePharma();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredReturns = useMemo(() => {
    return data.salesReturns.filter((sr) => {
      const q = searchTerm.toLowerCase();
      return (
        sr.returnNumber.toLowerCase().includes(q) ||
        sr.customerName.toLowerCase().includes(q) ||
        sr.medicineName.toLowerCase().includes(q) ||
        sr.batchNumber.toLowerCase().includes(q) ||
        sr.invoiceNumber.toLowerCase().includes(q)
      );
    });
  }, [data.salesReturns, searchTerm]);

  const totalPages = Math.ceil(filteredReturns.length / pageSize) || 1;
  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReturns.slice(start, start + pageSize);
  }, [filteredReturns, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredReturns.map((r) => ({
      ReturnNumber: r.returnNumber,
      InvoiceRef: r.invoiceNumber,
      Customer: r.customerName,
      Date: r.date,
      Medicine: r.medicineName,
      BatchCode: r.batchNumber,
      Quantity: r.quantity,
      RefundCredit: r.refundAmount,
      Reason: r.reason,
      Routing: r.destination,
      Status: r.status,
    }));
    exportToCSV('Sales_Returns_Log', rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Sales Returns & Recalls</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredReturns.length} records
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile hospital/pharmacy returns, credit notes, and automated quarantine routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setIsCreateOpen(true)}
          >
            Process Sales Return
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search return #, customer, medicine, or batch #..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>
              Total Returns Credited:{' '}
              <span className="font-bold text-slate-900">
                {formatCurrency(
                  filteredReturns.reduce((acc, r) => acc + (r.refundAmount || 0), 0)
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedReturns.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No sales returns recorded"
            description="Process a return when items are sent back by hospitals or retail accounts."
            actionLabel="Process Return"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Return #</th>
                  <th className="py-3 px-3 font-semibold">Invoice Ref</th>
                  <th className="py-3 px-3 font-semibold">Customer Account</th>
                  <th className="py-3 px-3 font-semibold">Medicine & Batch</th>
                  <th className="py-3 px-3 font-semibold text-center">Returned Qty</th>
                  <th className="py-3 px-3 font-semibold text-right">Credit Value</th>
                  <th className="py-3 px-3 font-semibold">Inventory Destination</th>
                  <th className="py-3 px-3 font-semibold">Reason</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReturns.map((sr) => (
                  <tr key={sr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {sr.returnNumber}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">{sr.invoiceNumber}</td>

                    <td className="py-3 px-3 font-medium text-slate-900">{sr.customerName}</td>

                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{sr.medicineName}</p>
                      <p className="font-mono text-[10px] text-slate-400">Lot: {sr.batchNumber}</p>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {sr.quantity} units
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(sr.refundAmount)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          sr.destination === 'Quarantine Stock'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {sr.destination}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[180px] truncate">
                      {sr.reason}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge status={sr.status} />
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
          totalItems={filteredReturns.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      <CreateSalesReturnModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
