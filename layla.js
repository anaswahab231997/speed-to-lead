/**
 * LAYLA.JS - The Emirati Closer for AI Nexlify Agencies
 * Handles inbound WhatsApp messages, processes with AI, logs to Airtable, and responds via Twilio.
 */

// Environment Variables (Zero Hardcoding)
const GEMINI_API_KEY=***
const ANTHROPIC_API_KEY=***
const AIRTABLE_API_KEY=***
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN=***
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Logging utility
const log = (msg) => {
    process.stdout.write(`\n[LAYLA] ${msg}\n`);
};

/**
 * Sends a WhatsApp message via Twilio API
 */
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
            log(`✅ [TWILIO] Message sent successfully. SID: ${data.sid}`);
            return { success: true, sid: data.sid };
        } else {
            log(`❌ [TWILIO] Failed to send message: ${data.message}`);
            return { success: false, error: data.message };
        }
    } catch (error) {
        log(`❌ [TWILIO] Error sending message: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Logs a lead interaction to Airtable
 */
async function logToAirtable(leadData) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`;

    const record = {
        fields: {
            'Phone': leadData.from,
            'Message': leadData.text,
            'Response': leadData.response,
            'Timestamp': new Date().toISOString(),
            'MessageSID': leadData.messageId || ''
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

        const data = await response.json();

        if (response.ok) {
            log(`✅ [AIRTABLE] Lead logged successfully. Record ID: ${data.id}`);
            return { success: true, recordId: data.id };
        } else {
            log(`❌ [AIRTABLE] Failed to log lead: ${JSON.stringify(data.error)}`);
            return { success: false, error: data.error };
        }
    } catch (error) {
        log(`❌ [AIRTABLE] Error logging to Airtable: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Generates an AI response using Anthropic Claude API
 */
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

    try {
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
            return data.content[0].text;
        } else {
            log(`❌ [AI] Failed to generate response: ${JSON.stringify(data)}`);
            return 'Thank you for reaching out to AI Nexlify Agencies! One of our team members will be with you shortly. How can we help transform your business with AI today?';
        }
    } catch (error) {
        log(`❌ [AI] Error generating response: ${error.message}`);
        return 'Thank you for reaching out to AI Nexlify Agencies! One of our team members will be with you shortly. How can we help transform your business with AI today?';
    }
}

/**
 * Main handler for inbound WhatsApp messages
 */
exports.handleInboundMessage = async function(data) {
    const { from, text, messageId, tenantDealer } = data;

    log(`📥 Processing message from ${from}: "${text}"`);

    try {
        // Step 1: Generate AI response
        log('🤖 Generating AI response...');
        const aiResponse = await generateAIResponse(text);
        log(`💬 AI Response: "${aiResponse}"`);

        // Step 2: Send response via Twilio
        log('📤 Sending response via Twilio...');
        const sendResult = await sendWhatsAppMessage(from, aiResponse);

        // Step 3: Log to Airtable
        log('📊 Logging interaction to Airtable...');
        const logResult = await logToAirtable({
            from,
            text,
            response: aiResponse,
            messageId
        });

        log('✅ [COMPLETE] Message processed successfully');

        return {
            success: true,
            aiResponse,
            twilioResult: sendResult,
            airtableResult: logResult
        };

    } catch (error) {
        log(`❌ [CRITICAL] Error processing message: ${error.message}`);
        log(`❌ [STACK] ${error.stack}`);

        // Attempt to send a fallback message
        try {
            await sendWhatsAppMessage(from, 'Thank you for your message! Our team will get back to you shortly.');
        } catch (fallbackError) {
            log(`❌ [FALLBACK] Failed to send fallback message: ${fallbackError.message}`);
        }

        return {
            success: false,
            error: error.message
        };
    }
};
