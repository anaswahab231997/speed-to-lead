export default function Sidebar({ active, onNav }) {
  const navItems = [
    { id: 'dashboard', icon: '⚡', label: 'Dashboard' },
    { id: 'leads', icon: '👥', label: 'All Leads' },
    { id: 'inventory', icon: '🚗', label: 'Inventory' },
    { id: 'followups', icon: '🔔', label: 'Follow-ups' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--gradient-main)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>Speed To Lead</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by Layla AI</div>
          </div>
        </div>
      </div>

      {/* Layla Status */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span className="dot dot-live"></span>
          <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>Layla is Active</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>6 active conversations</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: '0.5rem' }}>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Dealer tag */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Dealership</div>
        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>Al Futtaim Motors LLC</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Dubai, UAE</div>
      </div>
    </div>
  )
}
