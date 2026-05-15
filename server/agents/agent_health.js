const { sendWhatsAppMessage } = require('../whatsapp');
const { sendEmail } = require('./google_auth');
const { generateResponse } = require('../ai_gateway');

const apiKey = process.env.AIRTABLE_API_KEY;
if (!apiKey) console.warn('⚠️ [AIRTABLE] Missing API Key in server/agents/agent_health.js');
const base = new Airtable({ apiKey: apiKey || 'missing' }).base(process.env.AIRTABLE_BASE_ID);
const HEALTH_TABLE = 'System Health'; // Use name if ID not mapped

async function runHealthAgent() {
  console.log('🏥 [AGENT 4: HEALTH] Checking System Health...');
  
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const records = await base(HEALTH_TABLE).select({
      filterByFormula: `AND({Status} = 'Fail', {Timestamp} >= '${oneHourAgo}')`
    }).all();
    
    if (records.length > 0) {
      console.log(`[AGENT 4: HEALTH] Found ${records.length} new failures! Alerting...`);
      await sendWhatsAppMessage(
        '+917977441599', 
        `🚨 System Health Monitor: ${records.length} new failures detected in the last hour.`
      );
    }
    
    // Check if it's 8 AM Gulf Standard Time (GST is UTC+4)
    // Server time vs GST handling (simple check for ~8 AM GST)
    const currentHourGST = (new Date().getUTCHours() + 4) % 24;
    
    if (currentHourGST === 8) {
      console.log('🏥 [AGENT 4: HEALTH] Generating Daily Summary...');
      const allToday = await base(HEALTH_TABLE).select({
        filterByFormula: `IS_SAME({Timestamp}, TODAY())`
      }).all();
      
      const fails = allToday.filter(r => r.fields['Status'] === 'Fail').length;
      const total = allToday.length;
      const successRate = total > 0 ? (((total - fails) / total) * 100).toFixed(1) : 100;
      
      const summary = await generateResponse({
        systemPrompt: "You are the Nexlify System Health Officer. Generate a professional, high-fidelity daily summary of system operations.",
        history: [{ role: 'user', content: `Generate a summary for these stats: Total Executions=${total}, Failures=${fails}, Success Rate=${successRate}%. Mention that the system is operating optimally and focus on reliability.` }],
        maxTokens: 300,
        temperature: 0.7
      }) || `Speed To Lead - Daily Health Summary\n\nTotal Executions: ${total}\nFailures: ${fails}\nSuccess Rate: ${successRate}%`;
      
      await sendEmail('nexlifyhq@gmail.com', 'nexlifyhq@gmail.com', 'Daily System Health Summary', summary);
    }
    
    return `Checked health. ${records.length} fails found.`;
  } catch (err) {
    console.error('[AGENT 4: HEALTH] Error:', err.message);
    throw err;
  }
}

module.exports = { runHealthAgent };
