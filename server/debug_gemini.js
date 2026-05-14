require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function debugModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Available Models:', JSON.stringify(data.models?.map(m => m.name), null, 2));
  } catch (err) {
    console.log('Error listing models:', err.message);
  }
}

debugModels();
