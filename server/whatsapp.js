require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const axios = require('axios')

async function sendWhatsAppMessage(to, message, retries = 3, campaignNameOverride = null, tenantConfig = null) {
  // Bypassing Make.com webhook feedback loop ONLY for actual system alerts
  const isAlert = message.includes('⚠️') || message.includes('✅') || message.includes('[test run]') || message.includes('failure detected') || message.includes('System Health') || message.includes('CRITICAL DEMO ALERT')
  const alertTarget = process.env.META_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
  if (alertTarget && to === alertTarget && isAlert) {
    console.log(`[ALERT ROUTE] Bypassing Make.com webhook loop for system alert to ${to}. Routing via AiSensy directly.`)
    return sendViaAiSensy(to, message, retries, campaignNameOverride)
  }

  const mode = process.env.WHATSAPP_MODE || 'aisensy'

  // Register this outbound reply in our Loop Guard to block loopbacks!
  try {
    const { registerOutboundReply } = require('./loopGuard')
    registerOutboundReply(message)
  } catch (err) {
    console.error('[LOOP GUARD ERROR] Failed to register outbound:', err.message)
  }

  // MULTI-TENANT SAAS ROUTING OVERRIDE:
  // If a tenant profile with a custom Meta Access Token is active, bypass modes and use direct Cloud API
  if (tenantConfig && tenantConfig.meta_access_token) {
    console.log(`📡 [SAAS ROUTER] Intercepted multi-tenant outbound. Routing directly via Meta Cloud API using tenant token.`)
    return sendViaCloudAPI(to, message, retries, tenantConfig)
  }

  if (mode === 'twilio') {
    return sendViaTwilio(to, message, retries)
  }

  if (mode === 'aisensy') {
    try {
      return await sendViaAiSensy(to, message, retries, campaignNameOverride)
    } catch (err) {
      console.error(`[FAILOVER TRIGGERED] AiSensy failed: ${err.message}. Automatically routing to Make.com fallback...`)
      return await sendViaMake(to, message, retries)
    }
  }
  if (mode === 'make') {
    return sendViaMake(to, message, retries)
  }
  return sendViaCloudAPI(to, message, retries)
}

// ─── AiSensy (primary outbound channel) ──────────────────────────────────────
async function sendViaAiSensy(to, message, retries, campaignNameOverride = null) {
  // AiSensy requires an API key — requested from Anas
  if (!process.env.AISENSY_API_KEY || process.env.AISENSY_API_KEY === 'PENDING') {
    console.warn('[AISENSY] API key not set yet — logging message instead of sending')
    console.log(`[AISENSY MOCK] To: ${to} | Message: "${message}"`)
    return { mocked: true }
  }

  const payload = {
    apiKey: process.env.AISENSY_API_KEY,
    campaignName: campaignNameOverride || process.env.AISENSY_CAMPAIGN_NAME || 'speed_to_lead_reply',
    destination: to,
    userName: process.env.AISENSY_USERNAME || 'Layla',
    templateParams: [message],
    source: 'speed-to-lead',
    media: {},
    buttons: [],
    carouselCards: [],
    location: {},
  }

  // Set timeout to 2000ms (2 seconds) to guarantee fast failover if API is unresponsive
  const requestTimeout = 2000

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(process.env.AISENSY_API_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: requestTimeout,
      })
      console.log(`[AISENSY] ✓ Message sent to ${to} (attempt ${attempt})`)
      return res.data
    } catch (err) {
      console.error(`[AISENSY] Attempt ${attempt} failed:`, err.response?.data || err.message)
      if (attempt === retries) throw new Error(`AiSensy send failed after ${retries} attempts: ${err.message}`)
      await sleep(attempt * 500) // Shorter retry delay for fast failover
    }
  }
}

