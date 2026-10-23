// src/pages/warehouses/WarehouseFormModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { usePharma } from '../../context/PharmaContext';

const inputCls =
  'w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white';

const TYPES = ['Central Warehouse', 'Regional Depot', 'Cold Storage Facility', 'Sales Point / Counter'];
const ZONES = [
  'Controlled Room Temp (15°C - 25°C)',
  'Standard Pharma Ambient (18°C - 24°C)',
  'Below 30°C',
  'Cold Chain (2°C - 8°C)',
];

export default function WarehouseFormModal({ isOpen, onClose }) {
  const { addWarehouse } = usePharma();
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: TYPES[0],
    temperatureZone: ZONES[0],
    address: '',
    manager: '',
    phone: '',
    email: '',
    capacitySqFt: '',
    hasColdStorage: false,
  });
  const [error, setError] = useState('');
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!form.name.trim()) return setError('Warehouse name is required.');
    if (!form.code.trim()) return setError('Short code is required (e.g. LHR-01).');
    addWarehouse({ ...form, name: form.name.trim(), code: form.code.trim().toUpperCase() });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Warehouse / Depot"
      subtitle="Where stock is stored and dispatched from."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSubmit}>
            Save Warehouse
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse name *</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Lahore Main Warehouse" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
            <input value={form.code} onChange={set('code')} placeholder="LHR-01" className={`${inputCls} font-mono uppercase`} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
            <select value={form.type} onChange={set('type')} className={inputCls}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Storage temperature</label>
            <select value={form.temperatureZone} onChange={set('temperatureZone')} className={inputCls}>
              {ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
          <input value={form.address} onChange={set('address')} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Manager / In-charge</label>
            <input value={form.manager} onChange={set('manager')} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
            <input value={form.phone} onChange={set('phone')} placeholder="0300 1234567" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Area (sq ft)</label>
            <input type="number" min="0" value={form.capacitySqFt} onChange={set('capacitySqFt')} className={inputCls} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.hasColdStorage}
            onChange={(e) => setForm((f) => ({ ...f, hasColdStorage: e.target.checked }))}
            className="rounded text-teal-600 focus:ring-teal-500"
          />
          Has cold storage (2°C – 8°C) for vaccines / insulin
        </label>
      </form>
    </Modal>
  );
}
