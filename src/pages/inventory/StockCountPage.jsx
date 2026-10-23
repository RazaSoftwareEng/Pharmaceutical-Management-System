// src/pages/inventory/StockCountPage.jsx
import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Search,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

export default function StockCountPage() {
  const { data, adjustStock, showToast, currentWarehouseId } = usePharma();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    currentWarehouseId !== 'ALL' ? currentWarehouseId : data.warehouses[0]?.id || 'WH-01'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Physical counts state: { [batchId]: number }
  const [physicalCounts, setPhysicalCounts] = useState({});

  // Filter batches for selected warehouse
  const warehouseBatches = useMemo(() => {
    return data.batches.filter((b) => {
      const matchesWh = b.warehouseId === selectedWarehouseId;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        b.batchNumber.toLowerCase().includes(q) ||
        b.medicineName.toLowerCase().includes(q);
      return matchesWh && matchesSearch;
    });
  }, [data.batches, selectedWarehouseId, searchTerm]);

  // Compute variance for each item
  const countRows = useMemo(() => {
    return warehouseBatches.map((b) => {
      const physical =
        physicalCounts[b.id] !== undefined
          ? parseInt(physicalCounts[b.id], 10) || 0
          : b.availableQuantity;
      const system = b.availableQuantity;
      const variance = physical - system;
      const varianceValue = variance * b.purchaseCost;

      let status = 'Matched';
      if (variance > 0) status = 'Surplus';
      if (variance < 0) status = 'Deficit';

      return {
        batchId: b.id,
        batchNumber: b.batchNumber,
        medicineName: b.medicineName,
        mfgDate: b.mfgDate,
        expiryDate: b.expiryDate,
        purchaseCost: b.purchaseCost,
        systemCount: system,
        physicalCount: physical,
        variance,
        varianceValue,
        status,
      };
    });
  }, [warehouseBatches, physicalCounts]);

  const handlePhysicalCountChange = (batchId, value) => {
    setPhysicalCounts((prev) => ({
      ...prev,
      [batchId]: value === '' ? '' : parseInt(value, 10) || 0,
    }));
  };

  // Reconcile and apply adjustments to batches
  const handleReconcileAll = () => {
    const discrepancies = countRows.filter((r) => r.variance !== 0);

    if (discrepancies.length === 0) {
      showToast('All physical counts match system records. No adjustments required.', 'info');
      return;
    }

    discrepancies.forEach((d) => {
      adjustStock({
        batchId: d.batchId,
        quantityChange: d.variance,
        reason: 'Physical Cycle Count Audit Reconciliation',
        notes: `Reconciled physical count ${d.physicalCount} vs system ${d.systemCount}. Net delta: ${d.variance} units.`,
      });
    });

    setPhysicalCounts({});
    showToast(
      `Cycle count reconciliation complete: ${discrepancies.length} lot discrepancies updated in inventory and logged to audit trail.`,
      'success',
      4500
    );
  };

  const matchedCount = countRows.filter((r) => r.variance === 0).length;
  const discrepantCount = countRows.filter((r) => r.variance !== 0).length;
  const netVarianceValue = countRows.reduce((acc, r) => acc + r.varianceValue, 0);

  const handleExportCSV = () => {
    const wh = data.warehouses.find((w) => w.id === selectedWarehouseId);
    const rows = countRows.map((r) => ({
      Warehouse: wh?.name || selectedWarehouseId,
      BatchNumber: r.batchNumber,
      Medicine: r.medicineName,
      ExpiryDate: r.expiryDate,
      SystemCount: r.systemCount,
      PhysicalCount: r.physicalCount,
      Variance: r.variance,
      VarianceValue: r.varianceValue,
      AuditStatus: r.status,
    }));
    exportToCSV(`Stock_Cycle_Count_Audit_${selectedWarehouseId}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Physical Stock Count & Cycle Audit</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {countRows.length} audit lots
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile physical warehouse bin counts against live system inventory in compliance with cGMP auditing protocols.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export Audit Sheet
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Save}
            onClick={handleReconcileAll}
            disabled={discrepantCount === 0}
          >
            Post Reconciliation ({discrepantCount})
          </Button>
        </div>
      </div>

      {/* Warehouse Selector & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Select Warehouse Facility to Audit
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setPhysicalCounts({});
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-800"
            >
              {data.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Search Batch or Medicine
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by lot number or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards for Audit */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Lots in Audit"
          value={countRows.length}
          subtitle="Batches in this depot"
          icon={ClipboardCheck}
          color="blue"
        />

        <StatCard
          title="Matching Lots"
          value={matchedCount}
          subtitle="Physical = System count"
          icon={CheckCircle2}
          color="teal"
        />

        <StatCard
          title="Discrepancies"
          value={discrepantCount}
          subtitle="Surplus or shortages"
          icon={AlertTriangle}
          color={discrepantCount > 0 ? 'rose' : 'slate'}
        />

        <StatCard
          title="Net Variance Impact"
          value={formatCurrency(netVarianceValue)}
          subtitle="Net value adjustment"
          icon={Building2}
          color={netVarianceValue < 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Discrepancy Notice */}
      {discrepantCount > 0 && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>{discrepantCount} variance discrepancies detected.</strong> Click &ldquo;Post Reconciliation&rdquo; to automatically post corrective inventory adjustments to the audit trail.
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReconcileAll}>
            Reconcile Discrepancies
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {countRows.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No batches found in this facility"
            description="Select another warehouse or adjust your search filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Batch Code</th>
                  <th className="py-3 px-3 font-semibold">Medicine Formulation</th>
                  <th className="py-3 px-3 font-semibold">Expiry Date</th>
                  <th className="py-3 px-3 font-semibold text-right">Unit Cost</th>
                  <th className="py-3 px-3 font-semibold text-center w-28">System Qty</th>
                  <th className="py-3 px-3 font-semibold text-center w-32">Physical Count</th>
                  <th className="py-3 px-3 font-semibold text-center">Variance (Units)</th>
                  <th className="py-3 px-3 font-semibold text-right">Variance Value</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {countRows.map((row) => (
                  <tr
                    key={row.batchId}
                    className={`transition-colors ${
                      row.variance !== 0 ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {row.batchNumber}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">{row.medicineName}</td>

                    <td className="py-3 px-3 text-slate-500">{row.expiryDate}</td>

                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatCurrency(row.purchaseCost)}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-700 bg-slate-50/70">
                      {row.systemCount}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={row.physicalCount}
                        onChange={(e) => handlePhysicalCountChange(row.batchId, e.target.value)}
                        className={`w-24 text-xs font-mono font-bold text-center rounded-lg border py-1.5 px-2 outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                          row.variance !== 0
                            ? 'border-amber-400 bg-amber-50/50 text-amber-900'
                            : 'border-slate-300 bg-white text-slate-900'
                        }`}
                      />
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-mono font-bold text-xs ${
                          row.variance === 0
                            ? 'text-slate-400'
                            : row.variance > 0
                            ? 'text-emerald-600 font-extrabold'
                            : 'text-rose-600 font-extrabold'
                        }`}
                      >
                        {row.variance > 0 ? `+${row.variance}` : row.variance}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium">
                      <span
                        className={
                          row.varianceValue === 0
                            ? 'text-slate-400'
                            : row.varianceValue > 0
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }
                      >
                        {formatCurrency(row.varianceValue)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge
                        status={
                          row.status === 'Matched'
                            ? 'Active'
                            : row.status === 'Surplus'
                            ? 'Completed'
                            : 'Expired'
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
