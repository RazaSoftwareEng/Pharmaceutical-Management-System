// src/pages/suppliers/SupplierDetailModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import {
  Truck,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  ShoppingCart,
  BadgeDollarSign,
  Printer,
  Download,
  Calendar,
  Layers,
  Building2,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { useNavigate } from 'react-router-dom';

export default function SupplierDetailModal({ isOpen, onClose, supplier, onEdit }) {
  const { data } = usePharma();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders' | 'ledger'

  if (!supplier) return null;

  // Purchase orders made with this supplier
  const pos = data.purchaseOrders.filter((p) => p.supplierId === supplier.id);
  const payments = (data.payments || []).filter(
    (p) => p.partyId === supplier.id || p.partyName === supplier.name
  );

  // Compute Full Chronological Vendor Ledger
  const ledgerEntries = (() => {
    const entries = [];

    // 1. Purchase Orders (Delivered/Approved Invoiced Goods -> Credits to Payable)
    pos.forEach((po) => {
      // Completed, Received or Approved POs establish payable claim
      entries.push({
        id: `PO-${po.id}`,
        date: po.receivedDate || po.orderDate,
        type: po.status === 'Completed' ? 'Goods Received (GRN)' : 'Purchase Requisition',
        ref: po.poNumber,
        secondaryRef: po.warehouseName,
        debit: 0,
        credit: po.grandTotal,
        status: po.status,
        notes: `${po.items.length} line items to ${po.warehouseName}`,
      });
    });

    // 2. Payments (Debits against Payable)
    payments.forEach((pay) => {
      entries.push({
        id: `PAY-${pay.id}`,
        date: pay.date,
        type: 'Supplier Payment',
        ref: pay.referenceNumber || pay.id,
        secondaryRef: pay.invoiceReference || 'On Account',
        debit: pay.amount,
        credit: 0,
        status: 'Settled',
        notes: `${pay.paymentMethod}${pay.notes ? ` • ${pay.notes}` : ''}`,
      });
    });

    // Sort chronologically ascending
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance (Payable = Previous + Credit - Debit)
    let running = 0;
    return entries.map((entry) => {
      running += entry.credit - entry.debit;
      return {
        ...entry,
        runningBalance: running,
      };
    });
  })();

  const totalPayablesAccrued = ledgerEntries.reduce((acc, e) => acc + e.credit, 0);
  const totalSettlementsPaid = ledgerEntries.reduce((acc, e) => acc + e.debit, 0);

  const handleExportLedgerCSV = () => {
    const rows = ledgerEntries.map((e) => ({
      Date: e.date,
      TransactionType: e.type,
      Reference: e.ref,
      DestinationFacility: e.secondaryRef,
      DebitSettlementPKR: e.debit,
      CreditPayablePKR: e.credit,
      RunningBalancePKR: e.runningBalance,
      Status: e.status,
      Notes: e.notes,
    }));
    exportToCSV(`Vendor_Payables_Ledger_${supplier.name.replace(/[^a-zA-Z0-9]/g, '_')}`, rows);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier.name}
      subtitle={`Sales Tax (STRN): ${supplier.taxRegistrationNumber} • NTN: ${supplier.ntnNumber}`}
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
                onEdit(supplier);
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
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Outstanding Balance</span>
            <p className="text-base font-bold text-rose-700 mt-0.5">
              {formatCurrency(supplier.outstandingBalance)}
            </p>
            <p className="text-[11px] text-slate-500">Payable amount</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Deliveries</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {formatCurrency(supplier.totalPurchases)}
            </p>
            <p className="text-[11px] text-teal-600 font-medium">All-time delivered</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Credit Terms</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">{supplier.creditDays} Days</p>
            <p className="text-[11px] text-slate-500">Net trade settlement</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Vendor Quality Rating</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-amber-600">★ {supplier.rating}</span>
              <Badge status={supplier.status} />
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">cGMP Certified</p>
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
            <FileCheck className="w-3.5 h-3.5" />
            <span>Profile & GMP Compliance</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 text-xs font-semibold px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'orders'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Purchase Orders ({pos.length})</span>
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
            <span>Vendor Payables Ledger ({ledgerEntries.length})</span>
          </button>
        </div>

        {/* Tab 1: Profile & Compliance */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5 bg-white">
              <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Truck className="w-4 h-4 text-teal-600" />
                <span>Commercial & Contact Information</span>
              </h4>
              <div className="divide-y divide-slate-100">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Contact Representative:</span>
                  <span className="font-medium text-slate-800">{supplier.contactPerson}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Official Email:</span>
                  <span className="font-medium text-slate-800">{supplier.email}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Phone / Emergency:</span>
                  <span className="font-medium text-slate-800">{supplier.phone}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Factory / Depot Address:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">
                    {supplier.address}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3.5 space-y-2.5 bg-white">
              <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Tax & GMP Regulatory Audits</span>
              </h4>
              <div className="divide-y divide-slate-100">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Sales Tax (STRN):</span>
                  <span className="font-mono font-medium text-slate-800">
                    {supplier.taxRegistrationNumber}
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">National Tax # (NTN):</span>
                  <span className="font-mono font-medium text-slate-800">{supplier.ntnNumber}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">GMP Vendor Status:</span>
                  <span className="font-medium text-emerald-700">Audit Certified (Valid 2027)</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Quality Inspection Grade:</span>
                  <span className="font-semibold text-slate-800">Grade A Active API Vendor</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Purchase Orders */}
        {activeTab === 'orders' && (
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-slate-500" />
              <span>Purchase Orders & Deliveries ({pos.length})</span>
            </h4>

            {pos.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                No purchase orders currently recorded with this supplier.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">PO #</th>
                      <th className="py-2.5 px-3 font-medium">Order Date</th>
                      <th className="py-2.5 px-3 font-medium">Receiving Depot</th>
                      <th className="py-2.5 px-3 font-medium text-center">Lines</th>
                      <th className="py-2.5 px-3 font-medium text-right">Grand Total</th>
                      <th className="py-2.5 px-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pos.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-700">
                          {p.poNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{p.orderDate}</td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-[150px]">
                          {p.warehouseName}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {p.items ? p.items.length : 0} lines
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(p.grandTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Vendor Payables Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-3">
            {/* Ledger Totals Strip */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Total Invoiced Purchases (Credits)
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {formatCurrency(totalPayablesAccrued)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Total Vendor Settlements (Debits)
                </span>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                  {formatCurrency(totalSettlementsPaid)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Net Outstanding Payable
                </span>
                <p className="text-sm font-bold text-rose-700 mt-0.5">
                  {formatCurrency(totalPayablesAccrued - totalSettlementsPaid)}
                </p>
              </div>
            </div>

            {ledgerEntries.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                No financial transactions or deliveries recorded for this vendor.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 select-none">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Transaction Type</th>
                      <th className="py-2.5 px-3 font-semibold">Reference</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Debit / Settlement (-)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Credit / Invoiced (+)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Running Payable</th>
                      <th className="py-2.5 px-3 font-semibold">Details / Line Note</th>
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
                              entry.type === 'Supplier Payment'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : entry.type === 'Goods Received (GRN)'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">
                          {entry.ref}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-emerald-600">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
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
