import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/store';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, User, Building2, Shield } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('customer');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const isEmail = identifier.includes('@');
  const requiresPassword = isEmail;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      alert('Please enter your phone number or email.');
      return;
    }
    if (requiresPassword && !password.trim()) {
      alert('Password is required for owner/admin login.');
      return;
    }

    try {
      const payload = { identifier: identifier.trim() };
      if (requiresPassword) payload.password = password;

      const res = await axios.post('http://localhost:8000/api/auth/login', payload);
      const { token, role: userRole, status, user_id, name } = res.data;
      login({ name: name || identifier, role: userRole, status, user_id }, token);

      if (userRole === 'customer') navigate('/home');
      else if (userRole === 'owner') {
        if (status === 'pending') navigate('/waiting-approval');
        else navigate('/owner-dashboard');
      } else if (userRole === 'admin') navigate('/admin-dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="auth-layout">
      <div className="card auth-card">
        <div className="logo-container" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#2c5f5f', fontWeight: 'bold', margin: '0' }}>NO2Q+</h1>
        </div>

        <div className="auth-header text-center" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#5a7a7a', fontSize: '1.1rem', margin: '0 0 2rem 0', fontWeight: 500 }}>Welcome back! Please sign in.</h2>
        </div>

        <div className="role-select-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div
            className="role-card"
            onClick={() => { setSelectedRole('customer'); setIdentifier(''); setPassword(''); }}
            style={{
              padding: '1.25rem',
              border: selectedRole === 'customer' ? '2px solid #2c5f5f' : '1px solid #e0e0e0',
              borderRadius: '0.75rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: selectedRole === 'customer' ? '#f0f8f8' : '#fff',
            }}
          >
            <User size={28} style={{ color: '#2c5f5f', marginBottom: '0.5rem' }} />
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#2c5f5f' }}>Customer</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#888' }}>JOIN DIGITAL QUEUES</p>
          </div>

          <div
            className="role-card"
            onClick={() => { setSelectedRole('owner'); setIdentifier(''); setPassword(''); }}
            style={{
              padding: '1.25rem',
              border: selectedRole === 'owner' ? '2px solid #2c5f5f' : '1px solid #e0e0e0',
              borderRadius: '0.75rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: selectedRole === 'owner' ? '#f0f8f8' : '#fff',
            }}
          >
            <Building2 size={28} style={{ color: '#2c5f5f', marginBottom: '0.5rem' }} />
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#2c5f5f' }}>Restaurant</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#888' }}>MANAGE YOUR TABLES</p>
          </div>

          <div
            className="role-card"
            onClick={() => { setSelectedRole('admin'); setIdentifier(''); setPassword(''); }}
            style={{
              padding: '1.25rem',
              border: selectedRole === 'admin' ? '2px solid #2c5f5f' : '1px solid #e0e0e0',
              borderRadius: '0.75rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: selectedRole === 'admin' ? '#f0f8f8' : '#fff',
            }}
          >
            <Shield size={28} style={{ color: '#2c5f5f', marginBottom: '0.5rem' }} />
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#2c5f5f' }}>Administrator</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#888' }}>SYSTEM OVERSIGHT</p>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group" style={{ marginBottom: '1.25rem' }}>
            <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {selectedRole === 'customer' ? 'PHONE NUMBER' : 'WORKSPACE EMAIL'}
            </label>
            <input
              required
              type="text"
              placeholder={selectedRole === 'customer' ? '7777777777' : 'owner@paradise.com'}
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoFocus
              style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem' }}
            />
          </div>

          {(selectedRole === 'owner' || selectedRole === 'admin') && (
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SECRET PASSWORD</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem' }}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" style={{ padding: '1rem', fontSize: '1rem', fontWeight: 600, borderRadius: '0.5rem', backgroundColor: '#2c5f5f', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.3s' }}>
            Sign in <ArrowRight size={18} style={{ marginLeft: '0.8rem' }} />
          </button>
        </form>

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666' }}>
          <p style={{ margin: '0' }}>
            New to our platform?{' '}
            <Link to="/signup" style={{ color: '#2c5f5f', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
