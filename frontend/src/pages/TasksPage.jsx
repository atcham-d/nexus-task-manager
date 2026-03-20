import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';

const STATUSES = ['pending', 'in_progress', 'completed', 'archived'];
const PRIORITIES = ['low', 'medium', 'high'];

const statusStyle = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  archived: 'bg-slate-700/50 text-slate-400 border-slate-600/20',
};

const priorityStyle = {
  high: 'bg-red-500/10 text-red-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  low: 'bg-green-500/10 text-green-400',
};

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.slice(0, 16) : '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, due_date: form.due_date || null };
      if (task) {
        await tasksAPI.update(task.id, payload);
        toast.success('Task updated');
      } else {
        await tasksAPI.create(payload);
        toast.success('Task created');
      }
      onSave();
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast.error(errs?.[0]?.msg || err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-700">
          <h2 className="text-sm font-semibold text-slate-100">{task ? 'Edit task' : 'New task'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Title *</label>
            <input className="input" required placeholder="Task title"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Optional description"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Due date</label>
            <input type="datetime-local" className="input"
              value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving
                ? <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskRow({ task, onEdit, onDelete, onStatusChange }) {
  const isOverdue = task.due_date
    && isPast(parseISO(task.due_date))
    && !['completed', 'archived'].includes(task.status);

  return (
    <div className="card p-4 hover:bg-surface-800/50 transition-colors group animate-fade-in">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
          className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
            task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-surface-600 hover:border-brand-400'
          }`}
        >
          {task.status === 'completed' && <span className="text-white text-xs leading-none">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
              {task.title}
            </p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => onEdit(task)} className="p-1.5 rounded text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all text-xs">Edit</button>
              <button onClick={() => onDelete(task.id)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">Del</button>
            </div>
          </div>
          {task.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`badge border ${statusStyle[task.status]}`}>{task.status.replace('_', ' ')}</span>
            <span className={`badge ${priorityStyle[task.priority]}`}>{task.priority}</span>
            {task.due_date && (
              <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                {isOverdue ? '⚠ ' : ''}Due {format(parseISO(task.due_date), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 10 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const res = await tasksAPI.list(params);
      setTasks(res.data.data);
      setMeta(res.data.meta);
    } catch { }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch { }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await tasksAPI.update(id, { status });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch { }
  };

  const updateFilter = (key, val) => setFilters(p => ({ ...p, [key]: val, page: 1 }));

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{isAdmin ? 'All Tasks' : 'My Tasks'}</h1>
          {meta && <p className="text-slate-500 text-sm mt-0.5">{meta.total} task{meta.total !== 1 ? 's' : ''}</p>}
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary">+ New task</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input className="input w-48 text-sm" placeholder="Search tasks..."
          value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
        <select className="input w-36 text-sm" value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input w-32 text-sm" value={filters.priority} onChange={e => updateFilter('priority', e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filters.status || filters.priority || filters.search) && (
          <button onClick={() => setFilters({ status: '', priority: '', search: '', page: 1 })} className="btn-secondary text-xs">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length ? (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskRow key={task.id} task={task}
              onEdit={t => setModal({ type: 'edit', task: t })}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-400 text-sm mb-4">
            {filters.status || filters.priority || filters.search ? 'No tasks match your filters' : 'No tasks yet'}
          </p>
          <button onClick={() => setModal({ type: 'create' })} className="btn-primary mx-auto">Create first task</button>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs py-1.5" disabled={!meta.hasPrev}
              onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>← Prev</button>
            <button className="btn-secondary text-xs py-1.5" disabled={!meta.hasNext}
              onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next →</button>
          </div>
        </div>
      )}

      {modal && (
        <TaskModal task={modal.task} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchTasks(); }} />
      )}
    </div>
  );
}
