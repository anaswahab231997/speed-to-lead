require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder_key'
const supabase = createClient(supabaseUrl, supabaseKey)

// In-memory caches to maintain zero-latency
const inventoryCache = []
const leadsCache = new Map()

// ─── INVENTORY MODULE ────────────────────────────────────────────────────────

async function getAvailableInventory(dealerId = null) {
  if (inventoryCache.length > 0) return inventoryCache

  try {
    let query = supabase.from('inventory').select('*').eq('status', 'Available')
    if (dealerId) query = query.eq('dealer_id', dealerId)

    const { data, error } = await query
    if (error) throw error

    inventoryCache.length = 0 // Clear cache
    data.forEach(item => inventoryCache.push(item))
    return inventoryCache
  } catch (err) {
    console.error('[SUPABASE] Failed to fetch inventory:', err.message)
    return []
  }
}

async function getInventorySummaryForLayla(dealerId = null) {
  const cars = await getAvailableInventory(dealerId)
  if (!cars.length) return "No inventory currently available."
  return cars.map(c => `- ${c.name} (Specs: ${c.specs}) - Price: ${c.price}`).join('\n')
}

async function markCarUnavailable(recordId) {
  try {
    const { error } = await supabase
      .from('inventory')
      .update({ status: 'Sold' })
      .eq('item_id', recordId)
      
    if (error) throw error
    
    // Remove from local cache
    const idx = inventoryCache.findIndex(c => c.item_id === recordId)
    if (idx > -1) inventoryCache.splice(idx, 1)
      
    console.log(`[SUPABASE] Marked car unavailable: ${recordId}`)
  } catch (err) {
    console.error('[SUPABASE] Failed to mark car unavailable:', err.message)
  }
}

// ─── LEADS MODULE ────────────────────────────────────────────────────────────

async function getLeadByPhone(phone) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .single()
      
    if (error && error.code !== 'PGRST116') throw error // Ignore "not found" error
    return data
  } catch (err) {
    console.error('[SUPABASE] Failed to get lead by phone:', err.message)
    return null
  }
}

async function saveLead(data) {
  leadsCache.set(data.phone, { ...data, createdAt: new Date().toISOString(), status: 'active' })
  console.log(`[CRM] Saving lead to Supabase: ${data.phone}`)

  try {
    const existing = await getLeadByPhone(data.phone)
    if (existing) {
      return await updateLeadScore(data.phone, data)
    }

    const { data: record, error } = await supabase
      .from('leads')
      .insert([{
        phone: data.phone,
        name: data.name || 'Unknown',
        intent_score: data.intentScore || 0,
        status: data.status || 'New',
        car_interest: data.lastMessage || '',
        layla_reply: data.laylaReply || '',
        dealer: data.dealer || 'Nexlify',
        source: data.source || 'web',
        ai_active: data.aiActive !== false
      }])
      .select()
      .single()

    if (error) throw error
    console.log(`[SUPABASE] Lead saved successfully with phone: ${data.phone}`)
    return { id: record.id }
  } catch (err) {
    console.error('[SUPABASE CRITICAL] Save lead attempt failed:', err.message)
    return { id: data.phone }
  }
}

async function updateLeadScore(phone, data) {
  const existing = leadsCache.get(phone) || {}
  leadsCache.set(phone, { ...existing, ...data, updatedAt: new Date().toISOString() })
  
  const scoreLabel = data.intentScore >= 8 ? 'Hot' : data.intentScore >= 5 ? 'Warm' : 'Cold'

  try {
    const updatePayload = {
      car_interest: data.lastMessage || '',
      layla_reply: data.laylaReply || '',
      intent_score: data.intentScore || 0,
      status: 'New',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('phone', phone)

    if (error) throw error
    console.log(`[SUPABASE] Lead updated successfully: ${phone}`)
  } catch (err) {
    console.error('[SUPABASE] Failed to update lead:', err.message)
  }
}

async function getColdLeads(hoursThreshold = 24) {
  const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString()
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'active')
      .lt('last_activity', cutoff)
      
    if (error) throw error
    return data.map(lead => ({ id: lead.phone, fields: { Phone: lead.phone, Name: lead.name, 'Last Enquired Car': lead.car_interest } }))
  } catch (err) {
    console.error('[SUPABASE] getColdLeads failed:', err.message)
    return []
  }
}

