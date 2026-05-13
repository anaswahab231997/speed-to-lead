/**
 * Stress Test — simulates 50 simultaneous buyer conversations
 * Tests system throughput, response time, and error rate
 */
const { scoreLead } = require('./scorer')

const BUYER_SCRIPTS = [
  ['Is the Land Cruiser still available?', "What's your best price?", 'Can I test drive tomorrow?'],
  ['Hi, I want the Patrol V8. How much?', 'Does it have warranty?', 'Ok book me a test drive Saturday morning'],
  ['Range Rover Sport available?', 'What color?', 'Please hold it for me'],
  ['BMW X5 price please', 'Too expensive, can you go lower?', 'Let me think about it'],
  ['Hello, is the GLE 450 automatic?', 'Does it have panoramic roof?', 'Can you deliver to Abu Dhabi?'],
  ['LX 570 mileage?', '88k kms ok la. What warranty?', 'I want to come see it today'],
  ['Cayenne S available?', 'Full service history?', 'I am ready to buy this week'],
]

async function runStressTest(count = 50) {
  console.log(`\n🔥 STRESS TEST: Simulating ${count} simultaneous conversations\n`)
  const start = Date.now()
  const results = { total: count, success: 0, failed: 0, avgResponseMs: 0, scores: [] }

  const tasks = Array.from({ length: count }, (_, i) => simulateConversation(i))
  const outcomes = await Promise.allSettled(tasks)

  let totalMs = 0
  for (const outcome of outcomes) {
    if (outcome.status === 'fulfilled') {
      results.success++
      totalMs += outcome.value.durationMs
      results.scores.push(outcome.value.score)
    } else {
      results.failed++
      console.error('[STRESS] Conversation failed:', outcome.reason?.message)
    }
  }

  results.avgResponseMs = Math.round(totalMs / results.success)
  results.minScore = Math.min(...results.scores)
  results.maxScore = Math.max(...results.scores)
  results.avgScore = (results.scores.reduce((a, b) => a + b, 0) / results.scores.length).toFixed(1)
  results.totalDurationMs = Date.now() - start
  results.errorRate = ((results.failed / results.total) * 100).toFixed(1) + '%'

  printReport(results)
  return results
}

async function simulateConversation(index) {
  const t0 = Date.now()
  const script = BUYER_SCRIPTS[index % BUYER_SCRIPTS.length]

  // Build conversation history from script
  const history = []
  for (const msg of script) {
    history.push({ role: 'user', content: msg })
    history.push({ role: 'assistant', content: 'Simulated Layla reply' }) // Not calling Claude in stress test to avoid API costs
  }

  const score = scoreLead(history)
  const durationMs = Date.now() - t0

  return { index, score, durationMs }
}

function printReport(r) {
  console.log('\n══════════════════════════════════════')
  console.log('  STRESS TEST RESULTS')
  console.log('══════════════════════════════════════')
  console.log(`  Total conversations:  ${r.total}`)
  console.log(`  Successful:           ${r.success} ✓`)
  console.log(`  Failed:               ${r.failed} ✗`)
  console.log(`  Error rate:           ${r.errorRate}`)
  console.log(`  Avg response time:    ${r.avgResponseMs}ms`)
  console.log(`  Total duration:       ${r.totalDurationMs}ms`)
  console.log(`  Score range:          ${r.minScore}–${r.maxScore} (avg: ${r.avgScore})`)
  console.log('══════════════════════════════════════\n')
}

module.exports = { runStressTest }
