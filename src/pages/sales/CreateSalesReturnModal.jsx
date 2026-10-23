// src/pages/sales/CreateSalesReturnModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency } from '../../services/pharmaService';

export default function CreateSalesReturnModal({ isOpen, onClose }) {
  const { data, createSalesReturn } = usePharma();

  const [customerId, setCustomerId] = useState(data.customers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState(data.salesInvoices[0]?.invoiceNumber || '');
  const [medicineId, setMedicineId] = useState(data.medicines[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState(data.batches[0]?.batchNumber || '');
  const [quantity, setQuantity] = useState('10');
  const [unitPrice, setUnitPrice] = useState(data.medicines[0]?.sellingPrice || '580');
  const [reason, setReason] = useState('Secondary packaging damaged in hospital handling');
  const [destination, setDestination] = useState('Quarantine Stock'); // 'Quarantine Stock' or 'Active Stock'
  const [error, setError] = useState('');

  const reasons = [
    'Secondary packaging damaged in hospital handling',
    'Near-expiry stock returned before cutoff period',
    'Hospital clinical protocol cancellation / overstock',
    'Temperature excursion reported by recipient',
    'Batch recall regulatory quarantine',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const qtyNum = parseInt(quantity, 10);
    if (!qtyNum || qtyNum <= 0) {
      setError('Please provide a valid return quantity.');
      return;
    }

    const cust = data.customers.find((c) => c.id === customerId);
    const med = data.medicines.find((m) => m.id === medicineId);

    createSalesReturn({
      customerId,
      customerName: cust ? cust.name : 'Customer',
      invoiceNumber,
      medicineId,
      medicineName: med ? med.name : 'Medicine',
      batchNumber,
      quantity: qtyNum,
      unitPrice: parseFloat(unitPrice) || 0,
      reason,
      destination,
    });

    onClose();
  };

  const refundAmt = (parseInt(quantity, 10) || 0) * (parseFloat(unitPrice) || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Customer Sales Return"
      subtitle="Receive customer return, credit customer account receivables, and route lot to quarantine or active stock."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleSubmit}>
            Process Return & Credit Account
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Returning Customer Account <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {data.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referenced Invoice #
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Returned Medicine Formulation <span className="text-rose-500">*</span>
            </label>
            <select
              value={medicineId}
              onChange={(e) => {
                setMedicineId(e.target.value);
                const med = data.medicines.find((m) => m.id === e.target.value);
                if (med) setUnitPrice(med.sellingPrice);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {data.medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.strength})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Batch Lot Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity Returned <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit Rate (PKR)
            </label>
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inventory Routing
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
            >
              <option value="Quarantine Stock">Quarantine (QC Inspection)</option>
              <option value="Active Stock">Active Stock (Good Condition)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Return Reason</label>
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

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <span className="text-slate-600">Calculated Credit Note Amount:</span>
          <span className="font-bold text-teal-700 text-sm">{formatCurrency(refundAmt)}</span>
        </div>
      </form>
    </Modal>
  );
}