async function markLeadFollowedUp(phone) {
  const existing = leadsCache.get(phone) || {}
  leadsCache.set(phone, { ...existing, status: 'followup-sent', lastActivity: new Date().toISOString() })
  
  try {
    await supabase.from('leads').update({ status: 'followup-sent', last_activity: new Date().toISOString() }).eq('phone', phone)
  } catch(e) {}
}

async function getBlueprintLeads(hoursThreshold = 48) {
  const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString()
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'Blueprint Downloaded')
      .lt('created_at', cutoff)
      
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('[SUPABASE] getBlueprintLeads failed:', err.message)
    return []
  }
}

async function markBlueprintRetargeted(phone) {
  try {
    await supabase.from('leads').update({ status: 'Blueprint Retargeted', last_activity: new Date().toISOString() }).eq('phone', phone)
  } catch(e) {
    console.error('[SUPABASE] markBlueprintRetargeted failed:', e.message)
  }
}

async function toggleLeadAiActive(phone, active) {
  try {
    const { error } = await supabase.from('leads').update({ ai_active: active !== false }).eq('phone', phone)
    if (error) throw error
    
    const existing = leadsCache.get(phone)
    if (existing) leadsCache.set(phone, { ...existing, aiActive: active !== false })
    
    return { success: true }
  } catch (err) {
    console.error('[SUPABASE] Failed to toggle AI active status:', err.message)
    return { success: false, error: err.message }
  }
}

async function assignLead(phone, agentName) {
  try {
    const { error } = await supabase.from('leads').update({ assigned_to: agentName }).eq('phone', phone)
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('[SUPABASE] Failed to assign lead:', err.message)
    return { success: false, error: err.message }
  }
}

// ─── SENTINEL & LOGGING ──────────────────────────────────────────────────────

async function logSystemHealth(payload) {
  try {
    await supabase.from('system_health').insert([{
      project: payload.project || 'Speed To Lead',
      dealer_id: payload.dealer_id || '',
      lead_id: payload.lead_id || '',
      status: payload.status || 'Fail',
      execution_time: Number(payload.execution_time) || 0,
      error_message: payload.error_message || '',
      last_module: payload.last_module || ''
    }])
  } catch (err) {
    console.error('[SENTINEL] Failed to log System Health:', err.message)
  }
}

async function logUrgentNotification(message) {
  try {
    await supabase.from('urgent_notifications').insert([{ message }])
  } catch (err) {
    console.error('[SENTINEL] Failed to log Urgent Notification:', err.message)
  }
}

async function logActivity(leadId, type, details) {
  try {
    await supabase.from('activity_log').insert([{
      lead_id: leadId,
      type,
      details
    }])
    return { success: true }
  } catch (err) {
    return { success: false }
  }
}

// ─── RECON SWARM ─────────────────────────────────────────────────────────────

async function saveDealerProspect(data) {
  try {
    await supabase.from('market_recon').insert([{
      dealer_name: data.name,
      website: data.website,
      score: data.score,
      whatsapp_working: data.hasWhatsApp,
      google_reviews: data.reviews,
      google_rating: data.rating,
      pagespeed_score: data.pageSpeedScore,
      social_active: data.socialActive,
      priority_tag: data.priorityTag
    }])
    console.log(`[RECON] Saved prospect to Supabase: ${data.name}`)
  } catch (err) {
    console.error('[RECON] Failed to save prospect:', err.message)
  }
}

module.exports = {
  leadsCache,
  getAvailableInventory,
  getInventorySummaryForLayla,
  markCarUnavailable,
  saveLead: saveLead,
  saveLeadToAirtable: saveLead, // Legacy alias so we don't break unchecked code
  getLeadByPhone,
  updateLeadScore,
  getColdLeads,
  markLeadFollowedUp,
  getBlueprintLeads,
  markBlueprintRetargeted,
  logSystemHealth,
  logUrgentNotification,
  saveDealerProspect,
  toggleLeadAiActive,
  assignLead,
  logActivity,
  supabase
}
