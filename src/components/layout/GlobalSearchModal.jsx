// src/components/layout/GlobalSearchModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Pill, Layers, Users, ShoppingCart, FileText, ArrowRight, X } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearchModal() {
  const { isSearchOpen, setIsSearchOpen, data } = usePharma();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Handle Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  // Reset query on open
  useEffect(() => {
    if (isSearchOpen) setQuery('');
  }, [isSearchOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const results = [];

    // Search Medicines
    data.medicines.forEach((m) => {
      if (
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Medicine',
          title: m.name,
          subtitle: `${m.genericName} • SKU: ${m.sku}`,
          link: '/medicines',
          icon: Pill,
          color: 'text-teal-600 bg-teal-50',
        });
      }
    });

    // Search Batches
    data.batches.forEach((b) => {
      if (
        b.batchNumber.toLowerCase().includes(q) ||
        b.medicineName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Batch',
          title: b.batchNumber,
          subtitle: `${b.medicineName} • Exp: ${b.expiryDate} (${b.qualityStatus})`,
          link: '/batches',
          icon: Layers,
          color: 'text-indigo-600 bg-indigo-50',
        });
      }
    });

    // Search Customers
    data.customers.forEach((c) => {
      if (
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Customer',
          title: c.name,
          subtitle: `${c.type} • Contact: ${c.contactPerson}`,
          link: '/customers',
          icon: Users,
          color: 'text-sky-600 bg-sky-50',
        });
      }
    });

    // Search Sales Orders & POs
    data.salesOrders.forEach((so) => {
      if (
        so.soNumber.toLowerCase().includes(q) ||
        so.customerName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Sales Order',
          title: so.soNumber,
          subtitle: `${so.customerName} • Status: ${so.status}`,
          link: '/sales/orders',
          icon: FileText,
          color: 'text-emerald-600 bg-emerald-50',
        });
      }
    });

    data.purchaseOrders.forEach((po) => {
      if (
        po.poNumber.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Purchase Order',
          title: po.poNumber,
          subtitle: `${po.supplierName} • Status: ${po.status}`,
          link: '/purchases/orders',
          icon: ShoppingCart,
          color: 'text-amber-600 bg-amber-50',
        });
      }
    });

    return results.slice(0, 8);
  }, [data, query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="relative mx-auto max-w-xl transform rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/5 transition-all overflow-hidden border border-slate-200">
        <div className="relative flex items-center border-b border-slate-100 px-4">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            className="h-12 w-full border-0 bg-transparent pl-3 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            placeholder="Search medicines, batches, POs, customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Type medicine name (e.g. <span className="font-semibold text-slate-600">Amoxicillin</span>,{' '}
              <span className="font-semibold text-slate-600">Paralief</span>), batch code, customer or PO.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No results found for &ldquo;<span className="font-semibold">{query}</span>&rdquo;.
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate(item.link);
                    }}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Navigate with mouse or tap</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded">
            ESC to close
          </kbd>
        </div>
      </div>
    </div>
  );
}
