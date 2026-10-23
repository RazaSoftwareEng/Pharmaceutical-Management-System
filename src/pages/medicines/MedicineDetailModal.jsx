// src/pages/medicines/MedicineDetailModal.jsx
import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, evaluateBatchStatus } from '../../services/pharmaService';
import { Pill, ShieldCheck, Thermometer, Layers, AlertCircle } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

export default function MedicineDetailModal({ isOpen, onClose, medicine, onEdit }) {
  const { data } = usePharma();
  if (!medicine) return null;

  // Filter batches belonging to this medicine
  const batches = data.batches.filter((b) => b.medicineId === medicine.id);
  const totalStock = batches.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
  const eligibleStock = batches
    .filter((b) => {
      const st = evaluateBatchStatus(b);
      return st !== 'Expired' && st !== 'Quarantined' && st !== 'Recalled';
    })
    .reduce((acc, b) => acc + (b.availableQuantity || 0), 0);

  const profitMargin =
    medicine.purchasePrice > 0
      ? (((medicine.sellingPrice - medicine.purchasePrice) / medicine.sellingPrice) * 100).toFixed(1)
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medicine.name}
      subtitle={`SKU: ${medicine.sku} • Generic: ${medicine.genericName}`}
      size="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(medicine);
            }}
          >
            Edit Product
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Top Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Available Stock</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalStock} units</p>
            <p className="text-[11px] text-teal-600 font-medium">{eligibleStock} FEFO sellable</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Purchase Cost</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {formatCurrency(medicine.purchasePrice)}
            </p>
            <p className="text-[11px] text-slate-500">Unit base cost</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Selling Price</span>
            <p className="text-xl font-bold text-teal-700 mt-0.5">
              {formatCurrency(medicine.sellingPrice)}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">Margin: {profitMargin}%</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Reorder Point</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{medicine.minStockLevel}</p>
            <p className="text-[11px] text-slate-500">Max: {medicine.maxStockLevel}</p>
          </div>
        </div>

        {/* Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>Formulation Specifications</span>
            </h4>
            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-medium text-slate-800">{medicine.category}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Dosage Form:</span>
                <span className="font-medium text-slate-800">{medicine.dosageForm}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Strength:</span>
                <span className="font-medium text-slate-800">{medicine.strength}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Package Unit:</span>
                <span className="font-medium text-slate-800">{medicine.unitOfMeasure}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Regulatory & Handling</span>
            </h4>
            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Prescription Status:</span>
                <span className="font-medium text-slate-800">
                  {medicine.prescriptionRequired ? 'Rx Required (Schedule IV)' : 'Over the Counter (OTC)'}
                </span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Storage Specs:</span>
                <span className="font-medium text-slate-800">{medicine.storageCondition}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Product Status:</span>
                <Badge status={medicine.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Associated Batches In Stock Table */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Associated Inventory Batches ({batches.length})</span>
          </h4>

          {batches.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
              No batches currently registered for this product.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 font-medium">Batch #</th>
                    <th className="py-2 px-3 font-medium">Mfg Date</th>
                    <th className="py-2 px-3 font-medium">Expiry Date</th>
                    <th className="py-2 px-3 font-medium text-center">Available</th>
                    <th className="py-2 px-3 font-medium text-center">Warehouse</th>
                    <th className="py-2 px-3 font-medium text-center">Quality Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => {
                    const status = evaluateBatchStatus(b);
                    const wh = data.warehouses.find((w) => w.id === b.warehouseId);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{b.batchNumber}</td>
                        <td className="py-2 px-3 text-slate-500">{b.mfgDate}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{b.expiryDate}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-900">
                          {b.availableQuantity}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600">
                          {wh?.code || b.warehouseId}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge status={status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
