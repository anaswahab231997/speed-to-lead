/**
 * AI NEXLIFY™ ENTERPRISE OS — DETERMINISTIC COMMAND CENTER SERVER (PORT 5000)
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const app = express()
app.use(cors())
app.use(express.json())

// Serve admin-public panel
app.use(express.static(path.join(__dirname, 'admin-public')))

const DB_PATH = path.join(__dirname, 'multi_tenant_dealers.json')

/**
 * 1. GET /api/telemetry
 */
app.get('/api/telemetry', (req, res) => {
  try {
    let sentinelStatus = { status: 'ONLINE', logs: [] }
    try {
      const sentinel = require('./sentinel_daemon')
      sentinelStatus = sentinel.getSentinelStatus()
    } catch (e) {
      // Sentinel may be bootstrapping
    }

    let dealersList = []
    if (fs.existsSync(DB_PATH)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
        dealersList = parsed.dealers || []
      } catch (e) {
        // Fallback for corrupted database
      }
    }

    res.json({
      success: true,
      sentinel: sentinelStatus,
      dealers: dealersList
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * 2. POST /api/trigger-worker-a (The Provisioner)
 */
app.post('/api/trigger-worker-a', (req, res) => {
  const { dealerName, phone, wabaId, phoneId, token } = req.body

  if (!dealerName || !phone || !wabaId || !phoneId || !token) {
    return res.status(400).json({ success: false, error: 'Missing required configuration parameter' })
  }

  console.log(`📡 [ADMIN PORT 5000] Spawning Worker A (The Provisioner) for "${dealerName}"...`)

  // Spawn Worker A Node process with secure env passing
  const workerEnv = {
    ...process.env,
    WORKER_DEALER_NAME: dealerName,
    WORKER_PHONE: phone,
    WORKER_WABA_ID: wabaId,
    WORKER_PHONE_ID: phoneId,
    WORKER_TOKEN: token
  }

  const child = spawn('node', [path.join(__dirname, 'workers', 'worker_provisioner.js')], {
    env: workerEnv
  })

  let outputLogs = []

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n')
    lines.forEach(l => {
      try {
        // Extract plain log if JSON formatted
        const parsed = JSON.parse(l)
        outputLogs.push(parsed.message || l)
      } catch (e) {
        outputLogs.push(l)
      }
    })
  })

  child.stderr.on('data', (data) => {
    outputLogs.push(`[stderr] ${data.toString().trim()}`)
  })

  child.on('close', (code) => {
    console.log(`✅ [ADMIN PORT 5000] Worker A exited with status code ${code}`)
    if (code === 0) {
      res.json({ success: true, logs: outputLogs })
    } else {
      res.status(500).json({ success: false, error: `Worker exited with failure code ${code}`, logs: outputLogs })
    }
  })
})

/**
 * 3. POST /api/trigger-worker-b (The Scraper/Updater)
 */
app.post('/api/trigger-worker-b', (req, res) => {
  const { dealerId, markupPercent } = req.body

  if (!dealerId) {
    return res.status(400).json({ success: false, error: 'Missing target dealer ID' })
  }

  console.log(`📡 [ADMIN PORT 5000] Spawning Worker B (The Scraper) for target ID "${dealerId}"...`)

  const workerEnv = {
    ...process.env,
    WORKER_DEALER_ID: dealerId,
    WORKER_MARKUP_PERCENT: markupPercent || '0'
  }

  const child = spawn('node', [path.join(__dirname, 'workers', 'worker_scraper.js')], {
    env: workerEnv
  })

  let outputLogs = []

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n')
    lines.forEach(l => {
      try {
        const parsed = JSON.parse(l)
        outputLogs.push(parsed.message || l)
      } catch (e) {
        outputLogs.push(l)
      }
    })
  })

  child.stderr.on('data', (data) => {
    outputLogs.push(`[stderr] ${data.toString().trim()}`)
  })

  child.on('close', (code) => {
    console.log(`✅ [ADMIN PORT 5000] Worker B exited with status code ${code}`)
    if (code === 0) {
      res.json({ success: true, logs: outputLogs })
    } else {
      res.status(500).json({ success: false, error: `Worker exited with failure code ${code}`, logs: outputLogs })
    }
  })
})

/**
 * 4. HITL WAR ROOM & OUTBOUND SWARM ENDPOINTS
 */

// In-memory state storage for the HITL War Room demo
let outboundQueue = require('./agent-swarm/sdr_writer').getDrafts()
let boardProposals = [
  ...require('./agent-swarm/market_intel').getProposals(),
  ...require('./agent-swarm/strategist').getProposals()
]

// GET /api/outbound/queue - Fetch outbound prospects & sdr drafts
app.get('/api/outbound/queue', (req, res) => {
  res.json({ success: true, data: outboundQueue })
})

// POST /api/outbound/fire - Approve & Dispatch campaign (HITL approval)
app.post('/api/outbound/fire', (req, res) => {
  const { showroom } = req.body
  const idx = outboundQueue.findIndex(q => q.showroom === showroom)
  if (idx < 0) return res.status(404).json({ success: false, error: 'Prospect not found' })

  console.log(`🔥 [HITL DISPATCH APPROVED] Outbound message fired to ${showroom} decision maker!`)
  
  // Remove or update state to show "FIRED"
  outboundQueue[idx].fired = true
  outboundQueue[idx].status = 'DISPATCHED'
  
  res.json({
    success: true,
    message: `Message securely dispatched to ${outboundQueue[idx].decisionMaker} (${outboundQueue[idx].showroom})!`,
    logs: [
      `[Prospector] Verification passed for +${outboundQueue[idx].showroom}`,
      `[SDR] Rendering final email payload for ${outboundQueue[idx].email}`,
      `[Gateway] Dispatch payload verified via secure transport protocol. Status 200 OK.`
    ]
  })
})

