import { useState, useEffect } from 'react'
import { getLeads } from '../api'

export default function PulseHeader({ leadCount, hotCount }) {
  const [revAtRisk, setRevAtRisk] = useState(0)
  const [activeConversations, setActiveConversations] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      const res = await getLeads()
      if (res.success) {
        const leads = res.data
        const risk = leads.reduce((sum, l) => {
          // Simulated revenue risk calculation
          const scoreMultiplier = l.score === 'Hot' ? 150000 : 80000
          return sum + (l.status === 'New' ? scoreMultiplier : 0)
        }, 0)
        setRevAtRisk(risk)
        setActiveConversations(leads.filter(l => l.status === 'New' || l.status === 'Contacted').length)
      }
    }
    fetchStats()
    const t = setInterval(fetchStats, 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="pulse-header-luxury">
      <div className="pulse-headline">
        <div className="pulse-dot-green"></div>
        <span>Your Showroom is Active.</span>
      </div>
      
      <div className="pulse-metrics-grid">
        <div className="pulse-metric-card">
          <div className="pm-label">LIVE CONVERSATIONS</div>
          <div className="pm-value">Layla is talking to <span className="text-accent">{activeConversations}</span> buyers.</div>
        </div>
        
        <div className="pulse-metric-card">
          <div className="pm-label">SPEED TO LEAD</div>
          <div className="pm-value">Avg. Response: <span className="text-accent">42 Seconds</span></div>
        </div>
        
        <div className="pulse-metric-card alert">
          <div className="pm-label">REVENUE AT RISK</div>
          <div className="pm-value">Unclosed Opportunity: <span className="text-warm">AED {revAtRisk.toLocaleString()}</span></div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .pulse-header-luxury {
          padding: 20px 16px;
          background: linear-gradient(180deg, rgba(48, 209, 88, 0.05) 0%, transparent 100%);
          border-radius: 24px;
          margin-bottom: 20px;
          border: 1px solid rgba(48, 209, 88, 0.1);
        }
        .pulse-headline {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
          color: var(--text);
        }
        .pulse-dot-green {
          width: 10px;
          height: 10px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 12px var(--accent-glow);
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .pulse-metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 480px) {
          .pulse-metrics-grid { grid-template-columns: 1fr 1fr; }
        }
        .pulse-metric-card {
          background: rgba(255,255,255,0.03);
          padding: 12px 16px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .pulse-metric-card.alert {
          border-color: rgba(255, 159, 10, 0.2);
          background: rgba(255, 159, 10, 0.03);
        }
        .pm-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-tertiary);
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .pm-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .text-accent { color: var(--accent); }
        .text-warm { color: var(--warm); }
      `}} />
    </div>
  )
}
