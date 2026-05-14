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

const INVENTORY_TABLE = (process.env.AIRTABLE_TABLE_ID && process.env.AIRTABLE_TABLE_ID !== 'undefined') ? process.env.AIRTABLE_TABLE_ID : 'tblhrMiIjvR7OndME'
const SYSTEM_HEALTH_TABLE = 'System Health'
const URGENT_NOTIFICATIONS_TABLE = 'Urgent Notifications'
const MARKET_RECON_TABLE = 'Market_Recon'

// Shared leads store — exported so API routes can read it directly
const leadsCache = new Map() // phone → lead object

// ─── Inventory (read from existing Airtable schema) ──────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let inventoryFields = null;
let cachedInventory = null;
let lastInventoryFetch = 0;
let inventoryFetchPromise = null; // 🔒 Singleton Lock
const CACHE_TTL = 86400000; // 24 hours (Full re-fetch only as safety)
let lastSyncTime = new Date(Date.now() - 3600000).toISOString(); // Start from 1 hour ago

async function discoverInventorySchema() {
  if (inventoryFields) return inventoryFields;
  if (!process.env.AIRTABLE_API_KEY) {
    console.error('❌ [AIRTABLE] CRITICAL: AIRTABLE_API_KEY is missing from environment!');
    return null;
  }

  console.log(`📡 [AIRTABLE] Discovering schema for table: ${INVENTORY_TABLE} in base: ${baseId}`);
  
  try {
    const sampleRecords = await base(INVENTORY_TABLE).select({ maxRecords: 3 }).all();
    
    if (!sampleRecords || sampleRecords.length === 0) {
      console.warn('⚠️ [AIRTABLE] Inventory table appears to be empty. Using default schema mappings.');
      return { name: 'Car Name', available: 'Available', price: 'Price AED', status: 'Status' };
    }

    const keys = [];
    sampleRecords.forEach(r => { keys.push(...Object.keys(r.fields)); });
    const uniqueKeys = [...new Set(keys)];
    
    const findField = (aliases, fallback) => {
      const found = uniqueKeys.find(k => aliases.includes(k.toLowerCase().trim()));
      if (found) return found;
      // Secondary check: partial match
      return uniqueKeys.find(k => aliases.some(a => k.toLowerCase().includes(a))) || fallback;
    };

    inventoryFields = {
      name: findField(['car name', 'name', 'vehicle', 'title'], 'Car Name'),
      available: findField(['available', 'in stock', 'is available', 'active'], 'Available'),
      status: findField(['status', 'condition', 'state'], 'Status'),
      price: findField(['price aed', 'price', 'aed', 'cost'], 'Price AED'),
      mileage: findField(['mileage km', 'mileage', 'km', 'kms'], 'Mileage KM'),
      colour: findField(['colour', 'color', 'exterior'], 'Colour'),
      condition: findField(['condition', 'grade'], 'Condition'),
      description: findField(['description', 'notes', 'details'], 'Description'),
      make: findField(['make', 'brand'], 'Make'),
      model: findField(['model', 'variant'], 'Model'),
      year: findField(['year', 'model year'], 'Year'),
      dealer: findField(['dealer', 'showroom'], 'Dealer')
    };
    
    console.log('✅ [AIRTABLE INVENTORY] Dynamic schema mapped:', inventoryFields);
    return inventoryFields;
  } catch (err) {
    console.error(`❌ [AIRTABLE SCHEMA ERROR] Discovery failed for ${INVENTORY_TABLE}:`, err.message);
    if (err.message.includes('not found')) {
      console.error('💡 TIP: Check if AIRTABLE_TABLE_ID and AIRTABLE_BASE_ID are correct and the API key has access to them.');
    }
    return null;
  }
}

