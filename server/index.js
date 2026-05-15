require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { handleInboundMessage } = require('./layla')
const { scheduleFollowUps } = require('./followup')
const { runStressTest } = require('./stressTest')
const { getAvailableInventory, leadsCache, logSystemHealth, injectInventoryUpdate } = require('./airtable')
const { handlePulsePayload } = require('./sentinel')
const { startOrchestrator, getAgentStatus } = require('./agents/orchestrator')

// 🛡️ RIGID SYSTEM PROTECTION
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [CRITICAL] Unhandled Rejection:', reason);
  logSystemHealth({ status: 'Error', error_message: `Unhandled Rejection: ${reason.message}`, stack: reason.stack });
});

process.on('uncaughtException', (err) => {
  console.error('💥 [CRITICAL] Uncaught Exception:', err.stack || err.message);
  logSystemHealth({ status: 'Error', error_message: `Uncaught Exception: ${err.message}`, stack: err.stack });
  // Give time for logging before exiting
  setTimeout(() => process.exit(1), 1000);
});

const { router: authRouter } = require('./auth')
const stripeRouter = require('./stripe')
const dealersRouter = require('./dealers')

const app = express()

// ─── Stripe Webhook Raw Body Handling ────────────────────────────────────────
// Must come before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }))

// ─── Security Hardening ──────────────────────────────────────────────────────
const corsOptions = {
  origin: ['https://ainexlifyagencies.com', 'https://ainexlify-agencies.onrender.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── SaaS Routers ───────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/stripe', stripeRouter)
app.use('/api/dealers', dealersRouter)

// Rate limiting for the Recon Swarm Audit tool to prevent abuse
const auditLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 audits per hour
  message: { success: false, error: 'Too many audit requests from this IP. Please try again in an hour.' }
})

const path = require('path')
app.use(express.static(path.join(__dirname, 'agency-public')))

// 🏛️ IGNITION PORTAL (Decentralized Onboarding)
app.get('/ignite', (req, res) => {
  const filePath = path.join(__dirname, 'agency-public', 'ignite.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ [SERVER] Error serving ignite.html:', err.message);
      res.status(404).send('Ignition Portal Not Found. Please ensure ignite.html exists in agency-public.');
    }
  });
})

app.get(/^\/dealer-pulse/, (req, res) => {
  res.sendFile(path.join(__dirname, 'agency-public', 'dealer-pulse', 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Dealer Pulse App Not Found');
    }
  });
})

// 🏠 Explicit Root Route (Prevents "Cannot GET /" on some environments)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'agency-public', 'index.html'), (err) => {
    if (err) {
      console.error('❌ [SERVER] Error serving index.html:', err.message);
      res.status(404).send('Nexlify Agency Page Not Found');
    }
  });
})

