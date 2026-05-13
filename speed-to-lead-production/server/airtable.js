require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const Airtable = require('airtable')

const isTestEnv = process.env.NODE_ENV === 'test' || 
                  global.__IS_TEST_ENV__ || 
                  (process.argv[1] && (process.argv[1].includes('test_') || process.argv[1].includes('scratch_')));

const baseId = isTestEnv 
  ? (process.env.AIRTABLE_TEST_BASE_ID || process.env.AIRTABLE_BASE_ID)
  : process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseId);

if (isTestEnv) {
  console.log(`📡 [AIRTABLE] 🧪 TEST ENVIRONMENT ACTIVE. Routing queries to Base ID: ${baseId}`);
}

const INVENTORY_TABLE = process.env.AIRTABLE_TABLE_ID
const SYSTEM_HEALTH_TABLE = 'System Health' // Or the actual ID if we have it, name works too
const URGENT_NOTIFICATIONS_TABLE = 'Urgent Notifications'
const MARKET_RECON_TABLE = 'Market_Recon'

// Shared leads store — exported so API routes can read it directly
const leadsCache = new Map() // phone → lead object

// ─── Inventory (read from existing Airtable schema) ──────────────────────────
async function getAvailableInventory() {
  try {
    const records = await base(INVENTORY_TABLE).select({
      filterByFormula: `{Available} = TRUE()`,
    }).all()

    return records.map(r => ({
      id: r.id,
      name: r.fields['Car Name'],
      make: r.fields['Make'],
      model: r.fields['Model'],
      year: r.fields['Year'],
      colour: r.fields['Colour'],
      price: r.fields['Price AED'],
      mileage: r.fields['Mileage KM'],
      condition: r.fields['Condition'],
      description: r.fields['Description'],
      bodyType: r.fields['Body Type'],
      dealer: r.fields['Dealer'],
      available: true,
    }))
  } catch (err) {
    console.error('[AIRTABLE] Inventory fetch error:', err.message)
    return []
  }
}

async function getInventorySummaryForLayla() {
  const cars = await getAvailableInventory()
  if (cars.length === 0) return 'No cars currently available in inventory.'
  return cars.map(c =>
    `- ${c.name} (${c.colour}) | AED ${c.price.toLocaleString()} | ${c.mileage.toLocaleString()}km | Condition: ${c.condition} | ${c.description}`
  ).join('\n')
}

async function markCarUnavailable(carId) {
  try {
    await base(INVENTORY_TABLE).update(carId, { Available: false })
    console.log(`[AIRTABLE] Car ${carId} marked as unavailable`)
  } catch (err) {
    console.error('[AIRTABLE] Mark unavailable error:', err.message)
  }
}

// ─── Leads (in-memory CRM — shared singleton above) ───────────────────────

const LEADS_TABLE = 'tbly7iJArFklrO8yd'

async function getLeadByPhone(phone) {
  try {
    const records = await base(LEADS_TABLE).select({
      filterByFormula: `{Phone} = '${phone}'`,
      maxRecords: 1
    }).all()
    if (records.length > 0) {
      const r = records[0]
      return {
        id: r.id,
        name: r.fields['Name'] || 'Unknown',
        phone: r.fields['Phone'] || '',
        carInterest: r.fields['Car Interest'] || '',
        laylaReply: r.fields['AI Reasoning'] || '',
        score: r.fields[' Lead Score'] || r.fields['Lead Score'] || 'Cold',
        status: r.fields[' Status'] || r.fields['Status'] || 'New',
        source: r.fields['Source'] || '',
        dealer: r.fields['Dealer '] || r.fields['Dealer'] || '',
        submittedAt: r.fields['Submitted At'] || '',
      }
    }
  } catch (err) {
    console.error('[AIRTABLE] Error fetching lead by phone:', err.message)
  }
  return leadsCache.get(phone) || null
}

async function saveLeadToAirtable(data) {
  leadsCache.set(data.phone, { ...data, createdAt: new Date().toISOString() })
  console.log(`[CRM] Saving lead to Airtable: ${data.phone}`)

  const scoreLabel = data.intentScore >= 8 ? 'Hot' : data.intentScore >= 5 ? 'Warm' : 'Cold'

  try {
    const record = await base(LEADS_TABLE).create({
      'Name': data.name || 'Unknown Buyer',
      'Phone': data.phone,
      'Car Interest': data.lastMessage || '',
      'AI Reasoning': data.laylaReply || '',
      ' Lead Score': scoreLabel,
      ' Status': 'New',
      'Source': data.source || 'layla-ai',
      'Dealer ': data.dealer || 'Elite Cars UAE',
      'Submitted At': new Date().toISOString()
    })
    console.log(`[AIRTABLE] Lead saved successfully to Airtable with ID: ${record.id}`)
    return { id: record.id }
  } catch (err) {
    console.error('[AIRTABLE] Failed to save lead to Airtable:', err.message)
    try {
      const { handlePulsePayload } = require('./sentinel')
      await handlePulsePayload({
        project: 'Speed To Lead CRM',
        status: 'Fail',
        error_message: `Airtable Write Failed (Connection Drop): ${err.message}`,
        lead_id: data.phone || 'UNKNOWN',
        execution_time: 0,
        last_module: 'Airtable Save Lead'
      })
    } catch (sentinelErr) {
      console.error('[SENTINEL] Failed to spawn sentinel on write error:', sentinelErr.message)
    }
    return { id: data.phone }
  }
}

