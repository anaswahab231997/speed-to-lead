/**
 * AI GATEWAY: Gemini-Sovereign Prime Architecture
 * Mission: 24/7 High-Availability via the Golden Model (Gemini 2.5 Flash).
 * Hardened for direct, zero-latency sales orchestration.
 */

async function generateResponse({ systemPrompt, history, maxTokens = 1000, temperature = 0.7 }) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_Api_Key;
  
  if (!GEMINI_API_KEY) {
    console.error('❌ [AI GATEWAY] CRITICAL: GEMINI_API_KEY is missing!');
    return { error: true, reason: "API_KEY_MISSING" };
  }

  const relayBase = process.env.GEMINI_RELAY_URL 
    ? process.env.GEMINI_RELAY_URL.replace(/\/$/, '') 
    : 'https://generativelanguage.googleapis.com';
  
  // 🛰️ THE GOLDEN MODEL: Identified via rigorous discovery as the most stable & responsive tier.
  const model = 'gemini-2.5-flash';
  const version = 'v1beta';
  const geminiUrl = `${relayBase}/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for deep sales reasoning

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      generationConfig: { 
        maxOutputTokens: maxTokens, 
        temperature: temperature,
        topP: 0.95,
        topK: 40
      }
    };

    console.log(`📡 [AI GATEWAY] Dispatching to Golden Model: ${model} (${version})...`);
    
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
        console.log(`✅ [AI GATEWAY] ${model} response secured.`);
        return reply;
      }
    } else {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || response.statusText || response.status;
      console.error(`🚨 [AI GATEWAY] ${model} Critical Error (${response.status}): ${errMsg}`);
      if (response.status === 429) return { error: true, reason: "RATE_LIMIT" };
      return { error: true, reason: `API_ERROR: ${errMsg}` };
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`🕒 [AI GATEWAY] ${model} timed out after 20s.`);
      return { error: true, reason: "TIMEOUT" };
    } else {
      console.error(`🚨 [AI GATEWAY] ${model} Exception:`, err.message);
      return { error: true, reason: `EXCEPTION: ${err.message}` };
    }
  }

  console.error(`❌ [AI GATEWAY] TOTAL SYSTEM BLACKOUT.`);
  return { error: true, reason: "UNKNOWN_BLACKOUT" };
}

module.exports = { generateResponse };
