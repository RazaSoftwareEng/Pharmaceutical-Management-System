// src/pages/customers/CustomerDetailModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import {
  Users,
  FileText,
  Receipt,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  BadgeDollarSign,
  Printer,
  Download,
  CreditCard,
  ShoppingBag,
  RotateCcw,
  Building2,
  Calendar,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { useNavigate } from 'react-router-dom';

export default function CustomerDetailModal({ isOpen, onClose, customer, onEdit }) {
  const { data } = usePharma();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders' | 'ledger'

  if (!customer) return null;

  // Orders, invoices, payments and returns for this customer
  const orders = data.salesOrders.filter((o) => o.customerId === customer.id);
  const invoices = data.salesInvoices.filter((i) => i.customerId === customer.id);
  const payments = (data.payments || []).filter(
    (p) => p.partyId === customer.id || p.partyName === customer.name
  );
  const returns = (data.salesReturns || []).filter(
    (r) => r.customerId === customer.id || r.customerName === customer.name
  );

  const availableCredit = Math.max(0, customer.creditLimit - (customer.outstandingReceivables || 0));

  // Compute Full Chronological Financial Ledger
  const ledgerEntries = (() => {
    const entries = [];

    // 1. Sales Invoices (Debits to Receivable)
    invoices.forEach((inv) => {
      entries.push({
        id: `INV-${inv.id}`,
        date: inv.invoiceDate,
        type: 'Sales Invoice',
        ref: inv.invoiceNumber,
        secondaryRef: inv.salesOrderId || 'Direct Order',
        debit: inv.grandTotal,
        credit: 0,
        status: inv.paymentStatus,
        notes: `Invoiced goods under ${inv.paymentTerms || 'Standard Credit'}`,
      });
    });

    // 2. Payments (Credits against Receivable)
    payments.forEach((pay) => {
      entries.push({
        id: `PAY-${pay.id}`,
        date: pay.date,
        type: 'Payment Received',
        ref: pay.referenceNumber || pay.id,
        secondaryRef: pay.invoiceReference || 'On Account',
        debit: 0,
        credit: pay.amount,
        status: 'Settled',
        notes: `${pay.paymentMethod}${pay.notes ? ` • ${pay.notes}` : ''}`,
      });
    });

    // 3. Sales Returns (Credits against Receivable)
    returns.forEach((ret) => {
      entries.push({
        id: `RET-${ret.id}`,
        date: ret.returnDate,
        type: 'Return Credit Note',
        ref: ret.returnNumber,
        secondaryRef: ret.invoiceNumber || ret.id,
        debit: 0,
        credit: ret.refundAmount || ret.totalAmount || 0,
        status: 'Credited',
        notes: `Batch return credit: ${ret.reason || 'QA Inspection'}`,
      });
    });

    // Sort chronologically ascending
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let running = 0;
    return entries.map((entry) => {
      running += entry.debit - entry.credit;
      return {
        ...entry,
        runningBalance: running,
      };
    });
  })();

  const totalDebits = ledgerEntries.reduce((acc, e) => acc + e.debit, 0);
  const totalCredits = ledgerEntries.reduce((acc, e) => acc + e.credit, 0);

  const handleExportLedgerCSV = () => {
    const rows = ledgerEntries.map((e) => ({
      Date: e.date,
      TransactionType: e.type,
      Reference: e.ref,
      SecondaryReference: e.secondaryRef,
      DebitPKR: e.debit,
      CreditPKR: e.credit,
      RunningBalancePKR: e.runningBalance,
      Status: e.status,
      Notes: e.notes,
    }));
    exportToCSV(`Customer_Ledger_${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}`, rows);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      subtitle={`Classification: ${customer.type} • Drug License: ${customer.drugLicenseNumber}`}
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>
              Print Statement
            </Button>
            {activeTab === 'ledger' && (
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={handleExportLedgerCSV}
              >
                Export CSV
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">
              Outstanding Balance
            </span>
            <p className="text-base font-bold text-teal-700 mt-0.5">
              {formatCurrency(customer.outstandingReceivables)}
            </p>
            <p className="text-[11px] text-slate-500">Unsettled receivables</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Credit Limit</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {formatCurrency(customer.creditLimit)}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">
              {formatCurrency(availableCredit)} available
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Activity Volume</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">{orders.length} orders</p>
            <p className="text-[11px] text-slate-500">{invoices.length} invoices generated</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Account Status</span>
            <div className="mt-1">
              <Badge status={customer.status} />
            </div>
          </div>
        </div>

        {/* Modal Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 text-xs font-semibold px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Profile & Regulatory</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 text-xs font-semibold px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'orders'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders & Invoices ({orders.length + invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-2.5 text-xs font-semibold px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'ledger'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BadgeDollarSign className="w-3.5 h-3.5" />
            <span>Customer Financial Ledger ({ledgerEntries.length})</span>
          </button>
        </div>

        {/* Tab 1: Profile & Compliance */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5 bg-white">
              <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Pharmaceutical Licensing & Compliance</span>
              </h4>
              <div className="divide-y divide-slate-100">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Drug Sale License #:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {customer.drugLicenseNumber}
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Tax Reg # (STRN):</span>
                  <span className="font-mono text-slate-800">
                    {customer.taxRegistrationNumber || 'N/A'}
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Account Classification:</span>
                  <span className="font-medium text-slate-800">{customer.type}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Credit Term Agreement:</span>
                  <span className="font-medium text-slate-800">{customer.creditDays || 30} Days Net</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5 bg-white">
              <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Contact Representation</span>
              </h4>
              <div className="divide-y divide-slate-100">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Primary Contact:</span>
                  <span className="font-medium text-slate-800">{customer.contactPerson}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Official Email:</span>
                  <span className="font-medium text-slate-800">{customer.email}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Phone / Mobile:</span>
                  <span className="font-medium text-slate-800">{customer.phone}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Delivery Address:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">
                    {customer.address}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Orders & Invoices */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-teal-600" />
                <span>Sales Invoices ({invoices.length})</span>
              </h4>

              {invoices.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                  No sales invoices generated yet for this account.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 font-medium">Invoice #</th>
                        <th className="py-2 px-3 font-medium">Date</th>
                        <th className="py-2 px-3 font-medium text-right">Grand Total</th>
                        <th className="py-2 px-3 font-medium text-right">Balance Due</th>
                        <th className="py-2 px-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-teal-700">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{inv.invoiceDate}</td>
                          <td className="py-2 px-3 text-right font-medium text-slate-900">
                            {formatCurrency(inv.grandTotal)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(inv.balanceDue)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge status={inv.paymentStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Recent Sales Orders ({orders.length})</span>
              </h4>

              {orders.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                  No sales orders recorded.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 font-medium">Order #</th>
                        <th className="py-2 px-3 font-medium">Order Date</th>
                        <th className="py-2 px-3 font-medium text-center">Items</th>
                        <th className="py-2 px-3 font-medium text-right">Total</th>
                        <th className="py-2 px-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((so) => (
                        <tr key={so.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                            {so.soNumber}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{so.orderDate}</td>
                          <td className="py-2 px-3 text-center text-slate-700">
                            {so.items ? so.items.length : 0} lines
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                            {formatCurrency(so.grandTotal)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge status={so.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Financial Statement & Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-3">
            {/* Ledger Totals Strip */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Total Invoiced (Debits)
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalDebits)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Total Payments / Credits
                </span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                  {formatCurrency(totalCredits)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Net Ledger Balance
                </span>
                <p className="text-sm font-bold text-teal-700 mt-0.5">
                  {formatCurrency(totalDebits - totalCredits)}
                </p>
              </div>
            </div>

            {ledgerEntries.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                No financial ledger activity registered for this customer yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 select-none">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Transaction Type</th>
                      <th className="py-2.5 px-3 font-semibold">Reference</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Debit (+)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Credit (-)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Running Balance</th>
                      <th className="py-2.5 px-3 font-semibold">Details / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-slate-600 font-mono whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              entry.type === 'Sales Invoice'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : entry.type === 'Payment Received'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">
                          {entry.ref}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-emerald-600">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-teal-700">
                          {formatCurrency(entry.runningBalance)}
                        </td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[180px]">
                          {entry.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
