import { useState, useEffect } from 'react';
import api from '../api';
import { format, parseISO } from 'date-fns';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const admins = users.filter(u => u.role === 'admin');
  const members = users.filter(u => u.role === 'member');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Team</h1>
        <p>{users.length} members in your workspace</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{admins.length}</div>
          <div className="stat-label">Admins</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{members.length}</div>
          <div className="stat-label">Members</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Global Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex-center gap-8">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{u.name[0]}</div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
