// All data comes from the live backend server.
// This file replaces mockData.js — no static data here.

export const API_BASE = 'http://localhost:3001/api'

export async function fetchLeads() {
  const res = await fetch(`${API_BASE}/leads`)
  const json = await res.json()
  return json.success ? json.data : []
}

export async function fetchInventory() {
  const res = await fetch(`${API_BASE}/inventory`)
  const json = await res.json()
  return json.success ? json.data : []
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`)
  const json = await res.json()
  return json.success ? json.data : {}
}

export async function qualifyLead(phone) {
  await fetch(`${API_BASE}/leads/${encodeURIComponent(phone)}/qualify`, { method: 'POST' })
}

export async function dismissLead(phone) {
  await fetch(`${API_BASE}/leads/${encodeURIComponent(phone)}/dismiss`, { method: 'POST' })
}
