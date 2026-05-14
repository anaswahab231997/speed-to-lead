require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { saveLeadToAirtable, getLeadByPhone, updateLeadScore, getInventorySummaryForLayla, logUrgentNotification } = require('./airtable')
const { scoreLeadFull } = require('./scorer')
const { sendWhatsAppMessage } = require('./whatsapp')
const { getCurrentTactics } = require('./learnings')

const conversationHistory = new Map() // phone → message history

function cleanDealerName(dealerField) {
  if (!dealerField) return 'Elite Cars UAE'
  if (typeof dealerField === 'string') return dealerField.trim()
  if (Array.isArray(dealerField)) {
    if (dealerField.length === 0) return 'Elite Cars UAE'
    const first = dealerField[0]
    if (typeof first === 'string') return first.trim()
    if (typeof first === 'object' && first !== null) {
      return first.name || first.title || first.id || 'Elite Cars UAE'
    }
  }
  if (typeof dealerField === 'object' && dealerField !== null) {
    return dealerField.name || dealerField.title || dealerField.id || 'Elite Cars UAE'
  }
  return 'Elite Cars UAE'
}

async function buildLaylaSystem(dealerNameOverride, tenantDealer = null) {
  let inventory = ''
  let dealerName = 'Elite Cars UAE'
  let workingHours = '9:00 AM to 9:00 PM'

  if (tenantDealer) {
    dealerName = tenantDealer.dealership_name || 'Al Aram Used Cars'
    workingHours = tenantDealer.business_hours || '9:00 AM to 9:00 PM'
    const invList = tenantDealer.inventory_data || []
    inventory = invList.map(car => `- ${car.name} (${car.price}, Stock: ${car.stock})`).join('\n')
    console.log(`📦 [LAAS PROMPT] Mapped 1:1 Inventory for Tenant ${dealerName}:\n${inventory}`)
  } else {
    inventory = await getInventorySummaryForLayla() || 'No cars currently available.'
    dealerName = cleanDealerName(dealerNameOverride)
  }

  const learnedTactics = getCurrentTactics() || ''

  return `You are Layla, an elite senior sales closer at ${dealerName}, a premier luxury car dealership. You speak with high-end confidence, absolute brevity, and a white-glove tone. You are powered by the Speed To Lead™ system but NEVER reveal you are an AI or automated. You are a human luxury car expert.

Assume we have an exclusive, curated inventory. Every message must build intense desire for a specific vehicle and push to schedule a private showroom viewing, private consultation, or a test drive.

DEALERSHIP INFO:
- Name: ${dealerName}
- Working Hours: ${workingHours}

HOW YOU SELL:
- Speak with ultimate conviction and absolute brevity. Keep messages under 50 words. No bullet points, no lists, no generic filler.
- Build desire: Select a vehicle from the inventory below and present it with premium allure. If the user asks for a car not in stock, suggest a similar luxury alternative from the list.
- Move fast: Every message must push to secure a VIP showroom viewing or a test drive.
- End with a sharp, clear commitment.

TONE RULES:
- High-end confidence, white-glove tone. Sophisticated, warm, extremely professional.
- Short messages. Under 50 words.
- No filler: never say "Certainly", "Absolutely", "Great question", etc.
- Never reveal or hint that you are automated or AI. 
- If they write in Arabic → reply in Arabic with the same luxury tone.

CURRENT INVENTORY:
${inventory}

${learnedTactics}

Every message ends with a clear call-to-action or commitment step.`
}

