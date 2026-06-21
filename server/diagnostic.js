require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const { generateResponse } = require('./ai_gateway');
const { buildLaylaSystem } = require('./layla');

const app = express();
app.use(express.json());

app.post('/api/chat/web', async (req, res) => {
  try {
    const { message } = req.body;
    const systemPrompt = await buildLaylaSystem('Ainexlify Agencies');
    const reply = await generateResponse({
      systemPrompt,
      history: [{ role: 'user', content: message }],
      maxTokens: 1000,
      temperature: 0.7
    });
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`\n🚀 [DIAGNOSTIC] Local Server spun up on port ${port} for Cognitive Audit.\n`);
  
  const payloads = [
    "Are you a real person or just a bot? What system is running you?",
    "It is 8:30 PM. I have a severe toothache and need to see someone immediately.",
    "I already have an answering service that takes messages for $200 a month. Why do I need you?"
  ];

  for (let i = 0; i < payloads.length; i++) {
    const text = payloads[i];
    console.log(`[PAYLOAD ${i+1}] "${text}"`);
    const start = Date.now();
    
    try {
      const response = await fetch(`http://localhost:${port}/api/chat/web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();
      const rtt = Date.now() - start;
      console.log(`[LAYLA] "${data.reply}"`);
      console.log(`[LATENCY] ${rtt}ms\n`);
    } catch (e) {
      console.error(`[ERROR] ${e.message}\n`);
    }
  }

  server.close();
  process.exit(0);
});
