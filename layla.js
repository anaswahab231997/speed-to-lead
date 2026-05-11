/**
 * LAYLA.JS - The Emirati Closer for AI Nexlify Agencies
 * FINAL CLEAN BUILD - Zero Duplicates | Claude 3.5 Sonnet
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// SENTINEL: Use SENDER_NUMBER from Render with Sandbox fallback
const TWILIO_PHONE_NUMBER = process.env.TWILIO_SENDER_NUMBER || '+14155238886';

const log = (msg) => {
    process.stdout.write(`\n[LAYLA] ${msg}\n`);
};

async function sendWhatsAppMessage(to, message) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const params = new URLSearchParams();
    params.append('To', `whatsapp:${to}`);
    params.append('From', `whatsapp:${TWILIO_PHONE_NUMBER}`);
    params.append('Body', message);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        const data = await response.json();
        if (response.ok) {
            log(`✅ [TWILIO] Message sent. SID: ${data.sid}`);
            return { success: true };
        } else {
            log(`❌ [TWILIO] Failed: ${data.message}`);
            return { success: false };
        }
    } catch (error) {
        log(`❌ [TWILIO] Error: ${error.message}`);
        return { success: false };
    }
}

async function logToAirtable(leadData) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`;
    const record = {
        fields: {
            'Phone': leadData.from,
            'AI Reasoning': leadData.response,
            'Car Interest': leadData.text // Captures what they asked for
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        });
        if (response.ok) log(`✅ [AIRTABLE] Lead logged.`);
    } catch (error) {
        log(`❌ [AIRTABLE] Error: ${error.message}`);
    }
}

async function generateAIResponse(userMessage) {
    const url = 'https://api.anthropic.com/v1/messages';
    const systemPrompt = `You are Layla, a professional Emirati sales closer for AI Nexlify Agencies. You are warm, elite, and consultative. Greet the lead, ask about their business pain points, and suggest how AI automation can save them time. End with a question to book a call.`;

    try {
        log(`🔑 [AI] Calling Claude 3.5 Sonnet...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 300,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }]
            })
        });

        const data = await response.json();
        if (response.ok) return { success: true, text: data.content[0].text };
        
        log(`❌ [AI] API Error: ${data.error ? data.error.message : 'Unknown'}`);
        return { success: false, text: "Thank you for reaching out! Layla is reviewing your request and will be with you shortly." };
    } catch (error) {
        return { success: false, text: "Thank you for reaching out! Layla will be with you shortly." };
    }
}

// 🤝 THE FINAL HANDSHAKE
exports.handleInboundMessage = async function(data) {
    const { from, text } = data;
    log(`📥 Incoming: "${text}" from ${from}`);

    const aiResult = await generateAIResponse(text);
    await sendWhatsAppMessage(from, aiResult.text);
    await logToAirtable({ from, text, response: aiResult.text });

    log('✅ [COMPLETE] Pipeline finished');
};
