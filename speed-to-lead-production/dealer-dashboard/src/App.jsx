import { useState, useEffect } from 'react'
import { getLeads } from './api'
import InventoryTab from './components/InventoryTab'
import LeadsTab from './components/LeadsTab'
import AgentOS from './components/AgentOS'
import ReconTab from './components/ReconTab'
import OnboardingWizard from './components/OnboardingWizard'

export default function App() {
  const [tab, setTab] = useState('leads')
  const [view, setView] = useState('dealer') // 'dealer' or 'recon'
  const [leadCount, setLeadCount] = useState(0)
  const [hotCount, setHotCount] = useState(0)
  const [systemOk, setSystemOk] = useState(true)
  const [onboardingStep, setOnboardingStep] = useState(0)

  // iOS-specific simulation states
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(() => localStorage.getItem('stl_subscribed') === 'true')
  const [currentTime, setCurrentTime] = useState('9:41')
  const [faceIdStatus, setFaceIdStatus] = useState('Scanning...') // 'Scanning...', 'Verified', or 'Error'
  const [payStatus, setPayStatus] = useState('idle') // 'idle', 'processing', 'success'
  const [payLog, setPayLog] = useState('')

  // Swarm Real-Time Logs state
  const [swarmLogs, setSwarmLogs] = useState([
    `[Sentinel] Security shield active. SSL verified on port 5174.`,
    `[Recon Swarm] Scanning active UAE vehicle dealerships...`,
    `[Layla Core] Dynamic calculation engine fully online.`
  ])

  // Check query params for secret views and subscription resets
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === 'true') {
      localStorage.removeItem('stl_subscribed')
      setIsSubscribed(false)
      setIsUnlocked(false)
      setFaceIdStatus('Scanning...')
      setPayStatus('idle')
    }
    if (params.get('view') === 'recon') {
      setView('recon')
    } else {
      setView('dealer')
    }
  }, [])

  // Poll leads for active counters
  useEffect(() => {
    if (view !== 'dealer') return
    const poll = async () => {
      try {
        const res = await getLeads()
        if (res.success) {
          setLeadCount(res.data.length)
          setHotCount(res.data.filter(l => l.score?.trim() === 'Hot').length)
        }
        setSystemOk(true)
      } catch { setSystemOk(false) }
    }
    poll()
    const t = setInterval(poll, 15000)
    return () => clearInterval(t)
  }, [view])

  // Clock tick for iOS Status Bar
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      let hours = now.getHours()
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12 || 12
      setCurrentTime(`${hours}:${minutes}`)
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  // FaceID Unlock Simulator on mount (Satisfies interactive scanning for 2s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFaceIdStatus('Verified')
      const unlockTimer = setTimeout(() => {
        setIsUnlocked(true)
      }, 600)
      return () => clearTimeout(unlockTimer)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Stripe Pay Handler (1-second high-end process state)
  const handleStripeCheckout = () => {
    setPayStatus('processing')
    setPayLog('Stripe Gateway: Authorizing 2950 AED/month...')
    
    setTimeout(() => {
      setPayLog('Stripe Shield: Cryptographic transaction signed.')
      setTimeout(() => {
        setPayStatus('success')
        setTimeout(() => {
          setOnboardingStep(1)
        }, 1200)
      }, 500)
    }, 500)
  }

  // Swarm Real-Time Logs simulator
  useEffect(() => {
    const potentialLogs = [
      `[Recon Swarm] Executing instant regional pricing assessment for trade-ins...`,
      `[Calculators] Honest Leak Equation: Calculated AED 195,000 monthly bleed.`,
      `[Airtable CRM] Syncing lead Saeed Al-Maktoum: Status -> Qualified.`,
      `[Sentinel] Traffic validation packet approved via Cloudflare WAF.`,
      `[Layla Core] Incoming WhatsApp packet from Saeed Al-Maktoum (+971 50 *** 1234)`,
      `[Layla Core] Formulating objection handler for Saeed's Patrol V8 request...`,
      `[Layla Core] Incoming trade-in request from Fatima Al-Suwaidi.`,
      `[Calculators] Macan valuation compiled: AED 195,000 - 215,000 baseline.`,
      `[Layla Core] Booking inspection slot for Fatima Al-Suwaidi at 2:00 PM.`,
      `[Layla Core] Addressing John Davis expat bank finance loan objections...`,
      `[Layla Core] Structuring ENBD flat 2.99% fixed loan rate package parameters.`,
      `[Airtable CRM] CRM sync completed for John Davis: Status -> Deal Secured.`,
      `[Layla Core] Autonomous WhatsApp closer monitoring active webhooks.`
    ]

    const interval = setInterval(() => {
      const randomLog = potentialLogs[Math.floor(Math.random() * potentialLogs.length)]
      const timestamp = new Date().toLocaleTimeString()
      setSwarmLogs(prev => [...prev.slice(-15), `[${timestamp}] ${randomLog}`])
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll dev terminal
  useEffect(() => {
    const el = document.getElementById('dev-terminal-body')
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [swarmLogs])

  const tabs = [
    { id: 'inventory', icon: '🚗', label: 'Inventory' },
    { id: 'leads', icon: '📩', label: 'Leads', badge: hotCount || null },
    { id: 'agents', icon: '🤖', label: 'Agent OS' },
  ]

  const handleSimulateFailoverLogs = (logsArray) => {
    setSwarmLogs(prev => [...prev, ...logsArray.map(log => {
      const timestamp = new Date().toLocaleTimeString()
      return `[${timestamp}] ${log}`
    })])
  }

  // Render individual state content
  const renderAppContent = () => {
    if (window.location.pathname === '/setup' || window.location.search.includes('view=setup')) {
      return (
        <OnboardingWizard 
          onComplete={(provisionedPhone) => {
            localStorage.setItem('stl_subscribed', 'true')
            localStorage.setItem('stl_provisioned_phone', provisionedPhone)
            setIsSubscribed(true)
            setOnboardingStep(0)
            setIsUnlocked(true)
            window.location.href = '/'
          }}
        />
      )
    }

    if (!isUnlocked) {
      return (
        <div className="faceid-overlay">
          {/* iOS Top Status Bar */}
          <div className="ios-statusbar-sim">
            <div className="status-time">{currentTime}</div>
            <div className="status-notch-gap"></div>
            <div className="status-icons">
              <span>📶</span>
              <span>📶</span>
              <div className="battery-sim">98% 🔋</div>
            </div>
          </div>

          <div className="faceid-container">
            <div className="faceid-logo">⚡</div>
            <h1 className="faceid-title">SPEED TO LEAD™</h1>
            <p className="faceid-subtitle">AI SHOWROOM COMMAND CENTRE</p>

            <div className={`faceid-scanner-box ${faceIdStatus === 'Verified' ? 'verified' : ''}`}>
              {faceIdStatus === 'Scanning...' ? (
                <svg className="faceid-svg" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" className="scanner-circle" />
                  <path d="M30,40 Q50,20 70,40 T30,60" className="scanner-face-mesh" />
                  <rect x="25" y="48" width="50" height="4" className="scanner-laser" />
                </svg>
              ) : (
                <div className="faceid-checkmark">✓</div>
              )}
            </div>
            
            <div className="faceid-status-text">
              {faceIdStatus === 'Scanning...' ? (
                <span className="scanning-pulse">🔒 FaceID Biometrics Active...</span>
              ) : (
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>🔓 Showroom Decrypted</span>
              )}
            </div>

            {/* Premium Manual Decrypt Action */}
            <button className="btn-manual-decrypt" onClick={() => setIsUnlocked(true)}>
              🔓 MANUAL BYPASS / DECRYPT SHOWROOM
            </button>
          </div>

          {/* Home Swipe Indicator */}
          <div className="ios-swipe-indicator"></div>
        </div>
      )
    }

    if (!isSubscribed && view === 'dealer') {
      if (onboardingStep > 0) {
        return (
          <OnboardingWizard 
            onComplete={(provisionedPhone) => {
              localStorage.setItem('stl_subscribed', 'true')
              localStorage.setItem('stl_provisioned_phone', provisionedPhone)
              setIsSubscribed(true)
              setOnboardingStep(0)
            }}
          />
        )
      }
      return (
        <div className="gate-locked-state">
          {/* Fake blurred background dashboard */}
          <div className="fake-dashboard-blur" style={{ filter: 'blur(10px)', opacity: 0.25 }}>
            <div className="dynamic-island" style={{ marginTop: '44px' }}>
              <div className="di-left">
                <div className="di-icon">⚡</div>
                <div className="di-title">Speed To Lead</div>
              </div>
              <div className="di-status">Locked</div>
            </div>
            <div className="page-content" style={{ pointerEvents: 'none' }}>
              <div className="stat-grid">
                <div className="stat-card"><div className="stat-value">—</div></div>
                <div className="stat-card"><div className="stat-value">—</div></div>
                <div className="stat-card"><div className="stat-value">—</div></div>
              </div>
              <div className="section-label">📩 Live Feed</div>
              <div className="notif-card"><div className="notif-title">Porsche Center Dubai</div></div>
            </div>
          </div>

          {/* iOS-Style Top Status Bar */}
          <div className="ios-statusbar-sim">
            <div className="status-time">{currentTime}</div>
            <div className="status-notch-gap"></div>
            <div className="status-icons">
              <span>📶</span>
              <span>📶</span>
              <div className="battery-sim">98% 🔋</div>
            </div>
          </div>

          {/* Sliding Premium Sub Sheet (Action Sheet style) */}
          <div className="iap-sheet-overlay">
            <div className="iap-sheet">
              <div className="modal-handle"></div>
              <div className="iap-header">
                <div className="iap-lock-badge">🔒 Premium Access Required</div>
                <h2 className="iap-title">Activate Speed to Lead™</h2>
                <p className="iap-subtitle">Launch your 4-Second AI Showroom agent pipeline</p>
              </div>

              <div className="iap-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">🔥</span>
                  <div className="benefit-text">
                    <h4>Live Pulse Lead Feed</h4>
                    <p>Consolidated thumb-navigable vertical stream of hot car buyers</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🤖</span>
                  <div className="benefit-text">
                    <h4>Layla WhatsApp Closer Core</h4>
                    <p>Relentless AI sales closer pre-trained on UAE catalogs and rates</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📊</span>
                  <div className="benefit-text">
                    <h4>Unified Global State Engine</h4>
                    <p>Instant, zero-latency Airtable cloud CRM synchronization</p>
                  </div>
                </div>
              </div>

              <div className="iap-pricing">
                <div className="price-tag">2950 AED <span className="price-period">/ month</span></div>
                <p className="price-desc">All taxes included. Cancel or pause your CRM licensing anytime.</p>
              </div>

              <div className="iap-footer">
                {payStatus === 'idle' && (
                  <button className="btn-secure-pay" onClick={handleStripeCheckout}>
                    <span>💳 SECURE PAY via Stripe Node</span>
                    <span className="pay-arrow">→</span>
                  </button>
                )}

                {payStatus === 'processing' && (
                  <div className="pay-processing-box">
                    <div className="pay-spinner"></div>
                    <div className="pay-log-text">{payLog}</div>
                  </div>
                )}

                {payStatus === 'success' && (
                  <div className="pay-success-box">
                    <div className="pay-success-checkmark">✓</div>
                    <div className="pay-success-title">Payment Securely Dispatched!</div>
                    <div className="pay-success-desc">Activating Showroom Licenses & Feeds...</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Home Swipe Indicator */}
          <div className="ios-swipe-indicator"></div>
        </div>
      )
    }

    if (view === 'recon') {
      return (
        <div className="ios-standalone-wrapper">
          {/* iOS Top Status Bar */}
          <div className="ios-statusbar-sim">
            <div className="status-time">{currentTime}</div>
            <div className="status-notch-gap"></div>
            <div className="status-icons">
              <span>📶</span>
              <span>📶</span>
              <div className="battery-sim">98% 🔋</div>
            </div>
          </div>

          {/* Recon Secret Mode Header */}
          <div className="dynamic-island" style={{ border: '1px solid rgba(10, 132, 255, 0.4)', background: 'rgba(10, 132, 255, 0.08)', marginTop: '44px' }}>
            <div className="di-left">
              <div className="di-icon" style={{ background: 'linear-gradient(135deg, var(--accent), var(--teal))' }}>🛰️</div>
              <div>
                <div className="di-title" style={{ color: 'var(--teal)' }}>Nexlify Admin Mode</div>
                <div className="di-sub">Recon Swarm Intelligence Matrix</div>
              </div>
            </div>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/')
                setView('dealer')
              }}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                color: '#ffffff',
                padding: '6px 14px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              ← Exit
            </button>
          </div>

          <div className="page-content" style={{ marginTop: '10px' }}>
            <ReconTab />
          </div>

          {/* Home Swipe Indicator */}
          <div className="ios-swipe-indicator"></div>
        </div>
      )
    }

    return (
      <div className="ios-standalone-wrapper">
        {/* iOS Top Status Bar */}
        <div className="ios-statusbar-sim">
          <div className="status-time">{currentTime}</div>
          <div className="status-notch-gap"></div>
          <div className="status-icons">
            <span>📶</span>
            <span>📶</span>
            <div className="battery-sim">98% 🔋</div>
          </div>
        </div>

        {/* Dynamic Island Header */}
        <div className="dynamic-island" style={{ marginTop: '44px' }}>
          <div className="di-left">
            <div className="di-icon">⚡</div>
            <div>
              <div className="di-title">Speed To Lead</div>
              <div className="di-sub">
                {tab === 'leads' ? `${leadCount} leads · ${hotCount} hot` :
                 tab === 'agents' ? 'Agent Operating System' : 'Inventory Manager'}
              </div>
            </div>
          </div>
          <div className="di-status">
            <div className={`di-dot ${systemOk ? '' : 'error'}`}
                 style={!systemOk ? { background: 'var(--hot)', boxShadow: '0 0 8px var(--hot-glow)' } : {}} />
            {systemOk ? 'Active' : 'Error'}
          </div>
        </div>

        {/* Content */}
        <div className="page-content" style={{ paddingTop: '10px' }}>
          {tab === 'inventory' && <InventoryTab />}
          {tab === 'leads' && <LeadsTab />}
          {tab === 'agents' && <AgentOS onSimulateFailover={handleSimulateFailoverLogs} />}
        </div>

        {/* iOS Bottom Tab Bar */}
        <nav className="tab-bar">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="tab-icon">
                {t.icon}
                {t.badge ? <span className="tab-badge">{t.badge}</span> : null}
              </span>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Home Swipe Indicator */}
        <div className="ios-swipe-indicator"></div>
      </div>
    )
  }

  return (
    <div className="dev-workspace-layout">
      {/* Centered Desktop Simulator Shell wrapper */}
      <div className="device-simulator-shell">
        <div className="device-notch-physical"></div>
        <div className="device-screen-content">
          {renderAppContent()}
        </div>
      </div>

      {/* DevOps Debug Swarm live log panel */}
      <div className="swarm-terminal-panel">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <span className="terminal-title">AI Nexlify™ Swarm Monitor (Port :5174)</span>
          <span className="terminal-badge">LIVE RE-LOAD</span>
        </div>
        <div className="terminal-body" id="dev-terminal-body">
          {swarmLogs.map((log, i) => (
            <div key={i} className="terminal-line">
              <span className="terminal-prompt">$</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
