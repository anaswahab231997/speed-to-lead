/**
 * Layla Learning Engine
 * 
 * When a lead is marked Contacted or Closed (won), capture the conversation.
 * Every 10 new wins, Claude summarizes patterns into updated sales tactics.
 * Those tactics get injected into Layla's system prompt — she learns from every deal.
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
const LEARNINGS_FILE = path.join(__dirname, 'learnings.json')

// ─── Storage ──────────────────────────────────────────────────────────────────
function load() {
  if (!fs.existsSync(LEARNINGS_FILE)) {
    const init = { wins: [], tactics: '', totalWins: 0, lastSummarized: null }
    fs.writeFileSync(LEARNINGS_FILE, JSON.stringify(init, null, 2))
    return init
  }
  return JSON.parse(fs.readFileSync(LEARNINGS_FILE, 'utf8'))
}

function save(data) {
  fs.writeFileSync(LEARNINGS_FILE, JSON.stringify(data, null, 2))
}

// ─── Capture a winning interaction ───────────────────────────────────────────
async function captureWin({ buyerMessage, laylaReply, objection, outcome, carInterest, score }) {
  const data = load()

  const win = {
    id: Date.now(),
    capturedAt: new Date().toISOString(),
    carInterest: carInterest || '',
    buyerMessage,
    laylaReply,
    objection: objection || '',
    outcome, // 'Contacted' or 'Closed'
    score,
  }

  data.wins.push(win)
  data.totalWins = (data.totalWins || 0) + 1
  save(data)

  console.log(`[LEARNING] Win captured — total: ${data.totalWins}`)

  // Every 10 new wins since last summary, regenerate tactics
  const winsSinceLastSummary = data.wins.length
  if (winsSinceLastSummary >= 10 || (winsSinceLastSummary >= 3 && !data.tactics)) {
    await summarizeLearnings()
  }
}

// ─── Claude summarizes all wins into tactics ──────────────────────────────────
async function summarizeLearnings() {
  const data = load()
  if (data.wins.length < 3) return

  console.log(`[LEARNING] Summarizing ${data.wins.length} wins into tactics...`)

  const examples = data.wins.slice(-30).map((w, i) =>
    `Win ${i + 1}: Buyer asked about "${w.carInterest}" | Objection: "${w.objection || 'none'}" | Layla said: "${w.laylaReply?.slice(0, 200)}" | Outcome: ${w.outcome} | Score: ${w.score}/10`
  ).join('\n\n')

  try {
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are analyzing successful car sales conversations at a UAE used car dealership.

Here are the winning conversations (leads that converted to Contacted or Closed):

${examples}

Based on these patterns, write a concise "what's working at this dealership" brief for a sales AI.
Include:
1. The most common objections buyers raise and exactly what reply style converts them
2. Which car types/models generate the most interest
3. What qualification questions lead to faster closes
4. Any specific phrases or approaches that appear in successful conversations

Write this as direct instructions for Layla, the sales AI. Be specific. Under 300 words. No preamble.`
      }]
    })

    const tactics = res.content[0].text
    data.tactics = tactics
    data.lastSummarized = new Date().toISOString()
    data.wins = [] // reset after summarizing — tactics now encode the learnings
    save(data)

    console.log('[LEARNING] Tactics updated successfully')
    console.log('[LEARNING] New tactics:\n', tactics)
    return tactics
  } catch (err) {
    console.error('[LEARNING] Summarization failed:', err.message)
  }
}

// ─── Get current tactics to inject into Layla's prompt ───────────────────────
function getCurrentTactics() {
  const data = load()
  if (!data.tactics) return ''
  return `
WHAT'S WORKING AT THIS DEALERSHIP (learned from real conversations):
${data.tactics}
`
}

// ─── Manual trigger: summarize now ───────────────────────────────────────────
async function forceResummarize() {
  return summarizeLearnings()
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function getLearningStats() {
  const data = load()
  return {
    totalWins: data.totalWins || 0,
    pendingWins: data.wins.length,
    hasTactics: !!data.tactics,
    lastSummarized: data.lastSummarized,
    tacticsPreview: data.tactics ? data.tactics.slice(0, 200) + '...' : 'No tactics yet',
  }
}

module.exports = { captureWin, getCurrentTactics, getLearningStats, forceResummarize }
