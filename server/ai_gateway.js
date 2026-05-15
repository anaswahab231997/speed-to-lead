/**
 * AI GATEWAY: Gemini-Core Sovereign Infrastructure
 * Mission: 24/7 High-Availability via Google Gemini exclusively.
 * Handles 10+ dealers with resilient internal retries.
 */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function generateResponse({ systemPrompt, history, maxTokens = 1000, temperature = 0.7 }) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_Api_Key;
  
  if (!GEMINI_API_KEY) {
    console.error('❌ [AI GATEWAY] CRITICAL: GEMINI_API_KEY is missing from environment!');
    return null;
  }

  const relayBase = process.env.GEMINI_RELAY_URL ? process.env.GEMINI_RELAY_URL.replace(/\/$/, '') : 'https://generativelanguage.googleapis.com';
  
  // Model priority list for internal failover
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  
  for (const model of models) {
    const geminiUrl = `${relayBase}/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    let attempts = 0;
    const maxAttempts = 2; // Per model

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for deep sales logic

        const payload = {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
          })),
          generationConfig: { maxOutputTokens: maxTokens, temperature: temperature }
        };

        console.log(`📡 [AI GATEWAY] Attempting ${model} (Attempt ${attempts}/${maxAttempts})...`);
        
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
          console.warn(`⚠️ [AI GATEWAY] ${model} Status ${response.status}: ${errMsg}`);
          
          // If rate limited, wait and retry same model
          if (response.status === 429) {
            console.log(`⏳ [AI GATEWAY] Rate limited. Waiting for jittered backoff...`);
            await sleep(1000 * attempts + Math.random() * 1000);
            continue;
          }

          // If location is not supported, we can't retry this model/key combination easily unless we have a relay
          if (errMsg.toLowerCase().includes('location is not supported')) {
            console.error(`🚨 [AI GATEWAY] REGIONAL BLOCK: Gemini is not available in this server's region.`);
            if (!process.env.GEMINI_RELAY_URL) {
              console.error(`💡 TIP: Deploy the Gemini Relay (Cloudflare Worker) and set GEMINI_RELAY_URL to bypass regional blocks.`);
            }
            break; // Try next model or fail
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn(`🕒 [AI GATEWAY] ${model} timed out after 15s.`);
        } else {
          console.error(`🚨 [AI GATEWAY] ${model} Exception:`, err.message);
        }
        await sleep(500); // Small cooldown before retry
      }
    }
    
    console.log(`🔄 [AI GATEWAY] ${model} failed. Falling back to next Gemini model...`);
  }

  console.error(`❌ [AI GATEWAY] TOTAL SYSTEM BLACKOUT: All Gemini models failed.`);
  return null;
}

module.exports = { generateResponse };
