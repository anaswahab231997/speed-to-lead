import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

export default function SaaSStatusCard() {
  const { user } = useAuth();
  
  const isSubscribed = user?.subscription_status === 'active';
  const hasMeta = !!user?.phone_number_id && !!user?.waba_id;

  return (
    <div className="glass" style={{
      padding: '16px',
      marginBottom: '20px',
      background: 'rgba(28, 28, 30, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color={isSubscribed ? 'var(--success)' : 'var(--hot)'} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AGENT OS STATUS
          </span>
        </div>
        <div className={`di-dot ${isSubscribed && hasMeta ? '' : 'error'}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>Subscription</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSubscribed ? 'var(--success)' : 'var(--hot)', marginTop: '2px' }}>
            {isSubscribed ? 'ACTIVE PREMIUM' : 'PAYMENT REQUIRED'}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>AI Showroom</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: hasMeta ? 'var(--success)' : 'var(--warm)', marginTop: '2px' }}>
            {hasMeta ? 'SYNCED & LIVE' : 'AWAITING SETUP'}
          </div>
        </div>
      </div>

      {!isSubscribed && (
        <div style={{ 
          background: 'rgba(255, 59, 48, 0.1)', 
          padding: '10px', 
          borderRadius: '8px', 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center' 
        }}>
          <AlertCircle size={14} color="var(--hot)" />
          <span style={{ fontSize: '0.7rem', color: 'var(--hot)', fontWeight: 600 }}>
            Subscription inactive. Layla is currently in "Observer Mode".
          </span>
        </div>
      )}
    </div>
  );
}
