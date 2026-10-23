// src/components/layout/Header.jsx
import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Building2,
  ChevronDown,
  ShieldCheck,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleSidebar, onOpenNotifications }) {
  const { data, currentWarehouseId, setCurrentWarehouseId, currentUserRole, currentUser, setIsSearchOpen } =
    usePharma();
  const { signOut } = useAuth();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount = data.notifications.filter((n) => !n.read).length;
  const initials = (currentUser?.fullName || '?')
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-t-[3px] border-t-brand-red border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Trigger Bar */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full max-w-md flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl text-xs text-slate-400 transition-all cursor-pointer text-left shadow-2xs hover:border-slate-300"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate text-slate-500 font-normal">
              Search medicines, batches, POs, customers...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded-md text-slate-500 font-semibold shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Warehouse Depot Selector Dropdown */}
        <div className="relative hidden md:flex items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 shadow-2xs hover:border-slate-300 transition-colors">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wide">
              Depot:
            </span>
            <select
              value={currentWarehouseId}
              onChange={(e) => setCurrentWarehouseId(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 border-none outline-none cursor-pointer pr-1 text-xs max-w-[210px] truncate"
            >
              <option value="ALL">All Depots (Global View)</option>
              {data.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} • {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Notifications & Quality Alerts"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white"></span>
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            aria-expanded={profileMenuOpen}
            className="flex items-center gap-2.5 p-1 pl-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-900 to-slate-700 text-white grid place-items-center font-bold text-xs">
              {initials}
            </div>
            <div className="hidden xl:block max-w-[160px]">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate">{currentUser?.fullName}</p>
              <p className="text-[10px] text-teal-700 font-semibold leading-tight">{currentUserRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
          </button>

          {profileMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50"
              onMouseLeave={() => setProfileMenuOpen(false)}
            >
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-teal-50 ring-1 ring-teal-200 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
                  <ShieldCheck className="w-3 h-3" />
                  {currentUserRole}
                </span>
              </div>

              <div className="p-1 space-y-0.5">
                {currentUserRole === 'Admin' && (
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                    Company & System Settings
                  </button>
                )}
                <button
                  onClick={signOut}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
