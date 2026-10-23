// src/pages/settings/SettingsPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Building,
  Pill,
  Bell,
  ShieldCheck,
  RefreshCw,
  Plus,
  Save,
  Database,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { usePharma } from '../../context/PharmaContext';
import DataSyncPanel from './DataSyncPanel';
import UsersRolesPanel from './UsersRolesPanel';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function SettingsPage() {
  const {
    data,
    updateCompanyProfile,
    addCategory,
    addUnit,
    resetAllData,
    dataSource,
  } = usePharma();

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'company'); // 'company' | 'categories' | 'roles' | 'notifications' | 'data'
  const [profileForm, setProfileForm] = useState({ ...data.companyProfile });
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [resetMode, setResetMode] = useState(null); // null | 'empty' | 'demo'

  // Reload the form when the profile is replaced (Supabase load or reset)
  useEffect(() => {
    setProfileForm({ ...data.companyProfile });
  }, [data.companyProfile]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateCompanyProfile(profileForm);
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    addCategory(newCategory.trim());
    setNewCategory('');
  };

  const handleAddUnitSubmit = (e) => {
    e.preventDefault();
    if (!newUnit.trim()) return;
    addUnit(newUnit.trim());
    setNewUnit('');
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Corporate System Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Company licences, therapeutic categories, packaging units, users and data management.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={RefreshCw}
          onClick={() => setResetMode('empty')}
        >
          Start Fresh (Delete All Data)
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'company'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Company & Licensing Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Formulary & Packaging Units</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'roles'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Users & Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notification Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`pb-3 text-xs font-semibold px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'data'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Data & Cloud Sync</span>
        </button>
      </div>

      {/* Tab 5: Supabase data source */}
      {activeTab === 'data' && <DataSyncPanel onRequestReset={setResetMode} />}

      {/* Tab 1: Company Profile Form */}
      {activeTab === 'company' && (
        <Card
          title="Company Legal & Regulatory Identity"
          subtitle="Displayed on generated invoices, purchase orders, and audit schedules."
        >
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Legal Corporate Entity
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commercial Trade Name
                </label>
                <input
                  type="text"
                  value={profileForm.tradeName}
                  onChange={(e) => setProfileForm({ ...profileForm, tradeName: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Drug Regulatory License # (DRAP)
                </label>
                <input
                  type="text"
                  value={profileForm.drugLicenseNumber}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, drugLicenseNumber: e.target.value })
                  }
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  National Tax Number (NTN)
                </label>
                <input
                  type="text"
                  value={profileForm.taxId}
                  onChange={(e) => setProfileForm({ ...profileForm, taxId: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Sales Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profileForm.defaultTaxRate}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, defaultTaxRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plant & Office Address
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City & Sector</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Compliance Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button variant="secondary" size="sm" icon={Save} type="submit">
                Save Corporate Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Categories and Units */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories */}
          <Card
            title="Therapeutic Drug Categories"
            subtitle="Clinical classes used for inventory segregation and compliance."
          >
            <div className="space-y-3">
              <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Oncology & Chemotherapeutics"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Button variant="secondary" size="sm" icon={Plus} type="submit">
                  Add
                </Button>
              </form>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
                {data.categories.map((cat, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-800">{cat}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Units */}
          <Card
            title="Packaging & Unit of Measure (UOM)"
            subtitle="Primary and secondary packaging options."
          >
            <div className="space-y-3">
              <form onSubmit={handleAddUnitSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Box of 30 Sachets"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Button variant="secondary" size="sm" icon={Plus} type="submit">
                  Add
                </Button>
              </form>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
                {data.units.map((unit, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-800">{unit}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                      UOM
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Users, roles and permissions */}
      {activeTab === 'roles' && <UsersRolesPanel />}

      {/* Tab 4: Notification Preferences */}
      {activeTab === 'notifications' && (
        <Card
          title="Notification Dispatch Preferences"
          subtitle="Threshold triggers for quality alerts and stock shortages."
        >
          <div className="space-y-4 text-xs divide-y divide-slate-100">
            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Near-Expiry Warning Threshold</p>
                <p className="text-slate-500">Trigger FEFO alert for batches expiring within 90 days</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Low Stock Reorder Alert</p>
                <p className="text-slate-500">Alert store controllers when medicine inventory breaches minimum safety level</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Regulatory Quarantine Notifications</p>
                <p className="text-slate-500">Broadcast immediate high-priority alert when lot is flagged by QA</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" />
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Purchase Order Approval Prompts</p>
                <p className="text-slate-500">Notify directors upon submission of new procurement purchase orders</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" />
            </div>
          </div>
        </Card>
      )}

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={!!resetMode}
        onClose={() => setResetMode(null)}
        onConfirm={async () => {
          const mode = resetMode;
          setResetMode(null);
          await resetAllData(mode);
        }}
        title={resetMode === 'demo' ? 'Replace all data with demo data?' : 'Delete all data and start fresh?'}
        message={
          resetMode === 'demo'
            ? `Every medicine, batch, customer, order, invoice and payment${dataSource === 'supabase' ? ' in Supabase' : ''} will be deleted and replaced with sample data. Use this only for demos.`
            : `Every medicine, batch, customer, supplier, order, invoice, payment and employee record${dataSource === 'supabase' ? ' in Supabase' : ''} will be permanently deleted. Categories and packaging units are kept. Users and logins are not affected. This cannot be undone.`
        }
        confirmText={resetMode === 'demo' ? 'Load demo data' : 'Delete everything'}
      />
    </div>
  );
}
