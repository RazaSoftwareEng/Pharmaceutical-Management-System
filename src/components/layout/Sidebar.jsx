// src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ChevronDown, X } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { NAV_GROUPS } from '../../config/navigation';
import { canAccess } from '../../config/permissions';
import { BRAND_NAME, BRAND_TAGLINE } from '../../config/brand';

const ACCENTS = {
  teal: { icon: 'text-teal-600', rail: 'border-teal-100' },
  indigo: { icon: 'text-indigo-600', rail: 'border-indigo-100' },
  emerald: { icon: 'text-emerald-600', rail: 'border-emerald-100' },
  blue: { icon: 'text-blue-600', rail: 'border-blue-100' },
  purple: { icon: 'text-purple-600', rail: 'border-purple-100' },
  slate: { icon: 'text-slate-600', rail: 'border-slate-200' },
};

const BADGE_STYLES = {
  nearExpiry: 'bg-amber-100 text-amber-800',
  lowStock: 'bg-amber-100 text-amber-800',
  pendingPO: 'bg-sky-100 text-sky-800',
  overdue: 'bg-rose-100 text-rose-700',
  unread: 'bg-teal-600 text-white',
};

const isPathActive = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`);

function Count({ kind, value, suffix = '' }) {
  if (!value) return null;
  return (
    <span className={`text-[10px] font-bold px-1.5 rounded-full ${BADGE_STYLES[kind]}`}>
      {value}
      {suffix}
    </span>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { metrics, data, currentUserRole } = usePharma();
  const companyName = data.companyProfile.tradeName || data.companyProfile.name || BRAND_NAME;
  const location = useLocation();

  const badges = {
    nearExpiry: metrics.nearExpiryCount,
    lowStock: metrics.lowStockCount,
    pendingPO: metrics.pendingPOCount,
    overdue: metrics.overdueInvoiceCount,
    unread: data.notifications.filter((n) => !n.read).length,
  };

  // Only the modules this role may open
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => canAccess(currentUserRole, item.to)),
  })).filter((g) => g.items.length > 0);

  const groupForPath = (path) =>
    groups.find((g) => g.items.some((item) => isPathActive(path, item.to)))?.key || null;

  // Collapsed by default; the group of the current route opens automatically
  const [openGroups, setOpenGroups] = useState(() => {
    const active = groupForPath(location.pathname);
    return active ? { [active]: true } : {};
  });

  useEffect(() => {
    const active = groupForPath(location.pathname);
    if (active) setOpenGroups((prev) => (prev[active] ? prev : { ...prev, [active]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (key) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const sublinkClasses = ({ isActive }) =>
    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
      isActive ? 'bg-teal-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-xs ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 bg-white border-t-[3px] border-t-brand-red border-b border-slate-200/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/star-laboratories-logo.png" alt={companyName} width="88" height="44" className="h-11 w-auto shrink-0" />
            <div className="min-w-0 border-l border-slate-200 pl-2.5">
              <p className="text-[11px] font-bold text-teal-800 leading-tight truncate">{BRAND_TAGLINE}</p>
              <p className="text-[10px] text-slate-400 leading-tight truncate">{companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-1.5">
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </NavLink>

          <p className="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modules</p>

          {groups.map((g) => {
            const open = !!openGroups[g.key];
            const accent = ACCENTS[g.accent];
            return (
              <div key={g.key}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.key)}
                  aria-expanded={open}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    open ? 'bg-slate-100/90 text-slate-900' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <g.icon className={`w-4 h-4 shrink-0 ${accent.icon}`} />
                    {g.label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {g.badge && !open && <Count kind={g.badge} value={badges[g.badge]} />}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>

                {open && (
                  <div className={`mt-1 ml-3.5 pl-2.5 border-l-2 space-y-1 ${accent.rail}`}>
                    {g.items.map((item) => (
                      <NavLink key={item.to} to={item.to} end onClick={onClose} className={sublinkClasses}>
                        <span className="flex items-center gap-2">
                          <item.icon className="w-3.5 h-3.5 opacity-70" />
                          {item.label}
                        </span>
                        {item.badge && <Count kind={item.badge} value={badges[item.badge]} />}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            WHO-cGMP · FEFO enforced
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
            DRAP Lic # {data.companyProfile.drugLicenseNumber || '—'}
          </p>
        </div>
      </aside>
    </>
  );
}
