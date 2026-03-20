import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { usersAPI } from '../services/api';

function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user.name, role: user.role, is_active: user.is_active });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersAPI.update(user.id, form);
      onSave(res.data.data);
      toast.success('User updated');
      onClose();
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-surface-700">
          <h2 className="text-base font-semibold text-slate-100">Edit user</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input className="input" value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
            <select className="input" value={form.role}
              onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-3 p-3 card">
            <input type="checkbox" id="active" checked={form.is_active}
              onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 accent-sky-500" />
            <label htmlFor="active" className="text-sm text-slate-300">Account active</label>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <><span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashStats, setDashStats] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', role: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const res = await usersAPI.list(params);
      setUsers(res.data.data);
      setMeta(res.data.meta);
    } catch { }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
    usersAPI.dashboard().then(r => setDashStats(r.data.data)).catch(() => {});
  }, [fetchUsers]);

  const handleSaved = (updated) => setUsers(p => p.map(u => u.id === updated.id ? { ...u, ...updated } : u));

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete "${user.name}"? This also deletes their tasks.`)) return;
    try {
      await usersAPI.delete(user.id);
      setUsers(p => p.filter(u => u.id !== user.id));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const setFilter = (key, val) => setFilters(p => ({ ...p, [key]: val, page: 1 }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Admin Panel</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage users and monitor platform activity</p>
      </div>

      {dashStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total users', value: dashStats.users?.total, color: 'text-brand-400' },
            { label: 'Active users', value: dashStats.users?.active, color: 'text-green-400' },
            { label: 'Total tasks', value: dashStats.tasks?.total, color: 'text-brand-400' },
            { label: 'Overdue tasks', value: dashStats.tasks?.overdue, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-5 animate-slide-up">
              <div className="text-slate-400 text-xs font-medium mb-2">{label}</div>
              <div className={`text-3xl font-bold ${color}`}>{value ?? '—'}</div>
            </div>
          ))}
        </div>
      )}

      {dashStats?.recentUsers?.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Recently joined</h3>
          <div className="flex flex-wrap gap-3">
            {dashStats.recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-2.5 bg-surface-800 rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-semibold">
                  {u.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-100">All users</h3>
          <span className="text-xs text-slate-500">{meta?.total ?? 0} total</span>
        </div>

        <div className="card p-4 flex flex-wrap gap-3 mb-4">
          <input className="input w-52 py-2" placeholder="Search by name or email..."
            value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
          <select className="input w-32 py-2" value={filters.role} onChange={(e) => setFilter('role', e.target.value)}>
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          {(filters.search || filters.role) && (
            <button className="btn-secondary py-2"
              onClick={() => setFilters(p => ({ ...p, search: '', role: '', page: 1 }))}>Clear</button>
          )}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-700">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">User</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Role</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-surface-800 hover:bg-surface-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-semibold flex-shrink-0">
                            {user.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-surface-700 text-slate-400 border-surface-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge border ${user.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {user.is_active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setEditTarget(user)}
                            className="p-1.5 rounded text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">✎</button>
                          <button onClick={() => handleDelete(user)}
                            className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={!meta.hasPrev}
                onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                className="btn-secondary py-1.5 disabled:opacity-40">← Prev</button>
              <button disabled={!meta.hasNext}
                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                className="btn-secondary py-1.5 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {editTarget && (
        <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} onSave={handleSaved} />
      )}
    </div>
  );
}
