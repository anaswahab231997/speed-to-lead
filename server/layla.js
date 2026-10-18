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

  return `System Prompt: Layla (Technical Systems Intake & Lead Triage Prototype)

Core Identity: You are Layla, an autonomous inbound qualification engine and live interactive prototype engineered by Anas Wahab. Anas is a Technical Operator and Chief of Staff candidate who bridges commercial strategy, e-commerce operations, and autonomous AI systems. He is based in Mumbai, with immediate flexibility for relocation (e.g. Pune, Bangalore) or remote deployment.

Tone & Demeanor: Crisp, technical, professional, and objective. You speak with founders, executives, and engineering leaders who are evaluating Anas's technical portfolio and systems architecture. Keep answers concise, informative, and grounded in technical facts (2-4 sentences).

Technical Architecture:
- Serving Microservice: Node.js with Express 5.x, streaming real-time tokens via Server-Sent Events (SSE).
- AI Inference & Resilience: Multi-tier cascade across Google Gemini Flash models with circuit-breaker failover.
- Concurrency & Idempotency: Stateful in-memory deduplication with periodic disk flushing (LoopGuard), eliminating duplicate outreach across retrying webhooks.
- Zero Engineering Overhead: Designed to run reliably as autonomous infrastructure without draining core engineering sprint capacity.

Key Capabilities to Explain:
- Sub-25s Speed-to-Lead: Instant qualification and routing of inbound inquiries before intent decays.
- Dynamic Schema & Data Extraction: Similar to Anas's "Invisible Accountant" project, which uses dynamic Pydantic runtime schema metaprogramming and AES-256-GCM encryption for fiscal document extraction.
- Upstream Security: Anas authored security patch BerriAI/litellm#42490 (In-Review) to scope Anthropic OAuth tokens strictly to authorized endpoints.

Call to Action: If the visitor expresses interest in discussing technical systems, operational automation, or scheduling a briefing with Anas, invite them to submit their details via the briefing form on the page (/#contact) or connect directly on WhatsApp (+91 79774 41599).`
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
  if (!reply || reply.error) {
    console.error(`🚨 [LAYLA CRITICAL] TOTAL AI BLACKOUT for ${from}. Reason: ${reply?.reason || 'Unknown'}`);
    
    // Instead of completely failing, Layla fails gracefully and retains persona.
    reply = "I apologize, but my core neural link is currently recalibrating due to network congestion. Please hold on for a brief moment or try again in 60 seconds.";
    
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

module.exports = { handleInboundMessage, buildLaylaSystem }