app.post('/api/onboard/dealer', async (req, res) => {
  const { dealerName, phoneNumberId, wabaId, metaAccessToken } = req.body;
  if (!dealerName || !phoneNumberId || !wabaId || !metaAccessToken) {
    return res.status(400).json({ success: false, error: 'Missing required credentials.' });
  }
  try {
    const Airtable = require('airtable');
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appjPcjcc62gV2I0g');
    await base('Admin_Dealerships').create([{
      fields: {
        'Dealership Name': dealerName,
        'Phone Number ID': String(phoneNumberId),
        'WABA ID': String(wabaId),
        'Meta Access Token': metaAccessToken,
        'Status': 'Provisioned',
        'Onboarded At': new Date().toISOString()
      }
    }]);

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `🟢 [NODE ACTIVATED] New dealership [${dealerName}] has submitted Meta credentials. Ready for cognitive sync.`,
      from: process.env.TWILIO_SENDER_NUMBER,
      to: '+917439379780'
    });
    res.json({ success: true, message: 'Credentials vaulted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
})

// ─── EVENT-DRIVEN WEBHOOKS (Zero-Latency Sync) ────────────────────────────────
app.post('/api/webhooks/airtable/inventory', (req, res) => {
  // 1. Immediate Confirmation to Airtable
  res.status(200).json({ success: true, message: 'Update received' });

  // 2. Background Injection into AI Memory
  try {
    const payload = req.body;
    console.log('📡 [WEBHOOK] Airtable inventory update received for ID:', payload.id);
    injectInventoryUpdate(payload);
  } catch (err) {
    console.error('❌ [WEBHOOK ERROR] Failed to inject inventory update:', err.message);
  }
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

// 🏛️ HERMES MASTER PULSE
app.post('/api/hermes/pulse', async (req, res) => {
  try {
    const { runHermesAgent } = require('./agents/hermes')
    const result = await runHermesAgent()
    res.json({ success: true, message: result })
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
      
      const { isInboundDuplicate, registerInbound } = require('./loopGuard')
      if (isInboundDuplicate(msg.messageId)) {
        console.log(`🛡️ [WEBHOOK WHATSAPP] Dropped duplicate message ID: ${msg.messageId}`)
        continue
      }
      registerInbound(msg.messageId)

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
    try {
      await logSystemHealth({
        project: 'Speed To Lead',
        status: 'Fail',
        error_message: `WhatsApp Webhook crash: ${err.message}`,
        last_module: 'WHATSAPP_WEBHOOK'
      })
    } catch (e) {}
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
      const { isInboundDuplicate, registerInbound } = require('./loopGuard')
      if (isInboundDuplicate(msg.messageId)) {
        console.log(`🛡️ [TWILIO WEBHOOK] Dropped duplicate message ID: ${msg.messageId}`)
        continue
      }
      registerInbound(msg.messageId)

      console.log(`🚨 [TWILIO WEBHOOK TRACE] Handing message over to Layla engine. From: ${msg.from} | Text: "${msg.text}"`)
      
      const { handleInboundMessage } = require('./layla')
      await handleInboundMessage({ ...msg, tenantDealer: null })
    }
  } catch (err) {
    console.error('🚨 [TWILIO WEBHOOK TRACE] CRITICAL ERROR in webhook route:', err.message, err.stack)
    try {
      await logSystemHealth({
        project: 'Speed To Lead',
        status: 'Fail',
        error_message: `Webhook crash: ${err.message}`,
        last_module: 'TWILIO_WEBHOOK'
      })
    } catch (e) {
      console.error('🚨 [TWILIO WEBHOOK TRACE] Failed to log failure to System Health:', e.message)
    }
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

    const { isInboundDuplicate, registerInbound } = require('./loopGuard')
    const mid = messageId || `${from}_${Date.now()}`
    if (isInboundDuplicate(mid)) {
      console.log(`🛡️ [WEBHOOK MAKE] Dropped duplicate message: ${mid}`)
      return
    }
    registerInbound(mid)
    try { await handleInboundMessage({ from, text, messageId: messageId || Date.now().toString() }) }
    catch (err) { 
      console.error('[MAKE ERROR]', err.message)
      try {
        await logSystemHealth({
          project: 'Speed To Lead',
          status: 'Fail',
          error_message: `Make Webhook crash: ${err.message}`,
          last_module: 'MAKE_WEBHOOK'
        })
      } catch (e) {}
    }
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
  const { name, phone, email, website, contactName, dealerName } = req.body
  const finalName = name || contactName || 'Showroom Owner'
  const finalWebsite = website || dealerName || 'None'
  if (!finalName || !phone) {
    return res.status(400).json({ success: false, error: 'Name and Phone are required' })
  }
  
  try {
    const { saveLeadToAirtable } = require('./airtable')
    const result = await saveLeadToAirtable({
      name: finalName,
      phone,
      lastMessage: `Applied for membership on www.ainexlifyagencies.com. Website: ${finalWebsite}`,
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
app.post('/api/agency/audit', auditLimiter, async (req, res) => {
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
      const { scoreDealer, fetchDealersFromMaps } = require('./recon')
      const { saveDealerProspect } = require('./airtable')
      const { sendWhatsAppMessage } = require('./whatsapp')
      const { generateVulnerabilityPDF } = require('./pdfGenerator')

      // 1. Live Discovery: Find real business metadata from Maps using the URL/Host
      console.log(`[NEX-02] Performing deep Map discovery for: ${host}...`)
      let dealerProfile = { title: host.toUpperCase(), website: cleanUrl, rating: 0, ratingCount: 0 }
      
      try {
        const discovered = await fetchDealersFromMaps(host)
        if (discovered && discovered.length > 0) {
          // Find the best match by URL
          const match = discovered.find(d => d.website.includes(host)) || discovered[0]
          dealerProfile = { ...match, title: match.title || dealerProfile.title }
          console.log(`[NEX-02] Live match found: ${dealerProfile.title} (${dealerProfile.rating}⭐)`)
        }
      } catch (discoveryErr) {
        console.warn(`[NEX-02] Map discovery failed, falling back to basic scrape.`, discoveryErr.message)
      }

      // 2. Run live check and score
      const scoredData = await scoreDealer(dealerProfile)
      await saveDealerProspect(scoredData)

      // 3. Persist Lead to table tbly7iJArFklrO8yd
      const { saveLeadToAirtable } = require('./airtable')
      await saveLeadToAirtable({
        name: name || scoredData.name || host,
        phone: phone || '+971500000000',
        lastMessage: `Automated Website Audit Request for ${cleanUrl}. Calculated Score: ${scoredData.score}/8`,
        laylaReply: `Recon Report: WhatsApp=${scoredData.hasWhatsApp ? 'YES' : 'NO'}, Reviews=${scoredData.reviews}, PageSpeed=${scoredData.pageSpeedScore}%, Social=${scoredData.socialActive ? 'YES' : 'NO'}`,
        intentScore: scoredData.score <= 4 ? 9 : 6,
        source: 'agency-audit',
        dealer: scoredData.name
      })

      // 4. Generate high-contrast luxury PDF
      const absoluteOutputPath = path.join(__dirname, 'agency-public', 'reports', reportFilename)
      await generateVulnerabilityPDF(scoredData, absoluteOutputPath)
      console.log(`🕵️ [NEX-02 RECON] Luxury PDF compiled successfully: ${absoluteOutputPath}`)

      // 5. Zoho SMTP dispatch with compiled luxury PDF attachment
      const { sendEmail } = require('./agents/google_auth')
      const targetEmail = email || 'anaswahab97@gmail.com'
      const emailBody = `Hello,\n\nPlease find attached the custom Digital Vulnerability and Revenue Recovery Audit Report for your dealership website: ${scoredData.website}.\n\nMaturity Score: ${scoredData.score}/8\n\nBest regards,\nAnas Wahab\nNexlify AI Agencies`
      
      try {
        await sendEmail(
          process.env.ZOHO_EMAIL,
          targetEmail,
          `[NEX-02 RECON] Digital Audit Report — ${scoredData.name}`,
          emailBody,
          [{ filename: reportFilename, path: absoluteOutputPath }]
        )
        console.log(`📧 [ZOHO SMTP] Report dispatched to ${targetEmail}`)
      } catch (emailErr) {
        console.error('📧 [ZOHO SMTP] FAILED to send email:', emailErr.message)
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
    const crypto = require('crypto')
    const stableId = body.messageId || crypto.createHash('md5').update(body.from + body.text).digest('hex')
    return [{ from: body.from, text: body.text, messageId: stableId, recipient: body.recipient || '' }]
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
  console.log(`🤖 WhatsApp-Centric Engine ready`)

  scheduleFollowUps()
  
  // Start the WhatsApp-Centric Orchestrator (Email Triage Decommissioned)
  startOrchestrator()
})
