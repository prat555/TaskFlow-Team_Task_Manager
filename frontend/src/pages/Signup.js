import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import BrandMark from '../components/BrandMark';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <BrandMark />
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Get started with your team</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Jane Smith"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="member">Member — can view & update tasks</option>
              <option value="admin">Admin — can create & manage projects</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
