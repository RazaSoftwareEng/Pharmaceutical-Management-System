// src/pages/inventory/StockOverviewPage.jsx
import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Sliders,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Download,
  PlusCircle,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency, exportToCSV } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import StockAdjustmentModal from './StockAdjustmentModal';
import { useNavigate } from 'react-router-dom';

export default function StockOverviewPage() {
  const { data, metrics, currentWarehouseId } = usePharma();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterHealth, setFilterHealth] = useState('ALL'); // 'ALL' | 'Low' | 'Adequate' | 'Overstock'
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedBatchIdForAdjust, setSelectedBatchIdForAdjust] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Aggregate stock and health per medicine
  const medicinesWithStock = useMemo(() => {
    return data.medicines
      .map((med) => {
        // filter batches in current warehouse or all
        const batches = data.batches.filter((b) => {
          if (b.medicineId !== med.id) return false;
          if (currentWarehouseId !== 'ALL' && b.warehouseId !== currentWarehouseId) return false;
          return true;
        });

        const totalStock = batches.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
        const totalValuation = batches.reduce(
          (acc, b) => acc + (b.availableQuantity || 0) * (b.purchaseCost || 0),
          0
        );

        let health = 'Adequate';
        if (totalStock <= med.minStockLevel) {
          health = 'Low Stock';
        } else if (totalStock >= med.maxStockLevel) {
          health = 'Overstock';
        }

        return {
          ...med,
          currentStock: totalStock,
          totalValuation,
          batchCount: batches.length,
          health,
        };
      })
      .filter((med) => {
        const matchesSearch =
          med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.genericName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesHealth = filterHealth === 'ALL' || med.health === filterHealth;

        return matchesSearch && matchesHealth;
      });
  }, [data.medicines, data.batches, currentWarehouseId, searchTerm, filterHealth]);

  const totalPages = Math.ceil(medicinesWithStock.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return medicinesWithStock.slice(start, start + pageSize);
  }, [medicinesWithStock, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = medicinesWithStock.map((m) => ({
      SKU: m.sku,
      MedicineName: m.name,
      Category: m.category,
      CurrentStock: m.currentStock,
      MinThreshold: m.minStockLevel,
      MaxThreshold: m.maxStockLevel,
      InventoryValuation: m.totalValuation,
      HealthStatus: m.health,
      ActiveBatches: m.batchCount,
    }));
    exportToCSV('Inventory_Stock_Levels', rows);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Inventory Stock Overview</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {medicinesWithStock.length} items
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time warehouse aggregated inventory, stock health indicators, and reorder levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Sliders}
            onClick={() => {
              setSelectedBatchIdForAdjust(null);
              setIsAdjustModalOpen(true);
            }}
          >
            Adjust Stock
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
              placeholder="Search product or SKU..."
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
              value={filterHealth}
              onChange={(e) => {
                setFilterHealth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Stock Health Levels</option>
              <option value="Low Stock">Low Stock (Needs Reorder)</option>
              <option value="Adequate">Adequate Balance</option>
              <option value="Overstock">Overstock Buffer</option>
            </select>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-xs text-slate-500">
              Total Depot Value:{' '}
              <span className="font-bold text-slate-900">
                {formatCurrency(metrics.totalInventoryValue)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Stock Overview Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory records found"
            description="Adjust your search filters or add new stock through purchase receiving."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Medicine Formulation</th>
                  <th className="py-3 px-3 font-semibold">SKU</th>
                  <th className="py-3 px-3 font-semibold text-center">Batches</th>
                  <th className="py-3 px-3 font-semibold text-center">Safety Bounds</th>
                  <th className="py-3 px-3 font-semibold text-center">Available Stock</th>
                  <th className="py-3 px-3 font-semibold text-right">Lot Valuation</th>
                  <th className="py-3 px-3 font-semibold text-center">Stock Health</th>
                  <th className="py-3 px-4 font-semibold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 text-xs">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.category}</p>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-600">{item.sku}</td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => navigate('/batches')}
                        className="text-teal-700 font-semibold hover:underline"
                      >
                        {item.batchCount} lots
                      </button>
                    </td>

                    <td className="py-3 px-3 text-center text-slate-500">
                      <span className="text-rose-600 font-medium">{item.minStockLevel}</span>
                      <span className="mx-1 text-slate-300">/</span>
                      <span>{item.maxStockLevel}</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.health === 'Low Stock'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.currentStock.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-medium text-slate-900">
                      {formatCurrency(item.totalValuation)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <Badge
                        variant={
                          item.health === 'Low Stock'
                            ? 'Danger'
                            : item.health === 'Overstock'
                            ? 'Warning'
                            : 'Success'
                        }
                      >
                        {item.health}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {item.health === 'Low Stock' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate('/purchases/orders')}
                        >
                          Reorder PO
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBatchIdForAdjust(null);
                            setIsAdjustModalOpen(true);
                          }}
                        >
                          Adjust
                        </Button>
                      )}
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
          totalItems={medicinesWithStock.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        defaultBatchId={selectedBatchIdForAdjust}
      />
    </div>
  );
}
