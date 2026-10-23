// src/pages/employees/EmployeeFormModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { usePharma } from '../../context/PharmaContext';
import { TERRITORIES } from '../../data/commercialSeed';

export default function EmployeeFormModal({ isOpen, onClose, employeeToEdit = null }) {
  const { addEmployee, updateEmployee } = usePharma();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'Inventory & Warehousing',
    designation: '',
    role: 'Inventory Manager',
    isSalesRep: false,
    territory: TERRITORIES[0],
    monthlyTarget: '',
    status: 'Active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        fullName: employeeToEdit.fullName || '',
        email: employeeToEdit.email || '',
        phone: employeeToEdit.phone || '',
        department: employeeToEdit.department || 'Inventory & Warehousing',
        designation: employeeToEdit.designation || '',
        role: employeeToEdit.role || 'Inventory Manager',
        isSalesRep: !!employeeToEdit.isSalesRep,
        territory: employeeToEdit.territory || TERRITORIES[0],
        monthlyTarget: employeeToEdit.monthlyTarget || '',
        status: employeeToEdit.status || 'Active',
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        department: 'Inventory & Warehousing',
        designation: '',
        role: 'Inventory Manager',
        isSalesRep: false,
        territory: TERRITORIES[0],
        monthlyTarget: '',
        status: 'Active',
      });
    }
    setErrors({});
  }, [employeeToEdit, isOpen]);

  const departments = [
    'Inventory & Warehousing',
    'Quality Assurance & QC',
    'Commercial Sales & Distribution',
    'Finance & Accounts',
    'Production & Formulation',
    'Regulatory Affairs',
    'Executive Administration',
  ];

  const roles = [
    'Admin',
    'Inventory Manager',
    'Sales Manager',
    'Accountant',
    'Storekeeper',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Work email is required';
    if (!formData.designation.trim()) errs.designation = 'Official designation is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      ...formData,
      monthlyTarget: formData.isSalesRep ? Number(formData.monthlyTarget) || 0 : null,
      territory: formData.isSalesRep ? formData.territory : null,
    };
    if (employeeToEdit) {
      updateEmployee(employeeToEdit.id, payload);
    } else {
      addEmployee(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'Edit Personnel Record' : 'Enroll Staff Member'}
      subtitle="Department, designation, ERP role and sales territory."
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSubmit}>
            {employeeToEdit ? 'Save Changes' : 'Register Employee'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Legal Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Dr. Tariq Mahmood"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
              errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
            }`}
          />
          {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder="name@pharmacore.com"
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
              placeholder="+92 300 5551101"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Designation <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Lead QA Pharmacist"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.designation ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {errors.designation && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.designation}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ERP Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="Active">Active Duty</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Terminated / Resigned</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3 space-y-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isSalesRep}
              onChange={(e) => setFormData({ ...formData, isSalesRep: e.target.checked })}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            Field salesman (books orders, collects payments, has a target)
          </label>
          {formData.isSalesRep && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Territory</label>
                <select
                  value={formData.territory}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Sales Target (PKR)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="1000000"
                  value={formData.monthlyTarget}
                  onChange={(e) => setFormData({ ...formData, monthlyTarget: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
