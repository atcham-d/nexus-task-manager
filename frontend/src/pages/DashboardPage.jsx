import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, usersAPI } from '../services/api';

const StatCard = ({ label, value, sub, color = 'brand' }) => {
  const colors = { brand: 'text-brand-400 bg-brand-500/10', green: 'text-green-400 bg-green-500/10', yellow: 'text-yellow-400 bg-yellow-500/10', red: 'text-red-400 bg-red-500/10' };
  return (
    <div className="card p-5 animate-slide-up">
      <div className="text-slate-400 text-xs font-medium mb-3">{label}</div>
      <div className={`text-3xl font-bold ${colors[color].split(' ')[0]}`}>{value ?? '—'}</div>
      {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
    </div>
  );
};

const COLORS = { pending: '#f59e0b', in_progress: '#38bdf8', completed: '#22c55e', archived: '#64748b' };

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [taskStats, setTaskStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          tasksAPI.stats(),
          tasksAPI.list({ limit: 5, sortBy: 'created_at', order: 'desc' }),
        ]);
        setTaskStats(statsRes.data.data);
        setRecentTasks(tasksRes.data.data);
        if (isAdmin) {
          const adminRes = await usersAPI.dashboard();
          setAdminStats(adminRes.data.data);
        }
      } catch { /* handled by interceptor */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [isAdmin]);

  const chartData = taskStats ? [
    { name: 'Pending', value: parseInt(taskStats.pending), color: COLORS.pending },
    { name: 'In Progress', value: parseInt(taskStats.in_progress), color: COLORS.in_progress },
    { name: 'Completed', value: parseInt(taskStats.completed), color: COLORS.completed },
    { name: 'Archived', value: parseInt(taskStats.archived), color: COLORS.archived },
  ] : [];

  const priorityBadge = (p) => ({ high: 'bg-red-500/10 text-red-400', medium: 'bg-yellow-500/10 text-yellow-400', low: 'bg-green-500/10 text-green-400' }[p]);
  const statusBadge = (s) => ({ pending: 'bg-yellow-500/10 text-yellow-400', in_progress: 'bg-brand-500/10 text-brand-400', completed: 'bg-green-500/10 text-green-400', archived: 'bg-surface-700 text-slate-400' }[s]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's what's happening with your tasks</p>
        </div>
        <Link to="/tasks" className="btn-primary">+ New Task</Link>
      </div>

      {/* Task stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={taskStats?.total} color="brand" />
        <StatCard label="In Progress" value={taskStats?.in_progress} color="brand" sub="active" />
        <StatCard label="Completed" value={taskStats?.completed} color="green" />
        <StatCard label="Overdue" value={taskStats?.overdue} color="red" sub="need attention" />
      </div>

      {/* Admin stats */}
      {isAdmin && adminStats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Users" value={adminStats.users?.total} color="brand" />
          <StatCard label="Active Users" value={adminStats.users?.active} color="green" />
          <StatCard label="Admins" value={adminStats.users?.admins} color="yellow" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Tasks by Status</h3>
          {chartData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No tasks yet</div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Recent Tasks</h3>
            <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {recentTasks.length ? (
            <div className="space-y-2">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 font-medium truncate">{task.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${statusBadge(task.status)}`}>{task.status.replace('_', ' ')}</span>
                      <span className={`badge ${priorityBadge(task.priority)}`}>{task.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="text-3xl">📋</div>
              <div className="text-sm">No tasks yet</div>
              <Link to="/tasks" className="btn-primary text-xs">Create first task</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
