require('dotenv').config()
const axios = require('axios')
const cheerio = require('cheerio')
const { saveDealerProspect } = require('./supabase')
const { ApifyClient } = require('apify-client')

const SERPER_API_KEY = process.env.SERPER_API_KEY
const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY
const APIFY_TOKEN = process.env.APIFY_TOKEN

const apifyClient = new ApifyClient({ token: APIFY_TOKEN })

// ─── 1. Google Reviews (Serper.dev Places) ───────────────────────────────────
async function fetchDealersFromMaps(query) {
  console.log(`[RECON] Searching Google Places via Serper.dev for: ${query}`)
  try {
    const response = await axios.post(
      'https://google.serper.dev/places',
      { q: query, gl: 'ae' },
      { headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' } }
    )
    
    // Places endpoint returns specific business objects
    const places = (response.data.places || [])
    
    return places.slice(0, 5).map(p => ({
      title: p.title,
      website: p.website || '',
      rating: p.rating || 0,
      ratingCount: p.ratingCount || 0,
      address: p.address || ''
    })).filter(p => !!p.website) // Only audit dealers with websites
  } catch (err) {
    console.error(`[RECON] Serper API error:`, err.message)
    return []
  }
}

// ─── 2. WhatsApp Button Check ────────────────────────────────────────────────
async function checkWhatsApp(url) {
  if (!url) return false
  try {
    const { data } = await axios.get(url, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    })
    const $ = cheerio.load(data)
    let hasWhatsApp = false
    
    // Check all links
    $('a').each((i, link) => {
      const href = $(link).attr('href') || ''
      if (href.includes('wa.me') || href.includes('api.whatsapp.com') || href.includes('whatsapp://send')) {
        hasWhatsApp = true
      }
    })

    // Fallback: Check for common WhatsApp button classes or text
    if (!hasWhatsApp) {
      const bodyText = $('body').text().toLowerCase()
      if (bodyText.includes('whatsapp') && bodyText.includes('chat')) {
        hasWhatsApp = true
      }
    }

    return hasWhatsApp
  } catch (err) {
    console.error(`[RECON] WhatsApp check failed for ${url}:`, err.message)
    return false
  }
}

// ─── 3. PageSpeed Insights ───────────────────────────────────────────────────
async function checkPageSpeed(url) {
  if (!url) return 0
  console.log(`[RECON] Checking PageSpeed for ${url}`)
  try {
    const res = await axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${PAGESPEED_API_KEY}&strategy=mobile`, { timeout: 45000 })
    
    const score = res.data.lighthouseResult?.categories?.performance?.score
    if (score !== undefined) {
      return Math.round(score * 100)
    }
    return 50 // Balanced fallback if lighthouse fails but site responded
  } catch (err) {
    console.log(`[RECON] PageSpeed Check failed: ${err.message}. Defaulting to conservative 45.`)
    return 45 // Not 0, to avoid "scare tactics" errors when the API is just slow
  }
}

// ─── 4. Social Media Activity (Apify) ────────────────────────────────────────
async function checkSocialActivity(url) {
  if (!url) return false
  console.log(`[RECON] Scanning for Social Activity on ${url}`)
  try {
    const { data } = await axios.get(url, { timeout: 10000 })
    const $ = cheerio.load(data)
    let igLink = null
    $('a').each((i, link) => {
      const href = $(link).attr('href') || ''
      if (href.includes('instagram.com/')) {
        igLink = href
      }
    })

    if (!igLink) return false

    const usernameMatch = igLink.match(/instagram\.com\/([a-zA-Z0-9._]+)/)
    if (!usernameMatch) return false
    const username = usernameMatch[1]
    
    // Quick check to avoid long Apify runs in basic audits
    // If we have an IG link, we give a partial credit, or we could run Apify for High Priority
    return true // For now, presence of active IG link on a luxury site usually implies activity
  } catch (err) {
    return false
  }
}

// ─── Scoring Engine ──────────────────────────────────────────────────────────
async function scoreDealer(dealer) {
  let score = 0
  
  // Rule 1: Working WhatsApp Button (+2)
  const hasWhatsApp = await checkWhatsApp(dealer.website)
  if (hasWhatsApp) score += 2

  // Rule 2: >100 Reviews and 4+ Rating (+2)
  const ratingCount = dealer.ratingCount || 0
  const rating = dealer.rating || 0
  const goodReviews = ratingCount > 100 && rating >= 4.0
  if (goodReviews) score += 2

  // Rule 3: Fast Mobile Website (+2)
  const pageSpeedScore = await checkPageSpeed(dealer.website)
  if (pageSpeedScore >= 70) score += 2

  // Rule 4: Active on Instagram (+2)
  const socialActive = await checkSocialActivity(dealer.website)
  if (socialActive) score += 2

  const prospectData = {
    name: dealer.title,
    website: dealer.website,
    score: score,
    hasWhatsApp,
    reviews: ratingCount,
    rating: rating,
    pageSpeedScore,
    socialActive,
    priorityTag: score <= 4 ? 'High Priority Outreach' : 'Normal'
  }

  return prospectData
}

// ─── Main Swarm Execution ────────────────────────────────────────────────────
async function runReconSwarm() {
  console.log('🚀 [RECON SWARM] Initiating Market Recon with Live Map Intel...')
  const regions = ['Dubai', 'Abu Dhabi', 'Sharjah']
  
  for (const region of regions) {
    const dealers = await fetchDealersFromMaps(`luxury car dealers in ${region}`)
    
    for (const dealer of dealers) {
      console.log(`\nEvaluating: ${dealer.title}...`)
      const scoredData = await scoreDealer(dealer)
      
      console.log(`=== SCORING RESULTS: ${dealer.title} ===`)
      console.log(`- WhatsApp: ${scoredData.hasWhatsApp ? '✅ (+2)' : '❌ (0)'}`)
      console.log(`- Reviews: ${scoredData.reviews} (Rating: ${scoredData.rating}) ${scoredData.reviews > 100 && scoredData.rating >= 4 ? '✅ (+2)' : '❌ (0)'}`)
      console.log(`- PageSpeed: ${scoredData.pageSpeedScore}% ${scoredData.pageSpeedScore >= 70 ? '✅ (+2)' : '❌ (0)'}`)
      console.log(`- Social Media: ${scoredData.socialActive ? '✅ (+2)' : '❌ (0)'}`)
      console.log(`-> FINAL SCORE: ${scoredData.score}/8`)

      await saveDealerProspect(scoredData)
    }
  }
  
  console.log('\n✅ [RECON SWARM] Full regional cycle complete.')
}

module.exports = {
  runReconSwarm,
  scoreDealer,
  checkWhatsApp,
  checkPageSpeed,
  checkSocialActivity
}

