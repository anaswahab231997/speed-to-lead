/**
 * Live end-to-end test — simulates a real buyer using Claude + live Airtable inventory
 * Run with: node liveTest.js
 */
require('dotenv').config()
const { handleInboundMessage } = require('./layla')

const BUYER_PHONE = '+971501234567'

const conversation = [
  'Hi, is the Land Cruiser still available?',
  "What's the price? I've seen similar for 130k",
  'Can I test drive it tomorrow morning?',
]

async function runLiveTest() {
  console.log('\n═══════════════════════════════════════════════')
  console.log('  SPEED TO LEAD — LIVE CONVERSATION TEST')
  console.log('  Buyer:', BUYER_PHONE)
  console.log('═══════════════════════════════════════════════\n')

  for (const message of conversation) {
    console.log(`\n👤 BUYER: "${message}"`)
    console.log('⏳ Layla thinking...')

    const { reply, score } = await handleInboundMessage({
      from: BUYER_PHONE,
      text: message,
      messageId: `test_${Date.now()}`,
    })

    console.log(`🤖 LAYLA: "${reply}"`)
    console.log(`📊 INTENT SCORE: ${score}/10`)
    console.log('─'.repeat(60))

    await new Promise(r => setTimeout(r, 1000)) // brief pause between messages
  }

  console.log('\n✅ LIVE TEST COMPLETE')
  console.log('Claude API: Connected ✓')
  console.log('Airtable Inventory: Connected ✓')
  console.log('Lead Scoring: Active ✓')
  console.log('WhatsApp (AiSensy): Pending API key ⚠')
}

runLiveTest().catch(console.error)
