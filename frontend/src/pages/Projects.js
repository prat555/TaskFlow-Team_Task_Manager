import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

function ProjectModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>New Project</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input className="form-input" placeholder="e.g. Website Redesign"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="What's this project about?"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    toast.success('Project deleted');
    load();
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header-row page-header">
        <div>
          <h1>Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📁</div>
          <h3>No projects yet</h3>
          <p>{user?.role === 'admin' ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}</p>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex-between">
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</h3>
                {p.my_role && <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>}
              </div>
              {p.description && <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{p.description}</p>}
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
                <span>👥 {p.member_count} members</span>
                <span>✅ {p.task_count} tasks</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                by {p.owner_name} · {format(parseISO(p.created_at), 'MMM d, yyyy')}
              </div>
              <div className="flex gap-8 mt-8">
                <Link to={`/projects/${p.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  Open
                </Link>
                {user?.role === 'admin' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
