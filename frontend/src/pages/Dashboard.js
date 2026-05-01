import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { format, isPast, parseISO } from 'date-fns';

function StatusDot({ status }) {
  const map = { todo: '#9090a8', in_progress: '#60a5fa', done: '#4ade80' };
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: map[status] || '#9090a8', display: 'inline-block' }} />;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const statusMap = {};
  data?.by_status?.forEach(s => { statusMap[s.status] = parseInt(s.count); });
  const todo = statusMap['todo'] || 0;
  const inProgress = statusMap['in_progress'] || 0;
  const done = statusMap['done'] || 0;
  const total = data?.total || 0;
  const donePercent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's what's happening with your projects today.</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>{done}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--red)' }}>{data?.overdue?.length || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Progress */}
        <div className="card">
          <div className="flex-between gap-8" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>Overall Progress</h3>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Syne', color: 'var(--accent2)' }}>{donePercent}%</span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 16 }}>
            <div className="progress-fill" style={{ width: `${donePercent}%` }} />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['todo', '📋', todo, 'To Do'], ['in_progress', '🔄', inProgress, 'In Progress'], ['done', '✅', done, 'Done']].map(([s, icon, count, label]) => (
              <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne' }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Tasks by Priority</h3>
          {data?.by_priority?.map(p => {
            const pct = total ? Math.round((parseInt(p.count) / total) * 100) : 0;
            const colors = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--text3)' };
            return (
              <div key={p.priority} style={{ marginBottom: 12 }}>
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{p.priority}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: colors[p.priority] }} />
                </div>
              </div>
            );
          })}
          {!data?.by_priority?.length && <p className="text-muted text-sm">No tasks yet</p>}
        </div>
      </div>

      <div className="grid-2">
        {/* My Tasks */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>My Assigned Tasks</h3>
            <Link to="/my-tasks" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {data?.my_tasks?.length === 0 && (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">🎉</div>
              <p>No pending tasks!</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data?.my_tasks?.slice(0, 5).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <StatusDot status={task.status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{task.project_name}</div>
                </div>
                {task.due_date && (
                  <span style={{ fontSize: 11, color: isPast(parseISO(task.due_date)) ? 'var(--red)' : 'var(--text3)', flexShrink: 0 }}>
                    {format(parseISO(task.due_date), 'MMM d')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Overdue */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>⚠️ Overdue Tasks</h3>
            <span className="badge badge-high">{data?.overdue?.length || 0}</span>
          </div>
          {data?.overdue?.length === 0 && (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="icon">✅</div>
              <p>Nothing overdue!</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data?.overdue?.map(task => (
              <div key={task.id} style={{ padding: '10px 12px', background: 'var(--red-dim)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                  {task.project_name} · {task.assignee_name || 'Unassigned'} · due {format(parseISO(task.due_date), 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
