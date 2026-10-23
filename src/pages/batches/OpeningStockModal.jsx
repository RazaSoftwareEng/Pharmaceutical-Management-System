// src/pages/batches/OpeningStockModal.jsx
// Enter stock that is already on the shelves on go-live day (no purchase order).
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency } from '../../services/pharmaService';

const inputCls =
  'w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white';

const blank = (data) => ({
  medicineId: data.medicines[0]?.id || '',
  warehouseId: data.warehouses[0]?.id || '',
  batchNumber: '',
  mfgDate: '',
  expiryDate: '',
  quantity: '',
  unitCost: data.medicines[0]?.purchasePrice || '',
  notes: '',
});

export default function OpeningStockModal({ isOpen, onClose }) {
  const { data, addOpeningStock } = usePharma();
  const [form, setForm] = useState(() => blank(data));
  const [error, setError] = useState('');
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const missingSetup = !data.medicines.length || !data.warehouses.length;
  const today = new Date().toISOString().slice(0, 10);

  const submit = (addAnother) => {
    setError('');
    if (!form.batchNumber.trim()) return setError('Batch number is required (as printed on the pack).');
    if (!form.expiryDate) return setError('Expiry date is required.');
    if (form.mfgDate && form.mfgDate >= form.expiryDate) return setError('Manufacturing date must be before expiry.');
    if (!(Number(form.quantity) > 0)) return setError('Enter a quantity greater than zero.');

    const ok = addOpeningStock(form);
    if (!ok) return;
    if (addAnother) {
      // Keep medicine, warehouse and cost: the next line is usually another batch of the same product
      setForm((f) => ({ ...f, batchNumber: '', mfgDate: '', expiryDate: '', quantity: '', notes: '' }));
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Opening Stock"
      subtitle="Stock already in your warehouse on go-live day. New purchases should come in through Goods Receiving (GRN)."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" size="sm" disabled={missingSetup} onClick={() => submit(true)}>
            Save & add another
          </Button>
          <Button variant="secondary" size="sm" disabled={missingSetup} onClick={() => submit(false)}>
            Save
          </Button>
        </>
      }
    >
      {missingSetup ? (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Add at least one <strong>warehouse</strong> and one <strong>medicine</strong> before entering opening stock.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
          className="space-y-4"
        >
          {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine *</label>
              <select
                value={form.medicineId}
                onChange={(e) => {
                  const med = data.medicines.find((m) => m.id === e.target.value);
                  setForm((f) => ({ ...f, medicineId: e.target.value, unitCost: med?.purchasePrice || '' }));
                }}
                className={inputCls}
              >
                {data.medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.strength ? `(${m.strength})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse *</label>
              <select value={form.warehouseId} onChange={set('warehouseId')} className={inputCls}>
                {data.warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch / Lot No. *</label>
              <input value={form.batchNumber} onChange={set('batchNumber')} placeholder="e.g. B-24117" className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mfg. Date</label>
              <input type="date" max={today} value={form.mfgDate} onChange={set('mfgDate')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
              <input type="date" value={form.expiryDate} onChange={set('expiryDate')} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (packs) *</label>
              <input type="number" min="1" value={form.quantity} onChange={set('quantity')} className={`${inputCls} text-right`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cost per pack (PKR)</label>
              <input type="number" step="0.01" min="0" value={form.unitCost} onChange={set('unitCost')} className={`${inputCls} text-right`} />
            </div>
            <div className="flex flex-col justify-end text-xs text-slate-500 pb-2">
              Stock value:{' '}
              <span className="font-bold text-slate-900">
                {formatCurrency((Number(form.quantity) || 0) * (Number(form.unitCost) || 0))}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <input value={form.notes} onChange={set('notes')} placeholder="e.g. Physical count on 1 Nov" className={inputCls} />
          </div>

          {form.expiryDate && form.expiryDate <= today && (
            <p className="text-xs text-rose-600">This batch is already expired. It will be recorded but blocked from sale.</p>
          )}
        </form>
      )}
    </Modal>
  );
}
