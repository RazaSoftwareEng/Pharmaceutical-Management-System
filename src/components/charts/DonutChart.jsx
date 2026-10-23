// src/components/charts/DonutChart.jsx
import React, { useState } from 'react';

const COLORS = [
  '#0d9488', // teal-600
  '#4f46e5', // indigo-600
  '#0284c7', // sky-600
  '#e11d48', // rose-600
  '#d97706', // amber-600
  '#16a34a', // green-600
  '#7c3aed', // violet-600
  '#64748b', // slate-500
];

export default function DonutChart({ data = [], height = 220 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, d) => acc + (d.value || 0), 0);
  if (total === 0) return null;

  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {data.map((item, idx) => {
            const percent = (item.value || 0) / total;
            const strokeDashoffset = circumference * (1 - percent);
            const rotationAngle = accumulatedPercent * 360;
            accumulatedPercent += percent;

            const isHovered = hoveredIdx === idx;
            const color = COLORS[idx % COLORS.length];

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(${rotationAngle} ${center} ${center})`}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xl font-bold text-slate-800">
            {hoveredIdx !== null ? data[hoveredIdx].value : total}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-medium">
            {hoveredIdx !== null ? data[hoveredIdx].label.slice(0, 10) : 'Total Items'}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {data.map((item, idx) => {
          const color = COLORS[idx % COLORS.length];
          const pct = Math.round(((item.value || 0) / total) * 100);

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between text-xs py-1 px-2 rounded-md transition-colors cursor-pointer ${
                hoveredIdx === idx ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-slate-500 text-[11px]">
                <span>{item.value}</span>
                <span className="text-slate-400">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
