// src/pages/warehouses/InterWarehouseTransferModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { usePharma } from '../../context/PharmaContext';
import { ArrowRightLeft } from 'lucide-react';

export default function InterWarehouseTransferModal({ isOpen, onClose }) {
  const { data, transferStock } = usePharma();

  const [sourceWarehouseId, setSourceWarehouseId] = useState(data.warehouses[0]?.id || 'WH-01');
  const [destWarehouseId, setDestWarehouseId] = useState(data.warehouses[1]?.id || 'WH-02');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Candidate batches in source warehouse with available stock
  const availableBatches = data.batches.filter(
    (b) => b.warehouseId === sourceWarehouseId && b.availableQuantity > 0
  );

  const selectedBatch = data.batches.find((b) => b.id === selectedBatchId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sourceWarehouseId === destWarehouseId) {
      setError('Source and Destination warehouses must be different.');
      return;
    }
    if (!selectedBatchId) {
      setError('Please select a batch to transfer.');
      return;
    }
    const qtyNum = parseInt(quantity, 10);
    if (!qtyNum || qtyNum <= 0) {
      setError('Please specify a valid transfer quantity.');
      return;
    }
    if (selectedBatch && qtyNum > selectedBatch.availableQuantity) {
      setError(`Cannot transfer ${qtyNum} units; batch only has ${selectedBatch.availableQuantity} available.`);
      return;
    }

    transferStock({
      batchId: selectedBatchId,
      sourceWarehouseId,
      destWarehouseId,
      quantity: qtyNum,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inter-Warehouse Transfer Consignment"
      subtitle="Relocate stock between central hubs, regional distribution depots, and cold chain suites."
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSubmit}>
            Dispatch Transfer
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

        {/* Source and Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Origin (Source Depot) <span className="text-rose-500">*</span>
            </label>
            <select
              value={sourceWarehouseId}
              onChange={(e) => {
                setSourceWarehouseId(e.target.value);
                setSelectedBatchId('');
                setError('');
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {data.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Destination Depot <span className="text-rose-500">*</span>
            </label>
            <select
              value={destWarehouseId}
              onChange={(e) => {
                setDestWarehouseId(e.target.value);
                setError('');
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {data.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Medicine Batch Lot (Available in Origin) <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              setError('');
            }}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">-- Choose available batch --</option>
            {availableBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchNumber} - {b.medicineName} ({b.availableQuantity} units avail)
              </option>
            ))}
          </select>
          {availableBatches.length === 0 && (
            <p className="text-[11px] text-amber-600 mt-1">
              No active batches with stock located in the selected source warehouse.
            </p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Transfer Quantity Units <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 100"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setError('');
            }}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Transport & Manifest Details
          </label>
          <textarea
            rows={2}
            placeholder="Vehicle number, cold-chain temperature logger code, driver name..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>
    </Modal>
  );
}
