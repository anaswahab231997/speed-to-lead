const { logSystemHealth, logUrgentNotification } = require('./airtable')
const { sendWhatsAppMessage } = require('./whatsapp')

const ALERT_NUMBER = '+917439379780'

function categorizeError(status, errorMessage) {
  const err = (errorMessage || '').toLowerCase()
  const stat = (status || '').toLowerCase()

  if (stat === 'duplicate' || err.includes('duplicate') || err.includes('already exists')) {
    return 'DUPLICATE_LEAD'
  }
  if (err.includes('timeout') || err.includes('claude') || err.includes('anthropic') || err.includes('hallucination')) {
    return 'API_TIMEOUT'
  }
  if (err.includes('airtable') || err.includes('sync') || err.includes('connection')) {
    return 'AIRTABLE_CONNECTION_ERROR'
  }
  if (err.includes('aisensy') || err.includes('disconnect') || err.includes('whatsapp')) {
    return 'AISENSY_DISCONNECT'
  }
  
  return 'FATAL_CRASH'
}

async function handlePulsePayload(payload) {
  console.log('\n🛡️ [SENTINEL] Pulse received:', payload.status)

  // 1. Report: Log to Airtable
  await logSystemHealth(payload)

  // If it's a success, just send a summary to Anas and return
  if (payload.status === 'Success') {
    const successMsg = `✅ Speed To Lead: Success execution for lead ${payload.lead_id} (${payload.execution_time}ms)`
    await Promise.allSettled([
      sendWhatsAppMessage(ALERT_NUMBER, successMsg),
      logUrgentNotification(successMsg)
    ])
    return
  }

  // 2. Categorize the Failure
  const category = categorizeError(payload.status, payload.error_message)
  console.log(`🛡️ [SENTINEL] Categorized as: ${category}`)

  // 3. Execute Recovery Scenario
  const buyerPhone = payload.lead_id // Assuming lead_id is the phone number from Make.com
  let recoveryMessage = ''

  switch (category) {
    case 'API_TIMEOUT':
    case 'CLAUDE_HALLUCINATION':
      // Backup Agent
      recoveryMessage = "Checking those specs for you now, one moment!"
      break
    case 'AIRTABLE_CONNECTION_ERROR':
      recoveryMessage = "Got your request! Our team is pulling the history for this vehicle."
      break
    case 'DUPLICATE_LEAD':
      console.log('🛡️ [SENTINEL] Flagged as Low Priority. Sequence stopped.')
      // No message sent to buyer, alert sent to Dealer (and Anas)
      break
    case 'AISENSY_DISCONNECT':
    case 'FATAL_CRASH':
    default:
      recoveryMessage = "A consultant is reviewing your specific inquiry and will text you shortly."
      break
  }

  // Send recovery message to buyer (except for duplicates)
  if (recoveryMessage && buyerPhone && category !== 'DUPLICATE_LEAD') {
    try {
      await sendWhatsAppMessage(buyerPhone, recoveryMessage)
      console.log(`🛡️ [SENTINEL] Recovery message sent to ${buyerPhone}`)
    } catch (e) {
      console.error('🛡️ [SENTINEL] Failed to send recovery message:', e.message)
    }
  }

  // Send Failure Summary to Anas via Double-Tap Protocol (AiSensy + Airtable)
  const failureMsg = `⚠️ Speed To Lead: 1 failure detected [${category}]. Check System Health table.\nLead: ${buyerPhone}\nError: ${payload.error_message}`
  
  await Promise.allSettled([
    sendWhatsAppMessage(ALERT_NUMBER, failureMsg),
    logUrgentNotification(failureMsg + `\n\nFull Payload: ${JSON.stringify(payload)}`)
  ])
}

module.exports = { handlePulsePayload }
