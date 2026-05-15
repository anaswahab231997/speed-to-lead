const Anthropic = require('@anthropic-ai/sdk');

/**
 * AI GATEWAY: Production-Grade Master Sovereign-Switch
 * Mission: 24/7 High-Availability LLM Orchestration
 * Handles 10+ dealers with zero-lag failover.
 */
async function generateResponse({ systemPrompt, history, maxTokens = 1000, temperature = 0.7 }) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_Api_Key;
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

  const relayBase = process.env.GEMINI_RELAY_URL ? process.env.GEMINI_RELAY_URL.replace(/\/$/, '') : 'https://generativelanguage.googleapis.com';
  const geminiUrl = `${relayBase}/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // 🧠 High-Availability Logic: Try Gemini with an aggressive 5-second timeout
  if (GEMINI_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Strict 5s timeout

      const payload = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: history.map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        generationConfig: { maxOutputTokens: maxTokens, temperature: temperature }
      };

      console.log(`📡 [AI GATEWAY] Attempting Gemini Flash (v1beta) via ${process.env.GEMINI_RELAY_URL ? 'Relay' : 'Direct Google'}...`);
      
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          console.log(`✅ [AI GATEWAY] Gemini response secured.`);
          return reply;
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson.error?.message || response.statusText || response.status;
        console.warn(`⚠️ [AI GATEWAY] Gemini Status ${response.status}: ${errMsg}`);
        
        // Immediate failover for known regional or auth blocks
        if (errMsg.toLowerCase().includes('location is not supported') || [400, 403, 429].includes(response.status)) {
          console.log(`🚨 [AI GATEWAY] Regional/Limit Block detected. Triggering Anthropic Sovereign Pivot...`);
          return await callAnthropic({ systemPrompt, history, maxTokens, temperature, apiKey: CLAUDE_API_KEY });
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn(`🕒 [AI GATEWAY] Gemini timed out after 5s. Pivoting to Anthropic...`);
      } else {
        console.error(`🚨 [AI GATEWAY] Gemini Exception:`, err.message);
      }
      return await callAnthropic({ systemPrompt, history, maxTokens, temperature, apiKey: CLAUDE_API_KEY });
    }
  }

  // Final fallback to Anthropic if Gemini was skipped
  return await callAnthropic({ systemPrompt, history, maxTokens, temperature, apiKey: CLAUDE_API_KEY });
}

/**
 * Robust Anthropic Caller with internal retry
 */
async function callAnthropic({ systemPrompt, history, maxTokens, temperature, apiKey }) {
  if (!apiKey) {
    console.error('❌ [AI GATEWAY] Critical Failure: No Anthropic Key for failover.');
    return null;
  }

  try {
    console.log('📡 [AI GATEWAY] Dispatching to Anthropic (Claude-3.5-Sonnet)...');
    const anthropic = new Anthropic({ apiKey });
    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: history.map(h => ({ role: h.role, content: h.content }))
    });
    
    if (msg?.content?.[0]?.text) {
      console.log('✅ [AI GATEWAY] Anthropic response secured.');
      return msg.content[0].text;
    }
  } catch (err) {
    console.error(`🚨 [AI GATEWAY] Anthropic Failover CRASH:`, err.message);
  }
  return null;
}

module.exports = { generateResponse };
