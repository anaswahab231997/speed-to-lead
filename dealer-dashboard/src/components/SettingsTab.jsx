import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Save, MessageSquare, Shield, CheckCircle, Smartphone, Zap } from 'lucide-react';

export default function SettingsTab() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    waba_id: user?.waba_id || '',
    phone_number_id: user?.phone_number_id || '',
    meta_access_token: '' // Sensitive, keep hidden
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      await axios.post(`${API_URL}/dealers/credentials`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      // Stay on success state for a while for "Activation" feel
    } catch (err) {
      alert('Failed to activate AI Showroom: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="faceid-overlay" style={{ position: 'relative', height: '100%', zIndex: 1 }}>
        <div className="faceid-container" style={{ padding: '40px' }}>
          <div className="pay-success-checkmark" style={{ width: '80px', height: '80px', fontSize: '3rem' }}>✓</div>
          <h1 className="faceid-title" style={{ marginTop: '20px' }}>AI ACTIVATED</h1>
          <p className="faceid-subtitle">Your showroom is now under Layla's protection</p>
          
          <div className="glass-solid" style={{ padding: '20px', width: '100%', marginTop: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <Zap size={24} color="var(--success)" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>WhatsApp Closer: ONLINE</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Layla is monitoring inbound lead flow.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Smartphone size={24} color="var(--success)" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Secure Line Bound</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Phone ID {formData.phone_number_id} is active.</div>
              </div>
            </div>
          </div>

          <button className="btn-manual-decrypt" onClick={() => setSuccess(false)} style={{ marginTop: '40px' }}>
            RETURN TO COMMAND CENTER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-tab" style={{ padding: '20px' }}>
      <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Shield size={14} /> AI SHOWROOM ACTIVATION
      </div>
      
      <div className="iap-header" style={{ textAlign: 'left', marginBottom: '30px' }}>
        <h2 className="iap-title" style={{ fontSize: '1.4rem' }}>Connect your WhatsApp</h2>
        <p className="iap-subtitle">Layla needs your Meta Cloud credentials to start closing sales.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-solid" style={{ padding: '24px', borderRadius: '24px' }}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ color: 'var(--text-secondary)' }}>Meta Phone Number ID</label>
          <input 
            name="phone_number_id"
            value={formData.phone_number_id}
            onChange={handleChange}
            placeholder="Found in Meta App Settings"
            required
            style={{ padding: '14px', fontSize: '1rem' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ color: 'var(--text-secondary)' }}>WhatsApp Business Account ID</label>
          <input 
            name="waba_id"
            value={formData.waba_id}
            onChange={handleChange}
            placeholder="Found in Meta Dashboard"
            required
            style={{ padding: '14px', fontSize: '1rem' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '30px' }}>
          <label style={{ color: 'var(--text-secondary)' }}>Permanent Access Token</label>
          <input 
            name="meta_access_token"
            type="password"
            value={formData.meta_access_token}
            onChange={handleChange}
            placeholder="EAA..."
            required
            style={{ padding: '14px', fontSize: '1rem' }}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', height: '54px', fontSize: '1rem', justifyContent: 'center' }}>
          {loading ? <div className="pay-spinner" style={{ width: '20px', height: '20px' }}></div> : '🚀 ACTIVATE AI AGENT'}
        </button>
      </form>
      
      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(48,209,88,0.05)', borderRadius: '16px', border: '1px solid var(--success-glow)' }}>
        <h4 style={{ color: 'var(--success)', marginBottom: '8px', fontSize: '0.9rem' }}>✓ Managed Data Sync Active</h4>
        <p style={{ fontSize: '0.75rem', opacity: 0.8, lineHeight: '1.5' }}>
          Your car inventory and lead data are securely managed within the **Speed To Lead Master Airtable**. No technical setup is required on your end for the CRM integration.
        </p>
      </div>
    </div>
  );
}
