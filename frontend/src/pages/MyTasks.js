import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isPast } from 'date-fns';
import toast from 'react-hot-toast';

export default function MyTasks() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/tasks/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateStatus = async (taskId, status) => {
    await api.put(`/tasks/${taskId}`, { status });
    toast.success('Status updated');
    load();
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const tasks = data?.my_tasks || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Tasks</h1>
        <p>Tasks assigned to you across all projects</p>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎉</div>
          <h3>No tasks assigned to you</h3>
          <p>When someone assigns you a task, it'll show up here.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{task.description}</div>}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text2)' }}>{task.project_name}</td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td style={{ fontSize: 13 }}>
                      {task.due_date
                        ? <span style={{ color: isPast(parseISO(task.due_date)) && task.status !== 'done' ? 'var(--red)' : 'inherit' }}>
                            {format(parseISO(task.due_date), 'MMM d, yyyy')}
                            {isPast(parseISO(task.due_date)) && task.status !== 'done' ? ' ⚠️' : ''}
                          </span>
                        : <span style={{ color: 'var(--text3)' }}>—</span>
                      }
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                        value={task.status}
                        onChange={e => updateStatus(task.id, e.target.value)}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