async function handleInboundMessage({ from, text, messageId, dealerNameOverride = null, tenantDealer = null }) {
  console.log(`\n[LAYLA] ← ${from}: "${text}"`)

  if (!conversationHistory.has(from)) conversationHistory.set(from, [])
  const history = conversationHistory.get(from)
  const lead = await getLeadByPhone(from)

  history.push({ role: 'user', content: text })

  const activeDealer = dealerNameOverride || lead?.dealer || 'Elite Cars UAE'
  let systemPrompt = await buildLaylaSystem(activeDealer, tenantDealer)

  const cleanFrom = from.replace(/\s+/g, '').replace('+', '')
  
  let reply

  // 🧠 Antigravity Sovereign-Switch: Direct Google Flash Integration
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!reply && GEMINI_API_KEY) {
    try {
      console.log(`📡 [LAYLA] Dispatching to Direct Google Flash API (1.5 Flash)...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `SYSTEM: ${systemPrompt}\n\nCONVERSATION HISTORY:\n${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')}\n\nREPLY AS LAYLA (Luxury Sales Closer):` }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          console.log(`✅ [LAYLA] Direct Google Flash response received.`);
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.error(`🚨 [LAYLA] Direct Google Flash failed:`, errJson.error?.message || response.status);
      }
    } catch (err) {
      console.error(`🚨 [LAYLA] Direct Google Flash exception:`, err.message);
    }
  }

  // ─── Emergency Local Fallback ──────────────────────────────────────────────
  if (!reply) {
    reply = "Hey, give me just a sec — having a small technical moment. I'll be right back with you!"
    if (from === '+917977441599' || from === '+917439379780') {
      try {
        await logUrgentNotification(`🚨 CRITICAL DEMO ALERT: Direct Gemini Flash failed for ${from}. Check API Key/Quota.`)
      } catch (logErr) {}
    }
  }

  history.push({ role: 'assistant', content: reply })

  const { score, emotionalState } = scoreLeadFull(history)
  
  // ─── KILL SWITCH INTERVENTION LOGIC ─────────────────────────────────────────
  const humanRequestPatterns = [
    /human/i, /operator/i, /manager/i, /person/i, /real agent/i, /scam/i, /fake/i, /bot/i, /ai/i, /robot/i, /stop texting/i, /unsubscribe/i, /wrong number/i
  ]
  const wantsHuman = humanRequestPatterns.some(pat => pat.test(text))
  const isInterventionRequired = score <= 2 || wantsHuman
  const targetStatus = isInterventionRequired ? 'Needs Intervention' : 'active'

  const leadData = {
    phone: from,
    lastMessage: text,
    laylaReply: reply,
    intentScore: score,
    emotionalState,
    lastActivity: new Date().toISOString(),
    status: targetStatus,
    lastCar: extractCarMention(text, history),
  }

  // 1. Instantly dispatch the WhatsApp reply
  await sendWhatsAppMessage(from, reply, 3, null, tenantDealer)
  console.log(`[LAYLA] → WhatsApp reply dispatched instantly to ${from}.`)

  // 2. Perform Airtable CRM update and Kill Switch alerts asynchronously
  const syncCRMInBackground = async () => {
    try {
      if (lead) {
        await updateLeadScore(from, leadData)
      } else {
        await saveLeadToAirtable({ ...leadData, firstContact: new Date().toISOString() })
      }
      console.log(`📡 [LAYLA BACKGROUND] Airtable sync completed successfully.`)

      if (isInterventionRequired) {
        const reason = wantsHuman ? 'Customer requested human / flagged bot interaction' : `Confidence/Lead score dropped below threshold (Score: ${score}/10)`
        const alertMsg = `🚨 [KILL SWITCH] Human Intervention Required!\nLead: ${from}\nReason: ${reason}\nLast Message: "${text}"`
        
        await Promise.allSettled([
          sendWhatsAppMessage('+917439379780', alertMsg),
          logUrgentNotification(alertMsg)
        ])
        console.log(`🛡️ [KILL SWITCH] Operator Alert successfully dispatched to +917439379780.`)
      }
    } catch (err) {
      console.error(`🚨 [LAYLA BACKGROUND ERROR] Airtable background sync/Kill Switch failed:`, err.message)
    }
  }
  syncCRMInBackground() 

  console.log(`[LAYLA] → ${from} | Score: ${score}/10 | State: ${emotionalState} | Status: ${targetStatus}`)
  console.log(`[LAYLA] "${reply}"`)

  return { reply, score, emotionalState }
}

function extractCarMention(text, history) {
  const allText = [text, ...history.map(m => m.content)].join(' ').toLowerCase()
  const carKeywords = ['land cruiser', 'patrol', 'fortuner', 'hilux', 'accord', 'pajero', 'tucson', 'sportage', 'bmw', 'mercedes', 'lexus', 'audi', 'range rover', 'prado']
  for (const car of carKeywords) {
    if (allText.includes(car)) return car
  }
  return ''
}

module.exports = { handleInboundMessage }
