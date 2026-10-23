// src/pages/accounts/AccountsPage.jsx
import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  DollarSign,
  Download,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Pagination from '../../components/common/Pagination';
import RecordPaymentModal from './RecordPaymentModal';

export default function AccountsPage() {
  const { data, metrics } = usePharma();

  const [activeTab, setActiveTab] = useState('receivables'); // 'receivables' | 'payables' | 'ledger'
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModalMode, setPaymentModalMode] = useState(null); // 'customer' | 'supplier' | null

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Receivables list (Customers with balance)
  const customersList = useMemo(() => {
    return data.customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.outstandingReceivables - a.outstandingReceivables);
  }, [data.customers, searchTerm]);

  // Payables list (Suppliers with balance)
  const suppliersList = useMemo(() => {
    return data.suppliers
      .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance);
  }, [data.suppliers, searchTerm]);

  // Ledger transactions
  const ledgerTransactions = useMemo(() => {
    return data.payments.filter((p) => {
      const q = searchTerm.toLowerCase();
      return (
        p.partyName.toLowerCase().includes(q) ||
        p.referenceNumber.toLowerCase().includes(q) ||
        (p.invoiceReference && p.invoiceReference.toLowerCase().includes(q))
      );
    });
  }, [data.payments, searchTerm]);

  const handleExportCSV = () => {
    if (activeTab === 'receivables') {
      const rows = customersList.map((c) => ({
        CustomerName: c.name,
        Type: c.type,
        CreditLimit: c.creditLimit,
        OutstandingBalance: c.outstandingReceivables,
        Status: c.status,
      }));
      exportToCSV('Customer_Receivables_Ledger', rows);
    } else if (activeTab === 'payables') {
      const rows = suppliersList.map((s) => ({
        SupplierName: s.name,
        CreditDays: s.creditDays,
        OutstandingPayable: s.outstandingBalance,
        TotalPurchases: s.totalPurchases,
        Status: s.status,
      }));
      exportToCSV('Supplier_Payables_Ledger', rows);
    } else {
      const rows = ledgerTransactions.map((p) => ({
        PaymentId: p.id,
        Type: p.type,
        PartyName: p.partyName,
        Date: p.date,
        Amount: p.amount,
        Method: p.paymentMethod,
        Reference: p.referenceNumber,
        DocumentRef: p.invoiceReference,
      }));
      exportToCSV('Accounts_Financial_Ledger', rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Accounts, Payables & Receivables</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Commercial ledger reconciliations, hospital credit management, and vendor trade settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaymentModalMode('supplier')}
          >
            Supplier Payment
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPaymentModalMode('customer')}
          >
            Customer Payment
          </Button>
        </div>
      </div>

      {/* Compliance & Scope Notice */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Receivables & payables ledger</p>
          <p className="text-amber-800 text-[11px] mt-0.5 leading-snug">
            Figures come from your invoices, purchase orders, payments and expenses. A full double-entry chart of accounts and statutory tax filing are not part of this module yet.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Customer Receivables"
          value={formatCurrency(metrics.totalReceivables)}
          subtitle="Hospital & pharmacy outstanding balances"
          icon={ArrowDownRight}
          color="teal"
          onClick={() => setActiveTab('receivables')}
        />

        <StatCard
          title="Supplier Payables"
          value={formatCurrency(metrics.totalPayables)}
          subtitle="Active raw ingredient invoices due"
          icon={ArrowUpRight}
          color="rose"
          onClick={() => setActiveTab('payables')}
        />

        <StatCard
          title="Net Working Capital Delta"
          value={formatCurrency(metrics.totalReceivables - metrics.totalPayables)}
          subtitle="Receivables minus trade payables"
          icon={Wallet}
          color="indigo"
          onClick={() => setActiveTab('ledger')}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('receivables');
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors ${
            activeTab === 'receivables'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Receivables Aging ({data.customers.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('payables');
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors ${
            activeTab === 'payables'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Supplier Payables Ledger ({data.suppliers.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('ledger');
            setCurrentPage(1);
          }}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors ${
            activeTab === 'ledger'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Settlements & Payment Log ({data.payments.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search account name, reference #, or invoice..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>

      {/* Content depending on tab */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {activeTab === 'receivables' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Hospital / Pharmacy Account</th>
                  <th className="py-3 px-3 font-semibold">Classification</th>
                  <th className="py-3 px-3 font-semibold text-right">Credit Limit</th>
                  <th className="py-3 px-3 font-semibold text-right">Outstanding Receivables</th>
                  <th className="py-3 px-3 font-semibold text-center">Credit Health</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customersList.map((c) => {
                  const util = Math.round((c.outstandingReceivables / c.creditLimit) * 100);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.contactPerson}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{c.type}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(c.creditLimit)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-700">
                        {formatCurrency(c.outstandingReceivables)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            util > 80
                              ? 'bg-rose-50 text-rose-700'
                              : util > 50
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {util}% utilized
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentModalMode('customer')}
                        >
                          Receive Payment
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payables' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Active Ingredient Vendor</th>
                  <th className="py-3 px-3 font-semibold">Representative</th>
                  <th className="py-3 px-3 font-semibold text-center">Credit Terms</th>
                  <th className="py-3 px-3 font-semibold text-right">Total Purchases</th>
                  <th className="py-3 px-3 font-semibold text-right">Outstanding Payable</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliersList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{s.taxRegistrationNumber}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{s.contactPerson}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{s.creditDays} Days</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {formatCurrency(s.totalPurchases)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(s.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentModalMode('supplier')}
                      >
                        Disburse Settlement
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Payment ID</th>
                  <th className="py-3 px-3 font-semibold">Classification</th>
                  <th className="py-3 px-3 font-semibold">Account / Party</th>
                  <th className="py-3 px-3 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold">Channel</th>
                  <th className="py-3 px-3 font-semibold">Bank Ref #</th>
                  <th className="py-3 px-3 font-semibold text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerTransactions.map((p) => {
                  const isIncoming = p.type === 'Customer Payment';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-semibold text-teal-700">{p.id}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            isIncoming
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{p.partyName}</td>
                      <td className="py-3 px-3 text-slate-500">{p.date}</td>
                      <td className="py-3 px-3 text-slate-600">{p.paymentMethod}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{p.referenceNumber}</td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          isIncoming ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isIncoming ? '+' : '-'} {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for recording customer / supplier payment */}
      <RecordPaymentModal
        isOpen={!!paymentModalMode}
        onClose={() => setPaymentModalMode(null)}
        mode={paymentModalMode || 'customer'}
      />
    </div>
  );
}
