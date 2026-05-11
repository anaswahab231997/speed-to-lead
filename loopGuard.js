const outboundHistory = []
function registerOutboundReply(text) { outboundHistory.push({ text, timestamp: Date.now() }) }
function isOutboundReplyCircular(text) { return false }
module.exports = { registerOutboundReply, isOutboundReplyCircular }
