import React, { useState, useEffect } from 'react';
import { Shield, Zap, CheckCircle, Smartphone, Globe, Lock } from 'lucide-react';

export default function SubscriptionFlow({ status, onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Securing Merchant Connection', icon: <Lock size={20} /> },
    { label: 'Verifying Dealer Identity', icon: <Globe size={20} /> },
    { label: 'Provisioning AI Instance', icon: <Zap size={20} /> },
    { label: 'Syncing Master CRM Memory', icon: <Globe size={20} /> },
    { label: 'Activating WhatsApp Closer', icon: <Smartphone size={20} /> }
  ];

  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status === 'idle') return null;

  return (
    <div className="faceid-overlay" style={{ background: 'rgba(0,0,0,0.95)', zIndex: 1000 }}>
      <div className="faceid-container" style={{ padding: '40px', maxWidth: '400px' }}>
        <div className="pay-spinner" style={{ width: '80px', height: '80px', marginBottom: '30px' }}></div>
        
        <h2 className="iap-title" style={{ color: 'white', fontSize: '1.6rem', marginBottom: '10px' }}>
          {status === 'processing' ? 'ACTIVATING LAYLA™' : 'WELCOME TO THE FUTURE'}
        </h2>
        <p className="iap-subtitle" style={{ marginBottom: '40px' }}>
          {status === 'processing' ? 'Establishing secure showroom protocols...' : 'Your AI Sales Agent is now live.'}
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              opacity: i <= step ? 1 : 0.3,
              transition: 'all 0.5s ease'
            }}>
              <div style={{ 
                color: i < step ? 'var(--success)' : (i === step ? 'var(--accent)' : 'white'),
                transform: i === step ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}>
                {i < step ? <CheckCircle size={20} /> : s.icon}
              </div>
              <span style={{ 
                fontSize: '0.9rem', 
                fontWeight: i === step ? 700 : 500,
                color: i === step ? '#ffffff' : 'rgba(255,255,255,0.6)'
              }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {status === 'success' && (
          <button className="btn-primary" onClick={onComplete} style={{ marginTop: '50px', width: '100%' }}>
            ENTER COMMAND CENTER
          </button>
        )}
      </div>
    </div>
  );
}