async function getAvailableInventory() {
  // 1. Check Memory Cache
  const now = Date.now();
  if (cachedInventory && (now - lastInventoryFetch < CACHE_TTL)) {
    return cachedInventory;
  }

  // 2. Singleton Lock: If a fetch is already in progress, wait for it
  if (inventoryFetchPromise) {
    console.log('⏳ [AIRTABLE] Concurrent fetch detected. Joining existing request...');
    return inventoryFetchPromise;
  }

  // 3. Start New Fetch
  inventoryFetchPromise = (async () => {
    let attempts = 0;
    const maxAttempts = 3;
    
    const schema = await discoverInventorySchema() || { 
      name: 'Car Name', available: 'Available', price: 'Price AED', 
      mileage: 'Mileage KM', colour: 'Colour', condition: 'Condition', 
      description: 'Description', dealer: 'Dealer', status: 'Status'
    };

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const formula = `OR({${schema.available}} = TRUE(), {${schema.available}} = 'Available', {${schema.available}} = 'In Stock', {${schema.status}} = 'Available')`;
        
        console.log(`📡 [AIRTABLE] Fetching inventory (Attempt ${attempts}, limit 50)...`);
        
        let records = [];
        try {
          // 🚀 Performance Cap: Only fetch 50 records max to prevent hanging
          records = await base(INVENTORY_TABLE).select({ 
            filterByFormula: formula,
            maxRecords: 50,
            pageSize: 50
          }).all();
        } catch (filterErr) {
          console.warn(`⚠️ [AIRTABLE] Filtered fetch failed: ${filterErr.message}. Retrying WITHOUT filter...`);
          records = await base(INVENTORY_TABLE).select({ 
            maxRecords: 50,
            pageSize: 50
          }).all();
          // Manual filter
          records = records.filter(r => {
            const val = r.fields[schema.available] || r.fields[schema.status] || '';
            return val === true || val === 1 || String(val).toLowerCase().includes('avail') || String(val).toLowerCase().includes('stock');
          });
        }

        const mapped = records.map(r => ({
          id: r.id,
          name: r.fields[schema.name] || 'Unnamed Vehicle',
          make: r.fields[schema.make] || '',
          model: r.fields[schema.model] || '',
          year: r.fields[schema.year] || '',
          colour: r.fields[schema.colour] || '',
          price: r.fields[schema.price] || 0,
          mileage: r.fields[schema.mileage] || 0,
          condition: r.fields[schema.condition] || 'Good',
          description: r.fields[schema.description] || '',
          dealer: r.fields[schema.dealer] || 'Elite Cars UAE',
          available: true,
        }));

        // Update Cache
        cachedInventory = mapped;
        lastInventoryFetch = Date.now();
        inventoryFetchPromise = null; // Release Lock
        
        return mapped;
      } catch (err) {
        console.error(`❌ [AIRTABLE FETCH ERROR] Attempt ${attempts} failed:`, err.message);
        if (attempts >= maxAttempts) {
          console.warn(`🚨 [AIRTABLE] HARD FAILOVER: Serving static inventory cache.`);
          const mock = [
            { id: 'recMock1', name: '2024 Ferrari SF90 Stradale', price: 2100000, dealer: 'Elite Cars UAE', available: true },
            { id: 'recMock2', name: '2024 Nissan Patrol V8 Platinum', price: 215000, dealer: 'Elite Cars UAE', available: true }
          ];
          inventoryFetchPromise = null; // Release Lock
          return mock;
        }
        await sleep(attempts * 200);
      }
    }
    inventoryFetchPromise = null; // Safety release
  })();

  return inventoryFetchPromise;
}

/**
 * ⚡ EVENT-DRIVEN INJECTION: Updates the local cache instantly from a webhook.
 * This eliminates the need for periodic polling.
 */
function injectInventoryUpdate(payload) {
  if (!payload || !payload.id) return { success: false, error: 'Invalid payload' };
  
  if (!cachedInventory) cachedInventory = [];
  
  const schema = inventoryFields || { 
    name: 'Car Name', available: 'Available', price: 'Price AED', 
    mileage: 'Mileage KM', colour: 'Colour', condition: 'Condition', 
    description: 'Description', dealer: 'Dealer', status: 'Status'
  };

  const fields = payload.fields || payload;
  const isAvailable = fields[schema.available] === true || 
                    fields[schema.available] === 'Available' || 
                    fields[schema.status] === 'Available';

  const mapped = {
    id: payload.id,
    name: fields[schema.name] || 'Unnamed Vehicle',
    make: fields[schema.make] || '',
    model: fields[schema.model] || '',
    year: fields[schema.year] || '',
    colour: fields[schema.colour] || '',
    price: fields[schema.price] || 0,
    mileage: fields[schema.mileage] || 0,
    condition: fields[schema.condition] || 'Good',
    description: fields[schema.description] || '',
    dealer: fields[schema.dealer] || 'Elite Cars UAE',
    available: isAvailable,
  };

  const index = cachedInventory.findIndex(c => c.id === payload.id);
  
  if (isAvailable) {
    if (index !== -1) cachedInventory[index] = mapped;
    else cachedInventory.push(mapped);
    console.log(`⚡ [AIRTABLE WEBHOOK] Injected/Updated vehicle: ${mapped.name}`);
  } else if (index !== -1) {
    cachedInventory.splice(index, 1);
    console.log(`⚡ [AIRTABLE WEBHOOK] Removed unavailable vehicle: ${mapped.name}`);
  }

  lastInventoryFetch = Date.now();
  return { success: true, count: cachedInventory.length };
}

