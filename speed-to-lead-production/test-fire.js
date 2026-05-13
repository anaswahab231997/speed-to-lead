const http = require('http');

console.log('🚀 [LOOPBACK TEST-FIRE] Preparing raw Twilio URL-encoded payload...');

const data = new URLSearchParams();
data.append('From', 'whatsapp:+1234567890');
data.append('To', 'whatsapp:+14155238886');
data.append('Body', 'Hi, I am looking for a 2024 Nissan Patrol.');
data.append('MessageSid', `SM_TEST_${Date.now()}`);

const payload = data.toString();

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/twilio/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(payload),
    'User-Agent': 'TwilioProxy/1.1'
  }
};

console.log('📡 [LOOPBACK TEST-FIRE] Dispatching POST request directly to http://localhost:3001/api/twilio/webhook...');

const req = http.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => { responseBody += chunk; });
  res.on('end', () => {
    console.log(`\n✅ [LOOPBACK TEST-FIRE] Handshake complete! Status Code: ${res.statusCode}`);
    console.log(`💬 [LOOPBACK TEST-FIRE] Server Response:\n${responseBody}`);
    console.log('\n========================================================');
    console.log('👉 Now check your server terminal to confirm if Layla');
    console.log('   successfully caught the payload and fired the Anthropic API!');
    console.log('========================================================\n');
  });
});

req.on('error', (e) => {
  console.error(`🔴 [LOOPBACK TEST-FIRE] Error connecting to server: ${e.message}`);
});

req.write(payload);
req.end();
