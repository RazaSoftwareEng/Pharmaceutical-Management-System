// src/pages/purchases/CreatePOModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { formatCurrency } from '../../services/pharmaService';
import { Plus, Trash2, ShoppingCart, FileText, Send } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

export default function CreatePOModal({ isOpen, onClose }) {
  const { data, createPurchaseOrder } = usePharma();

  const [supplierId, setSupplierId] = useState(data.suppliers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(data.warehouses[0]?.id || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [notes, setNotes] = useState('');

  // Initial single line item
  const [items, setItems] = useState([
    {
      medicineId: data.medicines[0]?.id || '',
      quantity: 500,
      unitCost: data.medicines[0]?.purchasePrice || 420.0,
      discountPercent: 0,
      taxPercent: data.companyProfile.defaultTaxRate ?? 0,
    },
  ]);

  const [error, setError] = useState('');

  const handleAddItem = () => {
    const med = data.medicines[0];
    setItems((prev) => [
      ...prev,
      {
        medicineId: med ? med.id : '',
        quantity: 100,
        unitCost: med ? med.purchasePrice : 100.0,
        discountPercent: 0,
        taxPercent: data.companyProfile.defaultTaxRate ?? 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === 'medicineId') {
        const med = data.medicines.find((m) => m.id === value);
        updated[index] = {
          ...updated[index],
          medicineId: value,
          unitCost: med ? med.purchasePrice : updated[index].unitCost,
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  // Compute calculated line item values and grand totals
  const computedItems = items.map((it) => {
    const med = data.medicines.find((m) => m.id === it.medicineId);
    const qty = Number(it.quantity) || 0;
    const cost = Number(it.unitCost) || 0;
    const gross = qty * cost;
    const discountAmt = gross * ((Number(it.discountPercent) || 0) / 100);
    const afterDiscount = gross - discountAmt;
    const taxAmt = afterDiscount * ((Number(it.taxPercent) || 0) / 100);
    const lineTotal = afterDiscount + taxAmt;

    return {
      medicineId: it.medicineId,
      medicineName: med ? med.name : 'Unknown Product',
      sku: med ? med.sku : '',
      unitOfMeasure: med ? med.unitOfMeasure : 'Units',
      quantity: qty,
      unitCost: cost,
      discountPercent: Number(it.discountPercent) || 0,
      taxPercent: Number(it.taxPercent) || 0,
      total: lineTotal,
    };
  });

  const subtotal = computedItems.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);
  const discountTotal = computedItems.reduce(
    (acc, it) => acc + (it.quantity * it.unitCost * it.discountPercent) / 100,
    0
  );
  const afterDisc = subtotal - discountTotal;
  const taxTotal = computedItems.reduce(
    (acc, it) =>
      acc + (it.quantity * it.unitCost * (1 - it.discountPercent / 100) * it.taxPercent) / 100,
    0
  );
  const grandTotal = afterDisc + taxTotal;

  const handleSubmit = (e, targetStatus = 'Pending Approval') => {
    if (e && e.preventDefault) e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier');
      return;
    }
    if (!warehouseId) {
      setError('Please select a destination warehouse');
      return;
    }
    for (let i = 0; i < computedItems.length; i++) {
      if (!computedItems[i].medicineId || computedItems[i].quantity <= 0) {
        setError(`Please check line item #${i + 1}: valid medicine and positive quantity required.`);
        return;
      }
    }

    const sup = data.suppliers.find((s) => s.id === supplierId);
    const wh = data.warehouses.find((w) => w.id === warehouseId);

    createPurchaseOrder({
      supplierId,
      supplierName: sup ? sup.name : 'Supplier',
      warehouseId,
      warehouseName: wh ? wh.name : 'Warehouse',
      expectedDeliveryDate,
      paymentTerms,
      status: targetStatus,
      items: computedItems,
      subtotal,
      discountAmount: discountTotal,
      taxAmount: taxTotal,
      grandTotal,
      notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Procurement Purchase Order"
      subtitle="Issue formal purchase requisition with multi-item costing and destination specifications."
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              onClick={(e) => handleSubmit(e, 'Draft')}
            >
              Save as Draft
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Send}
              onClick={(e) => handleSubmit(e, 'Pending Approval')}
            >
              Submit PO for Approval
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={(e) => handleSubmit(e, 'Pending Approval')} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Supplier & Warehouse */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {data.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Receiving Depot <span className="text-rose-500">*</span>
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
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
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-teal-600" />
              <span>Purchase Order Line Items</span>
            </h4>
            <Button variant="outline" size="sm" icon={Plus} onClick={handleAddItem}>
              Add Product Line
            </Button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold min-w-[200px]">Medicine Formulation</th>
                  <th className="py-2.5 px-2 font-semibold w-24">Quantity</th>
                  <th className="py-2.5 px-2 font-semibold w-28">Unit Cost (PKR)</th>
                  <th className="py-2.5 px-2 font-semibold w-20">Disc %</th>
                  <th className="py-2.5 px-2 font-semibold w-20">Tax %</th>
                  <th className="py-2.5 px-3 font-semibold text-right min-w-[100px]">Total (PKR)</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <select
                        value={it.medicineId}
                        onChange={(e) => handleItemChange(idx, 'medicineId', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 py-1 px-2 outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        {data.medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.strength})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 py-1 px-2 outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center"
                      />
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        value={it.unitCost}
                        onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 py-1 px-2 outline-none focus:ring-1 focus:ring-teal-500 font-mono text-right"
                      />
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={it.discountPercent}
                        onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 py-1 px-2 outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center"
                      />
                    </td>

                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={it.taxPercent}
                        onChange={(e) => handleItemChange(idx, 'taxPercent', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 py-1 px-2 outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center"
                      />
                    </td>

                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(computedItems[idx]?.total || 0)}
                    </td>

                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Procurement Specifications & Notes
            </label>
            <textarea
              rows={2}
              placeholder="Certificate of Analysis (COA) required, temperature monitoring criteria..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Volume Discount:</span>
              <span className="font-mono text-emerald-600">-{formatCurrency(discountTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax:</span>
              <span className="font-mono">{formatCurrency(taxTotal)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-teal-700">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
