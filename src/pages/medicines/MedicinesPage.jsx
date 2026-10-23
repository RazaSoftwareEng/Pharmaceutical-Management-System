// src/pages/medicines/MedicinesPage.jsx
import React, { useState, useMemo } from 'react';
import {
  Pill,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MedicineFormModal from './MedicineFormModal';
import MedicineDetailModal from './MedicineDetailModal';

export default function MedicinesPage() {
  const { data, metrics, deleteMedicine } = usePharma();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [medicineToEdit, setMedicineToEdit] = useState(null);
  const [detailMedicine, setDetailMedicine] = useState(null);
  const [medicineToDelete, setMedicineToDelete] = useState(null);

  // Filtered and sorted medicines
  const filteredMedicines = useMemo(() => {
    return data.medicines
      .filter((med) => {
        const matchesSearch =
          med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.sku.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || med.category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || med.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (sortBy === 'stock') {
          valA = metrics.medicineStockMap[a.id] || 0;
          valB = metrics.medicineStockMap[b.id] || 0;
        }
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [data.medicines, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder, metrics.medicineStockMap]);

  // Paginated items
  const totalPages = Math.ceil(filteredMedicines.length / pageSize) || 1;
  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMedicines.slice(start, start + pageSize);
  }, [filteredMedicines, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = () => {
    if (medicineToDelete) {
      deleteMedicine(medicineToDelete.id);
      setMedicineToDelete(null);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredMedicines.map((m) => ({
      SKU: m.sku,
      Name: m.name,
      GenericMolecule: m.genericName,
      Category: m.category,
      DosageForm: m.dosageForm,
      Strength: m.strength,
      Packaging: m.unitOfMeasure,
      PurchaseCost: m.purchasePrice,
      SellingPrice: m.sellingPrice,
      CurrentStock: metrics.medicineStockMap[m.id] || 0,
      ReorderThreshold: m.minStockLevel,
      Status: m.status,
    }));
    exportToCSV('Medicines_Catalog', rows);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Medicines & Formulations</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredMedicines.length} products
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Master pharmaceutical formulary, dosage strengths, wholesale tariffs, and stock thresholds.
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
              setMedicineToEdit(null);
              setIsFormOpen(true);
            }}
          >
            Add Medicine
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by brand, generic, or SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Therapeutic Categories</option>
              {data.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Product Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive / Suspended</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="name-asc">Sort: Product Name (A-Z)</option>
              <option value="name-desc">Sort: Product Name (Z-A)</option>
              <option value="stock-asc">Sort: Stock (Low to High)</option>
              <option value="stock-desc">Sort: Stock (High to Low)</option>
              <option value="sellingPrice-desc">Sort: Price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicine Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedMedicines.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No medicine formulations found"
            description="Adjust your search filters or add a new medicine formulation to catalog."
            actionLabel="Add Medicine"
            onAction={() => {
              setMedicineToEdit(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Medicine & Molecule</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold">SKU / Code</th>
                  <th className="py-3 px-3 font-semibold">Therapeutic Class</th>
                  <th className="py-3 px-3 font-semibold">Strength & Form</th>
                  <th className="py-3 px-3 font-semibold text-right">Purchase</th>
                  <th className="py-3 px-3 font-semibold text-right">Selling</th>
                  <th className="py-3 px-3 font-semibold text-center">
                    <button
                      onClick={() => handleSort('stock')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>Stock Units</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMedicines.map((med) => {
                  const stock = metrics.medicineStockMap[med.id] || 0;
                  const isLow = stock <= med.minStockLevel;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{med.name}</p>
                            <p className="text-[11px] text-slate-500">{med.genericName}</p>
                          </div>
                          {med.prescriptionRequired && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200">
                              Rx
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-medium text-slate-600">{med.sku}</td>

                      <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                        {med.category}
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        <span className="font-medium">{med.strength}</span>
                        <span className="text-slate-400 ml-1">({med.dosageForm})</span>
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatCurrency(med.purchasePrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        {formatCurrency(med.sellingPrice)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {stock}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-rose-500 font-medium">Reorder</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge status={med.status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailMedicine(med)}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setMedicineToEdit(med);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMedicineToDelete(med)}
                            className="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMedicines.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add / Edit Medicine Modal */}
      <MedicineFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        medicineToEdit={medicineToEdit}
      />

      {/* Detail Modal */}
      <MedicineDetailModal
        isOpen={!!detailMedicine}
        onClose={() => setDetailMedicine(null)}
        medicine={detailMedicine}
        onEdit={(med) => {
          setMedicineToEdit(med);
          setIsFormOpen(true);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!medicineToDelete}
        onClose={() => setMedicineToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Medicine Formulation"
        message={`Are you sure you want to delete "${medicineToDelete?.name}" (${medicineToDelete?.sku})? This product will be permanently removed from catalog.`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
