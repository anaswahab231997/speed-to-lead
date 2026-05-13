import { useState, useEffect } from 'react'
import { getLeads, updateLeadStatus } from '../api'

function ScoreTag({ score }) {
  const s = score?.trim() || 'Cold'
  const cls = s === 'Hot' ? 'hot' : s === 'Warm' ? 'warm' : 'cold'
  return <span className={`score-tag score-${cls}`}>{s === 'Hot' ? '🔥 Hot' : s === 'Warm' ? '🟠 Warm' : '❄️ Cold'}</span>
}

function StatusPill({ status }) {
  const s = status?.trim() || 'New'
  const cls = s === 'Contacted' ? 'contacted' : s === 'Closed' ? 'closed' : 'new'
  return <span className={`status-pill status-${cls}`}>{s}</span>
}

function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m || 1}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })
}

function LeadModal({ lead, onClose, onAction }) {
  const [saving, setSaving] = useState(false)

  const action = async (status) => {
    setSaving(true)
    await updateLeadStatus(lead.id, status)
    setSaving(false)
    onAction()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <div>
            <div className="modal-title">{lead.name || 'Unknown Buyer'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{lead.phone}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScoreTag score={lead.score} />
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Conversation */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 12 }}>
            Conversation Summary
          </div>
          <div className="conv-wrap" style={{ padding: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: 3 }}>👤 Buyer</div>
                <div className="bubble bubble-buyer">{lead.carInterest || '—'}</div>
              </div>
              {lead.laylaReply && (
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: 3, textAlign: 'right' }}>🤖 Layla</div>
                  <div className="bubble bubble-layla">{lead.laylaReply}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['Source', lead.source || '—'],
              ['Dealer', lead.dealer || '—'],
              ['Status', lead.status],
              ['Received', timeAgo(lead.submittedAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions" style={{ padding: '20px' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ borderRadius: '12px', padding: '12px' }}>Close</button>
          {lead.status !== 'Contacted' && (
            <button className="btn btn-success" onClick={() => action('Contacted')} disabled={saving} style={{ borderRadius: '12px', padding: '12px' }}>
              ✓ Contacted
            </button>
          )}
          {lead.status !== 'Closed' && (
            <button className="btn btn-danger" onClick={() => action('Closed')} disabled={saving} style={{ borderRadius: '12px', padding: '12px' }}>
              Close Lead
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LeadsTab() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')
  const [updatingId, setUpdatingId] = useState(null)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024)

  const load = async () => {
    try {
      const res = await getLeads()
      if (res.success) setLeads(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleQuickContacted = async (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setUpdatingId(id)
    try {
      await updateLeadStatus(id, 'Contacted')
      await load()
      if (selected && selected.id === id) {
        setSelected(prev => ({ ...prev, status: 'Contacted' }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const parsedLeads = leads.map(l => {
    let digitalScore = 1;
    let revenueLost = 0;
    if (l.laylaReply) {
      const scoreMatch = l.laylaReply.match(/Digital Score: (\d)\/8/);
      if (scoreMatch) digitalScore = parseInt(scoreMatch[1]);
      const leakMatch = l.laylaReply.match(/Identified Monthly Commission Leak: AED ([\d,]+)/);
      if (leakMatch) {
        revenueLost = parseInt(leakMatch[1].replace(/,/g, ''));
      } else {
        const isHot = l.score?.trim() === 'Hot';
        const multiplier = isHot ? 3.5 : 1.2;
        revenueLost = Math.round((8 - digitalScore) * 150000 * 0.05 * multiplier);
      }
    }
    return { ...l, digitalScore, revenueLost };
  });

  const shown = parsedLeads.filter(l => filter === 'All' || l.score?.trim() === filter || l.status?.trim() === filter)
  const hot = parsedLeads.filter(l => l.score?.trim() === 'Hot').length
  const warm = parsedLeads.filter(l => l.score?.trim() === 'Warm').length
  const totalRevenueLost = parsedLeads.reduce((sum, l) => sum + (l.revenueLost || 0), 0)

  // Auto-select first lead on desktop layout if none is selected
  useEffect(() => {
    if (isDesktop && shown.length > 0 && !selected) {
      setSelected(shown[0])
    }
  }, [isDesktop, shown, selected])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%' }}>
      {/* Revenue Leak Widget */}
      <div className="glass" style={{
        padding: '20px 24px',
        border: '1px solid rgba(255, 69, 58, 0.3)',
        background: 'linear-gradient(135deg, rgba(255, 69, 58, 0.12), rgba(28, 28, 30, 0.85))',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--hot)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              CRITICAL REVENUE LEAK DETECTED
            </span>
          </div>
          <div className="aw-hb-dot live" />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}>
            AED {totalRevenueLost.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
            actively bleeding
          </span>
        </div>
        
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '4px' }}>
          Based on <strong>{leads.length}</strong> active regional dealerships scanned by the Recon Swarm with unaddressed digital leaks. Layla closes this leak instantly.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ minHeight: '80px', gap: '12px' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{leads.length}</div>
          <div className="stat-label">Total Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--hot)' }}>{hot}</div>
          <div className="stat-label">🔥 Hot</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warm)' }}>{warm}</div>
          <div className="stat-label">🟠 Warm</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row" style={{ minHeight: '38px', margin: '4px 0' }}>
        {['All', 'Hot', 'Warm', 'Cold', 'Contacted'].map(f => (
          <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Multi-Device Layout Wrapper */}
      <div className="leads-layout-wrapper" style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        width: '100%'
      }}>
        {/* Left Column: Pulse Feed Cards */}
        <div style={{ flex: 1, width: '100%' }}>
          <div className="section-label" style={{ marginBottom: '14px' }}>📩 Pulse Feed (Thumb Optimized)</div>

          <div className="pulse-scroll-container">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
                <div className="spinner" style={{ margin: 0 }} />
              </div>
            ) : shown.length === 0 ? (
              <div className="glass" style={{ borderRadius: '20px', width: '100%' }}>
                <div className="empty" style={{ padding: '40px 20px' }}>
                  <div className="empty-icon" style={{ fontSize: '2rem' }}>📩</div>
                  <div className="empty-title">No leads found</div>
                  <div className="empty-sub">When buyers message on WhatsApp, they appear here instantly</div>
                </div>
              </div>
            ) : (
              shown.map(lead => (
                <div
                  key={lead.id}
                  className={`notif-card ${lead.score?.trim() === 'Hot' ? 'hot-lead' : ''} ${selected?.id === lead.id ? 'active-selected' : ''}`}
                  onClick={() => setSelected(lead)}
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    border: selected?.id === lead.id ? '1px solid var(--hot)' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: selected?.id === lead.id ? 'rgba(255, 59, 48, 0.04)' : 'rgba(28, 28, 30, 0.35)',
                    boxShadow: selected?.id === lead.id ? '0 0 15px rgba(255,59,48,0.1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {/* Card Header */}
                  <div className="notif-header" style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <div className="notif-app" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div className="notif-app-icon" style={{ width: '22px', height: '22px', borderRadius: '6px', background: lead.score?.trim() === 'Hot' ? 'var(--hot)' : 'var(--accent)', fontSize: '0.7rem' }}>⚡</div>
                      <span className="notif-app-name" style={{ fontWeight: 700, fontSize: '0.72rem' }}>SPEED TO LEAD</span>
                    </div>
                    <span className="notif-time" style={{ fontWeight: 600, fontSize: '0.68rem' }}>{timeAgo(lead.submittedAt)}</span>
                  </div>
                  
                  {/* Client & Score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                      {lead.name || 'Unknown Buyer'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <ScoreTag score={lead.score} />
                      <StatusPill status={lead.status} />
                    </div>
                  </div>

                  {/* Interest */}
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🚗</span> <span>{lead.carInterest || 'Unspecified Model'}</span>
                  </div>

                  {/* Conversation Summary */}
                  <div style={{ 
                    fontSize: '0.82rem', 
                    lineHeight: '1.5',
                    color: 'var(--text-secondary)', 
                    background: 'rgba(255,255,255,0.015)', 
                    padding: '14px', 
                    borderRadius: '14px', 
                    borderLeft: lead.score?.trim() === 'Hot' ? '3px solid var(--hot)' : '3px solid var(--accent)',
                    boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.15)'
                  }}>
                    <span style={{ fontWeight: 800, color: '#ffffff', marginRight: '6px' }}>🤖 Layla AI Summary:</span>
                    {lead.laylaReply || 'Awaiting initial incoming buyer webhook transmission.'}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    {lead.status !== 'Contacted' && (
                      <button 
                        className="btn btn-success" 
                        onClick={(e) => handleQuickContacted(e, lead.id)}
                        disabled={updatingId === lead.id}
                        style={{ flex: 1, borderRadius: '12px', padding: '12px', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        {updatingId === lead.id ? 'Saving...' : '✓ Quick Contact'}
                      </button>
                    )}
                    <button 
                      className="btn btn-ghost" 
                      onClick={(e) => { e.stopPropagation(); setSelected(lead); }}
                      style={{ flex: 1, borderRadius: '12px', padding: '12px', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      CRM Details →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Desktop Split Details View (Rendered only on Desktop screen states) */}
        {isDesktop && (
          <div style={{
            flex: '0 0 420px',
            position: 'sticky',
            top: '20px',
            width: '420px'
          }}>
            <div className="section-label" style={{ marginBottom: '14px' }}>🛡️ Live Desk Detail View</div>
            {selected ? (
              <div className="glass-solid" style={{
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#121214',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
                      {selected.name || 'Unknown Buyer'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {selected.phone}
                    </p>
                  </div>
                  <ScoreTag score={selected.score} />
                </div>

                <div>
                  <h4 style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '8px' }}>
                    Active Dialog Stream
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '14px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>👤 BUYER INTEREST</span>
                      <span style={{ fontSize: '0.85rem', color: '#ffffff' }}>{selected.carInterest || '—'}</span>
                    </div>
                    {selected.laylaReply && (
                      <div style={{ background: 'rgba(255,59,48,0.04)', borderLeft: '3px solid var(--hot)', padding: '12px 14px', borderRadius: '14px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--hot)', fontWeight: 800, display: 'block', marginBottom: '4px' }}>🤖 LAYLA SALES SUMMARY</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block' }}>{selected.laylaReply}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Lead Source</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{selected.source || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Showroom</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{selected.dealer || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Registration Status</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}><StatusPill status={selected.status} /></p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Handshake Timestamp</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{timeAgo(selected.submittedAt)}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                  {selected.status !== 'Contacted' && (
                    <button 
                      className="btn btn-success" 
                      onClick={() => handleQuickContacted(null, selected.id)}
                      style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, justifyContent: 'center' }}
                    >
                      ✓ Mark Contacted
                    </button>
                  )}
                  <button 
                    className="btn btn-danger" 
                    onClick={async () => {
                      await updateLeadStatus(selected.id, 'Closed')
                      await load()
                      setSelected(null)
                    }}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, justifyContent: 'center' }}
                  >
                    Close Lead Thread
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass" style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                borderRadius: '24px',
                fontSize: '0.8rem'
              }}>
                <span>👈 Select a thread from the vertical thumb list to view permanent desk details</span>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && !isDesktop && (
        <LeadModal lead={selected} onClose={() => setSelected(null)} onAction={load} />
      )}
    </div>
  )
}
