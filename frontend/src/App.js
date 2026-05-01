import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import MyTasks from './pages/MyTasks';
import Team from './pages/Team';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">{children}</div>
    </div>
  );
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  if (user) return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
      <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
      <Route path="/my-tasks" element={<PrivateRoute><MyTasks /></PrivateRoute>} />
      <Route path="/team" element={<PrivateRoute><AdminRoute><Team /></AdminRoute></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181f',
              color: '#f0f0f8',
              border: '1px solid #2a2a35',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
