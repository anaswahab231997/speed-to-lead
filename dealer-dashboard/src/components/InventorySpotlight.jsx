import { useState, useEffect } from 'react'
import { getInventoryStats } from '../api'

export default function InventorySpotlight() {
  const [stats, setStats] = useState({ topHit: '...', ghostStock: '...' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const res = await getInventoryStats()
      if (res.success) {
        setStats(res.data)
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="spotlight-container-luxury">
      <div className="spotlight-headline">
        <span>What’s Moving & What’s Not</span>
      </div>
      
      <div className="spotlight-grid">
        <div className="spotlight-card hot">
          <div className="sl-label">🔥 TOP HIT</div>
          <div className="sl-value">{stats.topHit}</div>
          <div className="sl-sub">Most requested vehicle this week.</div>
        </div>
        
        <div className="spotlight-card ghost">
          <div className="sl-label">👻 GHOST STOCK</div>
          <div className="sl-value">{stats.ghostStock}</div>
          <div className="sl-sub">Low engagement. Consider price adjustment?</div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .spotlight-container-luxury {
          padding: 18px;
          background: rgba(255,255,255,0.02);
          border-radius: 24px;
          border: 1px solid var(--border);
          margin-bottom: 20px;
        }
        .spotlight-headline {
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .spotlight-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 480px) {
          .spotlight-grid { grid-template-columns: 1fr 1fr; }
        }
        .spotlight-card {
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }
        .spotlight-card.hot {
          border-color: rgba(48, 209, 88, 0.2);
          background: linear-gradient(135deg, rgba(48, 209, 88, 0.05), transparent);
        }
        .spotlight-card.ghost {
          border-color: rgba(255, 159, 10, 0.2);
          background: linear-gradient(135deg, rgba(255, 159, 10, 0.05), transparent);
        }
        .sl-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--text-tertiary);
          margin-bottom: 4px;
          letter-spacing: 0.1em;
        }
        .sl-value {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sl-sub {
          font-size: 0.68rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }
      `}} />
    </div>
  )
}
