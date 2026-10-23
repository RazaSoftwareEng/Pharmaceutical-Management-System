// src/pages/purchases/GoodsReceivingModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { PackageCheck, ShieldCheck, Calendar, Hash } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

export default function GoodsReceivingModal({ isOpen, onClose, po }) {
  const { receiveGoods } = usePharma();
  const [lines, setLines] = useState([]);
  const [receivingNotes, setReceivingNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (po && po.items) {
      const year = new Date().getFullYear();
      const initialLines = po.items.map((it, idx) => ({
        medicineId: it.medicineId,
        medicineName: it.medicineName,
        quantity: it.quantity,
        unitCost: it.unitCost,
        batchNumber: `BN-${year}-${Math.floor(100 + Math.random() * 899)}`,
        mfgDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10), // default 2 years shelf life
      }));
      setLines(initialLines);
      setReceivingNotes('Passed receiving visual QC inspection and cold-chain temperature verification.');
    }
  }, [po, isOpen]);

  if (!po) return null;

  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].batchNumber.trim()) {
        setError(`Please provide a batch lot code for line #${i + 1}`);
        return;
      }
      if (!lines[i].expiryDate) {
        setError(`Please provide an expiry date for line #${i + 1}`);
        return;
      }
      if (new Date(lines[i].expiryDate) <= new Date(lines[i].mfgDate)) {
        setError(`Expiry date must be after manufacturing date for line #${i + 1}`);
        return;
      }
    }

    receiveGoods({
      poId: po.id,
      receivingLines: lines,
      notes: receivingNotes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Goods Receiving Note (GRN): ${po.poNumber}`}
      subtitle={`Receiving consignment from ${po.supplierName} into ${po.warehouseName}`}
      size="2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" icon={PackageCheck} onClick={handleSubmit}>
            Confirm Acceptance & Post to Stock
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

        {/* Regulatory Banner */}
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2 text-xs text-teal-800">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            Accepting this delivery will create live active batches in warehouse inventory, log a
            Purchase Receipt audit record, and update supplier payable balances.
          </span>
        </div>

        {/* Goods Line Assignments */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-900">
            Assign Batch Lots & Expiry Dates per Item
          </h4>

          {lines.map((line, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{line.medicineName}</span>
                  <span className="text-slate-500 ml-2">({line.quantity} units ordered)</span>
                </div>
                <span className="font-mono text-teal-700 font-semibold">
                  Cost: Rs. {line.unitCost}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Batch Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={line.batchNumber}
                    onChange={(e) => handleLineChange(idx, 'batchNumber', e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 py-1.5 px-2 font-mono outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Received Units <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 py-1.5 px-2 outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Mfg Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={line.mfgDate}
                    onChange={(e) => handleLineChange(idx, 'mfgDate', e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 py-1.5 px-2 outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Expiry Date (FEFO) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={line.expiryDate}
                    onChange={(e) => handleLineChange(idx, 'expiryDate', e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 py-1.5 px-2 outline-none focus:ring-1 focus:ring-teal-500 bg-white font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Receiving & Physical Quality Notes
          </label>
          <textarea
            rows={2}
            value={receivingNotes}
            onChange={(e) => setReceivingNotes(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>
    </Modal>
  );
}
