import { useState, useEffect } from 'react'

export default function Topbar({ connected, lastUpdated }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <div className="topbar">
      <div>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
          Dealer Command Centre
        </h2>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
          {time.toLocaleString('en-AE', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} — Gulf Standard Time
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="glass" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px' }}>
          <span className="dot" style={{ background: connected ? 'var(--success)' : 'var(--danger)', boxShadow: connected ? '0 0 6px var(--success)' : 'none' }}></span>
          <span style={{ color: connected ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
          {connected && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>· updated {updatedStr}</span>}
        </div>
        <div className="glass" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '8px', color: 'var(--text-secondary)' }}>
          🤖 Layla Active
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--gradient-main)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.85rem'
        }}>A</div>
      </div>
    </div>
  )
}
