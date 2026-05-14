import { useState, useEffect } from 'react'
import axios from 'axios'
import { getLeads } from './api'
import { useAuth } from './contexts/AuthContext'
import InventoryTab from './components/InventoryTab'
import LeadsTab from './components/LeadsTab'
import AgentOS from './components/AgentOS'
import ReconTab from './components/ReconTab'
import OnboardingWizard from './components/OnboardingWizard'
import Login from './components/Login'
import SettingsTab from './components/SettingsTab'
import SaaSStatusCard from './components/SaaSStatusCard'
import SubscriptionFlow from './components/SubscriptionFlow'

export default function App() {
  const { user, token, loading, logout } = useAuth()
  const [tab, setTab] = useState('leads')
  const [view, setView] = useState('dealer') // 'dealer' or 'recon'
  const [leadCount, setLeadCount] = useState(0)
  const [hotCount, setHotCount] = useState(0)
  const [systemOk, setSystemOk] = useState(true)
  const [onboardingStep, setOnboardingStep] = useState(0)

  // SaaS state overrides
  const isSubscribed = user?.subscription_status === 'active'
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  const [currentTime, setCurrentTime] = useState('9:41')
  const [faceIdStatus, setFaceIdStatus] = useState('Scanning...')
  const [payStatus, setPayStatus] = useState('idle')
  const [payLog, setPayLog] = useState('')

  const [swarmLogs, setSwarmLogs] = useState([
    `[Sentinel] Security shield active. SSL verified on port 5174.`,
    `[Recon Swarm] Scanning active UAE vehicle dealerships...`,
    `[Layla Core] Dynamic calculation engine fully online.`
  ])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'recon') setView('recon')
  }, [])

  useEffect(() => {
    if (view !== 'dealer' || !token) return
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
  }, [view, token])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      let hours = now.getHours()
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setCurrentTime(`${hours % 12 || 12}:${minutes}`)
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  const handleStripeCheckout = async () => {
    setPayStatus('processing')
    setPayLog('Contacting Stripe Secure Gateway...')
    try {
      const res = await axios.post(`${API_URL}/stripe/create-checkout-session`, {
        priceId: 'price_1R1p78InA8iR2Zp8q2p8q2p8'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setPayStatus('idle');
      alert(`Stripe Error: ${err.message}`);
    }
  }

  useEffect(() => {
    const potentialLogs = [
      `[Recon Swarm] Executing instant regional pricing assessment...`,
      `[Airtable CRM] Syncing lead Saeed Al-Maktoum...`,
      `[Layla Core] Incoming WhatsApp packet from +971 50 *** 1234`,
      `[Layla Core] Formulating objection handler...`
    ]
    const interval = setInterval(() => {
      const randomLog = potentialLogs[Math.floor(Math.random() * potentialLogs.length)]
      setSwarmLogs(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${randomLog}`])
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { id: 'inventory', icon: '🚗', label: 'Inventory' },
    { id: 'leads', icon: '📩', label: 'Leads', badge: hotCount || null },
    { id: 'agents', icon: '🤖', label: 'Agent OS' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  const handleSimulateFailoverLogs = (logs) => {
    setSwarmLogs(prev => [...prev, ...logs.map(l => `[${new Date().toLocaleTimeString()}] ${l}`)])
  }

  const renderAppContent = () => {
    if (!isSubscribed && view === 'dealer') {
      return (
        <div className="gate-locked-state">
          <div className="ios-statusbar-sim">
            <div className="status-time">{currentTime}</div>
            <div className="status-notch-gap"></div>
            <div className="status-icons"><span>📶</span><span>📶</span><div className="battery-sim">98% 🔋</div></div>
          </div>
          <div className="iap-sheet-overlay">
            {payStatus !== 'idle' ? (
              <SubscriptionFlow 
                status={payStatus} 
                onComplete={() => window.location.reload()} 
              />
            ) : (
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
                    <div className="benefit-text"><h4>Live Pulse Lead Feed</h4><p>Hot car buyers stream</p></div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">🤖</span>
                    <div className="benefit-text"><h4>Layla WhatsApp Closer Core</h4><p>Relentless AI sales closer</p></div>
                  </div>
                </div>
                <div className="iap-pricing">
                  <div className="price-tag">2950 AED <span className="price-period">/ month</span></div>
                </div>
                <div className="iap-footer">
                  <button className="btn-secure-pay" onClick={handleStripeCheckout}>
                    💳 SECURE PAY via Stripe
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="ios-swipe-indicator"></div>
        </div>
      )
    }

    return (
      <div className="ios-standalone-wrapper">
        <div className="ios-statusbar-sim">
          <div className="status-time">{currentTime}</div>
          <div className="status-notch-gap"></div>
          <div className="status-icons"><span>📶</span><span>📶</span><div className="battery-sim">98% 🔋</div></div>
        </div>

        <div className="dynamic-island" style={{ marginTop: '44px' }}>
          <div className="di-left">
            <div className="di-icon">⚡</div>
            <div>
              <div className="di-title">Speed To Lead</div>
              <div className="di-sub">
                {tab === 'leads' ? `${leadCount} leads · ${hotCount} hot` :
                 tab === 'agents' ? 'Agent Operating System' : 
                 tab === 'settings' ? 'Global Settings' : 'Inventory Manager'}
              </div>
            </div>
          </div>
          <div className="di-status">
            <div className={`di-dot ${systemOk ? '' : 'error'}`} />
            {systemOk ? 'Active' : 'Error'}
          </div>
        </div>

        <div className="page-content" style={{ paddingTop: '10px' }}>
          {view === 'dealer' && <SaaSStatusCard />}
          {tab === 'inventory' && <InventoryTab />}
          {tab === 'leads' && <LeadsTab />}
          {tab === 'agents' && <AgentOS onSimulateFailover={handleSimulateFailoverLogs} />}
          {tab === 'settings' && <SettingsTab />}
        </div>

        <nav className="tab-bar">
          {tabs.map(t => (
            <button key={t.id} className={`tab-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.icon}{t.badge ? <span className="tab-badge">{t.badge}</span> : null}</span>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="ios-swipe-indicator"></div>
      </div>
    )
  }

  if (loading) return <div className="faceid-overlay"><div className="pay-spinner"></div></div>
  if (!user) return <Login />

  return (
    <div className="dev-workspace-layout">
      <div className="device-simulator-shell">
        <div className="device-notch-physical"></div>
        <div className="device-screen-content">{renderAppContent()}</div>
      </div>
      <div className="swarm-terminal-panel">
        <div className="terminal-header">
          <span className="terminal-title">AI Nexlify™ Swarm Monitor</span>
          <button onClick={logout} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px', fontSize: '10px', padding: '2px 8px', cursor: 'pointer' }}>LOGOUT</button>
        </div>
        <div className="terminal-body" id="dev-terminal-body">
          {swarmLogs.map((log, i) => <div key={i} className="terminal-line"><span className="terminal-prompt">$</span> {log}</div>)}
        </div>
      </div>
    </div>
  )
}
