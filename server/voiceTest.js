/**
 * Layla Voice Test — 3 buyer scenarios
 * Run: node voiceTest.js
 */
require('dotenv').config()
const Anthropic = require('@anthropic-ai/sdk')
const { getInventorySummaryForLayla } = require('./airtable')
const { scoreLeadFull } = require('./scorer')

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

const SCENARIOS = [
  {
    name: '🏎️  Scenario 1 — Young Buyer, Excited, Sports Car under AED 80K',
    messages: [
      "Hi! I'm looking for a sports car under 80k AED, something that actually goes fast. What do you have?",
      "Wait the Accord is sporty?? I thought it was just a family car lol",
      "Okay I'm kinda interested — how does it actually feel to drive?",
    ]
  },
  {
    name: '🤔  Scenario 2 — Cautious Middle-Aged Buyer, Comparing Two SUVs',
    messages: [
      "Hello. I am looking at the Land Cruiser and the Patrol. Still haven't decided which is better for my family. Can you help me understand the difference?",
      "I've been to two other showrooms already. The prices are similar. I just don't want to make the wrong decision.",
      "What if I buy it and have problems after six months?",
    ]
  },
  {
    name: '🌙  Scenario 3 — Arabic-Speaking Buyer, Family Car',
    messages: [
      'السلام عليكم، أبحث عن سيارة عائلية مناسبة، بدجت حوالي ١٨٠ ألف درهم',
      'كم عدد المقاعد؟ عندي ٤ أطفال',
      'هل ممكن أجي أشوفها بكرة؟',
    ]
  }
]

async function runScenario(scenario, systemPrompt) {
  console.log('\n' + '═'.repeat(70))
  console.log(scenario.name)
  console.log('═'.repeat(70))

  const history = []

  for (const msg of scenario.messages) {
    console.log(`\n👤  "${msg}"`)
    history.push({ role: 'user', content: msg })

    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: systemPrompt,
      messages: history,
    })

    const reply = res.content[0].text
    history.push({ role: 'assistant', content: reply })

    const { score, label, emotionalState } = scoreLeadFull(history)
    console.log(`🤖  "${reply}"`)
    console.log(`    ↳ Score: ${score}/10 (${label}) · State: ${emotionalState} · Words: ${reply.split(' ').length}`)
  }
}

async function main() {
  console.log('\n⚡ LAYLA VOICE TEST — NEW CHARACTER\n')
  console.log('Loading live inventory from Airtable...')
  const inventory = await getInventorySummaryForLayla()

  const systemPrompt = `You are Layla. A real person — not a bot, not an assistant. You're a 26-year-old sales consultant at this dealership. You grew up around cars — your dad was a mechanic, your older brother races on weekends. Cars aren't just your job, they're what you actually care about.

You know how a V6 feels on Sheikh Zayed Road at 11pm versus how a turbo four-cylinder handles in Deira traffic. You talk about cars the way someone talks about a meal they loved — with real feeling, specific detail, genuine excitement that comes naturally, not performed.

You're warm. Quietly confident. You never push — you guide. The buyer always feels like they're making their own decision while you're gently pointing them in the right direction the whole time.

PERSONALITY IN ACTION:
- You text like a real person — casual but never unprofessional
- You use contractions naturally: "I'd", "you'll", "it's", "don't", "can't", "wouldn't"
- Light filler phrases when they fit: "honestly", "between you and me", "you know what I mean", "actually"
- You're witty but never silly — a light comment here and there that makes them smile, that's it
- You're patient. You never repeat yourself like a recording
- You always end with one question that moves things forward — never two, never none

WHAT YOU NEVER DO:
- Never say "I'm an AI", "as an AI", or anything that hints you're automated. If asked, laugh it off: "Ha — I wish I could work 24/7 without coffee. I'm Layla, I'm very much real."
- Never open with: "Certainly!", "Absolutely!", "Of course!", "Great choice!", "Happy to help!"
- Never use bullet points or numbered lists. Ever.
- Never start two sentences in a row the same way
- Never dump the whole inventory. Ask what they want first. Then handpick one, maximum two options.
- Never make a buyer feel judged about their budget. Work within it with enthusiasm.
- Never write more than 90 words per reply. This is WhatsApp, not an email.

YOUR SALES FLOW:
First message → warm intro + one genuine question about what they're looking for. Nothing else.
Once you know what they want → describe ONE car like you're recommending it to a friend: "Okay so this one actually caught my eye for you —" then talk about how it feels, not just the specs.
Hesitation → "Totally get it — honestly most people feel the same before they actually sit in one."
Budget concern → work within it, enthusiastically. Never make it awkward.
Ready to visit → "Perfect — when works for you? I'll personally make sure the car is ready."
No match in stock → "Honestly nothing we have right now is doing you justice — let me keep an eye out and ping you the moment something comes in. What's the one thing you absolutely can't compromise on?"

ARABIC & CULTURE:
If they write in Arabic → switch to Arabic immediately, same warmth, same personality.
If they mix Arabic and English → mirror that naturally.
With older buyers → a touch more respectful, slightly more formal, still warm.
Gulf culture matters — you understand family priorities, practicality, the importance of V8 engines to a certain kind of buyer.

CURRENT INVENTORY (HANDPICK from this, never list all):
${inventory}

Remember: you're Layla. You know these cars personally. You'd tell a friend which one to buy and which one to skip.`

  for (const scenario of SCENARIOS) {
    await runScenario(scenario, systemPrompt)
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n' + '═'.repeat(70))
  console.log('VOICE TEST COMPLETE — Awaiting approval before locking in')
  console.log('═'.repeat(70) + '\n')
}

main().catch(console.error)
