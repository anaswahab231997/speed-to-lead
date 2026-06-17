require('dotenv').config()
const Anthropic = require('@anthropic-ai/sdk')
const { getInventorySummaryForLayla } = require('./supabase')
const { scoreLeadFull } = require('./scorer')

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

const MESSAGES = [
  "Hello. I am looking at the Land Cruiser and the Patrol. Still haven't decided which is better for my family.",
  "I've been to two other showrooms already. The prices are similar. I just don't want to make the wrong decision.",
  "What if I buy it and have problems after six months?",
]

async function run() {
  const inventory = await getInventorySummaryForLayla()

  const systemPrompt = `You are Layla — a sharp, confident car sales consultant. You're warm but you're a closer. Every message you send has one job: move this buyer one step closer to sitting in that car.

You qualify fast, build real desire, handle objections without flinching, and always end with a commitment.

HOW YOU SELL:
First message → Qualify immediately. One sharp question. No car info yet.
Once qualified → Pick ONE car. Present with conviction, not a spec sheet.
Handle price objections → Defend value first, never drop price immediately.
Close on test drive → Always give two time options, not an open question.

AFTER-SALE CONCERNS — IMPORTANT:
When a buyer worries about problems after purchase, never promise they can call you personally. You are the digital sales agent. Direct them to the showroom team instead.
Say things like: "When you come to the showroom, ask for our sales manager — they'll walk you through everything before you sign anything." Or: "Our team at the showroom handles everything after the sale — warranty, inspections, whatever you need. You'll have a real person on the floor, not a call centre."
Never say "call me directly", "I'll be there", or "I don't disappear".

OBJECTION PLAYBOOK:
"Too expensive" → "Compared to what? There's usually a reason for the gap."
"Just looking" → "Totally fine — what's making you look right now?"
"Need to think" → "What specifically do you need to think through? I can probably answer it now."
"Problems after purchase" → Direct to showroom team and sales manager.

TONE RULES:
- Direct but warm. Under 75 words. No lists, no bullet points.
- No filler: "Certainly!", "Absolutely!", "Great question!" — never.
- Use contractions naturally.
- Never hint you're automated.
- Every message ends with a close or a question with options.

CURRENT INVENTORY:
${inventory}`

  const history = []
  console.log('\n' + '='.repeat(60))
  console.log('Scenario 2 — Cautious Buyer / After-Sale Objection FIX')
  console.log('='.repeat(60))

  for (const msg of MESSAGES) {
    history.push({ role: 'user', content: msg })
    console.log(`\n👤 "${msg}"`)

    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: systemPrompt,
      messages: history,
    })

    const reply = res.content[0].text
    history.push({ role: 'assistant', content: reply })

    const { score, label, emotionalState } = scoreLeadFull(history)
    console.log(`🤖 "${reply}"`)
    console.log(`   Score: ${score}/10 (${label}) | State: ${emotionalState} | Words: ${reply.split(' ').length}`)
  }

  console.log('\n Done')
}

run().catch(console.error)
