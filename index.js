require('dotenv').config();
const express = require('express');
const cors = require('cors');
const layla = require('./layla');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. FORCE THE LOGS TO WINDOWS
const log = (msg) => {
    process.stdout.write(`\n${msg}\n`);
};

// Global error handlers for uncaught exceptions and unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    log('❌ [FATAL] Unhandled Rejection at:');
    log(`❌ [FATAL] Promise: ${promise}`);
    log(`❌ [FATAL] Reason: ${reason}`);
});

process.on('uncaughtException', (err) => {
    log('❌ [FATAL] Uncaught Exception:');
    log(`❌ [FATAL] Error: ${err.message}`);
    log(`❌ [FATAL] Stack: ${err.stack}`);
});

// 2. THE UN-MUZZLED WEBHOOK
app.post('/api/twilio/webhook', async (req, res) => {
    log('🚨 [INCOMING] Webhook detected from UAE Lead!');
    log(`📦 Payload: ${JSON.stringify(req.body, null, 2)}`);

    // Send immediate 200 OK to Twilio
    res.status(200).send('<Response></Response>');

    try {
        const body = req.body;
        // Filter out status updates
        if (body.SmsStatus && body.SmsStatus !== 'received') {
            log(`⚠️ [FILTERED] Ignoring status: ${body.SmsStatus}`);
            return;
        }

        const msg = {
            from: (body.From || '').replace('whatsapp:', '').trim(),
            text: body.Body || '',
            messageId: body.MessageSid
        };

        log(`✅ [PROCEEDING] Body: "${msg.text}" from ${msg.from}`);
        log('🚀 [AI] Handing over to the Emirati Closer (Layla)...');

        await layla.handleInboundMessage({ ...msg, tenantDealer: null });

    } catch (err) {
        log(`❌ [ERROR] ${err.message}`);
        log(`❌ [STACK] ${err.stack}`);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

// Force the Loop & Async Block Audit: Ensure server binds and keeps event loop open
try {
    const server = app.listen(PORT, () => {
        log('🚀 ==========================================');
        log(`🚀 SPEED TO LEAD™ GATEWAY: http://localhost:${PORT}`);
        log('🚀 STATUS: VERBOSE TRACING ACTIVE');
        log('🚀 ==========================================');
    });

    server.on('error', (err) => {
        log(`❌ [SERVER BINDING ERROR] Server failed to bind to port ${PORT}: ${err.message}`);
        process.exit(1);
    });

} catch (error) {
    log(`❌ [CRITICAL STARTUP ERROR] An unexpected error occurred during server startup: ${error.message}`);
    log(`❌ [CRITICAL STARTUP ERROR] Stack: ${error.stack}`);
    process.exit(1);
}
