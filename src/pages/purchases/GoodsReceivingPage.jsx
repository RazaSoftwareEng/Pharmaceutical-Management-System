// src/pages/purchases/GoodsReceivingPage.jsx
import React, { useState, useMemo } from 'react';
import { PackageCheck, Search, Eye, Clock, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import GoodsReceivingModal from './GoodsReceivingModal';
import PODetailModal from './PODetailModal';
import { useNavigate } from 'react-router-dom';

export default function GoodsReceivingPage() {
  const { data } = usePharma();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
  const [selectedPOForReceiving, setSelectedPOForReceiving] = useState(null);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter POs based on tab and search
  const filteredPOs = useMemo(() => {
    return data.purchaseOrders.filter((po) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        po.poNumber.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.warehouseName.toLowerCase().includes(q);

      const matchesTab =
        activeTab === 'pending'
          ? po.status === 'Approved'
          : po.status === 'Completed' || po.status === 'Received';

      return matchesSearch && matchesTab;
    });
  }, [data.purchaseOrders, searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredPOs.length / pageSize) || 1;
  const paginatedPOs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPOs.slice(start, start + pageSize);
  }, [filteredPOs, currentPage, pageSize]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Goods Receiving (GRN) Desk</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredPOs.length} consignments
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Accept approved consignments, generate batch tracking codes, verify cold-chain stability, and post stock to warehouses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={ShoppingCart}
            onClick={() => navigate('/purchases/orders')}
          >
            All Purchase Orders
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('pending');
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-semibold px-2 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Awaiting Physical Receiving ({data.purchaseOrders.filter((p) => p.status === 'Approved').length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('completed');
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-semibold px-2 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed GRN History ({data.purchaseOrders.filter((p) => p.status === 'Completed').length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by PO #, supplier, or destination depot..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedPOs.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title={activeTab === 'pending' ? 'No orders awaiting receiving' : 'No completed receipts'}
            description={
              activeTab === 'pending'
                ? 'All approved purchase orders have already been received and posted to batches.'
                : 'Received consignments will be listed here with batch audit links.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">PO Number</th>
                  <th className="py-3 px-3 font-semibold">Supplier</th>
                  <th className="py-3 px-3 font-semibold">Destination Facility</th>
                  <th className="py-3 px-3 font-semibold">Order Date</th>
                  <th className="py-3 px-3 font-semibold text-center">Items Ordered</th>
                  <th className="py-3 px-3 font-semibold text-right">PO Total</th>
                  <th className="py-3 px-3 font-semibold text-center">GRN Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{po.poNumber}</td>

                    <td className="py-3 px-3 font-medium text-slate-800">{po.supplierName}</td>

                    <td className="py-3 px-3 text-slate-600">{po.warehouseName}</td>

                    <td className="py-3 px-3 text-slate-500">{po.orderDate}</td>

                    <td className="py-3 px-3 text-center text-slate-700 font-semibold">
                      {po.items.reduce((acc, it) => acc + it.quantity, 0)} units ({po.items.length} lines)
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(po.grandTotal)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge status={po.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => setSelectedPOForDetail(po)}
                        >
                          Details
                        </Button>
                        {po.status === 'Approved' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={PackageCheck}
                            onClick={() => setSelectedPOForReceiving(po)}
                          >
                            Receive Goods
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

      {/* Modals */}
      <GoodsReceivingModal
        isOpen={!!selectedPOForReceiving}
        onClose={() => setSelectedPOForReceiving(null)}
        po={selectedPOForReceiving}
      />

      <PODetailModal
        isOpen={!!selectedPOForDetail}
        onClose={() => setSelectedPOForDetail(null)}
        po={selectedPOForDetail}
        onReceiveGoods={(po) => setSelectedPOForReceiving(po)}
      />
    </div>
  );
}