/**
 * 🛰️ DELTA-SYNC PROTOCOL: Surgically fetches only records modified since the last sync.
 */
async function runDeltaSync() {
  try {
    const schema = await discoverInventorySchema();
    if (!schema) return;

    // Fetch only changed records
    const filter = `IS_AFTER(LAST_MODIFIED_TIME(), '${lastSyncTime}')`;
    const records = await base(INVENTORY_TABLE).select({ filterByFormula: filter }).all();

    if (records.length > 0) {
      console.log(`✅ [AIRTABLE] Delta Sync: ${records.length} new/updated vehicles injected.`);
      records.forEach(record => injectInventoryUpdate(record));
      lastSyncTime = new Date().toISOString();
    }
  } catch (err) {
    // Silent fail for network/timeout issues as per directive
  }
}

// Re-initiate surgery-grade polling loop
setInterval(runDeltaSync, 60000);
// Run once on startup to catch up
setTimeout(runDeltaSync, 5000);

async function getInventorySummaryForLayla() {
  const cars = await getAvailableInventory()
  const schema = await discoverInventorySchema() || { price: 'Price AED', mileage: 'Mileage KM' };
  
  if (!cars || cars.length === 0) return 'No cars currently available in inventory.'
  
  return cars.map(c => {
    const p = c.price ? `AED ${c.price.toLocaleString()}` : 'Price on Request';
    const m = c.mileage ? `${c.mileage.toLocaleString()}km` : 'Low Mileage';
    return `- ${c.name} (${c.colour || 'N/A'}) | ${p} | ${m} | Condition: ${c.condition || 'Good'}`;
  }).join('\n')
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


let discoveredFields = null;

async function discoverLeadsSchema() {
  if (discoveredFields) return discoveredFields;
  try {
    const sampleRecords = await base(LEADS_TABLE).select({ maxRecords: 5 }).all();
    if (sampleRecords.length > 0) {
      // Aggregate all unique keys from multiple samples to ensure we don't miss empty fields in the first record
      let keys = [];
      sampleRecords.forEach(r => {
        keys = [...new Set([...keys, ...Object.keys(r.fields)])];
      });
      
      const findField = (aliases, fallback) => {
        return keys.find(k => aliases.includes(k.toLowerCase().trim())) || fallback;
      };

      const phoneField = findField(['phone', 'phone number', 'phone_number', 'mobile'], 'Phone');
      const nameField = findField(['name', 'full name', 'contact'], 'Name');
      const carInterestField = findField(['car interest', 'vehicle', 'interest'], 'Car Interest');
      const aiReasoningField = findField(['ai reasoning', 'layla reply', 'reasoning'], 'AI Reasoning');
      const leadScoreField = findField(['lead score', 'score'], 'Lead Score');
      const statusField = findField(['status'], 'Status');
      const sourceField = findField(['source'], 'Source');
      const dealerField = findField(['dealer'], 'Dealer');
      const submittedAtField = findField(['submitted at', 'timestamp', 'created at', 'date'], 'Timestamp');
      const midField = findField(['message id', 'message_id', 'last_message_id'], 'Message ID');

      discoveredFields = {
        phone: phoneField,
        name: nameField,
        carInterest: carInterestField,
        aiReasoning: aiReasoningField,
        leadScore: leadScoreField,
        status: statusField,
        source: sourceField,
        dealer: dealerField,
        submittedAt: submittedAtField,
        messageId: midField
      };
      
      console.log('✅ [AIRTABLE SCHEMA DISCOVERY] Schema mapped dynamically:', discoveredFields);
      return discoveredFields;
    }
  } catch (err) {
    console.error('⚠️ [AIRTABLE SCHEMA DISCOVERY] Sample fetch failed. Falling back to static mappings:', err.message);
  }

  return {
    phone: 'Phone',
    name: 'Name',
    carInterest: 'Car Interest',
    aiReasoning: 'AI Reasoning',
    leadScore: 'Lead Score',
    status: 'Status',
    source: 'Source',
    dealer: 'Dealer',
    submittedAt: 'Timestamp'
  };
}

async function getLeadByPhone(phone) {
  // Sanitize and protect input
  if (!phone || typeof phone !== 'string') {
    console.warn(`⚠️ [AIRTABLE SANITIZE] Null or malformed phone input received. Returning cached value if exists.`);
    return null;
  }
  const sanitizedPhone = phone.trim().replace(/\s+/g, '');
  if (!sanitizedPhone) return null;

  const schema = await discoverLeadsSchema();

  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`📡 [AIRTABLE] Attempting getLeadByPhone for ${sanitizedPhone} with dynamically discovered column {${schema.phone}} (Attempt ${attempts}/${maxAttempts})`);
      const records = await base(LEADS_TABLE).select({
        filterByFormula: `{${schema.phone}} = '${sanitizedPhone}'`,
        maxRecords: 1
      }).all();
      
      if (records.length > 0) {
        const r = records[0];
        return {
          id: r.id,
          name: r.fields[schema.name] || 'Unknown',
          phone: r.fields[schema.phone] || '',
          carInterest: r.fields[schema.carInterest] || '',
          laylaReply: r.fields[schema.aiReasoning] || '',
          score: r.fields[schema.leadScore] || 'Cold',
          status: r.fields[schema.status] || 'New',
          source: r.fields[schema.source] || '',
          dealer: r.fields[schema.dealer] || '',
          submittedAt: r.fields[schema.submittedAt] || '',
        };
      } else {
        // Fallback checks for potential mixed schemas during schema transition
        const secondaryField = schema.phone === 'Phone' ? 'Phone Number' : 'Phone';
        try {
          const legacyRecords = await base(LEADS_TABLE).select({
            filterByFormula: `{${secondaryField}} = '${sanitizedPhone}'`,
            maxRecords: 1
          }).all();
          if (legacyRecords.length > 0) {
            const r = legacyRecords[0];
            return {
              id: r.id,
              name: r.fields[schema.name] || 'Unknown',
              phone: r.fields[schema.phone] || r.fields[secondaryField] || '',
              carInterest: r.fields[schema.carInterest] || '',
              laylaReply: r.fields[schema.aiReasoning] || '',
              score: r.fields[schema.leadScore] || 'Cold',
              status: r.fields[schema.status] || 'New',
              source: r.fields[schema.source] || '',
              dealer: r.fields[schema.dealer] || '',
              submittedAt: r.fields[schema.submittedAt] || '',
            };
          }
        } catch (innerErr) {
          // Silent catch to fall back to map
        }
        break;
      }
    } catch (err) {
      console.error(`[AIRTABLE] Formula filter failed on '${sanitizedPhone}' (attempt ${attempts}):`, err.message);
      if (attempts >= maxAttempts) {
        console.log(`🚨 [AIRTABLE] All formula query attempts failed. Transitioning to ID-Fallback Protocol...`);
        break;
      }
      // Exponential Backoff sleep to avoid API rate limits
      await sleep(attempts * 150);
    }
  }

  // ID-Fallback Protocol: Manual client-side scanning on recent records
  try {
    console.log(`📡 [AIRTABLE FALLBACK] Fetching first 100 records for manual matching on phone: ${sanitizedPhone}`);
    const allRecords = await base(LEADS_TABLE).select({
      maxRecords: 100
    }).all();
    
    const matchedRecord = allRecords.find(r => {
      const pNum = r.fields[schema.phone] || r.fields['Phone Number'] || r.fields['Phone'] || '';
      return String(pNum).replace(/[^0-9]/g, '') === String(sanitizedPhone).replace(/[^0-9]/g, '');
    });
    
    if (matchedRecord) {
      console.log(`✅ [AIRTABLE FALLBACK] Record successfully matched via manual scan: ID ${matchedRecord.id}`);
      const r = matchedRecord;
      return {
        id: r.id,
        name: r.fields[schema.name] || 'Unknown',
        phone: r.fields[schema.phone] || '',
        carInterest: r.fields[schema.carInterest] || '',
        laylaReply: r.fields[schema.aiReasoning] || '',
        score: r.fields[schema.leadScore] || 'Cold',
        status: r.fields[schema.status] || 'New',
        source: r.fields[schema.source] || '',
        dealer: r.fields[schema.dealer] || '',
        submittedAt: r.fields[schema.submittedAt] || '',
      };
    }
  } catch (fallbackErr) {
    console.error('🚨 [AIRTABLE FALLBACK CRITICAL] ID-Fallback Protocol manual scan failed:', fallbackErr.message);
    
    // DEV-LOG KILL SWITCH TRIGGER ON ULTIMATE DATABASE PERSISTENT OUTAGE
    try {
      const { sendWhatsAppMessage } = require('./whatsapp')
      const devAlertMsg = `🚨 [DEV LOG KILL SWITCH] Airtable Database Error persists after 3 retries and ID-Fallback scan!\nLead Phone: ${sanitizedPhone}\nError: ${fallbackErr.message}`
      await Promise.allSettled([
        sendWhatsAppMessage('+917439379780', devAlertMsg),
        console.error(devAlertMsg)
      ])
    } catch (alertErr) {
      console.error('Failed to trigger dev-log kill switch alert:', alertErr.message)
    }
  }

  return leadsCache.get(sanitizedPhone) || null;
}

