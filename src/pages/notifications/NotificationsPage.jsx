// src/pages/notifications/NotificationsPage.jsx
import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const { data, markNotificationRead, markAllNotificationsRead } = usePharma();
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState('ALL');

  const filteredNotifs = useMemo(() => {
    return data.notifications.filter((n) => {
      if (filterType === 'unread') return !n.read;
      if (filterType === 'danger') return n.type === 'danger';
      if (filterType === 'warning') return n.type === 'warning';
      return true;
    });
  }, [data.notifications, filterType]);

  const iconMap = {
    danger: <AlertCircle className="w-5 h-5 text-rose-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    info: <Info className="w-5 h-5 text-sky-600" />,
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>System Notifications & Quality Alerts</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredNotifs.length} alerts
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time regulatory warnings, cold-chain excursion flags, low stock prompts, and authorization queues.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={CheckCheck}
          onClick={markAllNotificationsRead}
        >
          Mark All Read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setFilterType('ALL')}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors ${
            filterType === 'ALL'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Alerts ({data.notifications.length})
        </button>

        <button
          onClick={() => setFilterType('unread')}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors ${
            filterType === 'unread'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread Only ({data.notifications.filter((n) => !n.read).length})
        </button>

        <button
          onClick={() => setFilterType('danger')}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors ${
            filterType === 'danger'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Critical / Quarantines ({data.notifications.filter((n) => n.type === 'danger').length})
        </button>

        <button
          onClick={() => setFilterType('warning')}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors ${
            filterType === 'warning'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Near Expiry Warnings ({data.notifications.filter((n) => n.type === 'warning').length})
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {filteredNotifs.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No active alerts in this view"
            description="All notifications have been resolved or marked as read."
          />
        ) : (
          filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 transition-colors flex items-start gap-4 ${
                !notif.read ? 'bg-teal-50/30 hover:bg-teal-50/60' : 'hover:bg-slate-50'
              }`}
            >
              <div className="mt-1 shrink-0">{iconMap[notif.type] || iconMap.info}</div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{notif.timestamp}</span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                <div className="mt-3 flex items-center gap-3">
                  {notif.link && (
                    <button
                      onClick={() => {
                        markNotificationRead(notif.id);
                        navigate(notif.link);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-medium"
                    >
                      <span>Open Associated Module</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!notif.read && (
                    <button
                      onClick={() => markNotificationRead(notif.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
