function InventoryPanel({ inventory }) {
  if (!inventory || inventory.length === 0) {
    return (
      <div className="glass" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Loading inventory from Airtable…
      </div>
    )
  }

  const statusFor = (car) => {
    if (!car.available) return { label: 'Sold', cls: 'inv-sold' }
    return { label: 'Available', cls: 'inv-avail' }
  }

  return (
    <div className="glass" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>🚗 Live Inventory</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>{inventory.length} available</span>
      </div>
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {inventory.map(car => {
          const s = statusFor(car)
          return (
            <div key={car.id} className="inv-item">
              <div>
                <div className="inv-name">{car.name}</div>
                <div className="inv-detail">{car.mileage?.toLocaleString()}km · AED {car.price?.toLocaleString()} · {car.condition}</div>
              </div>
              <span className={`inv-badge ${s.cls}`}>{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FollowUpQueue({ leads }) {
  const pending = leads.filter(l => l.status === 'followup' || l.status === 'cold' || l.status === 'followup-sent')

  return (
    <div className="glass" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>🔔 Follow-up Queue</h3>
        <span style={{ fontSize: '0.75rem', background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 700 }}>
          {pending.length} pending
        </span>
      </div>
      <div style={{ padding: '0.5rem 1rem' }}>
        {pending.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.75rem 0', textAlign: 'center' }}>
            No follow-ups queued right now
          </p>
        ) : pending.map(lead => (
          <div key={lead.phone} className="followup-item">
            <div className="followup-icon">⏰</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{lead.phone}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lead.lastCar || 'Vehicle enquiry'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
                {lead.status === 'cold' ? 'Layla sending re-engagement…' : '24h follow-up queued'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RightPanel({ leads, inventory }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <FollowUpQueue leads={leads} />
      <InventoryPanel inventory={inventory} />
    </div>
  )
}
