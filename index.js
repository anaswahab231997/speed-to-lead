const axios = require('axios');
const express = require('express');
const cors = require('cors');
const { handleInboundMessage } = require('./layla');
// CORRECTED: Import getAirtable from airtable.js
const { getAirtable } = require('./airtable'); 
const app = express();

// Load environment variables from .env file
require('dotenv').config();

// --- Sentinel Agent Integration ---
// CORRECTED: Ensuring pingAlert is accessible. 
// If Sentinel is a module, it should be imported and instantiated.
// For now, assuming pingAlert is defined globally or within this scope.
const pingAlert = async (message) => {
    console.log(`SENTINEL ALERT: ${message}`);
    // In a real scenario, this would notify the CEO via the configured channel
};

// --- Credit Monitor Logic ---
async function checkOpenRouterBalance() {
    const OPENROUTER_API_KEY= process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
        console.error('OPENROUTER_API_KEY is not set. Cannot check balance.');
        await pingAlert('CRITICAL: OPENROUTER_API_KEY is missing. Cannot monitor API usage.');
        return null; 
    }

    try {
        // NOTE: Placeholder for actual balance check.
        // SIMULATION: Balance adjusted to trigger alert at $1.00
        const simulatedBalance = 0.75; // Example: Balance below $1.00 threshold.
        console.log(`Current OpenRouter balance (simulated): $${simulatedBalance.toFixed(2)}`);
        return simulatedBalance;

    } catch (error) {
        console.error('Error checking OpenRouter balance:', error.message);
        await pingAlert(`Error while checking OpenRouter balance: ${error.message}`);
        return null; 
    }
}

// --- Express App Setup ---
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
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    log('❌ [FATAL] Uncaught Exception:');
    log(`❌ [FATAL] Error: ${err.message}`);
    log(`❌ [FATAL] Stack: ${err.stack}`);
    process.exit(1);
});

// --- API Route: Twilio Webhook ---
app.post('/api/twilio/webhook', async (req, res) => {
    log('🚨 [INCOMING] Webhook detected from UAE Lead!');
    log(`📦 Payload: ${JSON.stringify(req.body, null, 2)}`);

    res.status(200).send('<Response></Response>');

    try {
        const body = req.body;
        if (body.SmsStatus && body.SmsStatus !== 'received') {
            log(`⚠️ [FILTERED] Ignoring status update: ${body.SmsStatus}`);
            return;
        }

        const msg = {
            from: (body.From || '').replace('whatsapp:', '').trim(),
            text: body.Body || '',
            messageId: body.MessageSid
        };

        log(`✅ [PROCEEDING] Message: "${msg.text}" from ${msg.from}`);
        log('🚀 [AI] Routing to Layla, the Emirati Closer...');

        // --- Credit Monitor Check ---
        const currentBalance = await checkOpenRouterBalance();
        // CORRECTED: Lowered alert threshold
        const alertThreshold = 1.00; // Set alert at $1.00 

        if (currentBalance !== null && currentBalance < alertThreshold) {
            await pingAlert(`🚨 OPENROUTER BALANCE LOW: Current balance is $${currentBalance.toFixed(2)}, which is below the $${alertThreshold.toFixed(2)} threshold. IMMEDIATE ACTION REQUIRED.`);
        }
        // --- End Credit Monitor Check ---

        await handleInboundMessage({ ...msg, tenantDealer: null });

    } catch (err) {
        log(`❌ [ERROR] Failed to process webhook: ${err.message}`);
        await pingAlert(`Webhook processing error: ${err.message}`);
    }
});

// --- Server Startup ---
// CORRECTED: Using process.env for PORT
const PORT = process.env.PORT || 3001; 

try {
    const server = app.listen(PORT, () => {
        log('🚀 ==========================================');
        log(`🚀 SPEED TO LEAD™ GATEWAY: http://localhost:${PORT}`);
        // CORRECTED: Using process.env for WHATSAPP_MODE
        log(`🚀 STATUS: OpenRouter Integration Active | Mode: ${process.env.WHATSAPP_MODE || 'default'}`); 
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
