/**
 * Speed To Lead™ Environment Validation Sentinel Script
 * Checks for the presence and length of live production API keys
 * without printing actual credentials to logs or terminals.
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') })

console.log('🛡️  [ENVIRONMENT SENTINEL] Running pre-flight security scan...\n')

const requiredEnv = [
  { key: 'CLAUDE_API_KEY', prefix: 'sk-ant-' },
  { key: 'TWILIO_ACCOUNT_SID', prefix: 'AC' },
  { key: 'TWILIO_AUTH_TOKEN', prefix: '' },
  { key: 'AIRTABLE_API_KEY', prefix: 'pat' },
  { key: 'AIRTABLE_BASE_ID', prefix: 'app' }
]

let passed = true

requiredEnv.forEach(({ key, prefix }) => {
  const val = process.env[key]
  if (!val) {
    console.log(`❌  [FAIL] ${key} is missing from host variables!`)
    passed = false
  } else {
    const isPrefixCorrect = prefix ? val.startsWith(prefix) : true
    const len = val.length
    console.log(`✅  [PASS] ${key} is active.`)
    console.log(`    - Length: ${len} chars`)
    console.log(`    - Schema validation: ${isPrefixCorrect ? 'NOMINAL' : 'WARNING (check key format)'}\n`)
  }
})

if (passed) {
  console.log('🟩  [SUCCESS] All cloud environment variables are correctly loaded and verified!')
} else {
  console.log('🟥  [ERROR] Critical environment variables are missing! Please inspect your host console settings.')
}
