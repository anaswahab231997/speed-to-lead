const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_Api_Key;
const relayBase = process.env.GEMINI_RELAY_URL ? process.env.GEMINI_RELAY_URL.replace(/\/$/, '') : 'https://generativelanguage.googleapis.com';

const testModels = [
  { name: 'gemini-2.0-flash', version: 'v1beta' },
  { name: 'gemini-1.5-flash', version: 'v1beta' },
  { name: 'gemini-1.5-pro', version: 'v1beta' }
];

async function test() {
  for (const config of testModels) {
    const url = `${relayBase}/${config.version}/models/${config.name}:generateContent?key=${GEMINI_API_KEY}`;
    console.log(`Testing ${config.name} (${config.version})...`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ SUCCESS: ${config.name} (${config.version}) is working!`);
        process.exit(0);
      } else {
        console.log(`❌ FAIL: ${config.name} (${config.version}) - ${data.error?.message || res.statusText}`);
      }
    } catch (e) {
      console.log(`❌ ERROR: ${config.name} (${config.version}) - ${e.message}`);
    }
  }
}

test();
