// src/components/layout/AppLayout.jsx
import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationDrawer from './NotificationDrawer';
import GlobalSearchModal from './GlobalSearchModal';
import ToastContainer from '../common/Toast';
import SyncStatusIndicator from './SyncStatusIndicator';
import { usePharma } from '../../context/PharmaContext';
import { Loader2, Lock } from 'lucide-react';
import { canAccess } from '../../config/permissions';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const { currentUserRole, currentUser, syncState } = usePharma();
  const location = useLocation();
  const allowed = canAccess(currentUserRole, location.pathname);
  const isInitialCloudLoad = syncState.status === 'loading' && !syncState.lastSyncedAt;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification Mount */}
      <ToastContainer />

      {/* Global Quick Search Modal */}
      <GlobalSearchModal />

      {/* Flyout Notification Center */}
      <NotificationDrawer
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
      />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Navbar */}
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenNotifications={() => setNotifDrawerOpen(true)}
        />

        {/* Refined Enterprise Status Bar */}
        <div className="no-print bg-slate-100/90 text-slate-600 text-xs px-4 sm:px-6 py-2 flex items-center justify-between border-b border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="font-bold text-slate-800">ERP System Live:</span>
            <span className="hidden sm:inline text-slate-600">
              FEFO batch engine, stateful inventory & goods receiving active.
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="bg-white border border-slate-200 px-2.5 py-0.5 rounded-md text-[11px] text-teal-800 font-mono font-bold shadow-2xs">
              {currentUser?.fullName} · {currentUserRole}
            </span>
            <SyncStatusIndicator />
          </div>
        </div>

        {/* Dynamic Page Routed Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isInitialCloudLoad ? (
            <div className="grid place-items-center py-32 text-sm text-slate-500">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                Loading live data from Supabase…
              </div>
            </div>
          ) : allowed ? (
            <Outlet />
          ) : (
            <div className="max-w-md mx-auto mt-24 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 grid place-items-center">
                <Lock className="w-6 h-6 text-slate-500" />
              </div>
              <h1 className="mt-4 text-lg font-bold text-slate-900">Access restricted</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Your role ({currentUserRole}) does not include this module. Ask an administrator if you need access.
              </p>
              <Link to="/" className="mt-5 inline-block text-sm font-semibold text-teal-700 hover:underline">
                Back to dashboard
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
