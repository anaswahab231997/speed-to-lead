const Airtable = require('airtable');
const { sendEmail } = require('./google_auth');
const Anthropic = require('@anthropic-ai/sdk');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const DEALERS_TABLE = 'tblJWeMeKvHGB66EZ';
const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

async function runDealerAgent() {
  console.log('🕵️ [AGENT 3: DEALER] Scanning for Prospect Dealers...');
  
  try {
    const records = await base(DEALERS_TABLE).select({
      filterByFormula: `{Status} = 'Prospect'`
    }).all();
    
    if (records.length === 0) {
      return 'No new prospects found.';
    }

    let processedCount = 0;
    
    for (const record of records) {
      // Check if WhatsApp or Contact Person is missing per user instructions
      const hasWhatsApp = !!record.fields['WhatsApp'] || !!record.fields['Phone'];
      const hasContact = !!record.fields['Contact Person'];
      
      if (!hasWhatsApp || !hasContact) {
        const dealerName = record.fields['Name'] || 'Dealer';
        const emirate = record.fields['Emirate'] || 'UAE';
        
        // Draft personalized email via Claude
        const res = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Write a short, highly personalized cold email draft to pitch our Speed To Lead AI service to a used car dealer named ${dealerName} located in ${emirate}. The draft should be from Anas Wahab at Nexlify. Keep it under 100 words and focus on missed lead revenue.`
          }]
        });
        
        const draft = res.content[0].text;
        
        // Send draft for approval
        await sendEmail(
          'nexlifyhq@gmail.com',
          'nexlifyhq@gmail.com',
          `[DRAFT APPROVAL] Outreach to ${dealerName}`,
          `Please review the following draft for ${dealerName}:\n\n${draft}`
        );
        
        processedCount++;
      }
    }

    return `Drafted outreach for ${processedCount} dealers.`;
  } catch (err) {
    console.error('[AGENT 3: DEALER] Error:', err.message);
    throw err;
  }
}

module.exports = { runDealerAgent };
