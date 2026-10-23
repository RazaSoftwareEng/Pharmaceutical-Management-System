// src/pages/warehouses/WarehouseDetailModal.jsx
import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, evaluateBatchStatus } from '../../services/pharmaService';
import { Building2, Thermometer, User, MapPin, Package } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

export default function WarehouseDetailModal({ isOpen, onClose, warehouse, onTransfer }) {
  const { data } = usePharma();
  if (!warehouse) return null;

  // Batches residing in this warehouse
  const batches = data.batches.filter((b) => b.warehouseId === warehouse.id && b.availableQuantity > 0);
  const totalUnits = batches.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
  const totalValuation = batches.reduce(
    (acc, b) => acc + (b.availableQuantity || 0) * (b.purchaseCost || 0),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={warehouse.name}
      subtitle={`Code: ${warehouse.code} • Classification: ${warehouse.type}`}
      size="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onClose();
              onTransfer(warehouse);
            }}
          >
            Initiate Transfer
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Capacity</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {warehouse.capacitySqFt.toLocaleString()} sq ft
            </p>
            <p className="text-[11px] text-teal-600 font-medium">{warehouse.utilizationPercent}% Used</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Stock Units</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalUnits.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500">Across {batches.length} batches</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Asset Value</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(totalValuation)}</p>
            <p className="text-[11px] text-slate-500">Lot cost basis</p>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Cold Chain</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {warehouse.hasColdStorage ? 'Certified' : 'Ambient'}
            </p>
            <Badge status={warehouse.status} />
          </div>
        </div>

        {/* Location & Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>Facility Logistics & Zone</span>
            </h4>
            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Address:</span>
                <span className="font-medium text-slate-800">{warehouse.address}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Temperature:</span>
                <span className="font-medium text-slate-800">{warehouse.temperatureZone}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Custody & Management</span>
            </h4>
            <div className="divide-y divide-slate-100">
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Depot Manager:</span>
                <span className="font-medium text-slate-800">{warehouse.manager}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Emergency Phone:</span>
                <span className="font-medium text-slate-800">{warehouse.phone}</span>
              </div>
              <div className="py-1.5 flex justify-between">
                <span className="text-slate-500">Official Email:</span>
                <span className="font-medium text-slate-800">{warehouse.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Batches In Warehouse */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-slate-500" />
            <span>Active Medicine Lots Stored in Facility ({batches.length})</span>
          </h4>

          {batches.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
              No inventory batches currently stored in this depot.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-medium">Batch #</th>
                    <th className="py-2 px-3 font-medium">Medicine</th>
                    <th className="py-2 px-3 font-medium">Expiry Date</th>
                    <th className="py-2 px-3 font-medium text-center">Available Units</th>
                    <th className="py-2 px-3 font-medium text-center">Quality Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                        {b.batchNumber}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">{b.medicineName}</td>
                      <td className="py-2 px-3 text-slate-600">{b.expiryDate}</td>
                      <td className="py-2 px-3 text-center font-bold text-teal-700">
                        {b.availableQuantity}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge status={evaluateBatchStatus(b)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
