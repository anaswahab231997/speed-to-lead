// loopGuard.js
// Stores recent inbound and outbound messages to prevent duplicate processing and bot loops
// Persists inbound IDs to disk to handle server restarts (Multi-Database Consistency)

const fs = require('fs');
const path = require('path');
const PERSIST_PATH = path.join(__dirname, 'inbound_processed.json');

const inboundHistory = new Map(); // messageId -> timestamp
const outboundHistory = []; // Array of { text, timestamp }

// Initialize from disk
if (fs.existsSync(PERSIST_PATH)) {
  try {
    const data = JSON.parse(fs.readFileSync(PERSIST_PATH, 'utf8'));
    for (const [id, time] of Object.entries(data)) {
      inboundHistory.set(id, time);
    }
    console.log(`💾 [LOOP GUARD] Hydrated ${inboundHistory.size} processed message IDs from disk.`);
  } catch (err) {
    console.error(`[LOOP GUARD] Hydration failed:`, err.message);
  }
}

function persistToDisk() {
  try {
    const data = Object.fromEntries(inboundHistory);
    fs.writeFileSync(PERSIST_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[LOOP GUARD] Persistence failed:`, err.message);
  }
}

function registerInbound(messageId) {
  if (!messageId) return;
  inboundHistory.set(messageId, Date.now());
  
  // Clean up old message IDs (older than 24 hours)
  const oneDayAgo = Date.now() - 86400000;
  let cleaned = false;
  for (const [id, time] of inboundHistory.entries()) {
    if (time < oneDayAgo) {
      inboundHistory.delete(id);
      cleaned = true;
    }
  }
  
  if (cleaned || inboundHistory.size % 10 === 0) {
    persistToDisk();
  }
}

function isInboundDuplicate(messageId) {
  if (!messageId) return false;
  return inboundHistory.has(messageId);
}

function registerOutboundReply(text) {
  if (!text) return;
  const cleanText = text.trim();
  outboundHistory.push({
    text: cleanText,
    timestamp: Date.now()
  });
  
  // Clean up history older than 5 minutes
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
  
  // Check if any recent outbound reply matches exactly in the last 60 seconds
  const sixtySecondsAgo = Date.now() - 60000;
  const isMatch = outboundHistory.some(item => {
    return normalizeText(item.text) === normText && item.timestamp >= sixtySecondsAgo;
  });
  
  return isMatch;
}

module.exports = {
  registerInbound,
  isInboundDuplicate,
  registerOutboundReply,
  isOutboundReplyCircular
};
