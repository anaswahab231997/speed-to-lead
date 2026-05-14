const Airtable = require('airtable');
const { sendEmail } = require('./google_auth');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const DEALERS_TABLE = 'tblJWeMeKvHGB66EZ';

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
      const hasWhatsApp = !!record.fields['WhatsApp'] || !!record.fields['Phone'];
      const hasContact = !!record.fields['Contact Person'];
      
      if (!hasWhatsApp || !hasContact) {
        const dealerName = record.fields['Name'] || 'Dealer';
        const emirate = record.fields['Emirate'] || 'UAE';
        
        // 🧠 Antigravity Direct-Flash Protocol: High-Availability Outreach
        let draft = '';
        if (process.env.GEMINI_API_KEY) {
          try {
            console.log(`📡 [AGENT 3: DEALER] Dispatching to Direct Gemini 2.5 Flash...`);
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
            
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: "You are Anas Wahab from Nexlify. Write high-conversion sales outreach." }]
                },
                contents: [{
                  role: 'user',
                  parts: [{ text: `Write a short, highly personalized cold email draft to pitch our Speed To Lead AI service to a used car dealer named ${dealerName} located in ${emirate}. Keep it under 100 words and focus on missed lead revenue.` }]
                }],
                generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
              })
            });

            if (response.ok) {
              const data = await response.json();
              draft = data.candidates?.[0]?.content?.parts?.[0]?.text;
            }
          } catch (e) {
            console.error('[AGENT 3: DEALER DIRECT AI ERROR]', e.message);
          }
        }

        if (!draft && process.env.OPENROUTER_API_KEY) {
          try {
            console.log(`📡 [AGENT 3: DEALER] Dispatching to OpenRouter Fallback...`);
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://ainexlifyagencies.com',
                'X-Title': 'AI Nexlify Agencies'
              },
              body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [{
                  role: 'user',
                  content: `Write a short, highly personalized cold email draft to pitch our Speed To Lead AI service to a used car dealer named ${dealerName} located in ${emirate}. The draft should be from Anas Wahab at Nexlify. Keep it under 100 words and focus on missed lead revenue.`
                }],
                max_tokens: 1000,
                temperature: 0.7
              })
            });

            if (response.ok) {
              const responseData = await response.json();
              draft = responseData.choices[0].message.content;
            }
          } catch (e) {
            console.error('[AGENT 3: DEALER OPENROUTER ERROR]', e.message);
          }
        }

        if (!draft) draft = `[FAILED TO GENERATE DRAFT] Manual outreach required for ${dealerName}.`;
        
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
