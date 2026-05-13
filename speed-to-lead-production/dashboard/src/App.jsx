import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import StatsRow from './components/StatsRow'
import LeadTable from './components/LeadTable'
import RightPanel from './components/RightPanel'
import LeadModal from './components/LeadModal'
import { fetchLeads, fetchInventory, fetchStats, qualifyLead, dismissLead } from './data/api'

const POLL_INTERVAL_MS = 8000 // refresh every 8 seconds

export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [selectedLead, setSelectedLead] = useState(null)

  // Live data state
  const [leads, setLeads] = useState([])
  const [inventory, setInventory] = useState([])
  const [stats, setStats] = useState({})
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [l, inv, s] = await Promise.all([fetchLeads(), fetchInventory(), fetchStats()])
      setLeads(l)
      setInventory(inv)
      setStats(s)
      setConnected(true)
      setLastUpdated(new Date())
    } catch {
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + polling
  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  const handleQualify = async (phone) => {
    await qualifyLead(phone)
    refresh()
  }

  const handleDismiss = async (phone) => {
    await dismissLead(phone)
    refresh()
  }

  return (
    <div className="layout">
      <Sidebar active={activeNav} onNav={setActiveNav} connected={connected} leads={leads} />
      <div className="main">
        <Topbar connected={connected} lastUpdated={lastUpdated} />
        <div className="content">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
              <div className="spinner" />
              <p style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Connecting to live backend…</p>
            </div>
          ) : (
            <>
              <StatsRow stats={stats} leads={leads} />
              <div className="dashboard-grid">
                <LeadTable leads={leads} onSelect={setSelectedLead} />
                <RightPanel leads={leads} inventory={inventory} />
              </div>
            </>
          )}
        </div>
      </div>
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onQualify={handleQualify}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  )
}
