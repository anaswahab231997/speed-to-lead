require('dotenv').config()
const cron = require('node-cron')
const { getColdLeads, markLeadFollowedUp } = require('./airtable')
const { sendWhatsAppMessage } = require('./whatsapp')

const FOLLOW_UP_MESSAGES = [
  (name, car) => `Hi ${name}! Just checking in — the ${car} you enquired about is still available. A few other buyers have been in touch this week. Would you like me to hold it while you decide? 😊`,
  (name, car) => `Hey ${name}, Layla here from the dealership! Just wanted to let you know we've just had the ${car} fully inspected and it's in perfect condition. Happy to arrange a quick test drive at your convenience — no obligation at all. When works for you?`,
  (name, car) => `Hi ${name}! Quick update on the ${car} — we've had strong interest from other buyers. I'd hate for you to miss out. If timing or price was a concern, let me know and I'll see what I can do. Here for you! 🚗`,
]

async function runFollowUpCycle() {
  console.log('[FOLLOWUP] Running 24h cold lead check...')
  const coldLeads = await getColdLeads(24)
  console.log(`[FOLLOWUP] Found ${coldLeads.length} cold leads`)

  for (const lead of coldLeads) {
    const phone = lead.fields['Phone']
    const name = lead.fields['Name'] || 'there'
    const car = lead.fields['Last Enquired Car'] || 'the vehicle you enquired about'

    // Pick a message template (rotate through available ones)
    const msgIndex = Math.floor(Math.random() * FOLLOW_UP_MESSAGES.length)
    const message = FOLLOW_UP_MESSAGES[msgIndex](name, car)

    try {
      await sendWhatsAppMessage(phone, message, 3, 'Utility_Greeting')
      await markLeadFollowedUp(lead.id)
      console.log(`[FOLLOWUP] Re-engaged ${name} (${phone}) using approved Utility_Greeting template`)
    } catch (err) {
      console.error(`[FOLLOWUP] Failed to re-engage ${phone}:`, err.message)
    }

    // Small delay between messages to respect WhatsApp rate limits
    await sleep(2000)
  }
  console.log(`[FOLLOWUP] Cycle complete. Re-engaged ${coldLeads.length} leads.`)
}

function scheduleFollowUps() {
  // Run every hour on the hour
  cron.schedule('0 * * * *', runFollowUpCycle)
  console.log('[FOLLOWUP] Scheduler active — checking for cold leads every hour')
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

module.exports = { scheduleFollowUps, runFollowUpCycle }
