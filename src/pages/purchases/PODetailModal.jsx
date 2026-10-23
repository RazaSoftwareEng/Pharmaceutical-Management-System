// src/pages/purchases/PODetailModal.jsx
import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../services/pharmaService';
import { ShoppingCart, CheckCircle, XCircle, PackageCheck, Printer, Send } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

export default function PODetailModal({ isOpen, onClose, po, onReceiveGoods }) {
  const { updatePOStatus, currentUserRole } = usePharma();
  if (!po) return null;

  const canApprove =
    currentUserRole === 'Admin' ||
    currentUserRole === 'Inventory Manager' ||
    currentUserRole === 'Accountant';

  const handleApprove = () => {
    updatePOStatus(po.id, 'Approved');
    onClose();
  };

  const handleReject = () => {
    updatePOStatus(po.id, 'Cancelled');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Purchase Order: ${po.poNumber}`}
      subtitle={`Supplier: ${po.supplierName} • Destination: ${po.warehouseName}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>
            Print PO
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>

            {po.status === 'Draft' && (
              <Button
                variant="secondary"
                size="sm"
                icon={Send}
                onClick={() => {
                  updatePOStatus(po.id, 'Pending Approval');
                  onClose();
                }}
              >
                Submit for Approval
              </Button>
            )}

            {po.status === 'Pending Approval' && canApprove && (
              <>
                <Button variant="danger" size="sm" icon={XCircle} onClick={handleReject}>
                  Reject PO
                </Button>
                <Button variant="success" size="sm" icon={CheckCircle} onClick={handleApprove}>
                  Approve Order
                </Button>
              </>
            )}

            {po.status === 'Approved' && (
              <Button
                variant="secondary"
                size="sm"
                icon={PackageCheck}
                onClick={() => {
                  onClose();
                  onReceiveGoods(po);
                }}
              >
                Receive Goods (GRN)
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status and Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Order Status</span>
            <div className="mt-1">
              <Badge status={po.status} />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Order Date</span>
            <p className="font-semibold text-slate-800 mt-1">{po.orderDate}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Expected Delivery</span>
            <p className="font-semibold text-slate-800 mt-1">
              {po.expectedDeliveryDate || 'Standard Delivery'}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Grand Total</span>
            <p className="font-bold text-teal-700 text-sm mt-1">{formatCurrency(po.grandTotal)}</p>
          </div>
        </div>

        {/* PO Line Items Table */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-slate-500" />
            <span>Procured Medicines & Raw Ingredients</span>
          </h4>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Medicine Formulation</th>
                  <th className="py-2.5 px-2 font-semibold">SKU</th>
                  <th className="py-2.5 px-2 font-semibold text-center">Quantity</th>
                  <th className="py-2.5 px-2 font-semibold text-right">Unit Cost</th>
                  <th className="py-2.5 px-2 font-semibold text-center">Disc %</th>
                  <th className="py-2.5 px-2 font-semibold text-center">Tax %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {po.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.medicineName}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-500">{item.sku}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-500">{item.discountPercent}%</td>
                    <td className="py-2.5 px-2 text-center text-slate-500">{item.taxPercent}%</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="text-xs text-slate-500 space-y-1">
            <p>
              <span className="font-semibold text-slate-700">Payment Terms:</span> {po.paymentTerms}
            </p>
            {po.notes && (
              <p>
                <span className="font-semibold text-slate-700">Notes:</span> {po.notes}
              </p>
            )}
            {po.receivedDate && (
              <p className="text-emerald-700 font-medium">
                ✓ Received and posted to inventory on {po.receivedDate}
              </p>
            )}
          </div>

          <div className="w-full sm:w-60 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(po.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discounts:</span>
              <span className="font-mono text-emerald-600">-{formatCurrency(po.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes:</span>
              <span className="font-mono">{formatCurrency(po.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900 text-sm">
              <span>Total Payable:</span>
              <span className="text-teal-700">{formatCurrency(po.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
