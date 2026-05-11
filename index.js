require('dotenv').config();
const express = require('express');
const cors = require('cors');
const layla = require('./layla');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const log = (msg) => {
    process.stdout.write(`\n${msg}\n`);
};

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

app.post('/api/twilio/webhook', async (req, res) => {
    log('🚨 [INCOMING] Webhook detected from UAE Lead!');
    log(`📦 Payload: ${JSON.stringify(req.body, null, 2)}`);

    res.status(200).send('<Response></Response>');

    try {
        const body = req.body;
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

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    log('🚀 ==========================================');
    log(`🚀 SPEED TO LEAD™ GATEWAY: http://localhost:${PORT}`);
    log('🚀 STATUS: VERBOSE TRACING ACTIVE');
    log('🚀 ==========================================');
});

server.on('error', (err) => {
    log(`❌ [SERVER BINDING ERROR] ${err.message}`);
    process.exit(1);
});
