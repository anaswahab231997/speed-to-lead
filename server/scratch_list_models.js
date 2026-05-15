const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini_Api_Key;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

async function listModels() {
  console.log(`Listing available models for the provided API key...`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) {
      console.log('--- AVAILABLE MODELS ---');
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log(`❌ FAIL: ${data.error?.message || res.statusText}`);
    }
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
}

listModels();
