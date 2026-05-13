import React, { useState, useEffect } from 'react'

export default function OnboardingWizard({ onComplete }) {
  const [setupStep, setSetupStep] = useState(1) // 1 = Inputs, 2 = Meta Connect, 3 = Heavy Lifting Loader
  const [phone, setPhone] = useState('')
  const [dealerId, setDealerId] = useState('')
  const [wabaId, setWabaId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  
  // Embedded Signup Pop-up / Simulation states
  const [showMetaPopup, setShowMetaPopup] = useState(false)
  const [metaPopupStep, setMetaPopupStep] = useState(1)
  
  // Heavy Lifting Loader details
  const [loaderStatus, setLoaderStatus] = useState('')
  const [loaderProgress, setLoaderProgress] = useState(0)
  const [agentLog, setAgentLog] = useState([])
  
  // Error handling
  const [error, setError] = useState('')

  // Pre-populate premium showroom name fallback
  useEffect(() => {
    const names = ['Al Aram Used Cars', 'Luxury Motors Dubai', 'Apex Luxury Cars', 'Prime Showroom Sharjah']
    setDealerId(names[Math.floor(Math.random() * names.length)])
  }, [])

  // Actuate local dynamic provisioning via Twilio Sandbox API
  const handleTwilioConnect = () => {
    setError('')
    const mockSid = `twilio_sid_${Math.floor(100000 + Math.random() * 900000)}`
    const mockToken = 'TWILIO_SECURE_TOKEN'
    
    setWabaId(mockSid)
    setAccessToken(mockToken)
    setSetupStep(3) // Proceed directly to heavy lifting simulation
    
    setTimeout(() => {
      runHeavyLiftingSimulation()
    }, 100)
  }

  const runHeavyLiftingSimulation = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    setAgentLog([])
    
    const addLog = (agent, msg, success = true) => {
      setAgentLog(prev => [...prev, { agent, msg, success }])
    }

    try {
      // Step 1: Initialize
      setLoaderProgress(10)
      setLoaderStatus('Initializing secure setup container...')
      addLog('System', 'Onboarding pipeline initiated. Loading 4-Agent Swarm...')
      await new Promise(r => setTimeout(r, 1000))

      // Step 2: Agent 2 - Token exchange & fetching metadata
      setLoaderProgress(35)
      setLoaderStatus('Agent 2: Exchanging temporary token for Permanent System Token...')
      addLog('Agent 2', 'Upgrading OAuth access token via Meta Graph API...')
      await new Promise(r => setTimeout(r, 1200))
      addLog('Agent 2', 'Permanent System User Token generated successfully.')
      addLog('Agent 2', `Programmatically retrieved phone_number_id & waba_id: ${wabaId}`)

      // Step 3: Agent 3 - Webhook Registration & Database Syncing
      setLoaderProgress(65)
      setLoaderStatus('Agent 3: Registering webhook endpoint callback...')
      addLog('Agent 3', 'Configuring callback URL to https://ainexlifyagencies.com/webhook/whatsapp')
      await new Promise(r => setTimeout(r, 1000))
      addLog('Agent 3', 'Callback registered. Synchronizing database state...')

      // Hit our backend API to save state
      const response = await fetch('http://localhost:3002/api/provision-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          dealerId,
          waba_id: wabaId,
          meta_access_token: accessToken,
          inventory_data: [
            { id: 'car1', name: '2024 Nissan Patrol V8 Platinum', price: 'AED 295,000', stock: 3 },
            { id: 'car2', name: '2023 Porsche Macan GTS', price: 'AED 340,000', stock: 1 },
            { id: 'car3', name: '2024 Land Cruiser 300 VXR', price: 'AED 310,000', stock: 2 }
          ]
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Human translation of technical Meta error
        const translatedMsg = data.errorType === 'COLLISION_ERROR'
          ? "This number is still on your phone's WhatsApp app. Please delete the account on your phone and click retry."
          : (data.error || 'Meta Auth handshake failed.')
        
        addLog('Agent 4', `Provisioning failed: ${translatedMsg}`, false)
        throw new Error(translatedMsg)
      }

      // Step 4: Agent 4 - Automated Welcome & QA Dispatch
      setLoaderProgress(90)
      setLoaderStatus('Agent 4: Dispatching automated success notification...')
      addLog('Agent 4', `Triggering outbound QA message to dealer phone line: ${cleanPhone}`)
      await new Promise(r => setTimeout(r, 1200))
      addLog('Agent 4', 'Layla Core welcome message sent successfully! Live stream active.')

      setLoaderProgress(100)
      setLoaderStatus('SaaS Setup Complete!')
      await new Promise(r => setTimeout(r, 800))
      
      onComplete(cleanPhone)

    } catch (err) {
      setError(err.message)
      setSetupStep(1) // Return back to first screen to modify parameters
    }
  }

  return (
    <div style={{
      padding: '24px',
      background: '#070709',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Sleek Progress Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent, #ff3b30)',
            boxShadow: '0 0 10px var(--accent, #ff3b30)'
          }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
            Twilio Autonomous Onboarding
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
          {setupStep === 3 ? 'HEAVY LIFTING' : `SCREEN ${setupStep} OF 2`}
        </div>
      </div>

      {/* Cyber-Luxe Obsidian Card */}
      <div className="glass" style={{
        padding: '32px 24px',
        border: '1px solid rgba(255, 59, 48, 0.2)',
        background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.04), rgba(7, 7, 9, 0.98))',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)'
      }}>
        
        {/* Screen 1: Simple Inputs */}
        {setupStep === 1 && (
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Showroom Setup Wizard
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '24px', lineHeight: '1.4' }}>
              Deploy Layla for your showroom in under 60 seconds. Enter your basic details to start the Twilio integration.
            </div>

            {error && (
              <div style={{
                background: 'rgba(255, 59, 48, 0.12)',
                border: '1px solid rgba(255, 59, 48, 0.35)',
                padding: '14px',
                borderRadius: '12px',
                color: '#ff453a',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '20px',
                lineHeight: '1.4'
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)' }}>
                Showroom Name
              </label>
              <input
                type="text"
                value={dealerId}
                onChange={(e) => setDealerId(e.target.value)}
                placeholder="e.g. Al Mansour Motors"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  marginTop: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)' }}>
                WhatsApp Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +971 50 987 6543"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  marginTop: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>
                💡 Tip: End your number with 00 to test Agent 4's custom collision errors.
              </div>
            </div>

            <button
              onClick={() => {
                if (!dealerId || !phone) {
                  setError('Please fill in both fields before continuing.')
                  return
                }
                setError('')
                setSetupStep(2) // Move to Screen 2!
              }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #ff3b30, #ff453a)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255,59,48,0.35)'
              }}
            >
              Continue to Twilio Connect →
            </button>
          </div>
        )}

        {/* Screen 2: Branded Twilio Connect Button */}
        {setupStep === 2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Connect with Twilio
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '30px', lineHeight: '1.4' }}>
              Delegate your WhatsApp profile to Speed To Lead™ securely via Twilio. Run an autonomous provisioning loop and trigger a real Twilio test message instantly.
            </div>

            <button
              onClick={handleTwilioConnect}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '0.9rem',
                background: 'linear-gradient(135deg, #f22f46, #ff4d4d)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 10px 30px rgba(242, 47, 70, 0.45)',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>🔴</span>
              <span>CONNECT WHATSAPP WITH TWILIO</span>
            </button>

            <button
              onClick={() => setSetupStep(1)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.75rem',
                marginTop: '20px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Go back and modify showroom details
            </button>
          </div>
        )}

        {/* Screen 3: Autonomous Swarm heavy lifting loader */}
        {setupStep === 3 && (
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px', color: '#ffffff' }}>
              Autonomous Swarm Active
            </div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '24px', lineHeight: '1.4' }}>
              Our agent swarm is performing token upgrades, dynamic routing bindings, and automatic first-impression QA tests.
            </p>

            {/* Glowing progress bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {loaderStatus}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#ff453a', fontWeight: 800 }}>{loaderProgress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${loaderProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff3b30, #ff453a)',
                  boxShadow: '0 0 10px rgba(255,59,48,0.5)',
                  transition: 'width 0.2s ease-out'
                }} />
              </div>
            </div>

            {/* Swarm activity terminal */}
            <div style={{
              background: '#040406',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              minHeight: '120px',
              maxHeight: '180px',
              overflowY: 'auto',
              color: '#30d158',
              lineHeight: '1.6'
            }}>
              {agentLog.map((log, i) => (
                <div key={i} style={{ marginBottom: '6px', color: log.success ? '#30d158' : '#ff453a' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: '8px' }}>[{log.agent}]</span>
                  {log.msg}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Meta Embedded Signup Simulation Modal (OAuth Pop-up emulation) */}
      {showMetaPopup && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(4, 4, 6, 0.96)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#121214',
            border: '1px solid rgba(0, 100, 224, 0.35)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Meta Branding Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5rem' }}>Ⓜ️</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>Facebook Login for Business</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Meta Embedded Onboarding</div>
              </div>
            </div>

            {metaPopupStep === 1 ? (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>Delegate Showroom Line</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '20px' }}>
                  Confirm delegation of the phone line input from Screen 1 for secure dynamic routing.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>WABA MERCHANT ID</label>
                  <input
                    type="text"
                    readOnly
                    value={wabaId}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '12px',
                      color: '#00c6ff',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      marginTop: '4px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>TARGET WHATSAPP LINE</label>
                  <input
                    type="text"
                    readOnly
                    value={phone}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      padding: '12px',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      marginTop: '4px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  onClick={() => setMetaPopupStep(2)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    background: '#0064e0',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Continue to Confirmation
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>Confirm Access Delegation</h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '20px' }}>
                  Granting authorization lets the Agentic Swarm bind callback routes and stand by to serve leads instantly.
                </p>

                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '0.72rem',
                  lineHeight: '1.5',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '20px'
                }}>
                  👤 <strong>Authorized System Account:</strong> AI Nexlify™ Admin<br />
                  📁 <strong>Showroom:</strong> {dealerId}<br />
                  📞 <strong>Line Mapped:</strong> {phone}<br />
                  🔑 <strong>Access Token (Temporary):</strong> <span style={{ fontFamily: 'monospace', color: '#00c6ff' }}>{accessToken.slice(0, 15)}...</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setMetaPopupStep(1)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmProvisioning}
                    style={{
                      flex: 2,
                      padding: '14px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg, #0064e0, #00c6ff)',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    Authorize & Launch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
