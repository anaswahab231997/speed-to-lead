/**
 * AI GATEWAY: Gemini-Core Sovereign Infrastructure (Refactored)
 * Mission: 24/7 High-Availability via Google Gemini exclusively.
 * Handles 10+ dealers with adaptive model-naming and resilient retries.
 */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function generateResponse({ systemPrompt, history, maxTokens = 1000, temperature = 0.7 }) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_Api_Key;
  
  if (!GEMINI_API_KEY) {
    console.error('❌ [AI GATEWAY] CRITICAL: GEMINI_API_KEY is missing from environment!');
    return null;
  }

  const relayBase = process.env.GEMINI_RELAY_URL ? process.env.GEMINI_RELAY_URL.replace(/\/$/, '') : 'https://generativelanguage.googleapis.com';
  
  // Adaptive Model Configuration
  const modelConfigs = [
    { name: 'gemini-1.5-flash', version: 'v1beta' },
    { name: 'gemini-2.0-flash-exp', version: 'v1beta' },
    { name: 'gemini-1.5-pro', version: 'v1beta' },
    { name: 'gemini-1.5-flash-latest', version: 'v1' },
    { name: 'gemini-1.5-pro-latest', version: 'v1' }
  ];
  
  for (const config of modelConfigs) {
    const { name: model, version } = config;
    const geminiUrl = `${relayBase}/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    let attempts = 0;
    const maxAttempts = (model.includes('2.0')) ? 1 : 2; // Fast-fail on experimental models

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s per attempt

        const payload = {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
          })),
          generationConfig: { maxOutputTokens: maxTokens, temperature: temperature }
        };

        console.log(`📡 [AI GATEWAY] Attempting ${model} (${version}) [Attempt ${attempts}/${maxAttempts}]...`);
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          clearTimeout(timeoutId);
          if (reply) {
            console.log(`✅ [AI GATEWAY] ${model} response secured.`);
            return reply;
          }
        } else {
          clearTimeout(timeoutId);
          const errJson = await response.json().catch(() => ({}));
          const errMsg = errJson.error?.message || response.statusText || response.status;
          
          console.warn(`⚠️ [AI GATEWAY] ${model} Error (${response.status}): ${errMsg}`);
          
          // 404 means the model string/version combination is invalid for this key. Skip immediately.
          if (response.status === 404) {
            console.log(`🚫 [AI GATEWAY] Model ${model} not found in ${version}. Pivoting to next...`);
            break; 
          }

          // 429 means Quota exceeded. Wait if it's the first attempt, else pivot.
          if (response.status === 429) {
            if (attempts < maxAttempts) {
              console.log(`⏳ [AI GATEWAY] Quota hit. Jittering before retry...`);
              await sleep(1500 + Math.random() * 1000);
              continue;
            } else {
              console.log(`🔄 [AI GATEWAY] Quota exhausted for ${model}. Pivoting...`);
              break;
            }
          }

          // 403 / Location Block
          if (response.status === 403 || errMsg.toLowerCase().includes('location is not supported')) {
            console.error(`🚨 [AI GATEWAY] REGIONAL BLOCK detected for ${model}.`);
            break; 
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn(`🕒 [AI GATEWAY] ${model} timed out.`);
        } else {
          console.error(`🚨 [AI GATEWAY] ${model} Exception:`, err.message);
        }
        await sleep(500); 
      }
    }
    
    console.log(`⏭️ [AI GATEWAY] Moving to next model tier...`);
  }

  console.error(`❌ [AI GATEWAY] TOTAL SYSTEM BLACKOUT: All Gemini tiers exhausted.`);
  return null;
}

module.exports = { generateResponse };
