const { logSystemHealth, getInventorySummaryForLayla } = require('../airtable');
const { handleInboundMessage } = require('../layla');

/**
 * HERMES AI: Master Orchestrator & System Intelligence
 * Mission: Maintain the Sovereign-Switch pipeline integrity.
 */
async function runHermesAgent() {
  console.log('\n🏛️ [MASTER AGENT: HERMES] Initiating System Intelligence Audit...');
  const auditResults = {
    timestamp: new Date().toISOString(),
    status: 'Healthy',
    checks: []
  };

  try {
    // 1. Cognitive Check (Direct Gemini Flash)
    console.log('🏛️ [HERMES] Auditing Cognitive Path (Direct Gemini Flash)...');
    if (!process.env.GEMINI_API_KEY) {
      auditResults.status = 'Degraded';
      auditResults.checks.push('❌ GEMINI_API_KEY Missing');
    } else {
      auditResults.checks.push('✅ Direct Gemini Key Detected');
    }

    // 2. Communication Check (WhatsApp Mode)
    const mode = process.env.WHATSAPP_MODE || 'aisensy';
    console.log(`🏛️ [HERMES] Auditing Communication Path (Mode: ${mode})...`);
    auditResults.checks.push(`✅ WhatsApp Mode: ${mode.toUpperCase()}`);
    
    if (mode === 'twilio') {
      const hasTwilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SENDER_NUMBER;
      if (!hasTwilio) {
        auditResults.status = 'Degraded';
        auditResults.checks.push('❌ Twilio Credentials Incomplete');
      } else {
        auditResults.checks.push('✅ Twilio Credentials Verified');
      }
    }

    // 3. CRM Check (Airtable Dynamic Schema)
    console.log('🏛️ [HERMES] Auditing CRM Path (Airtable)...');
    try {
      const inv = await getInventorySummaryForLayla();
      if (inv) {
        auditResults.checks.push('✅ Airtable Inventory Sync: Verified');
      } else {
        auditResults.checks.push('🟡 Airtable Inventory Sync: Empty');
      }
    } catch (e) {
      auditResults.status = 'Critical';
      auditResults.checks.push(`❌ Airtable Connection Failed: ${e.message}`);
    }

    // 4. Persistence
    console.log('🏛️ [HERMES] Audit Complete. Status:', auditResults.status);
    
    await logSystemHealth({
      project: 'Speed To Lead',
      status: auditResults.status === 'Healthy' ? 'Active' : 'Warning',
      error_message: `Hermes System Audit: ${auditResults.checks.join(' | ')}`,
      last_module: 'HERMES_MASTER'
    });

    return `Hermes Audit Complete: ${auditResults.status}. ${auditResults.checks.length} checks performed.`;

  } catch (err) {
    console.error('🏛️ [HERMES] Master Audit Crash:', err.message);
    throw err;
  }
}

module.exports = { runHermesAgent };
