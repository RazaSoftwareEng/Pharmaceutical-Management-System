// src/pages/accounts/ExpensesPage.jsx
import React, { useState, useMemo } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  DollarSign,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

export default function ExpensesPage() {
  const { data, addExpense, metrics } = usePharma();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // New Expense form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Cold-Chain Logistics',
    amount: '',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: '',
  });

  const expenseCategories = [
    'Cold-Chain Logistics',
    'Quality Assurance & Testing',
    'Warehouse Utilities',
    'Packaging & Consumables',
    'Regulatory Filings & Licensing',
    'Vehicle Fleet Fuel & Maintenance',
    'Factory Salaries & Overtime',
  ];

  const filteredExpenses = useMemo(() => {
    return data.expenses.filter((exp) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        exp.title.toLowerCase().includes(q) ||
        exp.referenceNumber.toLowerCase().includes(q) ||
        (exp.notes && exp.notes.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'ALL' || exp.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [data.expenses, searchTerm, selectedCategory]);

  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredExpenses.map((e) => ({
      ExpenseId: e.id,
      Date: e.date,
      Category: e.category,
      Title: e.title,
      Amount: e.amount,
      PaymentMethod: e.paymentMethod,
      Reference: e.referenceNumber,
      ApprovedBy: e.approvedBy,
      Notes: e.notes,
    }));
    exportToCSV('Operational_Expenses_Register', rows);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount || Number(formData.amount) <= 0) {
      alert('Please provide valid title and expense amount.');
      return;
    }
    addExpense(formData);
    setFormData({
      title: '',
      category: 'Cold-Chain Logistics',
      amount: '',
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      notes: '',
    });
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Operational Expenses Management</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredExpenses.length} disbursements
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking cold-chain continuous power, third-party microbiology assays, logistics, and packaging consumables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setIsFormOpen(true)}
          >
            Log Operating Expense
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description, reference #, or remarks..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Expense Categories</option>
              {expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>
              Total Logged Expenses:{' '}
              <span className="font-bold text-rose-700">
                {formatCurrency(filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0))}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedExpenses.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No expense logs found"
            description="Adjust your search criteria or log a new operational disbursement."
            actionLabel="Log Expense"
            onAction={() => setIsFormOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Expense Title</th>
                  <th className="py-3 px-3 font-semibold">Cost Category</th>
                  <th className="py-3 px-3 font-semibold">Posting Date</th>
                  <th className="py-3 px-3 font-semibold">Payment Channel</th>
                  <th className="py-3 px-3 font-semibold">Voucher Ref</th>
                  <th className="py-3 px-3 font-semibold text-right">Amount (PKR)</th>
                  <th className="py-3 px-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{exp.title}</td>

                    <td className="py-3 px-3">
                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-500">{exp.date}</td>

                    <td className="py-3 px-3 text-slate-600">{exp.paymentMethod}</td>

                    <td className="py-3 px-3 font-mono text-slate-600">{exp.referenceNumber}</td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(exp.amount)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[200px]">
                      {exp.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredExpenses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Expense Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Log Operational Disbursement"
        subtitle="Record facility utilities, cold-chain monitoring, or assay stability costs."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleFormSubmit}>
              Post Expense
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Description / Purpose <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Refrigerated Transport Fleet Diesel & Datalogger"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {expenseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 85000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Online Bank Transfer">Online Bank Transfer</option>
                <option value="Company Cheque">Company Cheque</option>
                <option value="Petty Cash">Petty Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Voucher / Reference #
              </label>
              <input
                type="text"
                placeholder="e.g. TXN-CC-9901"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes</label>
            <textarea
              rows={2}
              placeholder="Vendor details, invoice serial number, department justification..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
