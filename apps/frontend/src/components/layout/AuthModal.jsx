import React, { useState } from 'react';
import { X, LogIn, UserPlus, Key, Mail, Shield, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, notify }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'verify'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [verifyUser, setVerifyUser] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      notify('error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const userData = await apiService.login(username, password);
      notify('success', `Welcome back, ${userData.username}! Authenticated as ${userData.role.toUpperCase()}.`);
      onAuthSuccess(userData);
      onClose();
    } catch (err) {
      const errMsg = err.message || 'Login failed.';
      notify('error', errMsg);
      // If pending verification, suggest moving to verify screen
      if (errMsg.toLowerCase().includes('verification')) {
        setVerifyUser(username);
        setMode('verify');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      notify('error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.register(username, email, password, role);
      notify('success', result.message || 'Registration request sent. Verification required.');
      setVerifyUser(username);
      setMode('verify');
    } catch (err) {
      notify('error', err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyUser) {
      notify('error', 'Username is required to verify.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.verifyRegistration(verifyUser);
      notify('success', result.message || 'Verification complete. You can now login.');
      setMode('login');
      setUsername(verifyUser);
    } catch (err) {
      notify('error', err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 className="section-title" style={{ fontSize: '1.4rem' }}>
            {mode === 'login' && 'Login to Platform'}
            {mode === 'register' && 'Create Cloud Account'}
            {mode === 'verify' && 'Verify Email (SNS)'}
          </h2>
          <p className="section-subtitle">
            {mode === 'login' && 'Access your orders and catalog controls'}
            {mode === 'register' && 'Register your identity on DynamoDB'}
            {mode === 'verify' && 'Confirm email subscription to proceed'}
          </p>
        </div>

        {/* Mode Selector Tab (only for login/register modes) */}
        {mode !== 'verify' && (
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', marginBottom: '20px' }}>
            <button
              onClick={() => setMode('login')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: mode === 'login' ? 'rgba(129, 140, 248, 0.08)' : 'transparent',
                color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: mode === 'login' ? 600 : 400,
                fontSize: '0.85rem'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: mode === 'register' ? 'rgba(129, 140, 248, 0.08)' : 'transparent',
                color: mode === 'register' ? 'var(--primary)' : 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: mode === 'register' ? 600 : 400,
                fontSize: '0.85rem'
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form Body */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-username">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-username"
                  type="text"
                  className="input-field"
                  placeholder="e.g. admin or user123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
                <LogIn size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="action-primary-btn"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Want to skip credentials? Use <strong style={{ color: 'var(--primary)' }}>admin / admin</strong>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="register-username">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-username"
                  type="text"
                  className="input-field"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
                <UserPlus size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="register-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-email"
                  type="email"
                  className="input-field"
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="register-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="register-role">System Role</label>
              <div style={{ position: 'relative' }}>
                <select
                  id="register-role"
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  style={{ paddingLeft: '36px', width: '100%', appearance: 'none', background: 'var(--bg-tertiary)' }}
                >
                  <option value="user">User Role (Purchase Only)</option>
                  <option value="admin">Admin Role (Full Catalog Controls)</option>
                </select>
                <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="action-primary-btn"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        )}

        {mode === 'verify' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--accent-amber)', margin: '12px 0' }}>
              <CheckCircle2 size={48} className="animate-pulse" />
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              We have dispatched a registration email. In AWS production, you must confirm the SNS email verification link.
            </p>

            <div className="input-group" style={{ textAlign: 'left' }}>
              <label className="input-label" htmlFor="verify-username">Verify Account for Username</label>
              <input
                id="verify-username"
                type="text"
                className="input-field"
                value={verifyUser}
                onChange={(e) => setVerifyUser(e.target.value)}
                disabled={loading}
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              className="action-primary-btn"
              disabled={loading}
              style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? 'Verifying Account...' : 'Confirm Verification (SNS Subscription)'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
