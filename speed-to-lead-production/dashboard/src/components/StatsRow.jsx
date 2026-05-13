export default function StatsRow({ stats, leads }) {
  const totalLeads = stats.totalLeads ?? leads.length
  const hot = stats.hotLeads ?? leads.filter(l => (l.intentScore || 0) >= 8).length
  const avg = stats.avgIntentScore ?? (leads.length
    ? +(leads.reduce((s, l) => s + (l.intentScore || 0), 0) / leads.length).toFixed(1)
    : 0)
  const availableCars = stats.availableCars ?? '—'

  const cards = [
    { value: totalLeads, label: 'Total Leads Today', sub: `${stats.activeConversations ?? 0} active now`, color: 'var(--accent-light)' },
    { value: hot, label: 'Hot Leads (Score 8–10)', sub: 'Need immediate action', color: 'var(--danger)' },
    { value: avg || '—', label: 'Avg Intent Score', sub: 'Across all conversations', color: 'var(--warning)' },
    { value: availableCars, label: 'Cars in Inventory', sub: stats.responseTime ?? '< 4s response', color: 'var(--success)' },
  ]

  return (
    <div className="stats-grid">
      {cards.map((s, i) => (
        <div key={i} className={`glass stat-card anim anim-${i + 1}`}>
          <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          <div className="stat-label">{s.label}</div>
          <div className="stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
