require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { handleInboundMessage, buildLaylaSystem } = require('./layla')
const { generateResponse, streamResponse } = require('./ai_gateway')
const { scheduleFollowUps } = require('./followup')
const { runStressTest } = require('./stressTest')
const { getAvailableInventory, leadsCache, logSystemHealth, injectInventoryUpdate } = require('./supabase')
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

const { router: authRouter, authMiddleware } = require('./auth')
const stripeRouter = require('./stripe')
const dealersRouter = require('./dealers')

const app = express()
app.disable('x-powered-by')

// ─── Stripe Webhook Raw Body Handling ────────────────────────────────────────
// Must come before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }))

// ─── Security Hardening & CORS ───────────────────────────────────────────────
const allowedOrigins = [
  'https://ainexlifyagencies.com',
  'https://www.ainexlifyagencies.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173'
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, server-to-server) or approved origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    return callback(null, false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}))
app.use(express.json())

// ─── Rate Limiters ───────────────────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many chat requests from this IP. Please wait a few minutes before trying again.' }
})

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 submissions per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many submissions from this IP. Please try again later.' }
})

app.post('/api/chat/web', chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body
    if (!message) return res.status(400).json({ error: 'Message is required' })
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    
    // Normalize history format
    const formattedHistory = (history || []).map(h => ({
      role: h.role === 'ai' || h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content || h.text || ''
    }))

    // Build the rigorous Ainexlify SDR prompt
    const systemPrompt = await buildLaylaSystem('Ainexlify Agencies')
    
    // Process via the Golden Model (Gemini 2.5 Flash) using SSE
    await streamResponse({
      systemPrompt,
      history: [...formattedHistory, { role: 'user', content: message }],
      maxTokens: 1000,
      temperature: 0.7,
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      onError: (err) => {
        const errMsg = err.message || 'Stream error';
        if (errMsg.includes('Quota exceeded') || errMsg.includes('429')) {
          res.write(`data: ${JSON.stringify({ text: 'I am currently handling an unusually high volume of onboarding inquiries. Please give me about 60 seconds to clear my queue, and try your message again.' })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        }
        res.end();
      },
      onComplete: () => {
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    })
  } catch (err) {
    console.error('🚨 [WEB CHAT] Exception:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
      res.end();
    }
  }
})
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
app.use(express.static(path.join(__dirname, 'agency-public'), { extensions: ['html'] }))

// 🏛️ Decommissioned Legacy Routes (Clean 404 Rejection)
app.get(['/ignite', '/schedule', /^\/dealer-pulse/], (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint deprecated or relocated.' });
})

app.get('/meet-layla', (req, res) => {
  res.sendFile(path.join(__dirname, 'agency-public', 'meet-layla.html'))
})

// 🏠 Explicit Root Route (Prevents "Cannot GET /" on some environments)
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'agency-public', 'terms', 'index.html'))
})
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'agency-public', 'index.html'), (err) => {
    if (err) {
      console.error('❌ [SERVER] Error serving index.html:', err.message);
      res.status(404).send('Nexlify Agency Page Not Found');
    }
  });
})

app.post('/api/onboard/dealer', authMiddleware, async (req, res) => {
  const { dealerName, phoneNumberId, wabaId, metaAccessToken } = req.body;
  if (!dealerName || !phoneNumberId || !wabaId || !metaAccessToken) {
    return res.status(400).json({ success: false, error: 'Missing required credentials.' });
  }
    try {
      const { supabase } = require('./supabase');
      await supabase.from('admin_dealerships').insert([{
        dealership_name: dealerName,
        phone_number_id: String(phoneNumberId),
        waba_id: String(wabaId),
        meta_access_token: metaAccessToken,
        status: 'Provisioned'
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
app.get('/api/inventory', authMiddleware, async (req, res) => {
  try {
    const cars = await getAvailableInventory()
    res.json({ success: true, data: cars, total: cars.length, updatedAt: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// All leads (sorted most recent first)
app.get('/api/leads', authMiddleware, (req, res) => {
  const leads = Array.from(leadsCache.entries()).map(([phone, data]) => ({ id: phone, phone, ...data }))
  leads.sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0))
  res.json({ success: true, data: leads, total: leads.length })
})

// Single lead
app.get('/api/leads/:phone', authMiddleware, (req, res) => {
  const phone = decodeURIComponent(req.params.phone)
  const lead = leadsCache.get(phone)
  if (!lead) return res.status(404).json({ success: false, error: 'Not found' })
  res.json({ success: true, data: { phone, ...lead } })
})

// Aggregated stats for dashboard header cards
app.get('/api/stats', authMiddleware, async (req, res) => {
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
app.post('/api/leads/:phone/qualify', authMiddleware, (req, res) => {
  const phone = decodeURIComponent(req.params.phone)
  const lead = leadsCache.get(phone)
  if (!lead) return res.status(404).json({ success: false })
  leadsCache.set(phone, { ...lead, status: 'qualified', qualifiedAt: new Date().toISOString() })
  res.json({ success: true })
})

app.post('/api/leads/:phone/dismiss', authMiddleware, (req, res) => {
  const phone = decodeURIComponent(req.params.phone)
  const lead = leadsCache.get(phone)
  if (!lead) return res.status(404).json({ success: false })
  leadsCache.set(phone, { ...lead, status: 'dismissed' })
  res.json({ success: true })
})

// ─── AGENTS DASHBOARD API ─────────────────────────────────────────────────────

app.get('/api/agents/status', authMiddleware, (req, res) => {
  try {
    const statuses = getAgentStatus()
    res.json({ success: true, data: statuses })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 🏛️ HERMES MASTER PULSE
app.post('/api/hermes/pulse', authMiddleware, async (req, res) => {
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

// ─── CRON ENDPOINTS ───────────────────────────────────────────────────────────

// GET /api/cron/retargeting - Vercel Serverless Trigger
app.get('/api/cron/retargeting', async (req, res) => {
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized cron request' })
  }

  try {
    const { runBlueprintRetargeting } = require('./followup')
    await runBlueprintRetargeting()
    res.json({ success: true, message: 'Retargeting loop executed' })
  } catch (err) {
    console.error('[CRON ERROR]', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/contact - Layla Deployment Intake Form
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, businessName, clinicName, phone, website, email } = req.body
    const business = businessName || clinicName;

    let emailSent = false;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer')
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com', 
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        if (business === 'Blueprint Request') {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email || 'anaswahabofficial@gmail.com',
            subject: `ACCESS GRANTED: Your 2026 Autonomous Systems Blueprint`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                <h2>Applied AI Systems Architecture Blueprint</h2>
                <p>Thank you for requesting the systems blueprint. You can download the architecture document directly below.</p>
                <div style="margin: 30px 0;">
                  <a href="https://www.ainexlifyagencies.com/assets/The_2026_Autonomous_Blueprint.pdf" 
                     style="background-color: #34d399; color: #000; padding: 14px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
                    Download Architecture Blueprint (PDF)
                  </a>
                </div>
                <p>Best regards,<br>Anas Wahab<br>Applied AI Systems Operator & Technical Chief of Staff</p>
              </div>
            `
          });
          emailSent = true;
        } else {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: 'anaswahabofficial@gmail.com',
            subject: `🚨 Technical Briefing Request: ${business || 'Unknown'}`,
            html: `
              <h3>Technical Briefing Request / Portfolio Inquiry</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Organization:</strong> ${business}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Website / Context:</strong> ${website}</p>
            `,
          });
          emailSent = true;
        }
      } catch (mailErr) {
        console.warn('[API/CONTACT] SMTP dispatch warning:', mailErr.message);
      }
    } else {
      console.warn('[API/CONTACT] SMTP credentials unconfigured; logging lead to persistence layer.');
    }

    // Persist to Supabase
    if (business === 'Blueprint Request') {
      try {
        const { saveLead } = require('./supabase')
        await saveLead({
          name: name || 'Unknown',
          phone: phone || email || '+10000000000',
          lastMessage: `Blueprint Request. Email: ${email}`,
          laylaReply: 'Dispatched PDF.',
          intentScore: 8,
          status: 'Blueprint Downloaded',
          source: 'blueprint-magnet',
          dealer: 'Executive Portfolio'
        });
        
        const { supabase } = require('./supabase');
        await supabase.from('leads').update({ status: 'Blueprint Downloaded' }).eq('phone', phone || email || '+10000000000');
      } catch (e) {
        console.log('[API/CONTACT] Supabase sync failed:', e.message)
      }
    } else {
      try {
        const { saveLead } = require('./supabase')
        await saveLead({
          name: name || 'Unknown',
          phone: phone || '+10000000000',
          lastMessage: `Deployment Request. Business: ${business}, Website: ${website}, Email: ${email}`,
          laylaReply: 'Awaiting integration call.',
          intentScore: 10,
          source: 'website-form',
          dealer: business || 'Nexlify Agency'
        })
      } catch (e) {
        console.log('[API/CONTACT] Supabase sync failed:', e.message)
      }
    }

    res.status(200).json({ success: true, message: "Lead secured successfully.", emailDispatched: emailSent })
  } catch (error) {
    console.error('[API/CONTACT]', error.message)
    res.status(500).json({ success: false, error: "Failed to process lead.", details: error.message })
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
    const { saveLeadToAirtable } = require('./supabase')
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
  const { url, name } = req.body
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

  // 1. Run the CORE scoring logic synchronously so we can return real data to the HUD
  try {
    const { scoreDealer, fetchDealersFromMaps } = require('./recon')
    
    // Quick Map Lookup for metadata
    let dealerProfile = { title: name || host.toUpperCase(), website: cleanUrl, rating: 0, ratingCount: 0 }
    try {
      const discovered = await fetchDealersFromMaps(name || host)
      if (discovered && discovered.length > 0) {
        const match = discovered.find(d => d.website && d.website.includes(host)) || discovered[0]
        dealerProfile = { ...match, title: match.title || dealerProfile.title }
      }
    } catch (discoveryErr) {
      console.warn(`[AGENCY] Map discovery failed during sync phase.`, discoveryErr.message)
    }

    const scoredData = await scoreDealer(dealerProfile)
    
    // Respond with real data for the Interactive HUD
    res.json({ 
      success: true, 
      message: 'Recon Swarm analysis complete.', 
      scoredData,
      pdfUrl: relativePath 
    })

    // 2. Perform heavy background tasks (PDF, CRM, Email)
    const runBackgroundTasks = async () => {
      try {
        const { saveDealerProspect, saveLeadToAirtable } = require('./supabase')
        const { generateVulnerabilityPDF } = require('./pdfGenerator')
        const { sendEmail } = require('./agents/google_auth')

        // Save to CRM
        await saveDealerProspect(scoredData)
        await saveLeadToAirtable({
          name: name || scoredData.name || host,
          phone: '+971500000000',
          lastMessage: `Interactive Audit for ${cleanUrl}. Score: ${scoredData.score}/8`,
          laylaReply: `Recon Report: WhatsApp=${scoredData.hasWhatsApp ? 'YES' : 'NO'}, Reviews=${scoredData.reviews}, PageSpeed=${scoredData.pageSpeedScore}%`,
          intentScore: scoredData.score <= 4 ? 9 : 6,
          source: 'agency-audit',
          dealer: scoredData.name
        })

        // Generate PDF
        const absoluteOutputPath = path.join(__dirname, 'agency-public', 'reports', reportFilename)
        await generateVulnerabilityPDF(scoredData, absoluteOutputPath)

        // Email
        const emailBody = `Hello,\n\nPlease find attached the custom Digital Vulnerability and Revenue Recovery Audit Report for your dealership website: ${scoredData.website}.\n\nMaturity Score: ${scoredData.score}/8\n\nBest regards,\nAnas Wahab\nNexlify AI Agencies`
        await sendEmail('anaswahab97@gmail.com', `NEX-02 RECON: Revenue Recovery Audit - ${scoredData.name}`, emailBody, [{ path: absoluteOutputPath }])
      } catch (bgErr) {
        console.error('[AGENCY] Background audit tasks failed:', bgErr.message)
      }
    }
    runBackgroundTasks()

  } catch (err) {
    console.error('[AGENCY] Audit failed:', err.message)
    res.status(500).json({ success: false, error: 'Recon Swarm initialization failed.' })
  }
})

app.post('/stress-test', authMiddleware, async (req, res) => {
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

if (!process.env.VERCEL) {
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
}

module.exports = app;
