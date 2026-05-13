require('dotenv').config()
const Anthropic = require('@anthropic-ai/sdk')
const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

const MODELS_TO_TEST = [
  'claude-sonnet-4-6',
  'claude-sonnet-4-5',
  'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-0',
  'claude-opus-4-7'
]

async function main() {
  console.log('Testing 2026 Anthropic Models with current API Key...')
  console.log('Key:', process.env.CLAUDE_API_KEY ? 'Present' : 'Missing')
  
  for (const model of MODELS_TO_TEST) {
    try {
      console.log(`\n--- Testing model: ${model} ---`)
      const res = await client.messages.create({
        model: model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say hello' }]
      })
      console.log(`Success! Response: "${res.content[0].text}"`)
    } catch (err) {
      console.log(`Failed! Error: ${err.message}`)
    }
  }
}

main().catch(console.error)
