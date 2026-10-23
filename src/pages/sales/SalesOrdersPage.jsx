// src/pages/sales/SalesOrdersPage.jsx
import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Receipt,
  Download,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import CreateSalesOrderModal from './CreateSalesOrderModal';
import SalesOrderDetailModal from './SalesOrderDetailModal';
import { useNavigate } from 'react-router-dom';

export default function SalesOrdersPage() {
  const { data } = usePharma();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  const filteredOrders = useMemo(() => {
    return data.salesOrders.filter((so) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        so.soNumber.toLowerCase().includes(q) ||
        so.customerName.toLowerCase().includes(q) ||
        (so.warehouseName && so.warehouseName.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || so.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.salesOrders, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredOrders.map((o) => ({
      OrderNumber: o.soNumber,
      Customer: o.customerName,
      Warehouse: o.warehouseName,
      OrderDate: o.orderDate,
      ItemsCount: o.items.length,
      GrandTotal: o.grandTotal,
      Status: o.status,
      InvoiceRef: o.invoiceId || 'N/A',
    }));
    exportToCSV('Sales_Orders_Log', rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Sales Orders & Dispatches</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredOrders.length} orders
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hospital deliveries and retail distribution with automated First Expiry First Out (FEFO) batch deductions.
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
            Create Sales Order
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
              placeholder="Search by SO #, customer, or depot..."
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
              <option value="ALL">All Order Statuses</option>
              <option value="Confirmed">Confirmed & Dispatched</option>
              <option value="Draft">Draft Orders</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>
              Total Invoiced Revenue:{' '}
              <span className="font-bold text-teal-700">
                {formatCurrency(
                  filteredOrders.reduce((acc, so) => acc + (so.grandTotal || 0), 0)
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedOrders.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No sales orders found"
            description="Adjust your search criteria or create a new sales dispatch order."
            actionLabel="Create Sales Order"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">SO Number</th>
                  <th className="py-3 px-3 font-semibold">Customer Account</th>
                  <th className="py-3 px-3 font-semibold">Source Facility</th>
                  <th className="py-3 px-3 font-semibold">Order Date</th>
                  <th className="py-3 px-3 font-semibold text-center">Items</th>
                  <th className="py-3 px-3 font-semibold text-right">Grand Total</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.map((so) => (
                  <tr key={so.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{so.soNumber}</td>

                    <td className="py-3 px-3 font-medium text-slate-800">{so.customerName}</td>

                    <td className="py-3 px-3 text-slate-600">{so.warehouseName}</td>

                    <td className="py-3 px-3 text-slate-500">{so.orderDate}</td>

                    <td className="py-3 px-3 text-center text-slate-700">
                      <span className="font-semibold">{so.items.length} items</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(so.grandTotal)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge status={so.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => setSelectedOrderForDetail(so)}
                        >
                          View
                        </Button>
                        {so.invoiceId && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Receipt}
                            onClick={() => navigate('/sales/invoices')}
                          >
                            Invoice
                          </Button>
                        )}
                      </div>
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
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals */}
      <CreateSalesOrderModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <SalesOrderDetailModal
        isOpen={!!selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        order={selectedOrderForDetail}
        onViewInvoice={(invId) => navigate('/sales/invoices')}
      />
    </div>
  );
}
