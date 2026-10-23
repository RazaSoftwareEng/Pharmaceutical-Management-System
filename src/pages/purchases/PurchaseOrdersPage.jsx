// src/pages/purchases/PurchaseOrdersPage.jsx
import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  PackageCheck,
  Download,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import CreatePOModal from './CreatePOModal';
import PODetailModal from './PODetailModal';
import GoodsReceivingModal from './GoodsReceivingModal';

export default function PurchaseOrdersPage() {
  const { data } = usePharma();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);
  const [selectedPOForReceiving, setSelectedPOForReceiving] = useState(null);

  const filteredPOs = useMemo(() => {
    return data.purchaseOrders.filter((po) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        po.poNumber.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.warehouseName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.purchaseOrders, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPOs.length / pageSize) || 1;
  const paginatedPOs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPOs.slice(start, start + pageSize);
  }, [filteredPOs, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredPOs.map((p) => ({
      PONumber: p.poNumber,
      Supplier: p.supplierName,
      Warehouse: p.warehouseName,
      OrderDate: p.orderDate,
      ExpectedDelivery: p.expectedDeliveryDate,
      Status: p.status,
      ItemsCount: p.items.length,
      GrandTotal: p.grandTotal,
      ReceivedDate: p.receivedDate || 'Pending',
    }));
    exportToCSV('Purchase_Orders_Register', rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Purchase Orders</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredPOs.length} orders
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Procurement workflow: Draft → Pending Approval → Approved → Goods Receiving → Completed.
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
            Create Purchase Order
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
              placeholder="Search PO #, supplier, or depot..."
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
              <option value="ALL">All PO Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved (Ready for GRN)</option>
              <option value="Completed">Completed / Received</option>
              <option value="Draft">Drafts</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>
              Total Procurement Value:{' '}
              <span className="font-bold text-slate-900">
                {formatCurrency(filteredPOs.reduce((acc, p) => acc + (p.grandTotal || 0), 0))}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedPOs.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No purchase orders found"
            description="Adjust your search criteria or create a new purchase order."
            actionLabel="Create PO"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">PO Number</th>
                  <th className="py-3 px-3 font-semibold">Supplier Name</th>
                  <th className="py-3 px-3 font-semibold">Destination Facility</th>
                  <th className="py-3 px-3 font-semibold">Order Date</th>
                  <th className="py-3 px-3 font-semibold">Delivery Target</th>
                  <th className="py-3 px-3 font-semibold text-center">Lines</th>
                  <th className="py-3 px-3 font-semibold text-right">Grand Total</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{po.poNumber}</td>

                    <td className="py-3 px-3 font-medium text-slate-800">{po.supplierName}</td>

                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                      {po.warehouseName}
                    </td>

                    <td className="py-3 px-3 text-slate-500">{po.orderDate}</td>

                    <td className="py-3 px-3 text-slate-600">
                      {po.expectedDeliveryDate || 'Standard'}
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {po.items.length} items
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(po.grandTotal)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge status={po.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => setSelectedPOForDetail(po)}
                        >
                          View
                        </Button>
                        {po.status === 'Approved' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={PackageCheck}
                            onClick={() => setSelectedPOForReceiving(po)}
                          >
                            Receive
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
          totalItems={filteredPOs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Create PO Modal */}
      <CreatePOModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* PO Detail Modal */}
      <PODetailModal
        isOpen={!!selectedPOForDetail}
        onClose={() => setSelectedPOForDetail(null)}
        po={selectedPOForDetail}
        onReceiveGoods={(po) => setSelectedPOForReceiving(po)}
      />

      {/* Goods Receiving Modal */}
      <GoodsReceivingModal
        isOpen={!!selectedPOForReceiving}
        onClose={() => setSelectedPOForReceiving(null)}
        po={selectedPOForReceiving}
      />
    </div>
  );
}
