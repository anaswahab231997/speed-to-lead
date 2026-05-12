const axios = require('axios');

// Embed system prompt directly for clarity and self-containment.
const systemPrompt = `
IDENTITY:
You are Layla, a senior female Emirati sales closer and elite agent for Speed To Lead™. 
You are highly polished, sharp-witted, and possess an aesthetic, luxury-first personality. 
You speak with the confidence of someone who handles multi-million dirham deals daily.

CORE MISSION:
- Capture and qualify buyers in under 4 seconds.
- You represent the peak of the AI Nexlify NEURAL STACK (OpenRouter, Airtable, Cloudflare).
- Your goal is to move the lead to a "Close" or a "Showroom Visit" immediately.

TONE & STYLE:
- Polished & Professional: Use sophisticated English. You are polite but firm and result-oriented.
- Emirati Hospitality: Subtle warmth, but with a sharp focus on business.
- Direct & Faster than the Competition: "While others sleep, we close."

GUIDELINES:
1. Never sound like a robot. Sound like a high-end sales professional.
2. If the user is from the UAE (whatsapp:+971), acknowledge the prestige of their inquiry.
3. Your responses must be concise, aesthetic, and designed to trigger an immediate action.
`;

// Assuming airtable.js is present and provides these functions
const { getAirtable, updateAirtableLead } = require('./airtable'); 

async function callOpenRouter(prompt, model) { // Removed default model to enforce selection
    // CORRECTED: Using process.env instead of env
    const OPENROUTER_API_KEY= process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    }

    // CORRECTED: Updated model IDs
    const validModels = ['deepseek-ai/deepseek-chat', 'meta-llama/llama-3.1-70b-instruct'];
    if (!validModels.includes(model)) {
        // Fallback or throw error if an invalid model is passed
        console.warn(`Invalid model ID "${model}" provided. Falling back to 'deepseek-ai/deepseek-chat'.`);
        model = 'deepseek-ai/deepseek-chat'; // Default to a known valid model
    }

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: model, // Use the selected or fallback model
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message && response.data.choices[0].message.content) {
            return response.data.choices[0].message.content;
        } else {
            console.error("OpenRouter API Response Structure:", JSON.stringify(response.data, null, 2));
            throw new Error('Unexpected response structure from OpenRouter API.');
        }
    } catch (error) {
        console.error('Error calling OpenRouter API:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        const errorMessage = error.response?.data?.error?.message || error.message || 'An unknown OpenRouter API error.';
        throw new Error(`OpenRouter API interaction failed: ${errorMessage}`);
    }
}

async function handleInboundMessage(msg) {
    const { from, text, messageId, tenantDealer } = msg;

    let leadData = {};
    try {
        leadData = await getAirtable(from); 
        if (!leadData) {
            console.log(`No existing lead found for ${from}. Starting fresh conversation.`);
            leadData = { 
                get: (key) => {
                    if (key === 'Conversation History') return '';
                    if (key === 'Car Interest') return null; 
                    if (key === 'AI Reasoning') return null;
                    if (key === 'Lead Score') return null;
                    return null;
                }
            };
        }
    } catch (error) {
        console.error(`Error fetching Airtable data for ${from}:`, error);
        leadData = { get: (key) => '' }; 
    }

    let conversationHistory = leadData.get('Conversation History') || '';
    conversationHistory += `\nUser: ${text}`;

    const fullPrompt = `
        Conversation History:
        ${conversationHistory}
        
        New User Message: "${text}"
        
        Layla's Goal: Qualify the lead and drive to a "Close" or "Showroom Visit" immediately.
        Output your response in a structured format that includes:
        1. Layla's conversational reply.
        2. Parsable JSON containing 'carInterest', 'aiReasoning', and 'leadScore'. 
           - carInterest: Briefly state the car type discussed or inferred.
           - aiReasoning: Explain your scoring logic.
           - leadScore: Assign a score from 1-10 (10 being highest).

        Example structured output:
        "Great taste! That sounds like a fantastic SUV. Based on your inquiry, I'm assigning a high priority.
        \`\`\`json
        {
          "carInterest": "Luxury SUV",
          "aiReasoning": "High engagement, specific interest in luxury segment.",
          "leadScore": 9
        }
        \`\`\`"
    `;

    try {
        // CORRECTED: Explicitly pass model ID to callOpenRouter
        const laylaResponseContent = await callOpenRouter(fullPrompt, 'deepseek-ai/deepseek-chat'); // Using 'deepseek-ai/deepseek-chat' as primary
        
        let structuredResponse = {
            reply: laylaResponseContent, 
            carInterest: null,
            aiReasoning: null,
            leadScore: null,
            error: null
        };

        const jsonMatch = laylaResponseContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsedData = JSON.parse(jsonMatch[1]); 
                structuredResponse.carInterest = parsedData.carInterest || null;
                structuredResponse.aiReasoning = parsedData.aiReasoning || null;
                structuredResponse.leadScore = parsedData.leadScore || null;
                structuredResponse.reply = laylaResponseContent.replace(jsonMatch[0], '').trim(); 
            } catch (parseError) {
                console.error('Failed to parse JSON response:', parseError);
                structuredResponse.error = 'Failed to parse AI structured output.';
                structuredResponse.reply = laylaResponseContent; 
            }
        } else {
             structuredResponse.reply = laylaResponseContent;
        }

        conversationHistory += `\nLayla: ${structuredResponse.reply}`; 

        const updateData = {
            "Latest Layla Response": structuredResponse.reply,
            "Conversation History": conversationHistory,
            "Car Interest": structuredResponse.carInterest,
            "AI Reasoning": structuredResponse.aiReasoning,
            "Lead Score": structuredResponse.leadScore,
            ...(structuredResponse.error && { "AI Processing Error": structuredResponse.error }) 
        };
        
        await updateAirtableLead(from, updateData);

        console.log(`Layla's response to ${from}: ${structuredResponse.reply}`);
        return structuredResponse.reply; 

    } catch (error) {
        console.error('Error in handleInboundMessage:', error);
        await pingAlert(`Error processing inbound message from ${from}: ${error.message}`);
        throw error; 
    }
}

module.exports = {
    handleInboundMessage,
    callOpenRouter
};
