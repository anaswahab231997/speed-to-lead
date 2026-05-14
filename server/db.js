const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DB_PATH = path.join(__dirname, 'multi_tenant_dealers.json')

// AES-256-CBC Encryption configuration for securing Meta Access Tokens
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || crypto.scryptSync('SpeedToLeadSecretKey2026', 'salt', 32)
const IV_LENGTH = 16

function encrypt(text) {
  if (!text) return ''
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(text) {
  if (!text) return ''
  try {
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch (err) {
    console.error('[DB ENCRYPTION ERROR] Decryption failed:', err.message)
    return ''
  }
}

// Ensure the local multi-tenant database exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ dealers: [] }, null, 2))
}

function readData() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('[DB ERROR] Failed to read database:', err.message)
    return { dealers: [] }
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('[DB ERROR] Failed to write database:', err.message)
  }
}

/**
 * Find dealer profile by phone number id or display phone number
 */
async function getDealerByPhone(phoneNumberId) {
  const data = readData()
  const cleanId = String(phoneNumberId).replace(/[^0-9]/g, '')
  
  const dealer = data.dealers.find(d => {
    const dPhone = String(d.phone_number_id || '').replace(/[^0-9]/g, '')
    return dPhone === cleanId && d.subscription_status === 'active'
  })

  if (!dealer) return null

  // Decrypt token on-the-fly
  return {
    ...dealer,
    meta_access_token: decrypt(dealer.meta_access_token)
  }
}

/**
 * Save or update dealer multi-tenant profile
 */
async function saveDealerCredentials({
  dealer_id,
  dealership_name,
  waba_id,
  phone_number_id,
  meta_access_token,
  inventory_data,
  business_hours
}) {
  const data = readData()
  const cleanPhoneId = String(phone_number_id).replace(/[^0-9]/g, '')
  
  const existingIdx = data.dealers.findIndex(d => {
    const dPhone = String(d.phone_number_id || '').replace(/[^0-9]/g, '')
    return dPhone === cleanPhoneId
  })

  const encryptedToken = encrypt(meta_access_token)

  const dealerRecord = {
    dealer_id: dealer_id || `dlr_${Date.now()}`,
    dealership_name: dealership_name || 'AI Nexlify Showroom',
    waba_id: waba_id || '',
    phone_number_id: cleanPhoneId,
    meta_access_token: encryptedToken,
    inventory_data: inventory_data || [],
    business_hours: business_hours || '9:00 AM to 9:00 PM',
    updatedAt: new Date().toISOString()
  }

  if (existingIdx >= 0) {
    data.dealers[existingIdx] = {
      ...data.dealers[existingIdx],
      ...dealerRecord
    }
  } else {
    data.dealers.push(dealerRecord)
  }

  writeData(data)
  console.log(`💾 [DB] Successfully saved credentials for Dealer: ${dealership_name} (${cleanPhoneId})`)
  return {
    ...dealerRecord,
    meta_access_token
  }
}

async function getDealerByEmail(email) {
  const data = readData()
  const dealer = data.dealers.find(d => d.email === email)
  if (!dealer) return null
  return {
    ...dealer,
    meta_access_token: decrypt(dealer.meta_access_token)
  }
}

async function getDealerById(id) {
  const data = readData()
  const dealer = data.dealers.find(d => d.dealer_id === id)
  if (!dealer) return null
  return {
    ...dealer,
    meta_access_token: decrypt(dealer.meta_access_token)
  }
}

async function updateDealerSubscription(dealer_id, { stripe_customer_id, stripe_subscription_id, plan, status }) {
  const data = readData()
  const idx = data.dealers.findIndex(d => d.dealer_id === dealer_id)
  if (idx === -1) return null

  data.dealers[idx] = {
    ...data.dealers[idx],
    stripe_customer_id: stripe_customer_id || data.dealers[idx].stripe_customer_id,
    stripe_subscription_id: stripe_subscription_id || data.dealers[idx].stripe_subscription_id,
    subscription_plan: plan || data.dealers[idx].subscription_plan,
    subscription_status: status || data.dealers[idx].subscription_status,
    updatedAt: new Date().toISOString()
  }

  writeData(data)
  return data.dealers[idx]
}

module.exports = {
  getDealerByPhone,
  getDealerByEmail,
  getDealerById,
  saveDealerCredentials,
  updateDealerSubscription
}
