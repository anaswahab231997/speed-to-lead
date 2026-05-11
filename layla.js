const fetch = require('node-fetch');

// 🔐 Secure Key Mapping from Render
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SENDER = process.env.TWILIO_SENDER_NUMBER || '+14155238886';

const log = (msg) => {
    process.stdout.write(`\n[LAYLA] ${msg}\n`);
};

async function handleInboundMessage(data) {
    const { from, text } = data;
    log(`📥 Incoming from ${from}: "${text}"`);

    // 1. AI RESPONSE (Google Gemini 1.5 Flash v1 Stable)
    let aiResponse = "Thank you for reaching out to AI Nexlify Agencies! Our team will be with you shortly.";
    
    try {
        log(`🔑 [AI] Calling Gemini 1.5 Flash...`);
        // Note the backticks around the URL - this prevents the SyntaxError
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
        
        const systemPrompt = "You are Layla, an elite sales closer for AI Nexlify Agencies. Warm, professional, UAE-based. Greet the lead, suggest AI automation benefits, and ask a question to book a call.";
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemPrompt}\n\nUser: ${text}` }]
                }]
            })
        });

        const resData = await response.json();
        if (response.ok && resData.candidates) {
            aiResponse = resData.candidates[0].content.parts[0].text;
            log(`✅ [AI] Gemini success.`);
        } else {
            log(`❌ [AI] Error: ${JSON.stringify(resData)}`);
        }
    } catch (e) {
        log(`❌ [AI] Exception: ${e.message}`);
    }

    // 2. TWILIO OUTBOUND
    try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'To': `whatsapp:${from}`,
                'From': `whatsapp:${TWILIO_SENDER}`,
                'Body': aiResponse
            })
        });
        log(`✅ [TWILIO] Message sent.`);
    } catch (e) {
        log(`❌ [TWILIO] Error: ${e.message}`);
    }

    // 3. AIRTABLE LOGGING
    try {
        const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`;
        await fetch(airtableUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    'Phone': from,
                    'AI Reasoning': aiResponse,
                    'Car Interest': text
                }
            })
        });
        log(`✅ [AIRTABLE] Record created.`);
    } catch (e) {
        log(`❌ [AIRTABLE] Error: ${e.message}`);
    }

    log('🏁 Pipeline Finished.');
}

module.exports = { handleInboundMessage };
