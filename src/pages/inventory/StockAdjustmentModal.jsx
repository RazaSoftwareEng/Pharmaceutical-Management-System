// src/pages/inventory/StockAdjustmentModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { usePharma } from '../../context/PharmaContext';

export default function StockAdjustmentModal({ isOpen, onClose, defaultBatchId = null }) {
  const { data, adjustStock } = usePharma();

  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId || (data.batches[0]?.id ?? ''));
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'subtract'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Physical Audit Count Reconciliation');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectedBatch = data.batches.find((b) => b.id === selectedBatchId);

  const handleSubmit = (e) => {
    e.preventDefault();
    const qtyNum = parseInt(quantity, 10);
    if (!qtyNum || qtyNum <= 0) {
      setError('Please specify a positive integer quantity to adjust');
      return;
    }
    if (adjustmentType === 'subtract' && selectedBatch && selectedBatch.availableQuantity < qtyNum) {
      setError(`Cannot deduct ${qtyNum} units; batch only has ${selectedBatch.availableQuantity} available.`);
      return;
    }

    const change = adjustmentType === 'add' ? qtyNum : -qtyNum;
    adjustStock({
      batchId: selectedBatchId,
      quantityChange: change,
      reason,
      notes,
    });
    onClose();
  };

  const reasons = [
    'Physical Audit Count Reconciliation',
    'Laboratory Quality Assay Sampling',
    'Secondary Packaging Damage',
    'Cold-chain Temperature Excursion Write-off',
    'Customer Return Re-entry',
    'Production Line Overflow',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Inventory Adjustment"
      subtitle="Record an audit correction or write-off with formal QA traceability."
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSubmit}>
            Apply Adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Batch Lot <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              setError('');
            }}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {data.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchNumber} - {b.medicineName} ({b.availableQuantity} avail)
              </option>
            ))}
          </select>
        </div>

        {selectedBatch && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between">
            <span className="text-slate-500">Current Lot Available:</span>
            <span className="font-bold text-slate-900">{selectedBatch.availableQuantity} units</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type</label>
            <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`flex-1 py-2 font-medium transition-colors ${
                  adjustmentType === 'add' ? 'bg-teal-700 text-white font-bold' : 'bg-white text-slate-600'
                }`}
              >
                + Increase
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('subtract')}
                className={`flex-1 py-2 font-medium transition-colors ${
                  adjustmentType === 'subtract' ? 'bg-rose-600 text-white font-bold' : 'bg-white text-slate-600'
                }`}
              >
                - Deduct
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity Units <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 10"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Regulatory Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes / Ref #</label>
          <textarea
            rows={2}
            placeholder="Provide context, incident ref, or QC officer remarks..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>
    </Modal>
  );
}
