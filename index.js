const axios = require('axios');
const { getAirtable, updateAirtableLead } = require('./airtable');

const systemPrompt = `You are Layla, a senior female Emirati sales closer. Sharp, polished, luxury-first. Respond concisely to qualify car leads.`;

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
