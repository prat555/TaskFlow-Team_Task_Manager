import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandMark from './BrandMark';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <BrandMark />
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}>
          📁 Projects
        </NavLink>
        <NavLink to="/my-tasks" className={({ isActive }) => isActive ? 'active' : ''}>
          ✅ My Tasks
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/team" className={({ isActive }) => isActive ? 'active' : ''}>
            👥 Team
          </NavLink>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="role-badge">{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={handleLogout}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M6 3.5H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 5.5L12 8l-3 2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8H6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
