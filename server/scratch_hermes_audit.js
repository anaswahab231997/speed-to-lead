require('dotenv').config({ path: './.env' });
const { runHermesAgent } = require('./agents/hermes');

async function triggerManualAudit() {
  console.log('🚀 [MANUAL TRIGGER] Hermes Audit Re-run Initiated...');
  try {
    const result = await runHermesAgent();
    console.log('\n✅ AUDIT COMPLETE');
    console.log(result);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ AUDIT FAILED');
    console.error(err.message);
    process.exit(1);
  }
}

triggerManualAudit();
