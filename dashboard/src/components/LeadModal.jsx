function ScoreGauge({ score }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (score / 10) * circumference
  const color = score >= 8 ? '#f43f5e' : score >= 5 ? '#f59e0b' : '#818cf8'
  const label = score >= 8 ? 'HOT LEAD' : score >= 5 ? 'WARM LEAD' : 'COOL LEAD'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={50} cy={50} r={radius} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <text x={50} y={46} textAnchor="middle" fill={color} fontSize={22} fontWeight={800}>{score}</text>
        <text x={50} y={62} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9}>/10</text>
      </svg>
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color, letterSpacing: '0.08em' }}>{label}</span>
    </div>
  )
}

function ScoreBreakdown({ score }) {
  const signals = [
    { label: 'Purchase Timeline', value: score >= 7 ? 'This week' : 'Undecided', positive: score >= 7 },
    { label: 'Budget Confirmed', value: score >= 6 ? 'Yes' : 'Vague', positive: score >= 6 },
    { label: 'Test Drive Request', value: score >= 8 ? 'Requested' : 'Not yet', positive: score >= 8 },
    { label: 'Specific Car Named', value: 'Yes', positive: true },
    { label: 'Objections Raised', value: score <= 5 ? 'Price concerns' : 'Minor / None', positive: score > 5 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {signals.map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.label}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: s.positive ? 'var(--success)' : 'var(--warning)' }}>
            {s.positive ? '✓ ' : '⚠ '}{s.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function LeadModal({ lead, onClose, onSave }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem' }}>{lead.name}</h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{lead.phone} · {lead.city}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-light)', marginTop: '0.25rem', fontWeight: 600 }}>{lead.car}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <ScoreGauge score={lead.score} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem', lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Score Breakdown */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>AI Intent Analysis</div>
          <ScoreBreakdown score={lead.score} />
        </div>

        {/* Conversation */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>Layla Conversation Log</div>
          <div className="chat-wrap">
            {lead.messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'layla' ? 'flex-end' : 'flex-start' }}>
                <div className={`bubble bubble-${msg.sender}`}>{msg.text}</div>
                <div className="bubble-meta">{msg.sender === 'layla' ? '🤖 Layla' : `👤 ${lead.name.split(' ')[0]}`} · {msg.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Close</button>
          <button className="btn-ghost">📞 Assign to Human Agent</button>
          <button className="btn-primary" onClick={() => { onSave(lead.id); onClose() }}>
            ✓ Mark as Qualified
          </button>
        </div>
      </div>
    </div>
  )
}
