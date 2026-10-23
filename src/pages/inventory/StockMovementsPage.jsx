// src/pages/inventory/StockMovementsPage.jsx
import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

export default function StockMovementsPage() {
  const { data } = usePharma();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const movementTypes = [
    'Purchase receipt',
    'Sales issue',
    'Sales return',
    'Adjustment',
    'Warehouse transfer',
  ];

  const filteredMovements = useMemo(() => {
    return data.stockMovements.filter((mov) => {
      const matchesSearch =
        mov.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.performedBy && mov.performedBy.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'ALL' || mov.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [data.stockMovements, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredMovements.length / pageSize) || 1;
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredMovements.map((m) => ({
      Timestamp: m.timestamp,
      MovementType: m.type,
      MedicineName: m.medicineName,
      BatchNumber: m.batchNumber,
      Quantity: m.quantity,
      WarehouseFacility: m.warehouseName,
      DocumentReference: m.reference,
      PerformedBy: m.performedBy,
      AuditNotes: m.notes,
    }));
    exportToCSV('Inventory_Stock_Movement_Audit_Log', rows);
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'Purchase receipt':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Sales issue':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'Sales return':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'Adjustment':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Warehouse transfer':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Stock Movement Audit Trail</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredMovements.length} log entries
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete tamper-evident inventory movement history across purchase receipts, dispatches, and warehouse transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export Audit Log
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search medicine, batch #, ref # or user..."
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
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Movement Types</option>
              {movementTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500 font-medium">
            <span>Showing verified chronological logs</span>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedMovements.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No movements found"
            description="No transactions match your search filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-3 font-semibold">Transaction Type</th>
                  <th className="py-3 px-3 font-semibold">Medicine</th>
                  <th className="py-3 px-3 font-semibold">Batch Number</th>
                  <th className="py-3 px-3 font-semibold text-center">Qty Change</th>
                  <th className="py-3 px-3 font-semibold">Facility / Depot</th>
                  <th className="py-3 px-3 font-semibold">Document Ref</th>
                  <th className="py-3 px-3 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMovements.map((mov) => {
                  const isPositive = mov.quantity > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {mov.timestamp}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getTypeStyle(
                            mov.type
                          )}`}
                        >
                          {mov.type}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900">{mov.medicineName}</td>

                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {mov.batchNumber}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isPositive ? 'text-emerald-600' : 'text-slate-800'
                          }`}
                        >
                          {isPositive ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                        {mov.warehouseName}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] font-medium text-teal-700">
                        {mov.reference}
                      </td>

                      <td className="py-3 px-3 text-slate-600">{mov.performedBy || 'System'}</td>

                      <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[200px]">
                        {mov.notes}
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
          totalItems={filteredMovements.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
