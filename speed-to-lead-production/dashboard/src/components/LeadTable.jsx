function ScoreBadge({ score }) {
  const s = score || 0
  const cls = s >= 8 ? 'score-badge score-hot' : s >= 5 ? 'score-badge score-warm' : 'score-badge score-cold'
  return <span className={cls}>{s}</span>
}

function StatusPill({ status }) {
  const map = {
    active: { cls: 'pill pill-active', label: '● Active' },
    followup: { cls: 'pill pill-followup', label: '⏰ Follow-up' },
    'followup-sent': { cls: 'pill pill-followup', label: '⏰ Sent' },
    cold: { cls: 'pill pill-cold', label: '❄ Cold' },
    qualified: { cls: 'pill pill-new', label: '✓ Qualified' },
    dismissed: { cls: 'pill', label: '✕ Dismissed', style: { opacity: 0.5 } },
  }
  const s = map[status] || { cls: 'pill pill-new', label: '✦ New' }
  return <span className={s.cls} style={s.style}>{s.label}</span>
}

function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function LeadTable({ leads, onSelect }) {
  if (!leads || leads.length === 0) {
    return (
      <div className="glass anim anim-2" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💬</div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No leads yet</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Layla is standing by. The moment a buyer messages on WhatsApp, they will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="glass anim anim-2" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Live Lead Feed</h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click any row to view conversation · refreshes every 8s</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="lead-table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Phone</th>
              <th>Last Message</th>
              <th>Car Interest</th>
              <th>Status</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.phone} className="lead-row" onClick={() => onSelect(lead)}>
                <td><ScoreBadge score={lead.intentScore} /></td>
                <td>
                  <div className="lead-name">{lead.phone}</div>
                </td>
                <td style={{ maxWidth: '220px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lead.lastMessage || '—'}
                  </div>
                </td>
                <td>
                  <span className="lead-car" style={{ textTransform: 'capitalize' }}>{lead.lastCar || '—'}</span>
                </td>
                <td><StatusPill status={lead.status} /></td>
                <td className="lead-time">{timeAgo(lead.lastActivity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
