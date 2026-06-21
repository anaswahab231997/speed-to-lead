const http = require('http');

const postData = JSON.stringify({
  message: 'Hi, do you take Canada Life insurance? I have a terrible toothache.',
  history: []
});

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/chat/web',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const startTime = Date.now();
let firstByteReceived = false;

console.log('🚀 [TTFB DIAGNOSTIC] Disconnecting standard JSON fetch...');
console.log('📡 [TTFB DIAGNOSTIC] Initiating SSE Stream Connection to Layla Core...');

const req = http.request(options, (res) => {
  res.on('data', (chunk) => {
    if (!firstByteReceived) {
      firstByteReceived = true;
      const ttfb = Date.now() - startTime;
      console.log(`\n======================================================`);
      console.log(`⏱️ [METRIC] Time To First Byte (TTFB): ${ttfb}ms`);
      if (ttfb < 1500) {
         console.log(`✅ [STATUS] PASS: Latency is < 1.5s`);
      } else {
         console.log(`⚠️ [STATUS] FAIL: Latency exceeds 1.5s`);
      }
      console.log(`======================================================\n`);
      console.log('📥 [STREAM DATA INCOMING] (first 3 chunks):');
    }
    
    // Print the chunk string
    console.log(chunk.toString().trim());
  });

  res.on('end', () => {
    console.log('\n✅ [TTFB DIAGNOSTIC] Stream completed successfully.');
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`🚨 [TTFB DIAGNOSTIC] Problem with request: ${e.message}`);
  process.exit(1);
});

// Write data to request body
req.write(postData);
req.end();
