// src/pages/suppliers/SuppliersPage.jsx
import React, { useState, useMemo } from 'react';
import { Truck, Plus, Search, Eye, Edit, Phone, Mail, Download } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import SupplierFormModal from './SupplierFormModal';
import SupplierDetailModal from './SupplierDetailModal';

export default function SuppliersPage() {
  const { data } = usePharma();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState(null);

  const filteredSuppliers = useMemo(() => {
    return data.suppliers.filter((s) => {
      const q = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.taxRegistrationNumber.toLowerCase().includes(q) ||
        (s.ntnNumber && s.ntnNumber.toLowerCase().includes(q))
      );
    });
  }, [data.suppliers, searchTerm]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize) || 1;
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredSuppliers.map((s) => ({
      SupplierName: s.name,
      ContactPerson: s.contactPerson,
      Email: s.email,
      Phone: s.phone,
      STRN: s.taxRegistrationNumber,
      NTN: s.ntnNumber,
      CreditDays: s.creditDays,
      OutstandingPayable: s.outstandingBalance,
      TotalPurchases: s.totalPurchases,
      Status: s.status,
    }));
    exportToCSV('Suppliers_Directory', rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Suppliers Directory</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredSuppliers.length} vendors
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Raw active ingredients, packaging foil vendors, and biological excipient providers.
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
              setSupplierToEdit(null);
              setIsFormOpen(true);
            }}
          >
            Enroll Supplier
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vendor name, contact person, or STRN..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div className="flex items-center justify-end text-xs text-slate-500">
            <span>
              Total Outstanding Payables:{' '}
              <span className="font-bold text-rose-700">
                {formatCurrency(
                  data.suppliers.reduce((acc, s) => acc + (s.outstandingBalance || 0), 0)
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedSuppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No suppliers found"
            description="Adjust your search query or register a new active ingredient vendor."
            actionLabel="Enroll Supplier"
            onAction={() => {
              setSupplierToEdit(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Supplier Name</th>
                  <th className="py-3 px-3 font-semibold">Contact Representative</th>
                  <th className="py-3 px-3 font-semibold">STRN / Tax ID</th>
                  <th className="py-3 px-3 font-semibold text-center">Credit Terms</th>
                  <th className="py-3 px-3 font-semibold text-right">Outstanding Balance</th>
                  <th className="py-3 px-3 font-semibold text-center">Rating</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{sup.name}</p>
                      <p className="text-[11px] text-slate-500">{sup.address}</p>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-800">{sup.contactPerson}</p>
                      <p className="text-[11px] text-slate-400">{sup.email}</p>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-600">
                      {sup.taxRegistrationNumber}
                    </td>

                    <td className="py-3 px-3 text-center text-slate-600">
                      {sup.creditDays} Days
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-rose-700">
                      {formatCurrency(sup.outstandingBalance)}
                    </td>

                    <td className="py-3 px-3 text-center text-amber-600 font-semibold">
                      ★ {sup.rating}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge status={sup.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedSupplierForDetail(sup)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="View Ledger & POs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSupplierToEdit(sup);
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
          totalItems={filteredSuppliers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Form Modal */}
      <SupplierFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        supplierToEdit={supplierToEdit}
      />

      {/* Detail Modal */}
      <SupplierDetailModal
        isOpen={!!selectedSupplierForDetail}
        onClose={() => setSelectedSupplierForDetail(null)}
        supplier={selectedSupplierForDetail}
        onEdit={(sup) => {
          setSupplierToEdit(sup);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}
