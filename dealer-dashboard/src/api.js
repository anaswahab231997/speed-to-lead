export const API = (import.meta.env.VITE_API_URL) || `http://${window.location.hostname}:3001/api`


async function call(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  return res.json()
}

// Inventory
export const getInventory   = () => call('/inventory')
export const addCar         = (data) => call('/inventory', { method: 'POST', body: data })
export const updateCar      = (id, data) => call(`/inventory/${id}`, { method: 'PATCH', body: data })
export const markSold       = (id) => call(`/inventory/${id}`, { method: 'DELETE' })

// Leads
export const getLeads       = () => call('/leads')
export const updateLeadStatus = (id, status) => call(`/leads/${id}`, { method: 'PATCH', body: { status } })
export const getReconDealers = () => call('/recon-dealers')

// Agents
export const fetchAgentStatus = () => call('/agents/status').then(r => r.success ? r.data : [])

