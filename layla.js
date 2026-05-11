/**
 * LAYLA.JS - The Emirati Closer for AI Nexlify Agencies
 * SENTINEL SHIELD BUILD - Immune to undefined and field mismatches
 */

const GEMINI_API_KEY= process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY= process.env.ANTHROPIC_API_KEY; // Corrected to ANTHROPIC_API_KEY
const AIRTABLE_API_KEY= process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN= process.env.TWILIO_AUTH_TOKEN;

// SENTINEL: Explicitly use TWILIO_SENDER_NUMBER from Render, with fallback
const TWILIO_PHONE_NUMBER = process.env.TWILIO_SENDER_NUMBER || '+14155238886';

const log = (msg) => {
    process.stdout.write(`\n[LAYLA] ${msg}\n`);
};

async function sendWhatsAppMessage(to, message) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // SENTINEL: Ensure sender is never undefined by directly using the corrected env var reference
    const sender = TWILIO_PHONE_NUMBER;

    const params = new URLSearchParams();
    params.append('To', `whatsapp:${to}`);
    params.append('From', `whatsapp:${sender}`); // Directly use the sender variable
    params.append('Body', message);

    log(`📱 [TWILIO] Sending from: whatsapp:${sender} to: whatsapp:${to}`);

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
            return { success: true, sid: data.sid };
        } else {
            log(`❌ [TWILIO] Failed: ${JSON.stringify(data)}`);
            return { success: false, error: data.message };
        }
    } catch (error) {
        log(`❌ [TWILIO] Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function logToAirtable(leadData) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`;

    // SENTINEL: Corrected field mapping - "AI Reasoning" for the AI's reply
    const record = {
        fields: {
            'Phone': leadData.from,
            'AI Reasoning': leadData.response, // Mapped to 'AI Reasoning' field as confirmed
            'Timestamp': new Date().toISOString()
        }
    };

    log(`📊 [AIRTABLE] Logging lead with fields: Phone, AI Reasoning, Timestamp`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        });

        const data = await response.json();

        if (response.ok) {
            log(`✅ [AIRTABLE] Lead logged. ID: ${data.id}`);
            return { success: true, recordId: data.id };
        } else {
            log(`❌ [AIRTABLE] Failed: ${JSON.stringify(data.error)}`);
            return { success: false, error: data.error };
        }
    } catch (error) {
        log(`❌ [AIRTABLE] Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function generateAIResponse(userMessage) {
    const url = 'https://api.anthropic.com/v1/messages';

    const systemPrompt = `You are Layla, a professional and warm AI sales assistant for AI Nexlify Agencies, a premium AI automation agency based in the UAE. Your role is to:
1. Greet leads warmly and professionally
2. Understand their business needs
3. Explain how AI automation can help their business
4. Qualify leads by asking about their industry, company size, and pain points
5. Schedule discovery calls with the sales team
6. Always maintain a helpful, consultative tone

Keep responses concise (under 160 words) and always end with a question to keep the conversation going.`;

    // SENTINEL: AI Guard with strict try/catch - pipeline continues even if AI fails
    try {
        log(`🔑 [AI] Attempting Anthropic call...`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY, // Ensure this is correctly set in Render Environment Variables
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // SENTINEL: Model upgraded to claude-3-5-sonnet-20240620
                model: 'claude-3-5-sonnet-20240620', 
                max_tokens: 300,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userMessage }
                ]
            })
        });

        const data = await response.json();

        if (response.ok && data.content && data.content[0]) {
            log(`✅ [AI] Response generated successfully`);
            return { success: true, text: data.content[0].text };
        } else {
            log(`❌ [AI] API Error: ${JSON.stringify(data)}`);
            return { 
                success: false, 
                text: 'Thank you for reaching out to AI Nexlify Agencies! One of our team members will be with you shortly. How can we help transform your business with AI today?',
                error: data
            };
        }
    } catch (error) {
        log(`❌ [AI] Exception: ${error.message}`);
        return { 
            success: false, 
            text: 'Thank you for reaching out to AI Nexlify Agencies! One of our team members will be with you shortly. How can we help transform your business with AI today?',
            error: error.message
        };
    }
}
