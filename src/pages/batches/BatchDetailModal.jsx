// src/pages/batches/BatchDetailModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, evaluateBatchStatus, getDaysUntilExpiry } from '../../services/pharmaService';
import { Layers, ShieldCheck, AlertTriangle, Thermometer, Calendar } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

export default function BatchDetailModal({ isOpen, onClose, batch }) {
  const { data, updateBatchStatus } = usePharma();
  const [selectedStatus, setSelectedStatus] = useState(batch?.qualityStatus || 'Active');

  if (!batch) return null;

  const currentStatus = evaluateBatchStatus(batch);
  const daysLeft = getDaysUntilExpiry(batch.expiryDate);
  const wh = data.warehouses.find((w) => w.id === batch.warehouseId);

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    updateBatchStatus(batch.id, newStatus);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Batch Inspection: ${batch.batchNumber}`}
      subtitle={`Product: ${batch.medicineName}`}
      size="lg"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Status Callout Banner */}
        <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Evaluated Quality Status:</span>
              <Badge status={currentStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {daysLeft <= 0
                ? 'Batch is EXPIRED. Sales allocation strictly prevented by FEFO engine.'
                : daysLeft <= 90
                ? `Near expiration (${daysLeft} days remaining). Prioritized by FEFO engine.`
                : `Active and stable (${daysLeft} days remaining until expiration).`}
            </p>
          </div>

          {/* QA Override Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">QA Override:</span>
            <select
              value={batch.qualityStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Active">Active (Release)</option>
              <option value="Quarantined">Quarantine (QC Hold)</option>
              <option value="Recalled">Regulatory Recall</option>
            </select>
          </div>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Received Units</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">{batch.quantityReceived}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Available Stock</span>
            <p className="text-base font-bold text-teal-700 mt-0.5">{batch.availableQuantity} units</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Unit Cost</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {formatCurrency(batch.purchaseCost)}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Total Lot Value</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {formatCurrency(batch.availableQuantity * batch.purchaseCost)}
            </p>
          </div>
        </div>

        {/* Specifications & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Lifecycle Dates</span>
            </h4>
            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Manufacturing Date:</span>
                <span className="font-medium text-slate-800">{batch.mfgDate}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Expiry Date:</span>
                <span className="font-bold text-slate-900">{batch.expiryDate}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Days to Expiration:</span>
                <span
                  className={`font-semibold ${
                    daysLeft <= 0 ? 'text-rose-600' : daysLeft <= 90 ? 'text-amber-600' : 'text-slate-700'
                  }`}
                >
                  {daysLeft} days
                </span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-indigo-600" />
              <span>Warehouse Location</span>
            </h4>
            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Depot Facility:</span>
                <span className="font-medium text-slate-800">{wh?.name || batch.warehouseId}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Temp Zone:</span>
                <span className="font-medium text-slate-800">{wh?.temperatureZone || 'Standard Pharma Ambient'}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Depot Manager:</span>
                <span className="font-medium text-slate-800">{wh?.manager || 'Store Manager'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate of Analysis (COA) Simulation */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Certificate of Analysis (COA) Status: Verified</span>
          </div>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Passed HPLC assay potency (99.4%), dissolution test (Q &gt; 80% at 30 min), microbial limits, and heavy metals screening in compliance with British Pharmacopoeia (BP 2024).
          </p>
        </div>
      </div>
    </Modal>
  );
}
