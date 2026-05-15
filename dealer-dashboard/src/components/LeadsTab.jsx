import { useState, useEffect, useMemo } from 'react'
import { getLeads, updateLeadStatus, stopAiIntervention, getLeadActivity, assignLead, logActivity } from '../api'

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

function TimelineItem({ item }) {
  const isSystem = item.Type === 'System'
  const isAI = item.Type === 'AI'
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', position: 'relative' }}>
      <div style={{ 
        width: '10px', height: '10px', borderRadius: '50%', 
        background: isSystem ? 'var(--accent)' : isAI ? 'var(--hot)' : 'var(--purple)',
        marginTop: '6px', zIndex: 1, boxShadow: '0 0 8px currentColor'
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{item.Type}</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{timeAgo(item.Timestamp)}</span>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.Details}</div>
      </div>
    </div>
  )
}

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

function LeadModal({ lead, onClose, onAction, onIntervene }) {
  const [saving, setSaving] = useState(false)
  const [activity, setActivity] = useState([])
  const [activeTab, setActiveTab] = useState('summary') 
  const [showAssign, setShowAssign] = useState(false)
  const [showBook, setShowBook] = useState(false)

  useEffect(() => {
    getLeadActivity(lead.id).then(res => {
      if (res.success) setActivity(res.data)
    })
  }, [lead.id])

  const action = async (status) => {
    setSaving(true)
    await updateLeadStatus(lead.id, status)
    await logActivity(lead.id, 'Status Change', `Status updated to ${status}`)
    setSaving(false)
    onAction()
    onClose()
  }

  const handleAssign = async (agent) => {
    setSaving(true)
    const res = await assignLead(lead.id, agent)
    if (res.success) {
      alert(`Successfully assigned to ${agent}`)
      onAction()
    }
    setSaving(false)
    setShowAssign(false)
  }

  const handleBook = async (date) => {
    setSaving(true)
    await logActivity(lead.id, 'Appointment', `Test drive scheduled for ${date}`)
    alert(`Appointment booked for ${date}`)
    setSaving(false)
    setShowBook(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-handle" />
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div>
            <div className="modal-title">{lead.name || 'Unknown Buyer'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{lead.phone}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScoreTag score={lead.score} />
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px', flexShrink: 0 }}>
          {['summary', 'timeline'].map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              style={{ 
                padding: '12px 16px', 
                background: 'none', 
                border: 'none', 
                color: activeTab === t ? 'var(--accent)' : 'var(--text-tertiary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'summary' ? (
            <>
              <div style={{ marginBottom: '20px' }}>
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

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 12 }}>
                  Interactive Action Center
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button className="btn btn-ghost" style={{ justifyContent: 'center', height: 'auto', padding: '16px 10px', flexDirection: 'column', gap: '6px' }} onClick={() => setShowAssign(!showAssign)}>
                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Assign Agent</span>
                  </button>
                  <button className="btn btn-ghost" style={{ justifyContent: 'center', height: 'auto', padding: '16px 10px', flexDirection: 'column', gap: '6px' }} onClick={() => setShowBook(true)}>
                    <span style={{ fontSize: '1.2rem' }}>📅</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Book Visit</span>
                  </button>
                </div>

                {showAssign && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '8px' }}>Select Sales Agent</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['Ahmed', 'Sarah', 'John', 'Yasmin'].map(a => (
                        <button key={a} className="filter-pill" onClick={() => handleAssign(a)}>{a}</button>
                      ))}
                    </div>
                  </div>
                )}
                
                {showBook && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '8px' }}>Select Visit Date</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['Today', 'Tomorrow', 'Next Monday'].map(d => (
                        <button key={d} className="filter-pill" onClick={() => handleBook(d)}>{d}</button>
                      ))}
                      <button className="filter-pill" onClick={() => setShowBook(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="timeline-view">
              <div style={{ borderLeft: '1px solid var(--border)', marginLeft: '4px', paddingLeft: '20px' }}>
                {activity.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '20px' }}>No activity logged yet</div>
                ) : (
                  activity.map((item, i) => <TimelineItem key={i} item={item} />)
                )}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions" style={{ padding: '20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ borderRadius: '12px', padding: '12px' }}>Close</button>
          <button className="btn btn-primary" onClick={() => onIntervene(lead.id)} style={{ borderRadius: '12px', padding: '12px', background: 'var(--hot)', color: 'white' }}>
            🛑 Take the Wheel
          </button>
          {lead.status !== 'Contacted' && (
            <button className="btn btn-success" onClick={() => action('Contacted')} disabled={saving} style={{ borderRadius: '12px', padding: '12px' }}>
              ✓ Mark Contacted
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

  const handleIntervene = async (id) => {
    try {
      const res = await stopAiIntervention(id)
      if (res.success) {
        alert('AI Intervened. You now have total control of this conversation.')
        load()
      }
    } catch (e) {
      console.error(e)
    }
  }

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

  const { parsedLeads, shown, hot, warm, totalRevenueLost } = useMemo(() => {
    const parsed = leads.map(l => {
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

    const filtered = parsed.filter(l => filter === 'All' || l.score?.trim() === filter || l.status?.trim() === filter);
    const hotCount = parsed.filter(l => l.score?.trim() === 'Hot').length;
    const warmCount = parsed.filter(l => l.score?.trim() === 'Warm').length;
    const revTotal = parsed.reduce((sum, l) => sum + (l.revenueLost || 0), 0);

    return { parsedLeads: parsed, shown: filtered, hot: hotCount, warm: warmCount, totalRevenueLost: revTotal };
  }, [leads, filter]);

  useEffect(() => {
    if (isDesktop && shown.length > 0 && !selected) {
      setSelected(shown[0])
    }
  }, [isDesktop, shown, selected])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%' }}>
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
          Based on <strong>{leads.length}</strong> active regional dealerships scanned by the Recon Swarm. Layla closes this leak instantly.
        </p>
      </div>

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

      <div className="filter-row" style={{ minHeight: '38px', margin: '4px 0' }}>
        {['All', 'Hot', 'Warm', 'Cold', 'Contacted'].map(f => (
          <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="leads-layout-wrapper" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ flex: 1, width: '100%' }}>
          <div className="section-label" style={{ marginBottom: '14px', color: 'var(--hot)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="hot-lead-pulse-dot"></span>
            Action Required: High-Intent Buyers
          </div>

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
                    cursor: 'pointer'
                  }}
                >
                  <div className="notif-header" style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <div className="notif-app" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div className="notif-app-icon" style={{ width: '22px', height: '22px', borderRadius: '6px', background: lead.score?.trim() === 'Hot' ? 'var(--hot)' : 'var(--accent)', fontSize: '0.7rem' }}>⚡</div>
                      <span className="notif-app-name" style={{ fontWeight: 700, fontSize: '0.72rem' }}>SPEED TO LEAD</span>
                    </div>
                    <span className="notif-time" style={{ fontWeight: 600, fontSize: '0.68rem' }}>{timeAgo(lead.submittedAt)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>{lead.name || 'Unknown Buyer'}</div>
                    <ScoreTag score={lead.score} />
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.015)', padding: '14px', borderRadius: '14px' }}>
                    <span style={{ fontWeight: 800, color: '#ffffff' }}>🤖 Summary:</span> {lead.laylaReply?.substring(0, 80)}...
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); handleIntervene(lead.id); }} style={{ flex: 1, background: 'var(--hot)', color: 'white' }}>🛑 Intervene</button>
                    <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); setSelected(lead); }} style={{ flex: 1 }}>Details →</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {isDesktop && (
          <div style={{ flex: '0 0 420px', position: 'sticky', top: '20px', width: '420px' }}>
            <div className="section-label" style={{ marginBottom: '14px' }}>🛡️ Live Desk Detail View</div>
            {selected ? (
              <div className="glass-solid" style={{ padding: '24px', borderRadius: '24px', background: '#121214', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3>{selected.name}</h3>
                <ScoreTag score={selected.score} />
                <button className="btn btn-primary" onClick={() => handleIntervene(selected.id)}>🛑 Stop AI & Take Over</button>
              </div>
            ) : (
              <div className="glass" style={{ padding: '40px 20px', textAlign: 'center' }}>Select a lead to view details</div>
            )}
          </div>
        )}
      </div>

      {selected && !isDesktop && (
        <LeadModal lead={selected} onClose={() => setSelected(null)} onAction={load} onIntervene={handleIntervene} />
      )}
    </div>
  )
}
