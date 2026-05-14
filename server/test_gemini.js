require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function runDiagnostic() {
  if (!GEMINI_API_KEY) {
    console.log('🔴 [SYSTEM DEAD] Google API Key failed. Reason: GEMINI_API_KEY is missing from .env');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    contents: [{
      parts: [{ text: "ping" }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.status === 200) {
      console.log('🟢 [SYSTEM ALIVE] Google API Key is ACTIVE and routing correctly.');
    } else {
      console.log(`🔴 [SYSTEM DEAD] Google API Key failed. Reason: ${data.error?.message || 'Unknown Error'}`);
    }
  } catch (err) {
    console.log(`🔴 [SYSTEM DEAD] Google API Key failed. Reason: ${err.message}`);
  }
}

runDiagnostic();
