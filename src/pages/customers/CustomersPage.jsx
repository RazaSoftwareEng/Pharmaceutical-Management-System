// src/pages/customers/CustomersPage.jsx
import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Eye, Edit, Building, ShieldCheck, Download } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import CustomerFormModal from './CustomerFormModal';
import CustomerDetailModal from './CustomerDetailModal';

export default function CustomersPage() {
  const { data } = usePharma();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState(null);

  const customerTypes = ['Hospital', 'Pharmacy Chain', 'Distributor', 'Retailer', 'Clinic / Dispensary'];

  const filteredCustomers = useMemo(() => {
    return data.customers.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.drugLicenseNumber.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q));

      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [data.customers, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredCustomers.map((c) => ({
      AccountName: c.name,
      Type: c.type,
      DrugLicenseNumber: c.drugLicenseNumber,
      ContactPerson: c.contactPerson,
      Email: c.email,
      Phone: c.phone,
      CreditLimit: c.creditLimit,
      OutstandingReceivables: c.outstandingReceivables,
      Status: c.status,
    }));
    exportToCSV('Customers_Accounts_Register', rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Customer Accounts</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredCustomers.length} accounts
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Licensed hospitals, institutional clinics, commercial pharmacy retail chains, and wholesale distributors.
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
            onClick={() => {
              setCustomerToEdit(null);
              setIsFormOpen(true);
            }}
          >
            Add Customer Account
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
              placeholder="Search account name, contact, DL #..."
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
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Account Classifications</option>
              {customerTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>
              Total Outstanding Receivables:{' '}
              <span className="font-bold text-teal-700">
                {formatCurrency(
                  data.customers.reduce((acc, c) => acc + (c.outstandingReceivables || 0), 0)
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customer accounts found"
            description="Adjust your search criteria or register a new healthcare institution."
            actionLabel="Add Customer"
            onAction={() => {
              setCustomerToEdit(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Account / Institution</th>
                  <th className="py-3 px-3 font-semibold">Classification</th>
                  <th className="py-3 px-3 font-semibold">Drug Sale Lic #</th>
                  <th className="py-3 px-3 font-semibold">Key Contact</th>
                  <th className="py-3 px-3 font-semibold text-right">Credit Limit</th>
                  <th className="py-3 px-3 font-semibold text-right">Receivables</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{cust.name}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {cust.address}
                      </p>
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {cust.type}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-600">
                      {cust.drugLicenseNumber}
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-800">{cust.contactPerson}</p>
                      <p className="text-[11px] text-slate-400">{cust.phone}</p>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatCurrency(cust.creditLimit)}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-teal-700">
                      {formatCurrency(cust.outstandingReceivables)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge status={cust.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCustomerForDetail(cust)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="View Ledger & Invoices"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setCustomerToEdit(cust);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
          totalItems={filteredCustomers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customerToEdit={customerToEdit}
      />

      <CustomerDetailModal
        isOpen={!!selectedCustomerForDetail}
        onClose={() => setSelectedCustomerForDetail(null)}
        customer={selectedCustomerForDetail}
        onEdit={(cust) => {
          setCustomerToEdit(cust);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}
