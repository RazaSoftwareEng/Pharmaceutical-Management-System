// src/pages/sales/CreateSalesOrderModal.jsx
import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, allocateBatchesFEFO, calculateBonus, formatScheme } from '../../services/pharmaService';
import { Plus, Trash2, ShoppingBag, ShieldAlert, CheckCircle2, AlertCircle, Gift, CreditCard } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';

// Gross margin on a line once free bonus units are costed in
function lineMargin(line) {
  const net = line.quantity * line.unitPrice * (1 - line.discountPercent / 100);
  if (!net) return 0;
  return ((net - (line.quantity + line.bonusQty) * line.unitCost) / net) * 100;
}

export default function CreateSalesOrderModal({ isOpen, onClose }) {
  const { data, createSalesOrder, currentUserRole } = usePharma();

  const [customerId, setCustomerId] = useState(data.customers[0]?.id || '');
  const [salesRepId, setSalesRepId] = useState(data.customers[0]?.salesRepId || '');
  const [creditOverride, setCreditOverride] = useState(false);
  const salesReps = data.employees.filter((e) => e.isSalesRep && e.status !== 'Inactive');
  const [warehouseId, setWarehouseId] = useState(data.warehouses[0]?.id || 'WH-01');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [confirmNow, setConfirmNow] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Initial line item
  const [items, setItems] = useState([
    {
      medicineId: data.medicines[0]?.id || '',
      quantity: 50,
      unitPrice: data.medicines[0]?.sellingPrice || 580.0,
      bonusQty: null, // null = follow the product's scheme automatically
      discountPercent: 0,
      taxPercent: data.companyProfile.defaultTaxRate ?? 0,
    },
  ]);

  const handleAddItem = () => {
    const med = data.medicines[0];
    setItems((prev) => [
      ...prev,
      {
        medicineId: med ? med.id : '',
        quantity: 20,
        unitPrice: med ? med.sellingPrice : 200.0,
        bonusQty: null,
        discountPercent: 0,
        taxPercent: data.companyProfile.defaultTaxRate ?? 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === 'medicineId') {
        const med = data.medicines.find((m) => m.id === value);
        updated[index] = {
          ...updated[index],
          medicineId: value,
          unitPrice: med ? med.sellingPrice : updated[index].unitPrice,
          bonusQty: null,
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  // Evaluate FEFO allocation and eligible stock for each item in real time
  const evaluatedLines = items.map((it) => {
    const med = data.medicines.find((m) => m.id === it.medicineId);
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const autoBonus = calculateBonus(med?.bonusScheme, qty);
    const bonusQty = it.bonusQty === null || it.bonusQty === '' ? autoBonus : Math.max(0, Number(it.bonusQty) || 0);

    // Free units leave the warehouse too, so FEFO allocates billed + bonus
    const fefoResult = allocateBatchesFEFO({
      batches: data.batches,
      medicineId: it.medicineId,
      warehouseId,
      requestedQuantity: qty + bonusQty,
    });

    const gross = qty * price;
    const discountAmt = gross * ((Number(it.discountPercent) || 0) / 100);
    const afterDisc = gross - discountAmt;
    const taxAmt = afterDisc * ((Number(it.taxPercent) || 0) / 100);
    const lineTotal = afterDisc + taxAmt;

    return {
      medicineId: it.medicineId,
      medicineName: med ? med.name : 'Unknown Product',
      sku: med ? med.sku : '',
      genericName: med ? med.genericName : '',
      quantity: qty,
      bonusQty,
      autoBonus,
      scheme: med?.bonusScheme || null,
      unitPrice: price,
      retailPrice: med?.retailPrice || null,
      unitCost: med?.purchasePrice || 0,
      discountPercent: Number(it.discountPercent) || 0,
      taxPercent: Number(it.taxPercent) || 0,
      total: lineTotal,
      fefo: fefoResult,
    };
  });

  const subtotal = evaluatedLines.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const discountTotal = evaluatedLines.reduce(
    (acc, it) => acc + (it.quantity * it.unitPrice * it.discountPercent) / 100,
    0
  );
  const afterDisc = subtotal - discountTotal;
  const taxTotal = evaluatedLines.reduce(
    (acc, it) =>
      acc + (it.quantity * it.unitPrice * (1 - it.discountPercent / 100) * it.taxPercent) / 100,
    0
  );
  const grandTotal = afterDisc + taxTotal;

  // Check if any line has insufficient stock
  const hasStockErrors = evaluatedLines.some((l) => !l.fefo.success && l.quantity > 0);

  // Credit control
  const customer = data.customers.find((c) => c.id === customerId);
  const outstanding = customer?.outstandingReceivables || 0;
  const creditLimit = customer?.creditLimit || 0;
  const projected = outstanding + grandTotal;
  const overLimit = creditLimit > 0 && projected > creditLimit;
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueInvoices = data.salesInvoices.filter(
    (inv) => inv.customerId === customerId && (inv.balanceDue || 0) > 0 && inv.dueDate < todayStr
  );
  const canOverrideCredit = currentUserRole === 'Admin';
  const creditBlocked = confirmNow && overLimit && !(canOverrideCredit && creditOverride);

  const totalBonusUnits = evaluatedLines.reduce((a, l) => a + l.bonusQty, 0);
  const bonusValue = evaluatedLines.reduce((a, l) => a + l.bonusQty * l.unitPrice, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer account');
      return;
    }
    if (!warehouseId) {
      setError('Please select a dispatching warehouse');
      return;
    }

    // Validate quantities and stock
    for (let i = 0; i < evaluatedLines.length; i++) {
      const line = evaluatedLines[i];
      if (!line.medicineId || line.quantity <= 0) {
        setError(`Please check line #${i + 1}: valid medicine and positive quantity required.`);
        return;
      }
      if (!line.fefo.success) {
        setError(
          `Stock validation failed on line #${i + 1} (${line.medicineName}): requested ${
            line.quantity
          }, but only ${line.fefo.totalEligible} eligible units in depot.`
        );
        return;
      }
    }

    if (creditBlocked) {
      setError(
        `Credit limit exceeded: ${customer?.name} would owe ${formatCurrency(projected)} against a limit of ${formatCurrency(creditLimit)}.`
      );
      return;
    }

    const cust = data.customers.find((c) => c.id === customerId);
    const wh = data.warehouses.find((w) => w.id === warehouseId);

    const res = createSalesOrder({
      orderData: {
        customerId,
        customerName: cust ? cust.name : 'Customer',
        salesRepId: salesRepId || null,
        warehouseId,
        warehouseName: wh ? wh.name : 'Warehouse',
        orderDate,
        items: evaluatedLines,
        subtotal,
        discountAmount: discountTotal,
        taxAmount: taxTotal,
        grandTotal,
        notes,
      },
      confirmImmediately: confirmNow,
    });

    if (res.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Sales Dispatch Order (FEFO)"
      subtitle="Orders automatically allocate eligible earliest-expiring active batches and generate invoices."
      size="2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={hasStockErrors || creditBlocked}
            onClick={handleSubmit}
          >
            {confirmNow ? 'Confirm & Deduct Stock' : 'Save as Draft'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Customer & Warehouse selection */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Account (Hospital/Retail) <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setSalesRepId(data.customers.find((c) => c.id === e.target.value)?.salesRepId || '');
                setCreditOverride(false);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {data.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatching Warehouse Depot <span className="text-rose-500">*</span>
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {data.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Booked by (Salesman)</label>
            <select
              value={salesRepId}
              onChange={(e) => setSalesRepId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Direct / office order</option>
              {salesReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} ({r.territory})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Order Date</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
        </div>

        {/* Credit position */}
        {customer && (
          <div
            className={`p-3 rounded-lg border text-xs flex flex-wrap items-center gap-x-6 gap-y-2 ${
              overLimit ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <CreditCard className="w-4 h-4" /> Credit position
            </span>
            <span>
              Outstanding: <strong className="tabular-nums">{formatCurrency(outstanding)}</strong>
            </span>
            <span>
              Limit: <strong className="tabular-nums">{creditLimit ? formatCurrency(creditLimit) : 'Not set'}</strong>
            </span>
            <span>
              After this order: <strong className="tabular-nums">{formatCurrency(projected)}</strong>
            </span>
            {overdueInvoices.length > 0 && (
              <span className="text-amber-700 font-semibold">{overdueInvoices.length} overdue invoice(s)</span>
            )}
            {overLimit && (
              <span className="w-full flex flex-wrap items-center justify-between gap-2 font-semibold">
                Order exceeds the credit limit.
                {canOverrideCredit ? (
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={creditOverride}
                      onChange={(e) => setCreditOverride(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    Approve override (Admin)
                  </label>
                ) : (
                  <span className="font-medium">Ask an Admin to approve, or collect payment first.</span>
                )}
              </span>
            )}
          </div>
        )}

        {/* FEFO Policy Info Box */}
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>First Expiry First Out (FEFO):</strong> System will auto-assign soonest expiring batches. Expired & Quarantined stock is locked.
            </span>
          </div>
          <label className="flex items-center gap-1.5 font-medium cursor-pointer shrink-0 ml-2">
            <input
              type="checkbox"
              checked={confirmNow}
              onChange={(e) => setConfirmNow(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Confirm & Invoice Now</span>
          </label>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-teal-600" />
              <span>Medicine Line Items & Batch Allocation Preview</span>
            </h4>
            <Button variant="outline" size="sm" icon={Plus} onClick={handleAddItem}>
              Add Medicine
            </Button>
          </div>

          <div className="space-y-3">
            {evaluatedLines.map((line, idx) => {
              const fefo = line.fefo;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-2.5 transition-colors ${
                    !fefo.success
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    {/* Medicine */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Product Formulation
                      </label>
                      <select
                        value={line.medicineId}
                        onChange={(e) => handleItemChange(idx, 'medicineId', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 py-1.5 px-2 outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        {data.medicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.strength})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Qty */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Order Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 py-1.5 px-2 outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center"
                      />
                    </div>

                    {/* Bonus */}
                    <div className="sm:col-span-1">
                      <label
                        className="block text-[10px] font-semibold text-slate-500 mb-0.5"
                        title={line.scheme ? `Scheme ${formatScheme(line.scheme)}` : 'No scheme on this product'}
                      >
                        Bonus
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={items[idx].bonusQty === null ? line.autoBonus : items[idx].bonusQty}
                        onChange={(e) => handleItemChange(idx, 'bonusQty', e.target.value)}
                        className="w-full text-xs rounded border border-emerald-300 bg-emerald-50/40 py-1.5 px-1 outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        TP (PKR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 py-1.5 px-2 outline-none focus:ring-1 focus:ring-teal-500 font-mono text-right"
                      />
                    </div>

                    {/* Disc % */}
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Disc %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={line.discountPercent}
                        onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 py-1.5 px-1 outline-none focus:ring-1 focus:ring-teal-500 font-mono text-center"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="sm:col-span-2 text-right">
                      <span className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Line Total
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {formatCurrency(line.total)}
                      </span>
                    </div>

                    {/* Remove */}
                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="mt-4 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>

                  {/* Commercial terms */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    {line.scheme && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <Gift className="w-3.5 h-3.5" /> Scheme {formatScheme(line.scheme)}
                        {line.bonusQty !== line.autoBonus && ' (manually adjusted)'}
                      </span>
                    )}
                    {line.retailPrice && <span>MRP {formatCurrency(line.retailPrice)}</span>}
                    {line.unitPrice > 0 && line.quantity > 0 && (
                      <span>
                        Margin after bonus:{' '}
                        <strong className="text-slate-700">{lineMargin(line).toFixed(1)}%</strong>
                      </span>
                    )}
                  </div>

                  {/* Real-time FEFO Allocation Pill / Alert */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    {fefo.success ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-700">FEFO Allocated Lots:</span>
                        {fefo.allocations.map((a, i) => (
                          <span
                            key={i}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono"
                          >
                            {a.batchNumber} ({a.quantity}u • Exp: {a.expiryDate})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          {fefo.reason}. Available eligible stock in depot: {fefo.totalEligible} units.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Instructions / Hospital Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Delivery department gate, temperature logging instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discounts:</span>
              <span className="font-mono text-emerald-600">-{formatCurrency(discountTotal)}</span>
            </div>
            {totalBonusUnits > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Bonus units ({totalBonusUnits}):</span>
                <span className="font-mono">{formatCurrency(bonusValue)} free</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax:</span>
              <span className="font-mono">{formatCurrency(taxTotal)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-teal-700">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
