// src/pages/sales/SalesInvoicePrintModal.jsx
import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, buildWhatsAppLink } from '../../services/pharmaService';
import { Printer, Pill, MessageCircle } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { BRAND_NAME } from '../../config/brand';

export default function SalesInvoicePrintModal({ isOpen, onClose, invoice }) {
  const { data } = usePharma();
  if (!invoice) return null;

  const company = { ...data.companyProfile, name: data.companyProfile.name || BRAND_NAME };
  const customer = data.customers.find((c) => c.id === invoice.customerId);
  const salesRep = data.employees.find((e) => e.id === (invoice.salesRepId || customer?.salesRepId));
  const hasBonus = invoice.items.some((it) => it.bonusQty > 0);
  const hasMrp = invoice.items.some((it) => it.retailPrice);

  const whatsappMessage = [
    `Assalam-o-Alaikum ${customer?.contactPerson || invoice.customerName},`,
    '',
    `Invoice *${invoice.invoiceNumber}* from ${company.tradeName || company.name}`,
    `Date: ${invoice.invoiceDate}  |  Due: ${invoice.dueDate}`,
    ...invoice.items.map(
      (it) => `• ${it.medicineName} x ${it.quantity}${it.bonusQty ? ` + ${it.bonusQty} bonus` : ''} = ${formatCurrency(it.total)}`
    ),
    '',
    `*Total: ${formatCurrency(invoice.grandTotal)}*`,
    invoice.balanceDue > 0 ? `Balance due: ${formatCurrency(invoice.balanceDue)}` : 'Status: Paid in full',
    '',
    'Thank you for your business.',
  ].join('\n');
  const whatsappLink = buildWhatsAppLink(customer?.phone, whatsappMessage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sales Tax Invoice: ${invoice.invoiceNumber}`}
      subtitle={`Customer: ${invoice.customerName}`}
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full no-print">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={MessageCircle}
              disabled={!whatsappLink}
              title={whatsappLink ? 'Send invoice summary on WhatsApp' : 'Customer has no phone number on file'}
              onClick={() => window.open(whatsappLink, '_blank', 'noopener')}
            >
              Send on WhatsApp
            </Button>
            <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>
              Print Invoice
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-4 sm:p-6 bg-white border border-slate-200 rounded-xl print-shadow-none text-slate-800 text-xs font-sans">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center font-black shrink-0">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {company.name}
              </h2>
              <p className="text-[11px] text-slate-500">{company.address}, {company.city}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                DRAP Drug Lic: {company.drugLicenseNumber} • NTN: {company.taxId}
                {company.vatNumber ? ` • STRN: ${company.vatNumber}` : ''}
              </p>
              <p className="text-[10px] text-slate-400">{company.phone}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-slate-100 rounded text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Sales Tax Invoice
            </span>
            <p className="font-mono font-bold text-slate-900 text-sm">{invoice.invoiceNumber}</p>
            <p className="text-[11px] text-slate-500">Order Ref: {invoice.orderNumber}</p>
          </div>
        </div>

        {/* Customer & Billing Details */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Billed Account:</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{invoice.customerName}</p>
            <p className="text-slate-600 mt-0.5">{invoice.customerAddress || 'Address on file'}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              NTN/STRN: {invoice.customerTaxId || 'N/A'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Drug Sale Lic: {invoice.customerLicense || customer?.drugLicenseNumber || 'N/A'}
            </p>
          </div>

          <div className="text-right space-y-1">
            <p>
              <span className="text-slate-500">Invoice Date:</span>{' '}
              <span className="font-semibold text-slate-900">{invoice.invoiceDate}</span>
            </p>
            <p>
              <span className="text-slate-500">Payment Due Date:</span>{' '}
              <span className="font-semibold text-slate-900">{invoice.dueDate}</span>
            </p>
            <p>
              <span className="text-slate-500">Dispatched From:</span>{' '}
              <span className="font-semibold text-slate-900">{invoice.warehouseName}</span>
            </p>
            {salesRep && (
              <p>
                <span className="text-slate-500">Salesman:</span>{' '}
                <span className="font-semibold text-slate-900">{salesRep.fullName}</span>
              </p>
            )}
            <div className="pt-1">
              <Badge status={invoice.paymentStatus} />
            </div>
          </div>
        </div>

        {/* Invoice Items Table (with Batch # and Expiry - Standard Pharma Requirement) */}
        <div className="py-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-2 font-semibold">#</th>
                <th className="py-2 px-3 font-semibold">Formulation & Generic API</th>
                <th className="py-2 px-3 font-semibold">Batch Code</th>
                <th className="py-2 px-3 font-semibold">Expiry Date</th>
                <th className="py-2 px-2 font-semibold text-center">Qty</th>
                {hasBonus && <th className="py-2 px-2 font-semibold text-center">Bonus</th>}
                {hasMrp && <th className="py-2 px-2 font-semibold text-right">MRP</th>}
                <th className="py-2 px-2 font-semibold text-right">TP</th>
                <th className="py-2 px-2 font-semibold text-center">Disc %</th>
                <th className="py-2 px-2 font-semibold text-center">Tax %</th>
                <th className="py-2 px-3 font-semibold text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-2 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-slate-900">{it.medicineName}</p>
                    <p className="text-[10px] text-slate-500 italic">{it.genericName}</p>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                    {it.batchNumber || 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{it.expiryDate}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900">{it.quantity}</td>
                  {hasBonus && (
                    <td className="py-2.5 px-2 text-center font-semibold text-emerald-700">{it.bonusQty || '-'}</td>
                  )}
                  {hasMrp && (
                    <td className="py-2.5 px-2 text-right text-slate-500">
                      {it.retailPrice ? formatCurrency(it.retailPrice) : '-'}
                    </td>
                  )}
                  <td className="py-2.5 px-2 text-right text-slate-600">
                    {formatCurrency(it.unitPrice)}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-500">{it.discountPercent}%</td>
                  <td className="py-2.5 px-2 text-center text-slate-500">{it.taxPercent}%</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(it.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Financial Summary & Legal Notice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-xs">
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Warranty under the Drugs Act, 1976:</strong> We hereby give this warranty that the drugs
              described in this invoice, sold by us, do not contravene in any way the provisions of the Drugs Act, 1976
              and the rules framed thereunder.
            </p>
            {hasBonus && (
              <p className="text-[10px] text-slate-400">Bonus units are supplied free of charge under trade scheme.</p>
            )}
          </div>

          <div className="space-y-1.5 text-right">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Trade Discount:</span>
              <span className="font-mono text-emerald-600">
                -{formatCurrency(invoice.discountAmount)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax:</span>
              <span className="font-mono">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900 text-sm">
              <span>Grand Total:</span>
              <span className="text-teal-700">{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Amount Paid:</span>
              <span className="font-mono">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 text-xs pt-1 border-t border-slate-100">
              <span>Balance Due:</span>
              <span className="font-mono">{formatCurrency(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <div>
            <div className="border-b border-slate-300 w-44 mx-auto mb-1"></div>
            <p className="font-medium text-slate-700">QA / Pharmacist Release</p>
            <p className="text-[10px] text-slate-400">Lic. {company.drugLicenseNumber}</p>
          </div>
          <div>
            <div className="border-b border-slate-300 w-44 mx-auto mb-1"></div>
            <p className="font-medium text-slate-700">Authorized Commercial Signatory</p>
            <p className="text-[10px] text-slate-400">{company.tradeName}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
