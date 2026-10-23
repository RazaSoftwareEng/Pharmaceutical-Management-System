// src/components/charts/MiniAreaChart.jsx
import React, { useId, useState } from 'react';
import { formatCurrency, formatCompactCurrency } from '../../services/pharmaService';

const MAX_X_LABELS = 8;

export default function MiniAreaChart({ data = [], height = 220, emptyMessage = 'No data for this period.' }) {
  const [activeIdx, setActiveIdx] = useState(null);
  const gradientId = useId();

  const hasData = data.some((d) => (d.value || 0) > 0);
  if (!data.length || !hasData) {
    return (
      <div className="grid place-items-center text-xs text-slate-400" style={{ height }}>
        {emptyMessage}
      </div>
    );
  }

  const width = 560;
  const padLeft = 58;
  const padRight = 12;
  const padTop = 16;
  const padBottom = 28;
  const graphWidth = width - padLeft - padRight;
  const graphHeight = height - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => d.value || 0));
  // Round the axis ceiling up to a "nice" number
  const magnitude = 10 ** Math.floor(Math.log10(maxVal));
  const niceMax = Math.ceil(maxVal / magnitude) * magnitude || 1;

  const step = data.length > 1 ? graphWidth / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    ...d,
    x: data.length > 1 ? padLeft + i * step : padLeft + graphWidth / 2,
    y: padTop + graphHeight - ((d.value || 0) / niceMax) * graphHeight,
  }));

  const linePath = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const baseY = padTop + graphHeight;
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
  const labelEvery = Math.ceil(data.length / MAX_X_LABELS);
  const lastIdx = points.length - 1;
  // Always label the final point unless it would collide with the previous label
  const showLabel = (i) => i % labelEvery === 0 || (i === lastIdx && lastIdx % labelEvery >= labelEvery / 2);
  const active = activeIdx !== null ? points[activeIdx] : null;

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const idx = step ? Math.round((x - padLeft) / step) : 0;
    setActiveIdx(Math.min(points.length - 1, Math.max(0, idx)));
  };

  return (
    <div className="relative w-full">
      {active && (
        <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs rounded-lg py-1.5 px-2.5 shadow-lg z-10 pointer-events-none tabular-nums">
          <span className="text-slate-400">{active.tooltipLabel || active.label}</span>
          <span className="ml-2 font-semibold text-teal-300">{formatCurrency(active.value)}</span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setActiveIdx(null)}
        role="img"
        aria-label="Revenue trend chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid + axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padTop + graphHeight * (1 - pct);
          return (
            <g key={pct}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray={pct ? '3 4' : '0'} />
              <text x={padLeft - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 tabular-nums">
                {formatCompactCurrency(niceMax * pct, '')}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {active && (
          <line x1={active.x} y1={padTop} x2={active.x} y2={baseY} stroke="#94a3b8" strokeDasharray="3 3" />
        )}

        {points.map((p, i) => (
          <g key={i}>
            {(data.length <= 12 || i === activeIdx) && (
              <circle
                cx={p.x}
                cy={p.y}
                r={i === activeIdx ? 5 : 3}
                fill="#ffffff"
                stroke="#0f766e"
                strokeWidth="2"
              />
            )}
            {showLabel(i) && (
              <text x={p.x} y={height - 8} textAnchor="middle" className="text-[10px] fill-slate-400">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
