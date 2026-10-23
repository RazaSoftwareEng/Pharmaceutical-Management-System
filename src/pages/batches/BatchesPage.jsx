// src/pages/batches/BatchesPage.jsx
import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Calendar,
  Building2,
  ShieldAlert,
  ArrowUpDown,
  Download,
  PackagePlus,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, evaluateBatchStatus, getDaysUntilExpiry, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import BatchDetailModal from './BatchDetailModal';
import OpeningStockModal from './OpeningStockModal';

export default function BatchesPage() {
  const { data, currentWarehouseId, updateBatchStatus } = usePharma();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [selectedBatchForDetail, setSelectedBatchForDetail] = useState(null);
  const [isOpeningStockOpen, setIsOpeningStockOpen] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState('expiryDate');
  const [sortOrder, setSortOrder] = useState('asc'); // default asc for FEFO earliest expiry

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter batches
  const filteredBatches = useMemo(() => {
    return data.batches
      .filter((batch) => {
        const status = evaluateBatchStatus(batch);

        const matchesSearch =
          batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.medicineName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === 'ALL'
            ? true
            : statusFilter === 'Sellable'
            ? status === 'Active' || status === 'Near Expiry'
            : status === statusFilter;

        const effectiveWh = warehouseFilter !== 'ALL' ? warehouseFilter : currentWarehouseId;
        const matchesWarehouse = effectiveWh === 'ALL' || batch.warehouseId === effectiveWh;

        return matchesSearch && matchesStatus && matchesWarehouse;
      })
      .sort((a, b) => {
        if (sortBy === 'expiryDate') {
          const tA = new Date(a.expiryDate).getTime();
          const tB = new Date(b.expiryDate).getTime();
          return sortOrder === 'asc' ? tA - tB : tB - tA;
        }
        if (sortBy === 'availableQuantity') {
          return sortOrder === 'asc'
            ? a.availableQuantity - b.availableQuantity
            : b.availableQuantity - a.availableQuantity;
        }
        if (sortBy === 'batchNumber') {
          return sortOrder === 'asc'
            ? a.batchNumber.localeCompare(b.batchNumber)
            : b.batchNumber.localeCompare(a.batchNumber);
        }
        return 0;
      });
  }, [data.batches, searchTerm, statusFilter, warehouseFilter, currentWarehouseId, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1;
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredBatches.map((b) => {
      const wh = data.warehouses.find((w) => w.id === b.warehouseId);
      const st = evaluateBatchStatus(b);
      return {
        BatchNumber: b.batchNumber,
        Medicine: b.medicineName,
        MfgDate: b.mfgDate,
        ExpiryDate: b.expiryDate,
        DaysRemaining: getDaysUntilExpiry(b.expiryDate),
        QuantityReceived: b.quantityReceived,
        AvailableQuantity: b.availableQuantity,
        PurchaseCost: b.purchaseCost,
        LotValue: b.availableQuantity * b.purchaseCost,
        Warehouse: wh?.name || b.warehouseId,
        EvaluatedStatus: st,
      };
    });
    exportToCSV('Pharmaceutical_Batches_Inventory', rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Batch & Expiration Management</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredBatches.length} batches
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lot-level tracking, quarantine enforcement, and strict First Expiry First Out (FEFO) controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" icon={PackagePlus} onClick={() => setIsOpeningStockOpen(true)}>
            Add Opening Stock
          </Button>
        </div>
      </div>

      {/* FEFO & Quality Compliance Banner */}
      <div className="bg-teal-50/60 border border-teal-200/90 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-teal-950">
              FEFO Allocation & Quality Assurance Safeguard Active
            </p>
            <p className="text-teal-800 mt-0.5 leading-snug">
              Orders automatically select the earliest expiring batch. Expired, Quarantined, and Recalled batches are strictly locked from sales orders to ensure cGMP and DRAP compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search batch # or medicine..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          {/* Quality Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Quality Statuses</option>
              <option value="Sellable">Sellable Only (Active + Near Expiry)</option>
              <option value="Active">Active Batches</option>
              <option value="Near Expiry">Near Expiry (≤ 90 Days)</option>
              <option value="Expired">Expired (Ineligible)</option>
              <option value="Quarantined">Quarantined (QC Hold)</option>
              <option value="Recalled">Recalled (Regulatory)</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Depots / Facilities</option>
              {data.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="expiryDate-asc">Sort: Earliest Expiry (FEFO)</option>
              <option value="expiryDate-desc">Sort: Latest Expiry</option>
              <option value="availableQuantity-desc">Sort: Stock Qty (High to Low)</option>
              <option value="availableQuantity-asc">Sort: Stock Qty (Low to High)</option>
              <option value="batchNumber-asc">Sort: Batch Number</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedBatches.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No batches match filters"
            description="Adjust your search criteria or review warehouse selection."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Batch Code</th>
                  <th className="py-3 px-3 font-semibold">Medicine Formulation</th>
                  <th className="py-3 px-3 font-semibold">Mfg Date</th>
                  <th className="py-3 px-3 font-semibold">
                    <button
                      onClick={() => {
                        setSortBy('expiryDate');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Expiry Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold text-center">Remaining</th>
                  <th className="py-3 px-3 font-semibold text-center">Available / Recv</th>
                  <th className="py-3 px-3 font-semibold text-right">Cost</th>
                  <th className="py-3 px-3 font-semibold text-center">Warehouse</th>
                  <th className="py-3 px-3 font-semibold text-center">Quality Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBatches.map((batch) => {
                  const status = evaluateBatchStatus(batch);
                  const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                  const wh = data.warehouses.find((w) => w.id === batch.warehouseId);

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900">{batch.batchNumber}</span>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800">{batch.medicineName}</p>
                      </td>

                      <td className="py-3 px-3 text-slate-500">{batch.mfgDate}</td>

                      <td className="py-3 px-3 font-semibold text-slate-900">{batch.expiryDate}</td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono text-[11px] font-semibold ${
                            daysLeft <= 0
                              ? 'text-rose-600'
                              : daysLeft <= 90
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-900">{batch.availableQuantity}</span>
                        <span className="text-slate-400 text-[10px]"> / {batch.quantityReceived}</span>
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatCurrency(batch.purchaseCost)}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600">
                        <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">
                          {wh?.code || batch.warehouseId}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge status={status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => setSelectedBatchForDetail(batch)}
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBatches.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Batch Inspection Modal */}
      <BatchDetailModal
        isOpen={!!selectedBatchForDetail}
        onClose={() => setSelectedBatchForDetail(null)}
        batch={selectedBatchForDetail}
      />

      {isOpeningStockOpen && <OpeningStockModal isOpen onClose={() => setIsOpeningStockOpen(false)} />}
    </div>
  );
}
