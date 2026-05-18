require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const { handleInboundMessage } = require('./layla')
const { scheduleFollowUps } = require('./followup')
const { runStressTest } = require('./stressTest')
const { getAvailableInventory, leadsCache } = require('./airtable')
const { handlePulsePayload } = require('./sentinel')
const { startOrchestrator, getAgentStatus } = require('./agents/orchestrator')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const path = require('path')
app.use(express.static(path.join(__dirname, 'agency-public')))

// Decoupled Standalone iOS App Route deep-linking support
app.get('/dealer-pulse*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'agency-public', 'dealer-pulse', 'index.html'))
})

// ─── Legal Pages ───────────────────────────────────────────────────────────────
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'agency-public', 'terms', 'index.html'))
})

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', layla: 'active', timestamp: new Date().toISOString() })
})

// ─── DASHBOARD API (real-time data) ──────────────────────────────────────────

// Live inventory from Airtable
app.get('/api/inventory', async (req, res) => {
  try {
    const cars = await getAvailableInventory()
    res.json({ success: true, data: cars, total: cars.length, updatedAt: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// All leads (sorted most recent first)
app.get('/api/leads', (req, res) => {
  const leads = Array.from(leadsCache.entries()).map(([phone, data]) => ({ id: phone, phone, ...data }))
  leads.sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0))
  res.json({ success: true, data: leads, total: leads.length })
})

// Single lead
app.get('/api/leads/:phone', (req, res) => {
  const phone = decodeURIComponent(req.params.phone)
  const lead = leadsCache.get(phone)
  if (!lead) return res.status(404).json({ success: false, error: 'Not found' })
  res.json({ success: true, data: { phone, ...lead } })
})

// Aggregated stats for dashboard header cards
app.get('/api/stats', async (req, res) => {
  const leads = Array.from(leadsCache.values())
  const hot = leads.filter(l => (l.intentScore || 0) >= 8).length
  const avgScore = leads.length
    ? +(leads.reduce((s, l) => s + (l.intentScore || 0), 0) / leads.length).toFixed(1)
    : 0
  const inventory = await getAvailableInventory()
  res.json({
    success: true,
    data: {
      totalLeads: leads.length,
      hotLeads: hot,
      avgIntentScore: avgScore,
      availableCars: inventory.length,
      responseTime: '< 4s',
      updatedAt: new Date().toISOString(),
    },
  })
})

// Qualify / dismiss actions from dealer
app.post('/api/leads/:phone/qualify', (req, res) => {
  const phone = decodeURIComponent(req.params.phone)
  const lead = leadsCache.get(phone)
  if (!lead) return res.status(404).json({ success: false })
  leadsCache.set(phone, { ...lead, status: 'qualified', qualifiedAt: new Date().toISOString() })
  res.json({ success: true })
})

app.post('/api/leads/:phone/dismiss', (req, res) => {
  const phone = decodeURIComponent(req.params.phone)
  const lead = leadsCache.get(phone)
  if (!lead) return res.status(404).json({ success: false })
  leadsCache.set(phone, { ...lead, status: 'dismissed' })
  res.json({ success: true })
})

// ─── AGENTS DASHBOARD API ─────────────────────────────────────────────────────

app.get('/api/agents/status', (req, res) => {
  try {
    const statuses = getAgentStatus()
    res.json({ success: true, data: statuses })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── WEBHOOK ENDPOINTS ────────────────────────────────────────────────────────

app.get('/webhook/whatsapp', (req, res) => {
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (token === process.env.WEBHOOK_VERIFY_TOKEN) return res.status(200).send(challenge)
  res.sendStatus(403)
})

function isAlertMessage(from, text) {
  const msg = (text || '').toLowerCase()
  return text.includes('⚠️') || 
         msg.includes('[test run]') || 
         msg.includes('[api_timeout]') || 
         msg.includes('system health') || 
         msg.includes('failure detected') ||
         msg.includes('critical demo alert')
}

app.post('/webhook/whatsapp', async (req, res) => {
  res.status(200).json({ received: true })
  try {
    const messages = extractMessages(req.body)
    for (const msg of messages) {
      if (isAlertMessage(msg.from, msg.text)) {
        console.log(`🛡️ [WEBHOOK WHATSAPP] Blocked loop alert from ${msg.from}: "${msg.text}"`)
        continue
      }
      const { isOutboundReplyCircular } = require('./loopGuard')
      if (isOutboundReplyCircular(msg.text)) {
        console.log(`🛡️ [WEBHOOK WHATSAPP] Loop guard silently dropped circular replay: "${msg.text.substring(0, 45)}..."`)
        continue
      }

      // Multi-Tenant SaaS Routing Block
      let tenantDealer = null
      let dealerNameOverride = null
      
      if (msg.recipient) {
        try {
          const { getDealerByPhone } = require('./db')
          const cleanedRecipient = msg.recipient.replace(/[^0-9]/g, '')
          tenantDealer = await getDealerByPhone(cleanedRecipient)
          
          if (tenantDealer) {
            dealerNameOverride = tenantDealer.dealership_name
            console.log(`📡 [SaaS WEBHOOK ROUTING] Successfully mapped recipient ${cleanedRecipient} to secure Dealer: ${dealerNameOverride}`)
          } else {
            // Legacy mapping fallback
            const fs = require('fs')
            const path = require('path')
            const mappingsPath = path.join(__dirname, 'dealer-mappings.json')
            if (fs.existsSync(mappingsPath)) {
              const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'))
              dealerNameOverride = mappings[cleanedRecipient] || mappings['+' + cleanedRecipient] || mappings[cleanedRecipient.replace('+', '')] || null
              if (dealerNameOverride) {
                console.log(`📡 [WEBHOOK ROUTING FALLBACK] Mapped recipient ${cleanedRecipient} to Dealer: ${dealerNameOverride}`)
              }
            }
          }
        } catch (e) {
          console.error('[WEBHOOK SaaS ROUTER ERROR] Failed to route dynamically:', e.message)
        }
      }

      const { handleInboundMessage } = require('./layla')
      await handleInboundMessage({ ...msg, dealerNameOverride, tenantDealer })
    }
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err.message)
  }
})

// ─── TWILIO WHATSAPP SANDBOX WEBHOOK (CODE RED TELEMETRY ENDPOINT) ────────────
app.post('/api/twilio/webhook', async (req, res) => {
  console.log('\n🚨 [TWILIO WEBHOOK TRACE] Raw payload received (req.body):', JSON.stringify(req.body, null, 2))
  
  res.status(200).send('<Response></Response>') // TwiML success response
  
  try {
    const messages = extractMessages(req.body)
    console.log('🚨 [TWILIO WEBHOOK TRACE] Output of extractMessages:', JSON.stringify(messages, null, 2))
    
    if (messages.length === 0) {
      console.warn('🚨 [TWILIO WEBHOOK TRACE] WARNING: extractMessages returned empty array. Mismatch on request.body!')
      return
    }

    for (const msg of messages) {
      if (isAlertMessage(msg.from, msg.text)) {
        console.log(`🛡️ [TWILIO WEBHOOK TRACE] Blocked loop alert from ${msg.from}: "${msg.text}"`)
        continue
      }
      const { isOutboundReplyCircular } = require('./loopGuard')
      if (isOutboundReplyCircular(msg.text)) {
        console.log(`🛡️ [TWILIO WEBHOOK TRACE] Loop guard silently dropped circular replay: "${msg.text.substring(0, 45)}..."`)
        continue
      }

      console.log(`🚨 [TWILIO WEBHOOK TRACE] Handing message over to Layla engine. From: ${msg.from} | Text: "${msg.text}"`)
      
      const { handleInboundMessage } = require('./layla')
      await handleInboundMessage({ ...msg, tenantDealer: null })
    }
  } catch (err) {
    console.error('🚨 [TWILIO WEBHOOK TRACE] CRITICAL ERROR in webhook route:', err.message, err.stack)
  }
})

// Make.com relay
app.post('/webhook/make', async (req, res) => {
  res.status(200).json({ received: true })
  const { from, text, messageId } = req.body
  if (from && text) {
    if (isAlertMessage(from, text)) {
      console.log(`🛡️ [WEBHOOK MAKE] Blocked loop alert from ${from}: "${text}"`)
      return
    }
    const { isOutboundReplyCircular } = require('./loopGuard')
    if (isOutboundReplyCircular(text)) {
      console.log(`🛡️ [WEBHOOK MAKE] Loop guard silently dropped circular replay: "${text.substring(0, 45)}..."`)
      return
    }
    try { await handleInboundMessage({ from, text, messageId: messageId || Date.now().toString() }) }
    catch (err) { console.error('[MAKE ERROR]', err.message) }
  }
})

// Sentinel "Pulse" payload from Make.com
app.post('/api/sentinel/pulse', async (req, res) => {
  res.status(200).json({ received: true })
  try {
    await handlePulsePayload(req.body)
  } catch (err) {
    console.error('[SENTINEL ERROR]', err.message)
  }
})

// POST /api/agency/apply — Apply for membership on the luxury agency showroom
app.post('/api/agency/apply', async (req, res) => {
  const { name, phone, email, website } = req.body
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and Phone are required' })
  }
  
  try {
    const { saveLeadToAirtable } = require('./airtable')
    const result = await saveLeadToAirtable({
      name,
      phone,
      lastMessage: `Applied for membership on www.ainexlifyagencies.com. Website: ${website || 'None'} | Email: ${email || 'None'}`,
      laylaReply: 'Awaiting elite membership onboarding call.',
      intentScore: 10,
      source: 'agency-portfolio',
      dealer: 'Nexlify Agency'
    })
    
    try {
      const { sendWhatsAppMessage } = require('./whatsapp')
      await sendWhatsAppMessage(phone, `Hello ${name}! Welcome to the elite tier. Your application for Nexlify Membership has been received and logged in our CRM. One of our engineers will contact you shortly to activate your Agent OS.`)
    } catch (wsErr) {
      console.error('[AGENCY] WhatsApp confirmation failed:', wsErr.message)
    }

    res.json({ success: true, lead_id: result.id })
  } catch (err) {
    console.error('[AGENCY] Error processing application:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/agency/audit — Live conversion loop trigger for prospect audits
app.post('/api/agency/audit', async (req, res) => {
  const { url, name, phone, email } = req.body
  if (!url) return res.status(400).json({ success: false, error: 'Website URL is required' })

  const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`
  let host = 'dealership'
  try {
    host = new URL(cleanUrl).hostname.replace('www.', '')
  } catch (e) {
    host = cleanUrl.replace(/[^a-zA-Z0-9]/g, '_')
  }
  const reportFilename = `report_${host}_${Date.now()}.pdf`
  const relativePath = `/reports/${reportFilename}`

  // Respond immediately with the report URL so the UI can poll for the file's generation
  res.json({ success: true, message: 'Recon Swarm dispatched. Audit in progress.', pdfUrl: relativePath })

  const runBackgroundAudit = async () => {
    try {
      console.log(`\n🕵️ [NEX-02 RECON SWARM] Swarm dispatched for: ${cleanUrl}`)
      const { scoreDealer } = require('./recon')
      const { saveDealerProspect } = require('./airtable')
      const { sendWhatsAppMessage } = require('./whatsapp')
      const { generateVulnerabilityPDF } = require('./pdfGenerator')

      const title = host.split('.')[0].toUpperCase() + ' MOTORS'

      const dealerProfile = {
        title: title,
        website: cleanUrl,
        rating: 4.2,
        ratingCount: Math.floor(Math.random() * 150) + 40
      }

      // 1. Run live check and score
      const scoredData = await scoreDealer(dealerProfile)
      await saveDealerProspect(scoredData)

      // 2. Persist Lead to table tbly7iJArFklrO8yd
      const { saveLeadToAirtable } = require('./airtable')
      await saveLeadToAirtable({
        name: name || title,
        phone: phone || '+971500000000',
        lastMessage: `Automated Website Audit Request for ${cleanUrl}. Calculated Score: ${scoredData.score}/8`,
        laylaReply: `Recon Report: WhatsApp=${scoredData.hasWhatsApp ? 'YES' : 'NO'}, Reviews=${scoredData.reviews}, PageSpeed=${scoredData.pageSpeedScore}%, Social=${scoredData.socialActive ? 'YES' : 'NO'}`,
        intentScore: scoredData.score <= 3 ? 9 : 6,
        source: 'agency-audit',
        dealer: title
      })

      // 3. Generate high-contrast luxury PDF
      const absoluteOutputPath = path.join(__dirname, 'agency-public', 'reports', reportFilename)
      await generateVulnerabilityPDF(scoredData, absoluteOutputPath)
      console.log(`🕵️ [NEX-02 RECON] Luxury PDF compiled successfully at: ${absoluteOutputPath}`)

      // 4. Zoho SMTP dispatch with compiled luxury PDF attachment
      const { sendEmail } = require('./agents/google_auth')
      const targetEmail = email || 'anaswahab97@gmail.com'
      const emailBody = `Hello,\n\nPlease find attached the custom Digital Vulnerability and Revenue Recovery Audit Report for your dealership website: ${scoredData.website}.\n\nMaturity Score: ${scoredData.score}/8\n\nBest regards,\nAnas Wahab\nNexlify AI Agencies`
      
      try {
        await sendEmail(
          'nexlifyhq@gmail.com',
          targetEmail,
          `[NEX-02 RECON] Digital Audit Report — ${scoredData.name}`,
          emailBody,
          [
            {
              filename: reportFilename,
              path: absoluteOutputPath
            }
          ]
        )
        console.log(`🕵️ [NEX-02 RECON] Zoho SMTP email sent successfully with PDF to: ${targetEmail}`)
      } catch (mailErr) {
        console.error(`🕵️ [NEX-02 RECON] Zoho SMTP email send failed:`, mailErr.message)
      }

      // 5. Alert via WhatsApp
      const vulnerabilityReport = `*NEXLIFY DIGITAL AUDIT REPORT* 📊\n\n*Prospect:* ${scoredData.name}\n*Website:* ${scoredData.website}\n*Maturity Score:* ${scoredData.score}/8\n\n*Vulnerability Breakdown:*\n- WhatsApp Lead Capture: ${scoredData.hasWhatsApp ? '🟢 Active' : '🔴 Missing (-2 pts)'}\n- Google Reputation: ${scoredData.reviews > 50 ? '🟢 Strong' : '🟡 Low reviews'}\n- PageSpeed Score: ${scoredData.pageSpeedScore}% ${scoredData.pageSpeedScore >= 70 ? '🟢 Good' : '🔴 Critical Delay (-2 pts)'}\n- Social Engagement: ${scoredData.socialActive ? '🟢 Active' : '🔴 Dormant (-2 pts)'}\n\n*The ROI Math:*\nBased on an average vehicle value of AED 150,000 and a standard close rate of 5%, your current digital setup is actively losing high-value buyers. Converting just *one* additional sale pays for *20 years* of your Nexlify Monthly Subscription.\n\n_Nexlify Agent OS has been activated for this channel. Live demonstration is prepared._`

      if (phone) {
        await sendWhatsAppMessage(phone, vulnerabilityReport)
        console.log(`🕵️ [AGENCY AUDIT] Dispatched vulnerability report to WhatsApp: ${phone}`)
      }
    } catch (err) {
      console.error('[AGENCY AUDIT] Background audit error:', err.message)
    }
  }

  runBackgroundAudit()
})

app.post('/stress-test', async (req, res) => {
  const results = await runStressTest(req.body.count || 50)
  res.json(results)
})

function extractMessages(body) {
  // 1. Detect Twilio Webhook Payload (url-encoded or JSON fields from Twilio Sandbox)
  if (body && body.MessageSid && body.From) {
    const cleanFrom = body.From.replace('whatsapp:', '').trim();
    const cleanTo = body.To ? body.To.replace('whatsapp:', '').trim() : '';
    return [{
      from: cleanFrom,
      text: body.Body || '',
      messageId: body.MessageSid,
      recipient: cleanTo
    }];
  }

  // 2. Fallback to Meta Webhook Payload
  try {
    if (body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      const value = body.entry[0].changes[0].value
      const messages = value.messages || []
      const displayPhone = value.metadata?.display_phone_number || ''
      return messages.map(m => ({
        from: m.from,
        text: m.text?.body || m.text?.text || m.button?.text || m.interactive?.button_reply?.title || '',
        messageId: m.id,
        recipient: displayPhone
      }))
    }
    
    // Meta Test Number fallbacks (capturing entry structures with messages list)
    const fallbackMsgs = body?.entry?.[0]?.changes?.[0]?.value?.messages
    if (Array.isArray(fallbackMsgs) && fallbackMsgs.length > 0) {
      const firstMsg = fallbackMsgs[0]
      const displayPhone = body?.entry?.[0]?.changes?.[0]?.value?.metadata?.display_phone_number || ''
      return [{
        from: firstMsg?.from || '',
        text: firstMsg?.text?.body || firstMsg?.text?.text || '',
        messageId: firstMsg?.id || Date.now().toString(),
        recipient: displayPhone
      }]
    }
  } catch (err) {
    console.error('[WEBHOOK EXTRACTION FALLBACK ERROR]', err.message)
  }

  if (body?.from && body?.text) {
    return [{ from: body.from, text: body.text, messageId: body.messageId || Date.now().toString(), recipient: body.recipient || '' }]
  }
  return []
}

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.clear()
  console.log('\n🟩 [AI NEXLIFY AGENCIES] SPEED TO LEAD™ TUNNEL SECURED. LAYLA IS AWAKE. 🟩\n')
  console.log(`⚡ Speed To Lead — server on port ${PORT}`)
  console.log(`📡 Dashboard API → http://localhost:${PORT}/api/`)
  console.log(`🤖 Layla ready`)

  scheduleFollowUps()
  
  // Start the Multi-Agent Orchestrator
  startOrchestrator()
})
