// src/components/layout/NotificationDrawer.jsx
import React from 'react';
import { X, CheckCheck, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationDrawer({ isOpen, onClose }) {
  const { data, markNotificationRead, markAllNotificationsRead } = usePharma();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const iconMap = {
    danger: <AlertCircle className="w-4 h-4 text-rose-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    info: <Info className="w-4 h-4 text-sky-600" />,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">System Notifications</h3>
              <p className="text-[11px] text-slate-500">Regulatory, stock, and batch alerts</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {data.notifications.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-400">
                No active notifications or alerts.
              </div>
            ) : (
              data.notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    markNotificationRead(item.id);
                    if (item.link) {
                      navigate(item.link);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-lg transition-colors cursor-pointer flex items-start gap-3 ${
                    !item.read ? 'bg-teal-50/40 hover:bg-teal-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{iconMap[item.type] || iconMap.info}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-snug">{item.message}</p>
                    {item.link && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-medium mt-2 hover:underline">
                        <span>Review item</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  {!item.read && <span className="w-2 h-2 rounded-full bg-teal-600 mt-1 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
