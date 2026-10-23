// src/pages/accounts/RecordPaymentModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { CheckCircle } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency } from '../../services/pharmaService';

export default function RecordPaymentModal({ isOpen, onClose, mode = 'customer', initialPartyId }) {
  const { data, recordCustomerPayment, recordSupplierPayment } = usePharma();

  const isCustomer = mode === 'customer';

  const [partyId, setPartyId] = useState(
    initialPartyId || (isCustomer ? data.customers[0]?.id || '' : data.suppliers[0]?.id || '')
  );
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Online Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState(
    `FT-HBL-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectedCustomer = isCustomer ? data.customers.find((c) => c.id === partyId) : null;
  const selectedSupplier = !isCustomer ? data.suppliers.find((s) => s.id === partyId) : null;

  // Unpaid invoices for selected customer
  const customerInvoices = isCustomer
    ? data.salesInvoices.filter((inv) => inv.customerId === partyId && inv.balanceDue > 0)
    : [];

  // Active POs for selected supplier
  const supplierPOs = !isCustomer
    ? data.purchaseOrders.filter((po) => po.supplierId === partyId)
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) {
      setError('Please provide a valid settlement amount.');
      return;
    }

    if (isCustomer) {
      recordCustomerPayment({
        customerId: partyId,
        customerName: selectedCustomer ? selectedCustomer.name : 'Customer',
        amount: amtNum,
        date,
        paymentMethod,
        referenceNumber,
        invoiceNumber: invoiceNumber || 'General Account Credit',
        notes,
      });
    } else {
      recordSupplierPayment({
        supplierId: partyId,
        supplierName: selectedSupplier ? selectedSupplier.name : 'Supplier',
        amount: amtNum,
        date,
        paymentMethod,
        referenceNumber,
        poNumber: invoiceNumber || 'General Account Disbursement',
        notes,
      });
    }

    onClose();
  };

  const paymentMethods = [
    'Online Bank Transfer (IBFT)',
    'Pay Order / Bank Draft',
    'Crossed Cheque',
    'Real Time Gross Settlement (RTGS)',
    'Cash Collection',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCustomer ? 'Record Customer Payment Receipt' : 'Disburse Supplier Settlement'}
      subtitle={
        isCustomer
          ? 'Collect receivables against sales invoices and update customer ledger.'
          : 'Record vendor payment against delivered procurement purchase orders.'
      }
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" icon={CheckCircle} onClick={handleSubmit}>
            Post Payment
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isCustomer ? 'Customer Account' : 'Supplier Account'} <span className="text-rose-500">*</span>
          </label>
          <select
            value={partyId}
            onChange={(e) => {
              setPartyId(e.target.value);
              setInvoiceNumber('');
            }}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {isCustomer
              ? data.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({formatCurrency(c.outstandingReceivables)} outstanding)
                  </option>
                ))
              : data.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatCurrency(s.outstandingBalance)} payable)
                  </option>
                ))}
          </select>
        </div>

        {/* Balance Display */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {isCustomer ? 'Current Customer Receivables:' : 'Current Vendor Payables:'}
          </span>
          <span className="font-bold text-slate-900">
            {formatCurrency(
              isCustomer
                ? selectedCustomer?.outstandingReceivables
                : selectedSupplier?.outstandingBalance
            )}
          </span>
        </div>

        {/* Reference Document */}
        {isCustomer && customerInvoices.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Apply to Open Sales Invoice (Optional)
            </label>
            <select
              value={invoiceNumber}
              onChange={(e) => {
                setInvoiceNumber(e.target.value);
                const inv = customerInvoices.find((i) => i.invoiceNumber === e.target.value);
                if (inv) setAmount(inv.balanceDue);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Apply to general account credit --</option>
              {customerInvoices.map((inv) => (
                <option key={inv.id} value={inv.invoiceNumber}>
                  {inv.invoiceNumber} (Due: {formatCurrency(inv.balanceDue)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (PKR) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 50000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instrument / Bank Ref #
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Settlement Notes</label>
          <input
            type="text"
            placeholder="e.g. Cleared via Habib Bank Ltd, corporate account transfer."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>
    </Modal>
  );
}
