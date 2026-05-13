// loopGuard.js
// Stores Layla's recent outbound replies to detect and block circular loops

const outboundHistory = []; // Array of { text, timestamp }

function registerOutboundReply(text) {
  if (!text) return;
  const cleanText = text.trim();
  outboundHistory.push({
    text: cleanText,
    timestamp: Date.now()
  });
  console.log(`🛡️ [LOOP GUARD] Registered outbound reply: "${cleanText.substring(0, 40)}..."`);
  
  // Clean up history older than 5 minutes to keep memory clean
  const fiveMinutesAgo = Date.now() - 300000;
  while (outboundHistory.length > 0 && outboundHistory[0].timestamp < fiveMinutesAgo) {
    outboundHistory.shift();
  }
}

function normalizeText(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isOutboundReplyCircular(text) {
  if (!text) return false;
  const normText = normalizeText(text);
  
  // Check if any recent outbound reply matches in the last 60 seconds
  const sixtySecondsAgo = Date.now() - 60000;
  const isMatch = outboundHistory.some(item => {
    return normalizeText(item.text) === normText && item.timestamp >= sixtySecondsAgo;
  });
  
  if (isMatch) {
    console.warn(`🛡️ [LOOP GUARD] BLOCKED CIRCULAR REPLAY of outbound message: "${text.trim().substring(0, 45)}..."`);
  }
  return isMatch;
}

module.exports = {
  registerOutboundReply,
  isOutboundReplyCircular
};
