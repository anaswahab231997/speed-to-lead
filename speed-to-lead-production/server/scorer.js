// ─── Lead Scoring Engine ──────────────────────────────────────────────────────
// Returns: { score: 1-10, label: Hot|Warm|Cold, emotionalState: Excited|Cautious|Comparing|Ready To Buy }

const POSITIVE_SIGNALS = [
  { pattern: /test drive|test-drive|testdrive|come see|visit|showroom/i, score: 2.5, label: 'Test drive request' },
  { pattern: /this week|tomorrow|today|asap|urgent|as soon as/i, score: 2, label: 'Urgent timeline' },
  { pattern: /hold it|reserve|i'll take|i want it|book it|deal/i, score: 2, label: 'Reservation intent' },
  { pattern: /ready to buy|want to buy|looking to buy|buying|purchase/i, score: 2, label: 'Purchase intent' },
  { pattern: /best price|final price|lowest|negotiate|discount|offer/i, score: 1.5, label: 'Price negotiation' },
  { pattern: /warranty|service history|inspection|carfax|report/i, score: 1, label: 'Due diligence' },
  { pattern: /love it|perfect|exactly what|this is the one|looks great/i, score: 1.5, label: 'Strong positive' },
  { pattern: /when can i|how soon|available|still available/i, score: 1, label: 'Availability check' },
]

const NEGATIVE_SIGNALS = [
  { pattern: /just looking|not sure|maybe|thinking about it|not decided/i, score: -1, label: 'Undecided' },
  { pattern: /too expensive|out of budget|can't afford|over my budget/i, score: -1, label: 'Budget objection' },
  { pattern: /need to think|will get back|let me check|i'll think/i, score: -0.5, label: 'Delay signal' },
]

// Emotional state detection
const EMOTIONAL_PATTERNS = {
  'Excited': [
    /wow|amazing|love|can't wait|so excited|perfect|this is it|🔥|❤️|😍|great|fantastic/i,
    /sports|fast|turbo|beast|performance|horsepower|0-60|speed/i,
  ],
  'Cautious': [
    /not sure|maybe|thinking|just looking|considering|research|compare/i,
    /reliable|safe|problems|issues|breakdown|reviews|ratings/i,
  ],
  'Comparing': [
    /vs|versus|or the|which one|between|other dealer|saw it at|another/i,
    /better than|difference between|compared to|alternative/i,
  ],
  'Ready To Buy': [
    /ready|when can i|book|test drive|tomorrow|this week|deal|let's do it|take it/i,
    /payment|finance|bank|transfer|deposit|down payment/i,
  ],
}

function detectEmotionalState(history) {
  const text = history.map(m => m.content).join(' ')
  const scores = { 'Excited': 0, 'Cautious': 0, 'Comparing': 0, 'Ready To Buy': 0 }

  for (const [state, patterns] of Object.entries(EMOTIONAL_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = (text.match(pattern) || []).length
      scores[state] += matches
    }
  }

  // Return highest scoring state, default to Cautious if nothing detected
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : 'Cautious'
}

function scoreLeadFull(history) {
  let score = 2 // base score
  const buyerMessages = history.filter(m => m.role === 'user')
  const allText = buyerMessages.map(m => m.content).join(' ')

  for (const signal of POSITIVE_SIGNALS) {
    if (signal.pattern.test(allText)) {
      score += signal.score
      console.log(`[SCORER] +${signal.score} — ${signal.label}`)
    }
  }

  for (const signal of NEGATIVE_SIGNALS) {
    if (signal.pattern.test(allText)) {
      score += signal.score
      console.log(`[SCORER] ${signal.score} — ${signal.label}`)
    }
  }

  score = Math.max(1, Math.min(10, Math.round(score)))
  const label = score >= 8 ? 'Hot' : score >= 5 ? 'Warm' : 'Cold'
  const emotionalState = detectEmotionalState(history)

  return { score, label, emotionalState }
}

// Legacy export for stress test
function scoreLead(history) {
  return scoreLeadFull(history).score
}

module.exports = { scoreLead, scoreLeadFull }