// ─── Make.com relay (fallback) ────────────────────────────────────────────────
async function sendViaMake(to, message, retries) {
  let leadName = 'Buyer Full Name'
  let dealerName = 'Al Aram Used Cars'
  let dealerLocation = 'Sharjah'
  let dealerHours = '9 AM to 9 PM daily'

  try {
    const { getLeadByPhone } = require('./supabase')
    const lead = await getLeadByPhone(to)
    if (lead) {
      if (lead.name && lead.name !== 'Unknown') {
        leadName = lead.name
      }
      if (lead.dealer) {
        // Clean dealer name if it is an array or object
        if (typeof lead.dealer === 'string') {
          dealerName = lead.dealer.trim()
        } else if (Array.isArray(lead.dealer) && lead.dealer.length > 0) {
          dealerName = String(lead.dealer[0]).trim()
        }
      }
    }
  } catch (err) {
    console.warn('[MAKE RELAY] Could not fetch lead details for payload:', err.message)
  }

  const payload = {
    agent_name: 'Layla',
    dealer_name: dealerName,
    dealer_location: dealerLocation,
    dealer_hours: dealerHours,
    name: leadName,
    phone: to,
    message: message,
    source: 'WhatsApp'
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await axios.post(process.env.MAKE_INBOUND_WEBHOOK, payload, { timeout: 10000 })
      console.log(`[MAKE] ✓ Message relayed to ${to} using 8-field schema:`, JSON.stringify(payload))
      return
    } catch (err) {
      console.error(`[MAKE] Attempt ${attempt} failed:`, err.message)
      if (attempt === retries) throw new Error(`Make.com relay failed after ${retries} attempts`)
      await sleep(attempt * 1500)
    }
  }
}

// ─── WhatsApp Cloud API (direct) ──────────────────────────────────────────────
async function sendViaCloudAPI(to, message, retries, tenantConfig = null) {
  const phoneId = tenantConfig?.phone_number_id || process.env.META_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = tenantConfig?.meta_access_token || process.env.WHATSAPP_ACCESS_TOKEN
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`
  const payload = { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 10000,
      })
      console.log(`[WHATSAPP SaaS ROUTER] ✓ Message sent dynamically to ${to} using Phone ID: ${phoneId}`)
      return res.data
    } catch (err) {
      console.error(`[WHATSAPP SaaS ROUTER] Attempt ${attempt} failed:`, err.response?.data || err.message)
      if (attempt === retries) throw new Error(`WhatsApp send failed after ${retries} attempts`)
      await sleep(attempt * 1500)
    }
  }
}

// ─── Twilio (SaaS / Sandbox outbound channel) ──────────────────────────────────
async function sendViaTwilio(to, message, retries) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const senderNumber = process.env.TWILIO_SENDER_NUMBER;

  if (!accountSid || !authToken || !senderNumber) {
    throw new Error('SECURE FAIL: Outbound Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_SENDER_NUMBER) are missing from the environment configuration.');
  }

  // Format numbers with whatsapp: prefix securely for Twilio Sandbox compliance
  const cleanTo = to.replace('whatsapp:', '').trim();
  
  // Mock Bypass for local testing numbers to isolate physical networks during simulation
  if (cleanTo.includes('1234567890') || cleanTo.startsWith('+12345')) {
    console.log(`🤖 [MOCK TWILIO BYPASS] Intercepted local testing mockup ${cleanTo}. Simulating successful dispatch...`);
    return { sid: 'SM_MOCK_SUCCESS_' + Date.now() };
  }

  const formattedTo = `whatsapp:${cleanTo.startsWith('+') ? cleanTo : '+' + cleanTo}`;
  
  const cleanFrom = senderNumber.replace('whatsapp:', '').trim();
  const formattedFrom = `whatsapp:${cleanFrom.startsWith('+') ? cleanFrom : '+' + cleanFrom}`;

  console.log(`🚨 [TWILIO TRACE] Dispatching outbound Twilio WhatsApp payload. From: ${formattedFrom} | To: ${formattedTo}`);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.append('To', formattedTo);
  params.append('From', formattedFrom);
  params.append('Body', message);

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(url, params.toString(), {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      });
      console.log(`🚨 [TWILIO TRACE] ✓ Message successfully sent via Twilio! MessageSid: ${res.data.sid}`);
      return res.data;
    } catch (err) {
      console.error(`🚨 [TWILIO TRACE] Attempt ${attempt} failed:`, err.response?.data || err.message);
      if (attempt === retries) throw new Error(`Twilio send failed: ${err.message}`);
      await sleep(attempt * 1500);
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

module.exports = { sendWhatsAppMessage }