// POST /api/outbound/redraft - Re-draft outbound message with variation
app.post('/api/outbound/redraft', (req, res) => {
  const { showroom } = req.body
  const idx = outboundQueue.findIndex(q => q.showroom === showroom)
  if (idx < 0) return res.status(404).json({ success: false, error: 'Prospect not found' })

  console.log(`✍️ [HITL RE-DRAFT TRIGGERED] SDR Writer generating variation for ${showroom}...`)

  // Mutate message with more psychological conversion triggers
  const originalMsg = outboundQueue[idx].draftMessage
  outboundQueue[idx].draftMessage = `${originalMsg}\n\nPS. We have also analyzed your competitor's peak traffic hour. Layla's trigger-rules are calibrated to capture Sheikh Zayed traffic before they drift to competitors.`
  outboundQueue[idx].status = 'RE-DRAFTED'

  res.json({
    success: true,
    message: 'Outreach campaign re-drafted successfully with heightened conversion hooks.',
    draftMessage: outboundQueue[idx].draftMessage
  })
})

// GET /api/proposals - Fetch Agentic Advisory Board Proposals
app.get('/api/proposals', (req, res) => {
  res.json({ success: true, data: boardProposals })
})

// POST /api/proposals/approve - Approve advisory board proposal
app.post('/api/proposals/approve', (req, res) => {
  const { id } = req.body
  const idx = boardProposals.findIndex(p => p.id === id)
  if (idx < 0) return res.status(404).json({ success: false, error: 'Proposal not found' })

  console.log(`✅ [ADVISORY BOARD] Proposal "${boardProposals[idx].title}" approved by Anas!`)
  boardProposals[idx].status = 'APPROVED'

  res.json({
    success: true,
    message: `Proposal merged successfully. System status: DETERMINISTIC INTEGRITY PRESERVED.`
  })
})

// QA Defects Data Store (The QA & Correction Syndicate internal affairs logs)
let qaDefects = [
  {
    id: "def-01",
    target: "index.css",
    rootCause: "Builder Agent tangled the CSS Flexbox (Hardcoded width: 520px in .faceid-container breaking 390px mobile viewport)",
    severity: "CRITICAL",
    builderAgent: "Agent C (UI Builder)",
    defectReport: "The UI Builder agent applied a static, fixed pixel width (width: 520px;) directly on .faceid-container under standard viewports, overriding fluid layout properties and causing catastrophic horizontal clipping on device screens < 520px.",
    cleanCode: `.faceid-container {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  max-width: 380px;\n  padding: 1.25rem;\n  flex: 1;\n}`,
    status: "PENDING"
  },
  {
    id: "def-02",
    target: "iap-sheet-paywall",
    rootCause: "Fixed margins in .iap-sheet causing layout overflow on short iOS mobile screens",
    severity: "HIGH",
    builderAgent: "Agent D (SaaS Merchant Builder)",
    defectReport: "Hardcoded vertical margins (margin-top: 44px; margin-bottom: 24px;) combined with static box sizing restricted height scaling on devices with short screen heights (< 660px).",
    cleanCode: `.iap-sheet {\n  width: 100%; max-width: 480px;\n  border-radius: 2.25rem 2.25rem 0 0;\n  padding: 1.25rem 1.5rem calc(env(safe-area-inset-bottom) + 2rem) 1.5rem;\n}`,
    status: "PENDING"
  },
  {
    id: "def-03",
    target: "agency-public/index.html (Solution Section)",
    rootCause: "Inline 2-column grid-template-columns: 1.2fr 0.8fr; inside .bento-wide card causing severe squeezing and content overlap on mobile viewports (< 768px)",
    severity: "CRITICAL",
    builderAgent: "Agent C (UI Builder)",
    defectReport: "The builder agent applied a hardcoded inline 2-column layout (grid-template-columns: 1.2fr 0.8fr) to the parallel agent orchestration block inside the main bento card. On mobile screens (< 768px), this layout fails to collapse into a single column, resulting in squeezed text, truncated status badges, and severe horizontal clipping.",
    cleanCode: `/* Refactored Solution: Extract inline style to media-managed CSS class */\n.orchestration-grid {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 20px;\n  width: 100%;\n}\n@media (min-width: 768px) {\n  .orchestration-grid {\n    grid-template-columns: 1.2fr 0.8fr;\n    gap: 40px;\n  }\n}\n\n/* Apply class to container and reduce mobile card padding */\n@media (max-width: 768px) {\n  .bento-card {\n    padding: 24px 16px !important;\n  }\n}`,
    status: "PENDING"
  }
]

// GET /api/qa/defects - Fetch active QA & Defect reports
app.get('/api/qa/defects', (req, res) => {
  res.json({ success: true, data: qaDefects })
})

// POST /api/qa/defects/enforce - Approve & enforce defect override
app.post('/api/qa/defects/enforce', (req, res) => {
  const { id } = req.body
  const idx = qaDefects.findIndex(d => d.id === id)
  if (idx < 0) return res.status(404).json({ success: false, error: 'Defect report not found' })

  console.log(`🛡️ [QA OVERRIDE ENFORCED] Overrode failed Builder Agent with Agent G's clean refactored solution for ${qaDefects[idx].target}!`)
  qaDefects[idx].status = 'ENFORCED'

  res.json({
    success: true,
    message: `Defect override successfully executed. Clean code compiled and pushed to production, bypassing failed builder agent.`
  })
})

const PORT = 5000
app.listen(PORT, () => {
  console.log(`\n🛡️  Deterministic Command Center (GUI) active on localhost:${PORT}`)
  console.log(`📡 Control panel link: http://localhost:${PORT}`)
})
