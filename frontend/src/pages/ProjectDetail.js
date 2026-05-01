import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO, isPast } from 'date-fns';

function TaskModal({ projectId, task, members, onClose, onSaved }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigned_to: task?.assigned_to || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, assigned_to: form.assigned_to || undefined, due_date: form.due_date || undefined };
    try {
      if (task) {
        await api.put(`/tasks/${task.id}`, payload);
        toast.success('Task updated!');
      } else {
        await api.post(`/tasks/project/${projectId}`, payload);
        toast.success('Task created!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" placeholder="Task title"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Optional details..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-select" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">Unassigned</option>
                {members?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date"
                value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberModal({ projectId, onClose, onSaved }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user_id: '', role: 'member' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/users').then(r => setUsers(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/members`, form);
      toast.success('Member added!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Add Member</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">User</label>
            <select className="form-select" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} required>
              <option value="">Select user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Project Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>Add Member</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--text2)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--blue)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [taskModal, setTaskModal] = useState(null);
  const [memberModal, setMemberModal] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const [proj, ts] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(proj.data);
      setTasks(ts.data);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadProject(); }, [loadProject]);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    toast.success('Task deleted');
    loadProject();
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    toast.success('Member removed');
    loadProject();
  };

  const canManage = user?.role === 'admin' || project?.my_role === 'admin';

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return null;

  const tasksByStatus = {};
  COLUMNS.forEach(c => { tasksByStatus[c.key] = tasks.filter(t => t.status === c.key); });

  return (
    <div className="page">
      <div className="page-header-row page-header">
        <div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
            <span style={{ cursor: 'pointer', color: 'var(--accent2)' }} onClick={() => navigate('/projects')}>Projects</span> / {project.name}
          </div>
          <h1>{project.name}</h1>
          {project.description && <p>{project.description}</p>}
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setTaskModal('new')}>+ Add Task</button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>Board</button>
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>List</button>
        <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
          Members ({project.members?.length})
        </button>
      </div>

      {tab === 'board' && (
        <div className="kanban">
          {COLUMNS.map(col => (
            <div key={col.key} className="kanban-col">
              <div className="kanban-col-header">
                <span style={{ color: col.color }}>{col.label}</span>
                <span className="count">{tasksByStatus[col.key]?.length}</span>
              </div>
              <div className="kanban-tasks">
                {tasksByStatus[col.key]?.map(task => (
                  <div key={task.id} className="task-card" onClick={() => setTaskModal(task)}>
                    <div className="title">{task.title}</div>
                    <div className="meta">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </div>
                    {task.assignee_name && (
                      <div className="assignee">👤 {task.assignee_name}</div>
                    )}
                    {task.due_date && (
                      <div className={`due ${isPast(parseISO(task.due_date)) && task.status !== 'done' ? 'overdue' : ''}`}>
                        📅 {format(parseISO(task.due_date), 'MMM d')}
                        {isPast(parseISO(task.due_date)) && task.status !== 'done' ? ' · Overdue' : ''}
                      </div>
                    )}
                  </div>
                ))}
                {tasksByStatus[col.key]?.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 12 }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'list' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{task.description}</div>}
                    </td>
                    <td><span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span></td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td style={{ fontSize: 13 }}>{task.assignee_name || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                    <td style={{ fontSize: 13 }}>
                      {task.due_date
                        ? <span style={{ color: isPast(parseISO(task.due_date)) && task.status !== 'done' ? 'var(--red)' : 'inherit' }}>
                            {format(parseISO(task.due_date), 'MMM d, yyyy')}
                          </span>
                        : <span style={{ color: 'var(--text3)' }}>—</span>
                      }
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex gap-8">
                          <button className="btn btn-ghost btn-sm" onClick={() => setTaskModal(task)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No tasks yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div>
          {canManage && (
            <div style={{ marginBottom: 16 }}>
              <button className="btn btn-primary" onClick={() => setMemberModal(true)}>+ Add Member</button>
            </div>
          )}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Project Role</th>
                    <th>Joined</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {project.members?.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex-center gap-8">
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{m.name[0]}</div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text2)' }}>{m.email}</td>
                      <td><span className={`badge badge-${m.project_role}`}>{m.project_role}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--text2)' }}>{format(parseISO(m.joined_at), 'MMM d, yyyy')}</td>
                      {canManage && (
                        <td>
                          {m.id !== user?.id && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {taskModal && (
        <TaskModal
          projectId={id}
          task={taskModal === 'new' ? null : taskModal}
          members={project.members}
          onClose={() => setTaskModal(null)}
          onSaved={() => { setTaskModal(null); loadProject(); }}
        />
      )}
      {memberModal && (
        <MemberModal
          projectId={id}
          onClose={() => setMemberModal(false)}
          onSaved={() => { setMemberModal(false); loadProject(); }}
        />
      )}
    </div>
  );
}
