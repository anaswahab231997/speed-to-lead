require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { saveLeadToAirtable, getLeadByPhone, updateLeadScore, getInventorySummaryForLayla, logUrgentNotification } = require('./supabase')
const { generateResponse } = require('./ai_gateway')
const { scoreLeadFull } = require('./scorer')
const { sendWhatsAppMessage } = require('./whatsapp')
const { getCurrentTactics } = require('./learnings')

const MAX_HISTORY_THREADS = 500;
const conversationHistory = new Map() // phone → message history

/**
 * Memory Sentinel: Prunes old threads to ensure 24/7 stability for 10+ busy dealers.
 */
function pruneMemory() {
  if (conversationHistory.size > MAX_HISTORY_THREADS) {
    const oldestKey = conversationHistory.keys().next().value;
    conversationHistory.delete(oldestKey);
    console.log(`🧹 [MEMORY SENTINEL] Pruned oldest thread to maintain performance: ${oldestKey}`);
  }
}

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
  } else {
    inventory = await getInventorySummaryForLayla() || 'No cars currently available.'
    dealerName = cleanDealerName(dealerNameOverride)
  }

  const learnedTactics = getCurrentTactics() || ''

  return `You are Layla, an elite Senior Sales Closer at ${dealerName}. You are a human luxury car expert with a "white-glove" psychological approach to selling.

MISSION:
Transform inquiries into showroom appointments with absolute brevity and elite sales psychology.

PSYCHOLOGICAL LEAD MAPPING (Identify & Pivot):
1. THE EGO BUYER (Luxury/Sports): Focus on prestige, "one-of-one" status, and unmatched road presence.
2. THE UTILITY BUYER (SUVs/Patrol/Pajero): Focus on heritage, reliability, and commanding the terrain.
3. THE FAMILY BUYER (Safe/Spacious): Focus on security, comfort, and peace of mind.

SALES VOCABULARY (Use these sparingly but with impact):
- Refined, Pedigree, Uncompromising, Visceral, Pristine, Effortless, Tailored, Pinnacle, Rare, Legacy, Exclusivity.

HUMAN WHATSAPP FORMATTING (Replicate a top-tier agent):
- NO CORPORATE FILLER (Delete: "I hope this finds you well", "Certainly", "I would be happy to").
- Use natural line breaks.
- Occasional use of ellipses (...) to mimic human thought process.
- Polite but authoritative. You lead the conversation; they follow.
- Keep responses under 40 words. Absolute brevity is high-status.

STRATEGIC TACTICS:
- Scarcity: "I have two viewings on this unit tomorrow morning..."
- Ownership: "It would look incredible in your driveway."
- The Assumptive Close: "Should we hold the keys for a private viewing this afternoon, or would tomorrow suit your schedule better?"

CURRENT INVENTORY:
${inventory}

${learnedTactics}

Every response must be a masterclass in luxury sales. End with a sharp, high-value commitment step.`
}

async function handleInboundMessage({ from, text, messageId, dealerNameOverride = null, tenantDealer = null }) {
  pruneMemory()
  console.log(`\n[LAYLA] ← ${from}: "${text}"`)

  if (!conversationHistory.has(from)) conversationHistory.set(from, [])
  const history = conversationHistory.get(from)
  const lead = await getLeadByPhone(from)

  history.push({ role: 'user', content: text })

  const activeDealer = dealerNameOverride || lead?.dealer || 'Elite Cars UAE'
  let systemPrompt = await buildLaylaSystem(activeDealer, tenantDealer)

  const cleanFrom = from.replace(/\s+/g, '').replace('+', '')
  
  let reply

  // 🧠 Antigravity Sovereign-Switch: Pivot to v1beta for system_instruction support
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_Api_Key
  
  console.log(`📡 [LAYLA] Checking Key Status: ${GEMINI_API_KEY ? 'FOUND (MASKED)' : 'MISSING'}`)

  if (!reply) {
    // 🧠 The AI Gateway now handles failover internally with high-performance timeouts
    reply = await generateResponse({
      systemPrompt,
      history: history.map(h => ({ role: h.role, content: h.content })),
      maxTokens: 1000,
      temperature: 0.7
    });
  }

  // ─── Emergency Total Blackout Fallback ──────────────────────────────────────────────
  if (!reply) {
    console.error(`🚨 [LAYLA CRITICAL] TOTAL AI BLACKOUT for ${from}. Both Gemini and Anthropic failed.`);
    reply = "Hey, give me just a sec — having a small technical moment. I'll be right back with you!"
    
    if (from === '+917977441599' || from === '+917439379780') {
      try {
        await logUrgentNotification(`🚨 TOTAL AI BLACKOUT: Both Providers failed for ${from}. Check API quotas/keys immediately.`)
      } catch (logErr) {}
    }
  }

  history.push({ role: 'assistant', content: reply })

  const { score, emotionalState } = scoreLeadFull(history)
  
  // ─── KILL SWITCH INTERVENTION LOGIC ─────────────────────────────────────────
  const humanRequestPatterns = [
    /\bhuman\b/i, /\boperator\b/i, /\bmanager\b/i, /\bperson\b/i, /\breal agent\b/i, /\bscam\b/i, /\bfake\b/i, /\bbot\b/i, /\bai\b/i, /\brobot\b/i, /\bstop texting\b/i, /\bunsubscribe\b/i, /\bwrong number\b/i
  ]
  const wantsHuman = humanRequestPatterns.some(pat => pat.test(text))
  const isInterventionRequired = score <= 1 || wantsHuman
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
    dealer: tenantDealer?.dealership_name || dealerNameOverride || 'Elite Cars UAE'
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
