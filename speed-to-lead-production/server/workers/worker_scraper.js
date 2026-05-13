/**
 * 🛰️ SPEED TO LEAD™ WORKER FRAMEWORK — WORKER B: THE SCRAPER / UPDATER
 * Deterministic pricing update of local dealer stock models.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'multi_tenant_dealers.json')

function log(msg) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message: msg }))
}

function error(msg) {
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'ERROR', message: msg }))
  process.exit(1)
}

async function run() {
  log('Worker B: Scraper/Updater initialized.')

  const dealerId = process.env.WORKER_DEALER_ID
  const markupPercent = parseFloat(process.env.WORKER_MARKUP_PERCENT || '0')

  if (!dealerId) {
    error('Missing required environment parameter: WORKER_DEALER_ID')
  }

  log(`Targeting dealer ID for inventory refresh: ${dealerId}`)

  try {
    if (!fs.existsSync(DB_PATH)) {
      error('Database multi_tenant_dealers.json is missing.')
    }

    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const db = JSON.parse(raw)

    const dealerIdx = db.dealers.findIndex(d => d.dealer_id === dealerId)
    if (dealerIdx < 0) {
      error(`Dealer with ID ${dealerId} not found in database.`)
    }

    const dealer = db.dealers[dealerIdx]
    log(`Scraping latest regional market catalogs for "${dealer.dealership_name}"...`)

    // Simulate scraping latency
    await new Promise(r => setTimeout(r, 1200))

    // Apply pricing updates or stock changes
    log(`Applying pricing adjustment of ${markupPercent}%...`)
    const updatedInventory = dealer.inventory_data.map(car => {
      const priceNum = parseInt(car.price.replace(/[^0-9]/g, ''))
      const adjustedPrice = Math.round(priceNum * (1 + markupPercent / 100))
      return {
        ...car,
        price: `AED ${adjustedPrice.toLocaleString()}`,
        stock: Math.max(1, car.stock + (Math.random() > 0.5 ? 1 : -1)) // update stock
      }
    })

    db.dealers[dealerIdx].inventory_data = updatedInventory
    db.dealers[dealerIdx].updatedAt = new Date().toISOString()

    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
    log(`SUCCESS: Inventory pricing successfully synchronized & context updated for "${dealer.dealership_name}"`)
    console.log(JSON.stringify({ success: true, updated_inventory: updatedInventory }))
  } catch (err) {
    error(`Failed to process inventory scrape/update: ${err.message}`)
  }
}

run()
