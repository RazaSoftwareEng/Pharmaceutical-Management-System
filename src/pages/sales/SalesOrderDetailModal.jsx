// src/pages/sales/SalesOrderDetailModal.jsx
import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../services/pharmaService';
import { ShoppingBag, FileText, CheckCircle2, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SalesOrderDetailModal({ isOpen, onClose, order, onViewInvoice }) {
  const navigate = useNavigate();
  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sales Order: ${order.soNumber}`}
      subtitle={`Customer: ${order.customerName} • Depot: ${order.warehouseName}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>
            Print Order
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {order.invoiceId && (
              <Button
                variant="secondary"
                size="sm"
                icon={FileText}
                onClick={() => {
                  onClose();
                  onViewInvoice(order.invoiceId);
                }}
              >
                View Sales Invoice
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Order Status</span>
            <div className="mt-1">
              <Badge status={order.status} />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Dispatch Date</span>
            <p className="font-semibold text-slate-800 mt-1">{order.orderDate}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Payment Status</span>
            <div className="mt-1">
              <Badge status={order.paymentStatus} />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400">Grand Total</span>
            <p className="font-bold text-teal-700 text-sm mt-1">{formatCurrency(order.grandTotal)}</p>
          </div>
        </div>

        {/* Items & FEFO Batches Table */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <span>Dispatched Medicines & FEFO Allocated Batches</span>
          </h4>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Medicine Formulation</th>
                  <th className="py-2.5 px-2 font-semibold text-center">Quantity</th>
                  <th className="py-2.5 px-3 font-semibold">FEFO Lot Allocation & Expiry</th>
                  <th className="py-2.5 px-2 font-semibold text-right">Unit Price</th>
                  <th className="py-2.5 px-2 font-semibold text-center">Disc %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {item.medicineName}
                    </td>

                    <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        {item.allocatedBatches && item.allocatedBatches.length > 0 ? (
                          item.allocatedBatches.map((b, bi) => (
                            <span
                              key={bi}
                              className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono mr-1"
                            >
                              {b.batchNumber} ({b.quantity}u • Exp: {b.expiryDate})
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">Allocated on confirmation</span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    <td className="py-2.5 px-2 text-center text-slate-500">
                      {item.discountPercent}%
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="text-xs text-slate-500 space-y-1">
            {order.invoiceId && (
              <p className="font-semibold text-teal-700">
                Sales Invoice Generated: {order.invoiceId}
              </p>
            )}
            {order.notes && (
              <p>
                <span className="font-semibold text-slate-700">Delivery Notes:</span> {order.notes}
              </p>
            )}
          </div>

          <div className="w-full sm:w-60 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discounts:</span>
              <span className="font-mono text-emerald-600">-{formatCurrency(order.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax:</span>
              <span className="font-mono">{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900 text-sm">
              <span>Grand Total:</span>
              <span className="text-teal-700">{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
