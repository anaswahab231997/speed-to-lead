require('dotenv').config()
const cron = require('node-cron')
const { getColdLeads, markLeadFollowedUp } = require('./supabase')
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
  cron.schedule('0 * * * *', runBlueprintRetargeting)
  console.log('[FOLLOWUP] Scheduler active — checking for cold leads and blueprint retargeting every hour')
}

async function runBlueprintRetargeting() {
  console.log('[FOLLOWUP] Running 48h blueprint retargeting check...')
  try {
    const { getBlueprintLeads, markBlueprintRetargeted } = require('./supabase')
    const leads = await getBlueprintLeads(48)
    if (leads.length === 0) return

    console.log(`[FOLLOWUP] Found ${leads.length} blueprint leads ready for retargeting`)
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    for (const lead of leads) {
      const email = lead.phone // We stored email in the phone field for blueprint requests
      if (!email || !email.includes('@')) continue;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: `Did you map out your lead drop-off nodes yet?`,
        html: `<p>Hi ${lead.name || 'there'},</p>
<p>Just checking in to see if you had a chance to review the 2026 Autonomous Blueprint I sent over.</p>
<p>If you've mapped out the exact nodes where your leads are dropping, let's get on a brief architecture audit to plug the leaks.</p>
<p>You can grab a time that works for you here: <a href="https://ainexlifyagencies.com/schedule">ainexlifyagencies.com/schedule</a></p>
<p>Best,<br>Anas</p>`,
      }

      try {
        await transporter.sendMail(mailOptions)
        await markBlueprintRetargeted(lead.phone)
        console.log(`[FOLLOWUP] Retargeted blueprint lead: ${email}`)
      } catch (err) {
        console.error(`[FOLLOWUP] Failed to retarget blueprint lead ${email}:`, err.message)
      }

      await sleep(2000)
    }
  } catch (err) {
    console.error('[FOLLOWUP] Blueprint retargeting failed:', err.message)
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

module.exports = { scheduleFollowUps, runFollowUpCycle, runBlueprintRetargeting }
