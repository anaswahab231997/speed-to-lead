const { supabase } = require('../supabase');
const { sendEmail } = require('./google_auth');
const { generateResponse } = require('../ai_gateway');

async function runDealerAgent() {
  console.log('💎 [AGENT 3: DEALER] Scanning for Prospect Dealers...');
  
  try {
    const { data: records, error } = await supabase
      .from('market_recon')
      .select('*')
      .eq('status', 'Prospect');
    
    if (error && error.code !== '42703') throw error; // ignore if status column missing
    if (!records || records.length === 0) {
      return 'No new prospects found.';
    }

    let processedCount = 0;
    
    for (const record of records) {
      const hasWhatsApp = !!record.whatsapp_working || !!record.phone;
      const hasContact = !!record.contact_person;
      
      if (!hasWhatsApp || !hasContact) {
        const dealerName = record.dealer_name || 'Dealer';
        const emirate = record.emirate || 'UAE';
        
        let draft = '';
        if (process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY) {
          draft = await generateResponse({
            systemPrompt: "You are Anas Wahab from Nexlify. Write high-conversion sales outreach.",
            history: [{ role: 'user', content: `Write a short, highly personalized cold email draft to pitch our Speed To Lead AI service to a used car dealer named ${dealerName} located in ${emirate}. Keep it under 100 words and focus on missed lead revenue.` }],
            maxTokens: 1000,
            temperature: 0.7
          });
        }

        if (!draft && process.env.OPENROUTER_API_KEY) {
          try {
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
    // Silent fail to prevent Vercel crashes
    return 'Agent failed gracefully.';
  }
}

module.exports = { runDealerAgent };
