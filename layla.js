/**
 * LAYLA.JS - The Emirati Closer for AI Nexlify Agencies
 * GOOGLE GEMINI EDITION - High Performance | Zero Latency
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Using your Google Pro Key
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_SENDER_NUMBER || '+14155238886';

const log = (msg) => {
    process.stdout.write(`\n[LAYLA] ${msg}\n`);
};

async function generateAIResponse(userMessage) {
    // Google Gemini API Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = "You are Layla, an elite Emirati sales closer for AI Nexlify Agencies in the UAE. You are professional, warm, and highly consultative. Greet the lead, explain how AI automation saves businesses time and money, and ask one qualifying question to book a discovery call.";

    try {
        log(`🔑 [AI] Calling Gemini 1.5 Flash...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemPrompt}\n\nUser Message: ${userMessage}` }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            log(`✅ [AI] Gemini Response Generated.`);
            return { success: true, text: data.candidates[0].content.parts[0].text };
        } else {
            log(`❌ [AI] Gemini Error: ${JSON.stringify(data)}`);
            return { success: false, text: "Thank you for reaching out! Layla is reviewing your request and will be with you shortly." };
        }
    } catch (error) {
        log(`❌ [AI] Exception: ${error.message}`);
        return { success: false, text: "Thank you for reaching out! Layla will be with you shortly." };
    }
}

async function sendWhatsAppMessage(to, message) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'To': `whatsapp:${to}`,
                'From': `whatsapp:${TWILIO_PHONE_NUMBER}`,
                'Body': message
            })
        });
        log(`✅ [TWILIO] Sent to ${to}`);
    } catch (e) { log(`❌ [TWILIO] Error: ${e.message}`); }
}

async function logToAirtable(from, text, response) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    'Phone': from,
                    'AI Reasoning': response,
                    'Car Interest': text
                }
            })
        });
        log(`✅ [AIRTABLE] Logged.`);
    } catch (e) { log(`❌ [AIRTABLE] Error: ${e.message}`); }
}

// THE FINAL HANDSHAKE
exports.handleInboundMessage = async function(data) {
    const { from, text } = data;
    log(`📥 Incoming: "${text}" from ${from}`);

    const aiResult = await generateAIResponse(text);
    await sendWhatsAppMessage(from, aiResult.text);
    await logToAirtable(from, text, aiResult.text);

    log('✅ [COMPLETE] Pipeline finished');
};