async function saveLeadToAirtable(data) {
  leadsCache.set(data.phone, { ...data, createdAt: new Date().toISOString() })
  console.log(`[CRM] Saving lead to Airtable: ${data.phone}`)

  const schema = await discoverLeadsSchema();
  const scoreLabel = data.intentScore >= 8 ? 'Hot' : data.intentScore >= 5 ? 'Warm' : 'Cold'

  try {
    const recordPayload = {
      [schema.name]: data.name || 'Unknown Buyer',
      [schema.phone]: data.phone,
      [schema.carInterest]: data.lastMessage || '',
      [schema.aiReasoning]: data.laylaReply || '',
      [schema.leadScore]: scoreLabel,
      [schema.status]: 'New',
      [schema.source]: data.source || 'layla-ai',
      [schema.dealer]: data.dealer || 'Elite Cars UAE',
      [schema.submittedAt]: new Date().toISOString()
    };

    const record = await base(LEADS_TABLE).create(recordPayload);
    console.log(`[AIRTABLE] Lead saved successfully to Airtable with ID: ${record.id} using dynamic schema`);
    return { id: record.id }
  } catch (err) {
    console.error('[AIRTABLE CRITICAL] Save lead attempt failed:', err.message)
    try {
      const { handlePulsePayload } = require('./sentinel')
      await handlePulsePayload({
        project: 'Speed To Lead CRM',
        status: 'Fail',
        error_message: `Airtable Write Failed: ${err.message}`,
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

  const schema = await discoverLeadsSchema();
  const scoreLabel = data.intentScore >= 8 ? 'Hot' : data.intentScore >= 5 ? 'Warm' : 'Cold'

  try {
    let airtableRecordId = recordId
    if (recordId.startsWith('+') || !recordId.includes('rec')) {
      const existingRecord = await getLeadByPhone(recordId)
      if (existingRecord && existingRecord.id) {
        airtableRecordId = existingRecord.id
      } else {
        console.log(`[AIRTABLE] Lead record not found for ${recordId}. Redirecting to save/create flow...`);
        return await saveLeadToAirtable({ ...data, phone: recordId })
      }
    }

    const updatePayload = {
      [schema.carInterest]: data.lastMessage || '',
      [schema.aiReasoning]: data.laylaReply || '',
      [schema.leadScore]: scoreLabel,
      [schema.status]: 'New',
      [schema.submittedAt]: new Date().toISOString()
    };

    await base(LEADS_TABLE).update(airtableRecordId, updatePayload);
    console.log(`[AIRTABLE] Lead updated successfully in Airtable: ${airtableRecordId}`)
  } catch (err) {
    console.error('[AIRTABLE] Failed to update lead in Airtable:', err.message)
    console.log(`[AIRTABLE FALLBACK] Retrying via save/create flow...`);
    try {
      await saveLeadToAirtable({ ...data, phone: recordId })
    } catch (createErr) {
      console.error('[AIRTABLE CRITICAL] Double fallback failed:', createErr.message)
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
