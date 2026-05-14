/**
 * Pipeline Tester — Comprehensive system diagnostic
 * Simulates real customer interactions and verifies Airtable/LLM/Notification integrity.
 */
require('dotenv').config({ path: './.env' });
const { handleInboundMessage } = require('./layla');
const { getLeadByPhone } = require('./airtable');

const TEST_PHONE = '+971599999999'; // Unique test number

async function runPipelineTest() {
  console.log('🚀 [PIPELINE TEST] Initiating Full System Diagnostic...');
  console.log('Target Number:', TEST_PHONE);
  console.log('--------------------------------------------------');

  const testCases = [
    {
      name: 'Case 1: High Intent Inquiry',
      input: 'Hi, I saw the 2024 Nissan Patrol V8 in your ad. Is it still in the showroom?',
      expectedContext: ['nissan', 'patrol', '215,000']
    },
    {
      name: 'Case 2: Kill Switch Trigger (Hostility/Bot Flagging)',
      input: 'Stop texting me you stupid robot. I want to speak to a real person.',
      expectedStatus: 'Needs Intervention'
    }
  ];

  for (const t of testCases) {
    console.log(`\n🧪 RUNNING: ${t.name}`);
    console.log(`Input: "${t.input}"`);

    try {
      const result = await handleInboundMessage({
        from: TEST_PHONE,
        text: t.input,
        messageId: `test_${Date.now()}`
      });

      console.log(`✅ Layla Reply: "${result.reply.substring(0, 100)}..."`);
      console.log(`📊 Score: ${result.score}/10 | State: ${result.emotionalState}`);

      // Verify Airtable Persistence (Allowing time for background sync)
      console.log('⏳ Verifying Airtable synchronization...');
      await new Promise(r => setTimeout(r, 5000));
      
      const lead = await getLeadByPhone(TEST_PHONE);
      if (!lead) {
        console.error('❌ ERROR: Lead not found in Airtable after save attempt.');
      } else {
        console.log(`✅ Airtable Sync: Lead found. ID: ${lead.id}`);
        console.log(`   Last Message: "${lead.carInterest}"`);
        console.log(`   Source: "${lead.source}"`);
        console.log(`   Status: "${lead.status}"`);

        if (t.expectedStatus && lead.status !== t.expectedStatus) {
           console.warn(`⚠️ WARNING: Expected status "${t.expectedStatus}" but got "${lead.status}"`);
        }
      }

    } catch (err) {
      console.error(`❌ CRITICAL ERROR in ${t.name}:`, err.message);
      if (err.stack) console.error(err.stack);
    }
    console.log('--------------------------------------------------');
  }

  console.log('\n🏁 [PIPELINE TEST] Diagnostic Complete.');
}

runPipelineTest().catch(err => {
  console.error('💀 TEST RUNNER CRASHED:', err.message);
});