async function updateLeadScore(recordId, data) {
  const existing = leadsCache.get(recordId) || {}
  leadsCache.set(recordId, { ...existing, ...data, updatedAt: new Date().toISOString() })
  console.log(`[CRM] Updating lead in Airtable: ${recordId}`)

  const scoreLabel = data.intentScore >= 8 ? 'Hot' : data.intentScore >= 5 ? 'Warm' : 'Cold'

  try {
    let airtableRecordId = recordId
    if (recordId.startsWith('+')) {
      const existingRecord = await getLeadByPhone(recordId)
      if (existingRecord && existingRecord.id) {
        airtableRecordId = existingRecord.id
      } else {
        return await saveLeadToAirtable(data)
      }
    }

    await base(LEADS_TABLE).update(airtableRecordId, {
      'Car Interest': data.lastMessage || '',
      'AI Reasoning': data.laylaReply || '',
      ' Lead Score': scoreLabel,
      ' Status': 'New',
      'Submitted At': new Date().toISOString()
    })
    console.log(`[AIRTABLE] Lead updated successfully in Airtable: ${airtableRecordId}`)
  } catch (err) {
    console.error('[AIRTABLE] Failed to update lead in Airtable:', err.message)
    try {
      const { handlePulsePayload } = require('./sentinel')
      await handlePulsePayload({
        project: 'Speed To Lead CRM',
        status: 'Fail',
        error_message: `Airtable Update Failed (Connection Drop): ${err.message}`,
        lead_id: recordId || 'UNKNOWN',
        execution_time: 0,
        last_module: 'Airtable Update Lead'
      })
    } catch (sentinelErr) {
      console.error('[SENTINEL] Failed to spawn sentinel on update error:', sentinelErr.message)
    }
  }
}

async function getColdLeads(hoursThreshold = 24) {
  const cutoff = Date.now() - hoursThreshold * 60 * 60 * 1000
  const cold = []
  for (const [phone, lead] of leadsCache.entries()) {
    const lastActivity = new Date(lead.lastActivity || lead.createdAt).getTime()
    if (lead.status === 'active' && lastActivity < cutoff) {
      cold.push({ id: phone, fields: { Phone: phone, Name: lead.name || 'there', 'Last Enquired Car': lead.lastCar || '' } })
    }
  }
  return cold
}

async function markLeadFollowedUp(recordId) {
  const existing = leadsCache.get(recordId) || {}
  leadsCache.set(recordId, { ...existing, status: 'followup-sent', lastActivity: new Date().toISOString() })
}

// ─── Sentinel System Health ────────────────────────────────────────────────
async function logSystemHealth(payload) {
  try {
    await base(SYSTEM_HEALTH_TABLE).create({
      'Project': payload.project || 'Speed To Lead',
      'Dealer ID': payload.dealer_id || '',
      'Lead ID': payload.lead_id || '',
      'Status': payload.status || 'Fail',
      'Execution Time': Number(payload.execution_time) || 0,
      'Error Message': payload.error_message || '',
      'Last Module': payload.last_module || '',
      'Timestamp': new Date().toISOString()
    })
    console.log(`[SENTINEL] Logged ${payload.status} to System Health`)
  } catch (err) {
    console.error('[SENTINEL] Failed to log System Health:', err.message)
  }
}

async function logUrgentNotification(message) {
  try {
    await base(URGENT_NOTIFICATIONS_TABLE).create({
      'Message': message,
      'Timestamp': new Date().toISOString()
    })
    console.log(`[SENTINEL] Alert logged to Urgent Notifications Airtable`)
  } catch (err) {
    console.error('[SENTINEL] Failed to log Urgent Notification:', err.message)
  }
}

// ─── Recon Swarm (Market Prospecting) ────────────────────────────────────────
async function saveDealerProspect(data) {
  try {
    await base(MARKET_RECON_TABLE).create({
      'Dealer Name': data.name,
      'Website': data.website,
      'Score': data.score,
      'WhatsApp Working': data.hasWhatsApp,
      'Google Reviews': data.reviews,
      'Google Rating': data.rating,
      'PageSpeed Score': data.pageSpeedScore,
      'Social Active': data.socialActive,
      'Priority Tag': data.priorityTag
    })
    console.log(`[RECON] Saved prospect to Airtable: ${data.name} | Score: ${data.score}`)
  } catch (err) {
    console.error('[RECON] Failed to save prospect to Airtable:', err.message)
  }
}

module.exports = {
  leadsCache,
  getAvailableInventory,
  getInventorySummaryForLayla,
  markCarUnavailable,
  saveLeadToAirtable,
  getLeadByPhone,
  updateLeadScore,
  getColdLeads,
  markLeadFollowedUp,
  logSystemHealth,
  logUrgentNotification,
  saveDealerProspect,
}
