async function sendWhatsAppMessage(to, message) {
  console.log(`[WHATSAPP] Sending to ${to}: "${message}"`)
  return { success: true }
}
module.exports = { sendWhatsAppMessage }
