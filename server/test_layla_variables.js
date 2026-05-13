require('dotenv').config();
const { handleInboundMessage } = require('./layla');

async function testLayla() {
  console.log("Testing Layla with variables...");
  const res = await handleInboundMessage({ 
    from: '+971500000000', 
    text: 'What are your working hours?', 
    messageId: 'test_msg_001' 
  });
  console.log("Layla Reply:", res.reply);
}

testLayla();
