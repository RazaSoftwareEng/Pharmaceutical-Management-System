// src/components/charts/MiniBarChart.jsx
import React, { useState } from 'react';
import { formatCurrency } from '../../services/pharmaService';

export default function MiniBarChart({ data = [], height = 220 }) {
  const [activeItem, setActiveItem] = useState(null);

  if (!data || data.length === 0) return null;
  if (!data.some((d) => d.sales || d.purchases)) {
    return (
      <div className="grid place-items-center text-xs text-slate-400" style={{ height }}>
        No sales or purchases recorded in this window.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.sales || 0, d.purchases || 0)), 1000);
  const chartHeight = height - 50;

  return (
    <div className="relative w-full">
      {/* Tooltip */}
      {activeItem && (
        <div className="absolute top-0 right-2 bg-slate-900 text-white text-xs rounded-lg py-1.5 px-3 shadow-md pointer-events-none z-10">
          <p className="font-semibold text-slate-200">{activeItem.label}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-teal-400">Sales: {formatCurrency(activeItem.sales)}</span>
            <span className="text-indigo-300">Purchases: {formatCurrency(activeItem.purchases)}</span>
          </div>
        </div>
      )}

      {/* Chart container */}
      <div className="flex items-end justify-between gap-2 pt-8" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const salesHeight = Math.max(4, ((item.sales || 0) / maxVal) * chartHeight);
          const purchasesHeight = Math.max(4, ((item.purchases || 0) / maxVal) * chartHeight);

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => setActiveItem(item)}
              onMouseLeave={() => setActiveItem(null)}
            >
              <div className="w-full flex items-end justify-center gap-1.5 h-full">
                {/* Sales Bar */}
                <div
                  className="w-1/2 max-w-[18px] bg-teal-600 rounded-t-sm transition-all duration-200 group-hover:bg-teal-500 group-hover:opacity-90"
                  style={{ height: `${salesHeight}px` }}
                />
                {/* Purchases Bar */}
                <div
                  className="w-1/2 max-w-[18px] bg-indigo-600 rounded-t-sm transition-all duration-200 group-hover:bg-indigo-500 group-hover:opacity-90"
                  style={{ height: `${purchasesHeight}px` }}
                />
              </div>
              <span className="mt-2 text-[11px] font-medium text-slate-500 group-hover:text-slate-900 transition-colors truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-xs bg-teal-600" />
          <span>Sales Invoiced</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-xs bg-indigo-600" />
          <span>Purchases Received</span>
        </div>
      </div>
    </div>
  );
}
