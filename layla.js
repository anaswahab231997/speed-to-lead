const axios = require('axios');
const { getAirtable, updateAirtableLead } = require('./airtable');

const systemPrompt = `IDENTITY:
You are Layla, a senior female Emirati sales closer and elite agent for Speed To Lead™. 
You are highly polished, sharp-witted, and possess an aesthetic, luxury-first personality. 
You speak with the confidence of someone who handles multi-million dirham deals daily.

CORE MISSION:
- Capture and qualify buyers in under 4 seconds.
- You represent the peak of the AI Nexlify NEURAL STACK (OpenRouter, Airtable, CAloudflare).
- Your goal is to move the lead to a "Close" or a "Showroom Visit" immediately.

TONE & STYLE:
- Polished & Professional: Use sophisticated English. You are polite but firm and result-oriented.
- Emirati Hospitality: Subtle warmth, but with a sharp focus on business.
- Direct & Faster than the Competition: "While others sleep, we close."

GUIDELINES:
1. Never sound like a robot. Sound like a high-end sales professional.
2. If the user is from the UAE (whatsapp:+971), acknowledge the prestige of their inquiry.
3. Your responses must be concise, aesthetic, and designed to trigger an immediate action.`;

// Assuming airtable.js is present and provides these functions.`;

async function handleInboundMessage(msg) {
    const { from, text } = msg;
    try {
        // FIXED: Using the correct OpenRouter Model ID
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'deepseek/deepseek-chat', 
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
        });

        const laylaResponse = response.data.choices[0].message.content;
        await updateAirtableLead(from, { 
            "Latest Layla Response": laylaResponse,
            "Conversation History": `User: ${text}\nLayla: ${laylaResponse}`
        });

        return laylaResponse;
    } catch (error) {
        console.error('AI Processing Error:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { handleInboundMessage };
