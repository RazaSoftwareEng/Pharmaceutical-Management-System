// src/pages/customers/CustomerFormModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { usePharma } from '../../context/PharmaContext';
import { TERRITORIES } from '../../data/commercialSeed';

export default function CustomerFormModal({ isOpen, onClose, customerToEdit = null }) {
  const { data, addCustomer, updateCustomer } = usePharma();
  const salesReps = data.employees.filter((e) => e.isSalesRep);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Hospital',
    drugLicenseNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    taxRegistrationNumber: '',
    address: '',
    creditLimit: '2000000',
    creditDays: '30',
    territory: TERRITORIES[0],
    salesRepId: '',
    openingBalance: '',
    openingBalanceDate: new Date().toISOString().slice(0, 10),
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name || '',
        type: customerToEdit.type || 'Hospital',
        drugLicenseNumber: customerToEdit.drugLicenseNumber || '',
        contactPerson: customerToEdit.contactPerson || '',
        email: customerToEdit.email || '',
        phone: customerToEdit.phone || '',
        taxRegistrationNumber: customerToEdit.taxRegistrationNumber || '',
        address: customerToEdit.address || '',
        creditLimit: customerToEdit.creditLimit || '2000000',
        creditDays: customerToEdit.creditDays || '30',
        territory: customerToEdit.territory || TERRITORIES[0],
        salesRepId: customerToEdit.salesRepId || '',
        status: customerToEdit.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        type: 'Hospital',
        drugLicenseNumber: '',
        contactPerson: '',
        email: '',
        phone: '',
        taxRegistrationNumber: '',
        address: '',
        creditLimit: '2000000',
        creditDays: '30',
        territory: TERRITORIES[0],
        salesRepId: '',
        openingBalance: '',
        openingBalanceDate: new Date().toISOString().slice(0, 10),
        status: 'Active',
      });
    }
    setErrors({});
  }, [customerToEdit, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Customer account name is required';
    if (!formData.drugLicenseNumber.trim())
      errs.drugLicenseNumber = 'Valid Drug Sale / Pharmacy License # is required';
    if (!formData.contactPerson.trim()) errs.contactPerson = 'Primary contact person is required';
    if (!formData.email.trim()) errs.email = 'Official procurement email is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (customerToEdit) {
      updateCustomer(customerToEdit.id, { ...formData, creditLimit: Number(formData.creditLimit) || 0, creditDays: Number(formData.creditDays) || 30 });
    } else {
      addCustomer({ ...formData, creditDays: Number(formData.creditDays) || 30 });
    }
    onClose();
  };

  const customerTypes = ['Hospital', 'Pharmacy Chain', 'Distributor', 'Retailer', 'Clinic / Dispensary'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'Edit Customer Profile' : 'Register Authorized Customer Account'}
      subtitle="Register hospitals, pharmacy retail chains, and licensed pharmaceutical distributors."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSubmit}>
            {customerToEdit ? 'Save Changes' : 'Create Customer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account / Institution Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Shifa International Tertiary Hospital"
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
              Classification Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {customerTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Drug Sale License (DL #) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="DL-HOSP-2022-991"
              value={formData.drugLicenseNumber}
              onChange={(e) => setFormData({ ...formData, drugLicenseNumber: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono ${
                errors.drugLicenseNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.drugLicenseNumber && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.drugLicenseNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sales Tax Reg (STRN / NTN)
            </label>
            <input
              type="text"
              placeholder="STRN-9988112-4"
              value={formData.taxRegistrationNumber}
              onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Representative <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Khalid Niazi (Chief Pharmacist)"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Procurement Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder="pharmacy@hospital.org"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+92 51 8463000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Credit Limit (PKR)
            </label>
            <input
              type="number"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Territory</label>
            <select
              value={formData.territory}
              onChange={(e) => {
                const territory = e.target.value;
                const rep = salesReps.find((r) => r.territory === territory);
                setFormData({ ...formData, territory, salesRepId: rep ? rep.id : formData.salesRepId });
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {TERRITORIES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Salesman</label>
            <select
              value={formData.salesRepId}
              onChange={(e) => setFormData({ ...formData, salesRepId: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Unassigned</option>
              {salesReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Days</label>
            <select
              value={formData.creditDays}
              onChange={(e) => setFormData({ ...formData, creditDays: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {['0', '7', '15', '30', '45', '60', '90'].map((d) => (
                <option key={d} value={d}>
                  {d === '0' ? 'Cash on delivery' : `${d} days`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!customerToEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Balance (PKR)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">Amount this customer already owes you on go-live day.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Balance as of (bill date)</label>
              <input
                type="date"
                value={formData.openingBalanceDate}
                onChange={(e) => setFormData({ ...formData, openingBalanceDate: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">Used to age this balance in Recovery.</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Delivery / Physical Address
          </label>
          <input
            type="text"
            placeholder="Hospital gate, Pharmacy department, City"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>
    </Modal>
  );
}
