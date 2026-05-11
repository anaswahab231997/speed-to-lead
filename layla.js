/**
 * LAYLA.JS - The Emirati Closer for AI Nexlify Agencies
 * SENTINEL SHIELD BUILD - Immune to undefined and field mismatches
 */

const ANTHROPIC_API_KEY= process.env.ANTHROPIC_API_KEY;
const AIRTABLE_API_KEY= process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN= process.env.TWILIO_AUTH_TOKEN;

// SENTINEL: Hardcoded fallback to prevent undefined
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+141****8886';

const log = (msg) => {
    process.stdout.write(`\n[LAYLA] ${msg}\n`);
};

async function sendWhatsAppMessage(to, message) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // SENTINEL: Ensure sender is never undefined
    const sender = TWILIO_PHONE_NUMBER || '+141****8886';

    const params = new URLSearchParams();
    params.append('To', `whatsapp:${to}`);
    params.append('From', `whatsapp:${sender}`);
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

    // SENTINEL: Corrected field mapping - "Car Interest" instead of "Message"
    const record = {
        fields: {
            'Phone': leadData.from,
            'Car Interest': leadData.text,
            'Response': leadData.response,
            'Timestamp': new Date().toISOString()
        }
    };

    log(`📊 [AIRTABLE] Logging lead with fields: Phone, Car Interest, Response, Timestamp`);

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
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
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

exports.handleInboundMessage = async function(data) {
    const { from, text, messageId } = data;

    log(`📥 Processing message from ${from}: "${text}"`);

    // Step 1: Generate AI response (continues even if AI fails)
    log('🤖 Generating AI response...');
    const aiResult = await generateAIResponse(text);
    const aiResponse = aiResult.text;
    
    if (aiResult.success) {
        log(`💬 AI Response (LIVE): "${aiResponse}"`);
    } else {
        log(`💬 AI Response (FALLBACK): "${aiResponse}"`);
    }

    // Step 2: Send response via Twilio (continues even if Step 1 failed)
    log('📤 Sending response via Twilio...');
    const sendResult = await sendWhatsAppMessage(from, aiResponse);

    // Step 3: Log to Airtable (continues even if Step 2 failed)
    log('📊 Logging to Airtable...');
    const logResult = await logToAirtable({
        from,
        text,
        response: aiResponse,
        messageId
    });

    log('✅ [COMPLETE] Pipeline finished');

    return {
        success: true,
        aiResult,
        twilioResult: sendResult,
        airtableResult: logResult
    };
};
