require('dotenv').config();
const express = require('express');
const { handleInboundMessage } = require('./layla');
const app = express();

// FIXED: Defined pingAlert at the top level so it is visible everywhere
const pingAlert = (msg) => {
    console.log(`SENTINEL ALERT: ${msg}`);
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/twilio/webhook', async (req, res) => {
    res.status(200).send('<Response></Response>');
    try {
        const from = (req.body.From || '').replace('whatsapp:', '').trim();
        const text = req.body.Body || '';

        // Credit Monitor (Lowered threshold to $0.50)
        const balance = 0.75; // Simulation based on your logs
        if (balance < 0.50) pingAlert("Low Balance!");

        await handleInboundMessage({ from, text });
    } catch (err) {
        // FIXED: pingAlert is now defined and will work here
        pingAlert(`Webhook Error: ${err.message}`);
    }
});

app.listen(process.env.PORT || 10000, () => console.log("Speed to Lead Live"));
