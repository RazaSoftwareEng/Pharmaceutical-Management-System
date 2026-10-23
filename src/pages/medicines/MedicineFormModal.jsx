// src/pages/medicines/MedicineFormModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { usePharma } from '../../context/PharmaContext';

export default function MedicineFormModal({ isOpen, onClose, medicineToEdit = null }) {
  const { data, addMedicine, updateMedicine } = usePharma();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    genericName: '',
    brand: '',
    category: data.categories[0] || 'Antibiotics & Antimicrobials',
    dosageForm: 'Tablet',
    strength: '',
    unitOfMeasure: data.units[0] || 'Box of 100 Tablets',
    purchasePrice: '',
    sellingPrice: '',
    retailPrice: '',
    schemeBuy: '',
    schemeFree: '',
    minStockLevel: '200',
    maxStockLevel: '2500',
    prescriptionRequired: true,
    storageCondition: 'Store below 25°C in dry place',
    status: 'Active',
    description: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (medicineToEdit) {
      setFormData({
        name: medicineToEdit.name || '',
        sku: medicineToEdit.sku || '',
        genericName: medicineToEdit.genericName || '',
        brand: medicineToEdit.brand || '',
        category: medicineToEdit.category || data.categories[0],
        dosageForm: medicineToEdit.dosageForm || 'Tablet',
        strength: medicineToEdit.strength || '',
        unitOfMeasure: medicineToEdit.unitOfMeasure || data.units[0],
        purchasePrice: medicineToEdit.purchasePrice || '',
        sellingPrice: medicineToEdit.sellingPrice || '',
        retailPrice: medicineToEdit.retailPrice || '',
        schemeBuy: medicineToEdit.bonusScheme?.buyQty || '',
        schemeFree: medicineToEdit.bonusScheme?.freeQty || '',
        minStockLevel: medicineToEdit.minStockLevel || '200',
        maxStockLevel: medicineToEdit.maxStockLevel || '2500',
        prescriptionRequired: medicineToEdit.prescriptionRequired ?? true,
        storageCondition: medicineToEdit.storageCondition || 'Store below 25°C',
        status: medicineToEdit.status || 'Active',
        description: medicineToEdit.description || '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        genericName: '',
        brand: '',
        category: data.categories[0] || 'Antibiotics & Antimicrobials',
        dosageForm: 'Tablet',
        strength: '',
        unitOfMeasure: data.units[0] || 'Box of 100 Tablets',
        purchasePrice: '',
        sellingPrice: '',
        retailPrice: '',
        schemeBuy: '',
        schemeFree: '',
        minStockLevel: '200',
        maxStockLevel: '2500',
        prescriptionRequired: true,
        storageCondition: 'Store below 25°C in dry place',
        status: 'Active',
        description: '',
      });
    }
    setErrors({});
  }, [medicineToEdit, data.categories, data.units, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Medicine name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU / Product code is required';
    if (!formData.genericName.trim()) errs.genericName = 'Generic formulation name is required';
    if (!formData.strength.trim()) errs.strength = 'Strength (e.g. 500mg) is required';
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0)
      errs.purchasePrice = 'Valid purchase price is required';
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0)
      errs.sellingPrice = 'Valid selling price is required';
    if (Number(formData.sellingPrice) < Number(formData.purchasePrice))
      errs.sellingPrice = 'Trade price should exceed purchase cost';
    if (formData.retailPrice && Number(formData.retailPrice) < Number(formData.sellingPrice))
      errs.retailPrice = 'MRP cannot be lower than the trade price';
    if ((formData.schemeBuy && !formData.schemeFree) || (!formData.schemeBuy && formData.schemeFree))
      errs.scheme = 'Enter both numbers, e.g. 10 + 1';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { schemeBuy, schemeFree, ...rest } = formData;
    const payload = {
      ...rest,
      retailPrice: parseFloat(formData.retailPrice) || null,
      bonusScheme:
        Number(schemeBuy) > 0 && Number(schemeFree) > 0
          ? { buyQty: Number(schemeBuy), freeQty: Number(schemeFree) }
          : null,
    };
    if (medicineToEdit) {
      updateMedicine(medicineToEdit.id, payload);
    } else {
      addMedicine(payload);
    }
    onClose();
  };

  const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Vial', 'Ampoule', 'Ointment', 'Inhaler', 'Drops'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medicineToEdit ? 'Edit Pharmaceutical Product' : 'Register New Medicine Product'}
      subtitle="Enter formulation specifics, regulatory classification, and pricing."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSubmit}>
            {medicineToEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name and SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Brand / Trade Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AmoxiCure 500mg"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              SKU / Formulation Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. AMX-500-CAP"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono ${
                errors.sku ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.sku && <p className="text-[11px] text-rose-600 mt-1">{errors.sku}</p>}
          </div>
        </div>

        {/* Row 2: Generic Name and Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Generic Molecule (API) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Amoxicillin Trihydrate"
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.genericName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.genericName && <p className="text-[11px] text-rose-600 mt-1">{errors.genericName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Therapeutic Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {data.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Dosage Form, Strength, Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form</label>
            <select
              value={formData.dosageForm}
              onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {dosageForms.map((df) => (
                <option key={df} value={df}>
                  {df}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Strength <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 500 mg, 100 IU/ml"
              value={formData.strength}
              onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.strength ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.strength && <p className="text-[11px] text-rose-600 mt-1">{errors.strength}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Packaging Unit</label>
            <select
              value={formData.unitOfMeasure}
              onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {data.units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purchase Cost (PKR) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 420.00"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.purchasePrice ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.purchasePrice && <p className="text-[11px] text-rose-600 mt-1">{errors.purchasePrice}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trade Price — TP (PKR) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 580.00"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.sellingPrice ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.sellingPrice && <p className="text-[11px] text-rose-600 mt-1">{errors.sellingPrice}</p>}
          </div>
        </div>

        {/* Row 4b: MRP & trade scheme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Retail Price — MRP (PKR)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Printed on pack"
              value={formData.retailPrice}
              onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.retailPrice ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.retailPrice ? (
              <p className="text-[11px] text-rose-600 mt-1">{errors.retailPrice}</p>
            ) : (
              Number(formData.retailPrice) > 0 &&
              Number(formData.sellingPrice) > 0 && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Retailer margin{' '}
                  {(((formData.retailPrice - formData.sellingPrice) / formData.retailPrice) * 100).toFixed(1)}%
                  {Number(formData.purchasePrice) > 0 &&
                    ` · Our margin ${(((formData.sellingPrice - formData.purchasePrice) / formData.sellingPrice) * 100).toFixed(1)}%`}
                </p>
              )
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bonus Scheme (Buy + Free)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="10"
                value={formData.schemeBuy}
                onChange={(e) => setFormData({ ...formData, schemeBuy: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 text-center"
              />
              <span className="text-slate-400 font-bold">+</span>
              <input
                type="number"
                min="0"
                placeholder="1"
                value={formData.schemeFree}
                onChange={(e) => setFormData({ ...formData, schemeFree: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 text-center"
              />
            </div>
            <p className={`text-[11px] mt-1 ${errors.scheme ? 'text-rose-600' : 'text-slate-500'}`}>
              {errors.scheme || 'Leave empty for no scheme. Bonus is added to orders automatically.'}
            </p>
          </div>
        </div>

        {/* Row 5: Reorder thresholds & prescription */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Min Reorder Level</label>
            <input
              type="number"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Max Stock Level</label>
            <input
              type="number"
              value={formData.maxStockLevel}
              onChange={(e) => setFormData({ ...formData, maxStockLevel: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Prescription (Rx)</label>
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.prescriptionRequired}
                  onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Rx Required</span>
              </label>
            </div>
          </div>
        </div>

        {/* Row 6: Storage conditions & description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Storage & Temperature Specification
          </label>
          <input
            type="text"
            placeholder="e.g. Store below 25°C in dry place, Cold chain (2°C - 8°C)"
            value={formData.storageCondition}
            onChange={(e) => setFormData({ ...formData, storageCondition: e.target.value })}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>
    </Modal>
  );
}
