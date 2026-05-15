const { getGmailClient, sendEmail } = require('./google_auth');
const { generateResponse } = require('../ai_gateway');

async function runEmailAgent() {
  console.log('📧 [AGENT 2: EMAIL] Triaging Inboxes (nexlifyhq & anaswahab97)...');
  
  try {
    const accounts = ['nexlifyhq@gmail.com', 'anaswahab97@gmail.com'];
    let processedEmails = 0;

    for (const account of accounts) {
      const gmail = await getGmailClient(account);
      
      // Fetch unread messages
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: 5
      });

      const messages = res.data.messages || [];
      
      for (const msg of messages) {
        const msgData = await gmail.users.messages.get({ userId: 'me', id: msg.id });
        const snippet = msgData.data.snippet;
        
        // Use AI Gateway for triage classification
        const category = await generateResponse({
          systemPrompt: "You are an elite triage agent. Classify emails with extreme precision.",
          history: [{ role: 'user', content: `Classify this email snippet into exactly ONE of these categories: Client, Lead, Supplier, Junk. Snippet: "${snippet}"` }],
          maxTokens: 50,
          temperature: 0
        }) || 'Junk';
        console.log(`[AGENT 2: EMAIL] Classified as ${category}: "${snippet.slice(0, 30)}..."`);
        
        if (category.includes('Client') || category.includes('Lead')) {
          await sendEmail(
            account, 
            account, 
            `[DRAFT REQUIRED] Unread ${category} Email`, 
            `Please review this ${category} email:\n\n${snippet}`
          );
        } else if (category.includes('Supplier')) {
          console.log(`[AGENT 2: EMAIL] Supplier logged to CRM (Mocked).`);
        } else {
          console.log(`[AGENT 2: EMAIL] Junk ignored.`);
        }
        
        processedEmails++;
      }
    }

    return `Triaged ${processedEmails} unread emails.`;
  } catch (err) {
    console.error('[AGENT 2: EMAIL] Error:', err.message);
    throw err;
  }
}

module.exports = { runEmailAgent };
