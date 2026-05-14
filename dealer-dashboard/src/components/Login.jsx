import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Shield, Zap } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="faceid-overlay">
      <div className="faceid-container">
        <div className="faceid-logo">
          <Zap size={32} fill="white" />
        </div>
        <h1 className="faceid-title">SPEED TO LEAD™</h1>
        <p className="faceid-subtitle">DEALER PULSE COMMAND CENTER</p>

        <form onSubmit={handleSubmit} className="glass-solid" style={{ width: '100%', padding: '24px', borderRadius: '24px' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label><Mail size={12} style={{ marginRight: '6px' }} /> Email Address</label>
            <input 
              type="email" 
              placeholder="dealer@showroom.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label><Lock size={12} style={{ marginRight: '6px' }} /> Secure Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {error && <p style={{ color: 'var(--hot)', fontSize: '0.8rem', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn-manual-decrypt" disabled={loading} style={{ marginTop: '0' }}>
            {loading ? <div className="pay-spinner" style={{ width: '20px', height: '20px' }}></div> : '🔓 AUTHORIZE ACCESS'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', opacity: 0.6 }}>
          <p style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Shield size={12} /> SECURED BY NEXLIFY AGENT OS
          </p>
        </div>
      </div>
      <div className="ios-swipe-indicator"></div>
    </div>
  );
}
