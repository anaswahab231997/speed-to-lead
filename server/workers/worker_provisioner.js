/**
 * 🛰️ SPEED TO LEAD™ WORKER FRAMEWORK — WORKER A: THE PROVISIONER
 * Scoped, deterministic credential injection inside local container.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { saveDealerCredentials } = require('../db')

function log(msg) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message: msg }))
}

function error(msg) {
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'ERROR', message: msg }))
  process.exit(1)
}

async function run() {
  log('Worker A: The Provisioner initiated.')

  // Parse parameters from environment variables
  const dealershipName = process.env.WORKER_DEALER_NAME
  const phone = process.env.WORKER_PHONE
  const wabaId = process.env.WORKER_WABA_ID
  const phoneId = process.env.WORKER_PHONE_ID
  const token = process.env.WORKER_TOKEN

  if (!dealershipName || !phone || !wabaId || !phoneId || !token) {
    error('Missing required environment parameters: WORKER_DEALER_NAME, WORKER_PHONE, WORKER_WABA_ID, WORKER_PHONE_ID, WORKER_TOKEN')
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '')
  log(`Input validated for showroom: "${dealershipName}" (Line: +${cleanPhone})`)

  try {
    log('Securely encrypting authorization token and executing DB injection...')
    const result = await saveDealerCredentials({
      dealer_id: `dlr_${cleanPhone}`,
      dealership_name: dealershipName,
      waba_id: wabaId,
      phone_number_id: phoneId,
      meta_access_token: token,
      inventory_data: [
        { id: 'car1', name: '2024 Nissan Patrol V8 Platinum', price: 'AED 295,000', stock: 3 },
        { id: 'car2', name: '2023 Porsche Macan GTS', price: 'AED 340,000', stock: 1 }
      ],
      business_hours: '9:00 AM to 9:00 PM'
    })

    log(`SUCCESS: Injected encrypted profile for "${result.dealership_name}" into multi_tenant_dealers.json`)
    console.log(JSON.stringify({ success: true, dealer_id: result.dealer_id }))
  } catch (err) {
    error(`DB Cryptographic shield write failure: ${err.message}`)
  }
}

run()
