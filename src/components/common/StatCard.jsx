// src/components/common/StatCard.jsx
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const colorMap = {
  teal: { icon: 'bg-teal-50 text-teal-700 ring-teal-600/15', bar: 'bg-teal-500', hover: 'hover:border-teal-300' },
  blue: { icon: 'bg-sky-50 text-sky-700 ring-sky-600/15', bar: 'bg-sky-500', hover: 'hover:border-sky-300' },
  emerald: { icon: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', bar: 'bg-emerald-500', hover: 'hover:border-emerald-300' },
  indigo: { icon: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15', bar: 'bg-indigo-500', hover: 'hover:border-indigo-300' },
  amber: { icon: 'bg-amber-50 text-amber-700 ring-amber-600/15', bar: 'bg-amber-500', hover: 'hover:border-amber-300' },
  rose: { icon: 'bg-rose-50 text-rose-700 ring-rose-600/15', bar: 'bg-rose-500', hover: 'hover:border-rose-300' },
  purple: { icon: 'bg-purple-50 text-purple-700 ring-purple-600/15', bar: 'bg-purple-500', hover: 'hover:border-purple-300' },
  slate: { icon: 'bg-slate-100 text-slate-700 ring-slate-600/15', bar: 'bg-slate-500', hover: 'hover:border-slate-300' },
};

const trendStyles = {
  up: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', Icon: ArrowUpRight },
  down: { cls: 'bg-rose-50 text-rose-700 ring-rose-600/20', Icon: ArrowDownRight },
  flat: { cls: 'bg-slate-100 text-slate-600 ring-slate-500/20', Icon: Minus },
};

export default function StatCard({
  title,
  value,
  hint, // full-precision value shown on hover when `value` is abbreviated
  subtitle,
  icon: Icon,
  color = 'blue', // 'blue' | 'teal' | 'emerald' | 'amber' | 'rose' | 'purple' | 'indigo' | 'slate'
  trend,
  trendType = 'up', // 'up' | 'down' | 'flat'
  progress, // optional 0-100 bar under the value
  onClick,
}) {
  const c = colorMap[color] || colorMap.blue;
  const t = trendStyles[trendType] || trendStyles.up;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      className={`group relative flex flex-col bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all duration-200 ${
        onClick
          ? `cursor-pointer hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-teal-500 ${c.hover}`
          : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className={`grid place-items-center w-9 h-9 rounded-lg ring-1 ring-inset shrink-0 ${c.icon}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
          )}
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
            {title}
          </p>
        </div>

        {trend !== undefined && trend !== null && trend !== '' && (
          <span
            className={`inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded-md ring-1 ring-inset text-[11px] font-semibold tabular-nums ${t.cls}`}
          >
            <t.Icon className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>

      <p
        title={hint}
        className="mt-4 text-[26px] leading-none font-bold tracking-tight text-slate-900 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis"
      >
        {value}
      </p>

      {typeof progress === 'number' && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${c.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {subtitle && <p className="mt-2.5 text-xs text-slate-500 leading-snug">{subtitle}</p>}
    </div>
  );
}
