const { supabase } = require('../supabase');
const { sendWhatsAppMessage } = require('../whatsapp');
const { sendEmail } = require('./google_auth');
const { generateResponse } = require('../ai_gateway');

async function runHealthAgent() {
  console.log('🩺 [AGENT 4: HEALTH] Checking System Health...');
  
  try {
    const { data: records, error } = await supabase
      .from('system_health')
      .select('*')
      .eq('status', 'Fail');
      
    if (error) throw error;
    if (!records || records.length === 0) {
      console.log('✅ System Health 100% - No failures logged.');
      return 'System Health 100%';
    }

    console.warn(`⚠️ [HEALTH AGENT] Detected ${records.length} recent system failures.`);
    let summary = '';
    
    for (const record of records) {
      const msg = record.error_message || 'Unknown Error';
      const moduleName = record.last_module || 'Unknown Module';
      const time = record.created_at || new Date().toISOString();
      summary += `- [${time}] ${moduleName}: ${msg}\n`;
    }

    let report = `URGENT: ${records.length} errors detected in system.\n\n${summary}`;
    
    if (process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY) {
      report = await generateResponse({
        systemPrompt: "You are the autonomous DevOps Sentinel for Ainexlify Agencies. Summarize these errors in a highly concise, technical executive summary.",
        history: [{ role: 'user', content: summary }],
        maxTokens: 500,
        temperature: 0.1
      });
    }

    await sendEmail(
      'nexlifyhq@gmail.com',
      'nexlifyhq@gmail.com',
      `🚨 [Ainexlify Sentinel] Critical System Failures Detected`,
      report
    );

    // Update records to "Triaged" so we don't alert again
    for (const record of records) {
      await supabase.from('system_health').update({ status: 'Triaged' }).eq('id', record.id);
    }

    return `Triaged ${records.length} errors.`;
  } catch (err) {
    console.error('[AGENT 4: HEALTH] Error:', err.message);
    return 'Agent failed gracefully.';
  }
}

module.exports = { runHealthAgent };
