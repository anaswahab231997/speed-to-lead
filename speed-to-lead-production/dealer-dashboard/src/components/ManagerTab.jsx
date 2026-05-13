import { useState, useEffect } from 'react'
import { fetchAgentStatus } from '../api'

export default function ManagerTab() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatus()
    const int = setInterval(loadStatus, 5000)
    return () => clearInterval(int)
  }, [])

  async function loadStatus() {
    try {
      const data = await fetchAgentStatus()
      setAgents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="card">Loading Manager View...</div>

  return (
    <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
        Antigravity Manager View
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {agents.map(a => (
          <div key={a.id} style={{ 
            background: '#1e293b', 
            borderRadius: 8, 
            padding: '1rem', 
            border: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: '#f8fafc' }}>{a.id}</h3>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                <div>Next Run: {a.nextRun}</div>
                <div>Last Result: {a.lastResult}</div>
              </div>
            </div>
            <div style={{ 
              background: a.status.includes('Error') ? '#ef444420' : (a.status.includes('Running') ? '#10b98120' : '#f59e0b20'),
              color: a.status.includes('Error') ? '#ef4444' : (a.status.includes('Running') ? '#10b981' : '#f59e0b'),
              padding: '0.5rem 1rem',
              borderRadius: 20,
              fontWeight: 600,
              fontSize: '0.9rem',
              whiteSpace: 'nowrap'
            }}>
              {a.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
