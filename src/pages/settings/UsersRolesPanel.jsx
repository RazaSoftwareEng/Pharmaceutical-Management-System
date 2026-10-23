// src/pages/settings/UsersRolesPanel.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePharma } from '../../context/PharmaContext';
import { ROLES, ROLE_NAMES, canAccess } from '../../config/permissions';
import { NAV_GROUPS } from '../../config/navigation';
import Card from '../../components/common/Card';

const selectCls =
  'text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-50';

export default function UsersRolesPanel() {
  const { listProfiles, updateProfile, isDemoAuth, user } = useAuth();
  const { showToast } = usePharma();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProfiles(await listProfiles());
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [listProfiles]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (id, changes) => {
    setSavingId(id);
    try {
      await updateProfile(id, changes);
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
      showToast('User updated. Changes apply on their next sign-in.');
    } catch (e) {
      showToast(`Could not update user: ${e.message}`, 'danger', 6000);
    } finally {
      setSavingId(null);
    }
  };

  const modules = [{ to: '/', label: 'Dashboard' }, ...NAV_GROUPS.flatMap((g) => g.items)];

  return (
    <div className="space-y-6">
      <Card
        title="Users & Roles"
        subtitle={
          isDemoAuth
            ? 'Demo mode uses fixed accounts. Connect Supabase to invite real staff and manage their roles here.'
            : 'To add staff: Supabase Dashboard → Authentication → Users → Add user (e-mail + password, tick Auto Confirm). They appear here as Sales Manager — set their role below.'
        }
      >
        {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}
        <div className="overflow-x-auto -mx-5 -my-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-5 font-medium">Name</th>
                <th className="py-2.5 px-3 font-medium">E-mail</th>
                <th className="py-2.5 px-3 font-medium">Role</th>
                <th className="py-2.5 px-5 font-medium">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    Loading users…
                  </td>
                </tr>
              ) : (
                profiles.map((p) => {
                  const isSelf = p.id === user?.id;
                  const locked = isDemoAuth || isSelf || savingId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-5 font-semibold text-slate-900">
                        {p.full_name}
                        {isSelf && <span className="ml-1.5 text-[10px] font-medium text-teal-700">(you)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{p.email}</td>
                      <td className="py-2.5 px-3">
                        <select
                          value={p.role}
                          disabled={locked}
                          onChange={(e) => save(p.id, { role: e.target.value })}
                          className={selectCls}
                          title={isSelf ? 'You cannot change your own role' : undefined}
                        >
                          {ROLE_NAMES.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-5">
                        <select
                          value={p.active ? 'active' : 'blocked'}
                          disabled={locked}
                          onChange={(e) => save(p.id, { active: e.target.value === 'active' })}
                          className={selectCls}
                        >
                          <option value="active">Active</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Role Permissions" subtitle="Which modules each role can open. Enforced in navigation and on every page.">
        <div className="overflow-x-auto -mx-5 -my-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-5 font-medium">Module</th>
                {ROLES.map((r) => (
                  <th key={r.name} className="py-2.5 px-2 font-medium text-center whitespace-nowrap" title={r.desc}>
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modules.map((m) => (
                <tr key={m.to} className="hover:bg-slate-50/60">
                  <td className="py-2 px-5 font-medium text-slate-800">{m.label}</td>
                  {ROLES.map((r) => (
                    <td key={r.name} className="py-2 px-2 text-center">
                      {canAccess(r.name, m.to) ? (
                        <Check className="w-4 h-4 text-emerald-600 inline" aria-label="Allowed" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-300 inline" aria-label="No access" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
