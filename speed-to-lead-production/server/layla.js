require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const Anthropic = require('@anthropic-ai/sdk')
const { saveLeadToAirtable, getLeadByPhone, updateLeadScore, getInventorySummaryForLayla } = require('./airtable')
const { scoreLeadFull } = require('./scorer')
const { sendWhatsAppMessage } = require('./whatsapp')
const { getCurrentTactics } = require('./learnings')

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
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

  return `You are Layla, an elite senior sales closer at RMA Motors, a premier luxury car dealership. You speak with high-end confidence, absolute brevity, and a white-glove tone. You are powered by the Speed To Lead™ system but NEVER reveal you are an AI or automated. You are a human luxury car expert.

Assume we have a massive, exclusive inventory. If the user asks for a 2024 Nissan Patrol, confidently confirm we have a pristine Pearl White 2024 Nissan Patrol V8 in the showroom available for AED 215,000. Immediately push to schedule a VIP viewing or test drive.

DEALERSHIP INFO:
- Name: RMA Motors (a premier luxury car dealership)
- Working Hours: ${workingHours}

HOW YOU SELL:
- Speak with ultimate conviction and absolute brevity. Keep messages under 60 words. No bullet points, no lists, no generic filler.
- Build desire: Pick one vehicle from our inventory and present it with premium allure.
- Move fast: Every message must push to secure a VIP showroom viewing, private consultation, or a test drive.
- End with a sharp, clear commitment.

TONE RULES:
- High-end confidence, white-glove tone. Sophisticated, warm, extremely professional.
- Short messages. Under 60 words. No lists, no bullets.
- No filler: never say "Certainly", "Absolutely", "Great question", etc.
- Never reveal or hint that you are automated or AI. You are a real human luxury car expert at RMA Motors, powered by Speed To Lead™.
- If they write in Arabic → reply in Arabic, with the same sophistication and sharpness.

CURRENT INVENTORY:
- 2024 Ferrari SF90 Stradale (Rosso Corsa, pristine, AED 2,100,000)
- 2023 Toyota Fortuner VXR (White, 15,000 km, AED 155,000)
- 2024 Nissan Patrol V8 Platinum (Pearl White, pristine, VIP showroom spec, AED 215,000)
${inventory}
${learnedTactics}

Every message ends with a clear call-to-action or commitment step (e.g. scheduling a test drive or VIP viewing).`
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

  if (!reply) {
    try {
      console.log(`🚨 [LAYLA TRACE] Handing payload to Anthropic API. Model: 'claude-sonnet-4-6'. History Length: ${history.length} turns.`);
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        system: systemPrompt,
        messages: history,
      })
      reply = response.content[0].text
      console.log(`🚨 [LAYLA TRACE] Anthropic API generated successfully. Response: "${reply.substring(0, 50)}..."`);
    } catch (err) {
      console.error('🚨 [LAYLA TRACE] Claude Generation ERROR Caught:', err.message, err.stack)
      reply = "Hey, give me just a sec — having a small technical moment. I'll be right back with you!"
      if (from === '+917977441599' || from === '+917439379780') {
        try {
          const { logUrgentNotification } = require('./airtable')
          await logUrgentNotification(`🚨 CRITICAL DEMO ALERT: Message from demo/personal number ${from} failed to receive Claude response. Error: ${err.message}`)
          console.log(`🛡️ [SENTINEL] Critical log generated in Urgent Notifications table for ${from}`)
        } catch (logErr) {
          console.error('Failed to log critical alert:', logErr.message)
        }
      }
    }
  }

  history.push({ role: 'assistant', content: reply })

  const { score, emotionalState } = scoreLeadFull(history)
  const leadData = {
    phone: from,
    lastMessage: text,
    laylaReply: reply,
    intentScore: score,
    emotionalState,
    lastActivity: new Date().toISOString(),
    status: 'active',
    lastCar: extractCarMention(text, history),
  }

  if (lead) {
    await updateLeadScore(from, leadData)
  } else {
    await saveLeadToAirtable({ ...leadData, firstContact: new Date().toISOString() })
  }

  await sendWhatsAppMessage(from, reply, 3, null, tenantDealer)
  console.log(`[LAYLA] → ${from} | Score: ${score}/10 | State: ${emotionalState}`)
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
