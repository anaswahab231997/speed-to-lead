import { useState, useEffect } from 'react'
import { getReconDealers } from '../api'

export default function ReconTab() {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await getReconDealers()
      if (res.success) setDealers(res.data)
      setLoading(false)
    }
    load()
  }, [])

  const totalLeak = dealers.reduce((sum, d) => sum + (d.revenueLost || 0), 0)
  const avgMaturity = (dealers.reduce((sum, d) => sum + (d.digitalScore || 0), 0) / (dealers.length || 1)).toFixed(1)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Recon Header */}
      <div className="glass" style={{
        padding: '24px',
        marginBottom: '20px',
        border: '1px solid rgba(10, 132, 255, 0.3)',
        background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.1), rgba(28, 28, 30, 0.9))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>🛰️</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            NEXLIFY RECON SWARM INTELLIGENCE
          </span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '12px', color: '#ffffff' }}>
          Regional Showroom Leaks
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Secret telemetry monitoring 50 regional dealerships scanned by Nexlify OS. The dealers below are currently bleeding commissions due to unaddressed digital gaps. Layla is engineered to close these leaks.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ border: '1px solid rgba(255, 69, 58, 0.2)' }}>
          <div className="stat-value" style={{ color: 'var(--hot)' }}>AED {totalLeak.toLocaleString()}</div>
          <div className="stat-label">Total Commission Leak / mo</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{dealers.length}</div>
          <div className="stat-label">Scanned Dealerships</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warm)' }}>{avgMaturity}/8</div>
          <div className="stat-label">Avg Digital Maturity</div>
        </div>
      </div>

      {/* Dealers Feed */}
      <div className="section-label">📋 Regional Target Matrix</div>
      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {dealers.map((d, i) => (
            <div key={d.id} className="glass" style={{ padding: '16px 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{i + 1}. {d.name}</h3>
                  <a href={d.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.74rem', color: 'var(--accent)', textDecoration: 'none' }}>
                    {d.website}
                  </a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: d.score === 'Hot' ? 'var(--hot)' : 'var(--warm)' }}>
                    {d.score === 'Hot' ? '🔥 HIGH PRIORITY' : '🟠 MEDIUM PRIORITY'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Maturity: {d.digitalScore || 1}/8</span>
                </div>
              </div>

              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                padding: '10px 14px', 
                borderRadius: '8px', 
                fontSize: '0.78rem', 
                color: 'var(--text-secondary)',
                lineHeight: '1.4',
                borderLeft: '3px solid var(--accent)'
              }}>
                <strong>Recon Telemetry:</strong> {d.laylaReply}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                <span>Scanned: GCC Region</span>
                <span style={{ fontWeight: 600, color: 'var(--hot)' }}>Leak: AED {(d.revenueLost || 0).toLocaleString()}/mo</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
