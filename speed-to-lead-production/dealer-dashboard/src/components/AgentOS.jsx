import { useState, useEffect } from 'react'
import { fetchAgentStatus } from '../api'

const AGENT_META = {
  'Lead Response Agent': { icon: '⚡', gradient: 'linear-gradient(135deg, #0a84ff, #5e5ce6)' },
  'Email Triage Agent': { icon: '📧', gradient: 'linear-gradient(135deg, #ff9f0a, #ff375f)' },
  'Dealer Outreach Agent': { icon: '🎯', gradient: 'linear-gradient(135deg, #30d158, #64d2ff)' },
  'System Health Monitor': { icon: '🛡️', gradient: 'linear-gradient(135deg, #bf5af2, #0a84ff)' },
  'Inventory Intelligence Agent': { icon: '📊', gradient: 'linear-gradient(135deg, #64d2ff, #30d158)' },
}

function getHeartbeatClass(status) {
  if (!status) return 'idle'
  if (status.includes('Running') || status.includes('🟢')) return 'live'
  if (status.includes('Error') || status.includes('🔴')) return 'error'
  return 'idle'
}

export default function AgentOS({ onSimulateFailover }) {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Resiliency Simulation States
  const [simState, setSimState] = useState(false)
  const [simProgress, setSimProgress] = useState('')
  const [simLogs, setSimLogs] = useState('')

  useEffect(() => {
    loadStatus()
    const int = setInterval(loadStatus, 5000)
    return () => clearInterval(int)
  }, [])

  async function loadStatus() {
    try {
      const data = await fetchAgentStatus()
      setAgents(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const triggerFailoverSimulation = () => {
    setSimState(true)
    setSimProgress('AiSensy: Primary Timeout Triggered...')
    setSimLogs('📡 dispatching primary lead payload to AiSensy...\n🕒 awaiting webhook response (limit: 2000ms)...')
    
    if (onSimulateFailover) {
      onSimulateFailover([
        `Stress Test Initialized: Simulating timeout on AiSensy route.`,
        `[System Health] AiSensy primary route ping: 2014ms (Timeout: 2000ms).`
      ])
    }

    setTimeout(() => {
      setSimProgress('🚨 AUTO-RELAY EVENT ACTIVATED')
      setSimLogs(prev => prev + '\n❌ timeout exceeded (2014ms)! primary route dead.\n🛰️ routing failover to Make.com backup line...')
      
      if (onSimulateFailover) {
        onSimulateFailover([
          `[Auto-Relay] Primary timeout exceeded! Activating automatic failover.`,
          `[System Health] Relaying lead packets to Make.com backup line...`
        ])
      }
      
      setTimeout(() => {
        setSimProgress('🚀 Failover Dispatch Complete')
        setSimLogs(prev => prev + '\n\n📥 [Make.com 8-Field Schema Payload Received]:\n' + JSON.stringify({
          lead_id: "recSaeed971",
          phone: "+971505551234",
          name: "Saeed Al-Maktoum",
          carInterest: "2022 Nissan Patrol V8 SE",
          agent_name: "Layla",
          dealer_name: "Al Aram Used Cars",
          source: "layla-ai",
          status: "Auto-Relay: Success"
        }, null, 2) + '\n\n[Scheduler] Check lead status: سعید المکتوم (> 24h old).\n⚠️ Bypassing 24h Window: Using Utility_Greeting Template for Saeed Al-Maktoum.')
        
        if (onSimulateFailover) {
          onSimulateFailover([
            `[Make.com Schema] Dispatched 8-field schema payload successfully.`,
            `[Scheduler] Checked lead: Saeed Al-Maktoum (> 24h old).`,
            `[Scheduler] Bypassing 24h Window: Using Utility_Greeting Template for Saeed Al-Maktoum.`
          ])
        }
      }, 1200)
    }, 1500)
  }

  const liveCount = agents.filter(a => getHeartbeatClass(a.status) === 'live').length

  if (loading) return <div className="spinner" />

  return (
    <div>
      {/* System Summary */}
      <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{liveCount}</div>
          <div className="stat-label">Agents Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{agents.length}</div>
          <div className="stat-label">Total Deployed</div>
        </div>
      </div>

      {/* Resiliency & System Health Telemetry Panel */}
      <div className="section-label">🛰️ System Health & Webhook Telemetry</div>
      <div className="glass" style={{
        padding: '18px 20px',
        border: '1px solid rgba(48, 209, 88, 0.25)',
        background: 'linear-gradient(135deg, rgba(48, 209, 88, 0.08), rgba(28, 28, 30, 0.95))',
        borderRadius: 'var(--radius)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Meta Webhook (Port 3001)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <div className="aw-hb-dot live" style={{ width: '8px', height: '8px', background: 'var(--success)' }} />
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>Nominal</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Make.com Backup Line
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <div className="aw-hb-dot" style={{ width: '8px', height: '8px', background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)' }} />
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--teal)' }}>Failover Ready</span>
            </div>
          </div>
        </div>

        {/* Dynamic Simulation Sandbox */}
        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: '14px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Resiliency Sandbox
            </span>
            <span style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-tertiary)' }}>
              Aitb-v4.6 Failover
            </span>
          </div>

          {!simState ? (
            <button 
              onClick={triggerFailoverSimulation}
              className="btn btn-success" 
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.75rem',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(48, 209, 88, 0.25)',
                border: 'none',
                color: '#fff',
                background: 'var(--success)'
              }}
            >
              ⚡ Trigger 2s Primary Timeout Stress Test
            </button>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--warm)' }}>
                  {simProgress}
                </span>
                <span className="scanning-pulse" style={{ fontSize: '0.68rem', color: simProgress.includes('Complete') ? 'var(--success)' : 'var(--warm)' }}>
                  ● Live Action
                </span>
              </div>
              
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.62rem', 
                color: '#30d158', 
                background: '#050505', 
                padding: '10px', 
                borderRadius: '8px', 
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                maxHeight: '120px',
                lineHeight: '1.3'
              }}>
                {simLogs}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="section-label">🤖 Agent Widgets</div>

      {/* 2x2 iOS Home Screen Widget Grid */}
      <div className="widget-grid">
        {agents.map(a => {
          const meta = AGENT_META[a.id] || { icon: '🔧', gradient: 'linear-gradient(135deg, #636366, #48484a)' }
          const hbClass = getHeartbeatClass(a.status)

          return (
            <div key={a.id} className="agent-widget" style={{ '--widget-gradient': meta.gradient }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: meta.gradient, opacity: 0.7 }} />
              <div className="aw-header">
                <span className="aw-icon">{meta.icon}</span>
                <div className="aw-heartbeat">
                  <div className={`aw-hb-dot ${hbClass}`} />
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 600,
                    color: hbClass === 'live' ? 'var(--success)' : hbClass === 'error' ? 'var(--hot)' : 'var(--warm)'
                  }}>
                    {hbClass === 'live' ? 'Live' : hbClass === 'error' ? 'Error' : 'Idle'}
                  </span>
                </div>
              </div>
              <div className="aw-name">{a.id.replace(' Agent', '')}</div>
              <div className="aw-task">{a.lastResult || 'Waiting to start'}</div>
              <div className="aw-schedule">⏱ {a.nextRun || '—'}</div>
            </div>
          )
        })}
      </div>

      {/* Subscription & Billing Section */}
      <div className="section-label" style={{ marginTop: '24px' }}>💳 Subscription & Billing</div>
      
      <div className="glass" style={{
        padding: '18px 20px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(28, 28, 30, 0.95))',
        borderRadius: 'var(--radius)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Nexlify Enterprise OS
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="aw-hb-dot live" style={{ width: '6px', height: '6px' }} /> Plan Status: Live & Verified
            </div>
          </div>
          <div style={{ background: 'rgba(48,209,88,0.15)', color: 'var(--success)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700 }}>
            Active
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', borderTop: '0.5px solid var(--border)', paddingTop: '14px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Monthly Subscription
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              AED 2950 / monthly
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Next Cycle: June 8, 2026
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-xs)', border: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1rem' }}>🔒</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              CRM Persistence: <strong>Active</strong> (Table <code>tbly7iJArFklrO8yd</code>)
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>v4.6 Enterprise</span>
        </div>
      </div>
    </div>
  )
}
