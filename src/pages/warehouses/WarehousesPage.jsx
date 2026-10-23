// src/pages/warehouses/WarehousesPage.jsx
import React, { useState } from 'react';
import {
  Building2,
  ArrowRightLeft,
  Thermometer,
  Eye,
  MapPin,
  Phone,
  Plus,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { formatCurrency } from '../../services/pharmaService';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import InterWarehouseTransferModal from './InterWarehouseTransferModal';
import WarehouseDetailModal from './WarehouseDetailModal';
import WarehouseFormModal from './WarehouseFormModal';

export default function WarehousesPage() {
  const { data } = usePharma();
  const [selectedWarehouseForDetail, setSelectedWarehouseForDetail] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Warehouses & Distribution Depots</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {data.warehouses.length} facilities
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cold chain chambers, regional distribution centers, and real-time facility capacity tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => setIsFormOpen(true)}>
            Add Warehouse
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.warehouses.length < 2}
            title={data.warehouses.length < 2 ? 'Add a second warehouse to transfer stock' : undefined}
            icon={ArrowRightLeft}
            onClick={() => setIsTransferModalOpen(true)}
          >
            Inter-Depot Transfer
          </Button>
        </div>
      </div>

      {data.warehouses.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="mt-3 text-sm font-semibold text-slate-900">No warehouses yet</p>
          <p className="mt-1 text-xs text-slate-500">Add the warehouse or depot where your stock is kept.</p>
          <Button variant="secondary" size="sm" icon={Plus} className="mt-4" onClick={() => setIsFormOpen(true)}>
            Add Warehouse
          </Button>
        </div>
      )}

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data.warehouses.map((wh) => {
          // Count active batches in this warehouse
          const whBatches = data.batches.filter(
            (b) => b.warehouseId === wh.id && b.availableQuantity > 0
          );
          const totalUnits = whBatches.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
          const totalValuation = whBatches.reduce(
            (acc, b) => acc + (b.availableQuantity || 0) * (b.purchaseCost || 0),
            0
          );

          return (
            <div
              key={wh.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{wh.name}</h3>
                      <p className="text-[11px] font-mono text-slate-400">{wh.code}</p>
                    </div>
                  </div>
                  <Badge status={wh.status} />
                </div>

                {/* Cold Chain Badge */}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${
                      wh.hasColdStorage
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>{wh.temperatureZone}</span>
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Facility Utilization</span>
                    <span className="font-semibold text-slate-800">{wh.utilizationPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        wh.utilizationPercent > 80
                          ? 'bg-rose-500'
                          : wh.utilizationPercent > 60
                          ? 'bg-amber-500'
                          : 'bg-teal-600'
                      }`}
                      style={{ width: `${wh.utilizationPercent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Stored Stock</span>
                    <p className="font-bold text-slate-900 mt-0.5">{totalUnits.toLocaleString()} units</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Lot Value</span>
                    <p className="font-bold text-teal-700 mt-0.5">{formatCurrency(totalValuation)}</p>
                  </div>
                </div>

                <div className="mt-3 text-xs space-y-1 text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{wh.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{wh.manager} ({wh.phone})</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  icon={Eye}
                  onClick={() => setSelectedWarehouseForDetail(wh)}
                >
                  Depot Inventory
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  icon={ArrowRightLeft}
                  onClick={() => setIsTransferModalOpen(true)}
                >
                  Transfer
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warehouse Detail Modal */}
      <WarehouseDetailModal
        isOpen={!!selectedWarehouseForDetail}
        onClose={() => setSelectedWarehouseForDetail(null)}
        warehouse={selectedWarehouseForDetail}
        onTransfer={() => {
          setSelectedWarehouseForDetail(null);
          setIsTransferModalOpen(true);
        }}
      />

      {/* Transfer Modal */}
      <InterWarehouseTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
      {isFormOpen && <WarehouseFormModal isOpen onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
