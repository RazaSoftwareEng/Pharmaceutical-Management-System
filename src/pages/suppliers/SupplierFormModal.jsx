// src/pages/suppliers/SupplierFormModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { usePharma } from '../../context/PharmaContext';

export default function SupplierFormModal({ isOpen, onClose, supplierToEdit = null }) {
  const { addSupplier, updateSupplier } = usePharma();

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    taxRegistrationNumber: '',
    ntnNumber: '',
    address: '',
    creditDays: 30,
    outstandingBalance: 0,
    rating: 4.5,
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        name: supplierToEdit.name || '',
        contactPerson: supplierToEdit.contactPerson || '',
        email: supplierToEdit.email || '',
        phone: supplierToEdit.phone || '',
        taxRegistrationNumber: supplierToEdit.taxRegistrationNumber || '',
        ntnNumber: supplierToEdit.ntnNumber || '',
        address: supplierToEdit.address || '',
        creditDays: supplierToEdit.creditDays || 30,
        outstandingBalance: supplierToEdit.outstandingBalance || 0,
        rating: supplierToEdit.rating || 4.5,
        status: supplierToEdit.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        taxRegistrationNumber: '',
        ntnNumber: '',
        address: '',
        creditDays: 30,
        outstandingBalance: 0,
        rating: 4.5,
        status: 'Active',
      });
    }
    setErrors({});
  }, [supplierToEdit, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Supplier company name is required';
    if (!formData.contactPerson.trim()) errs.contactPerson = 'Contact representative name is required';
    if (!formData.email.trim()) errs.email = 'Official procurement email is required';
    if (!formData.taxRegistrationNumber.trim()) errs.taxRegistrationNumber = 'STRN / Tax registration is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (supplierToEdit) {
      updateSupplier(supplierToEdit.id, formData);
    } else {
      addSupplier(formData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplierToEdit ? 'Edit Supplier Record' : 'Enroll New Active Pharma Supplier'}
      subtitle="Register vendor profile, NTN/STRN tax compliance, and payment credit terms."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSubmit}>
            {supplierToEdit ? 'Save Changes' : 'Enroll Supplier'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company / Vendor Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Active Pharma Ingredients Ltd."
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
              Contact Representative <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Hamza Bilal (Key Account Manager)"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.contactPerson ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.contactPerson && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.contactPerson}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Procurement Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder="orders@apexapi.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+92 42 35918800"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sales Tax Reg # (STRN) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="STRN-7740192-3"
              value={formData.taxRegistrationNumber}
              onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono ${
                errors.taxRegistrationNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.taxRegistrationNumber && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.taxRegistrationNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">NTN / Business Tax ID</label>
            <input
              type="text"
              placeholder="3892019-1"
              value={formData.ntnNumber}
              onChange={(e) => setFormData({ ...formData, ntnNumber: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Terms (Days)</label>
            <input
              type="number"
              value={formData.creditDays}
              onChange={(e) => setFormData({ ...formData, creditDays: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="Active">Active (Approved Vendor)</option>
              <option value="Under Review">Under Review</option>
              <option value="Inactive">Suspended</option>
            </select>
          </div>
        </div>

        {!supplierToEdit && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Payable (PKR)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={formData.outstandingBalance || ''}
              onChange={(e) => setFormData({ ...formData, outstandingBalance: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">Amount you already owe this supplier on go-live day.</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Plant / Office Address</label>
          <input
            type="text"
            placeholder="Plot / Street, Industrial Estate, City"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>
    </Modal>
  );
}
