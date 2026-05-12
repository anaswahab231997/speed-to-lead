const axios = require('axios');
const express = require('express');
const cors = require('cors');
const { handleInboundMessage } = require('./layla');
const app = express();

// Load environment variables from .env file
require('dotenv').config();

// --- Sentinel Agent Integration ---
// Assume Sentinel agent is available and has a pingAlert function
// Replace with actual import path and instantiation if Sentinel is a module
// const Sentinel = require('./sentinel'); 
// const sentinelAgent = new Sentinel();

// Placeholder for Sentinel pingAlert function for demonstration
const pingAlert = async (message) => {
    console.log(`SENTINEL ALERT: ${message}`);
    // In a real scenario, this would notify the CEO via the configured channel
    // For now, it logs to the console.
};

// --- Credit Monitor Logic ---
async function checkOpenRouterBalance() {
    // CORRECTED: Using process.env instead of env
    const OPENROUTER_API_KEY= process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
        console.error('OPENROUTER_API_KEY is not set. Cannot check balance.');
        // Log this critical configuration error
        await pingAlert('CRITICAL: OPENROUTER_API_KEY is missing. Cannot monitor API usage.');
        return null; 
    }

    try {
        // NOTE: As of my last update, OpenRouter does not provide a public API endpoint
        // to directly query the account balance via their Chat Completions API.
        // This function serves as a placeholder. In a real-world scenario, you would need:
        // 1. A dedicated billing/account API if OpenRouter provides one.
        // 2. Or, manually monitor the balance and update a secured value periodically.
        // 3. Or, use a service that tracks API spending if integrated.
        
        // SIMULATION: Replace this with actual balance retrieval logic.
        // For now, we simulate a balance that might trigger the alert.
        const simulatedBalance = 4.50; // Example: Balance is below $5 threshold.
        console.log(`Current OpenRouter balance (simulated): $${simulatedBalance.toFixed(2)}`);
        return simulatedBalance;

    } catch (error) {
        console.error('Error checking OpenRouter balance:', error.message);
        await pingAlert(`Error while checking OpenRouter balance: ${error.message}`);
        return null; // Indicate failure to retrieve balance
    }
}

// --- Express App Setup ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global logging function
const log = (msg) => {
    process.stdout.write(`\n${msg}\n`);
};

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    log('❌ [FATAL] Unhandled Rejection at:');
    log(`❌ [FATAL] Promise: ${promise}`);
    log(`❌ [FATAL] Reason: ${reason}`);
    // Consider notifying Sentinel about fatal errors as well
    // pingAlert(`FATAL Unhandled Rejection: ${reason}`);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    log('❌ [FATAL] Uncaught Exception:');
    log(`❌ [FATAL] Error: ${err.message}`);
    log(`❌ [FATAL] Stack: ${err.stack}`);
    // Consider notifying Sentinel about fatal errors as well
    // pingAlert(`FATAL Uncaught Exception: ${err.message}`);
    process.exit(1);
});

// --- API Route: Twilio Webhook ---
app.post('/api/twilio/webhook', async (req, res) => {
    log('🚨 [INCOMING] Webhook detected from UAE Lead!');
    log(`📦 Payload: ${JSON.stringify(req.body, null, 2)}`);

    // Respond to Twilio immediately to avoid timeouts
    res.status(200).send('<Response></Response>');

    try {
        const body = req.body;
        // Filter out non-received messages (e.g., delivery status updates)
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
        // Perform balance check before potentially costly AI processing
        const currentBalance = await checkOpenRouterBalance();
        const alertThreshold = 5.00; // Set alert at $5

        if (currentBalance !== null && currentBalance < alertThreshold) {
            await pingAlert(`🚨 OPENROUTER BALANCE LOW: Current balance is $${currentBalance.toFixed(2)}, which is below the $${alertThreshold.toFixed(2)} threshold. IMMEDIATE ACTION REQUIRED.`);
            // Decide if processing should continue or be halted based on balance
            // For now, we continue but alert the CEO.
        }
        // --- End Credit Monitor Check ---

        // Call Layla to handle the inbound message and AI processing
        await handleInboundMessage({ ...msg, tenantDealer: null });

    } catch (err) {
        log(`❌ [ERROR] Failed to process webhook: ${err.message}`);
        // Notify Sentinel about the processing error
        await pingAlert(`Webhook processing error: ${err.message}`);
    }
});

// --- Server Startup ---
const PORT = process.env.PORT || 3001; // CORRECTED: Using process.env for PORT

try {
    const server = app.listen(PORT, () => {
        log('🚀 ==========================================');
        log(`🚀 SPEED TO LEAD™ GATEWAY: http://localhost:${PORT}`);
        log(`🚀 STATUS: OpenRouter Integration Active | Mode: ${process.env.WHATSAPP_MODE || 'default'}`); // CORRECTED: Using process.env for WHATSAPP_MODE
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
