require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 🤝 THE HANDSHAKE (TOP): Import using destructuring
const { handleInboundMessage } = require('./layla');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Force logs to be visible in the console
const log = (msg) => {
    process.stdout.write(`\n${msg}\n`);
};

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason) => log(`❌ [FATAL] Unhandled Rejection: ${reason}`));
process.on('uncaughtException', (err) => log(`❌ [FATAL] Uncaught Exception: ${err.message}`));

/**
 * THE UN-MUZZLED WEBHOOK
 * Specifically tuned for raw Twilio/WhatsApp payloads
 */
app.post('/api/twilio/webhook', async (req, res) => {
    log('🚨 [INCOMING] Webhook detected from UAE Lead!');
    
    // 1. Immediate 200 OK to Twilio to stop retries
    res.status(200).send('<Response></Response>');

    try {
        const body = req.body;
        
        // 2. Filter out status updates (SmsStatus 'sent', 'delivered', etc.)
        if (body.SmsStatus && body.SmsStatus !== 'received') {
            log(`⚠️ [FILTERED] Ignoring status update: ${body.SmsStatus}`);
            return;
        }

        // 3. Extract core payload
        const msg = {
            from: (body.From || '').replace('whatsapp:', '').trim(),
            text: body.Body || '',
            messageId: body.MessageSid
        };

        log(`✅ [PROCEEDING] Message: "${msg.text}" from ${msg.from}`);
        log('🚀 [AI] Handing over to Layla (The Emirati Closer)...');

        // 4. CALL LAYLA (The Handshake Check)
        if (typeof handleInboundMessage === 'function') {
            await handleInboundMessage({ ...msg, tenantDealer: null });
        } else {
            throw new Error('CRITICAL: handleInboundMessage is not a function. Check exports in layla.js!');
        }

    } catch (err) {
        log(`❌ [ERROR] ${err.message}`);
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    log('🚀 ==========================================');
    log(`🚀 SPEED TO LEAD™ GATEWAY LIVE`);
    log(`🚀 URL: http://localhost:${PORT}`);
    log('🚀 ==========================================');
});
