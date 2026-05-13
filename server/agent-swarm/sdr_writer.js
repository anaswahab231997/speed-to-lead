/**
 * 🛰️ SPEED TO LEAD™ SWARM OS — AGENT E: THE SDR (COPYWRITER)
 * Drafts non-spam, value-first, high-precision B2B outreach copy.
 */

const { getProspects } = require('./prospector')

function draftOutreach(prospect) {
  if (prospect.showroom.includes("Sun City")) {
    return `Subject: Response Speed on Sun City Sheikh Zayed Expansion

Hi Marcus,

Congratulations on the upcoming showroom extension on Sheikh Zayed Road! Housing additional hypercar stock is a massive milestone.

While auditing your digital leads, we noticed inquiries on suncitymotors.net face an average 4.2-hour delay. For a showroom selling premium marques, this response lag is leaking an estimated AED 140,000/mo in commissions.

Speed To Lead™ connects your showroom forms directly to a pre-trained conversational closer (Layla Core) via WhatsApp in 4 seconds flat.

I have drafted an AI model mapped specifically to your Sheikh Zayed stock. Can I send a 60-second preview link to your mobile?

Best regards,
Anas Wahab
Founder, Speed To Lead™`
  }

  if (prospect.showroom.includes("Infinity")) {
    return `Subject: Instant Conversational Bookings for Rajesh

Dear Rajesh,

Your expansion into the Audi e-tron and Porsche Taycan EV line-up is spectacular.

However, we noticed infinitycars.co.in relies on standard email webforms, which lack WhatsApp click-to-chat capabilities. Wealthy EV buyers expect instant conversational engagement.

Our platform, Speed To Lead™, connects luxury EV prospects with Layla (our pre-trained closer agent) on WhatsApp within 4 seconds of a form submission.

Would you be open to trying a simulated live chat session mapped to your Taycan inventory?

Best regards,
Anas Wahab
Founder, Speed To Lead™`
  }

  return `Subject: Carbon-Ceramic Lead Leakage on DAS

Hi Dieter,

With the massive influx of organic search traffic from your carbon-ceramic service PR campaign, ensuring fast lead capture is critical.

Right now, customers inquiring about carbon-ceramic packages face hours of latency before manual follow-up.

Speed To Lead™ isolates deutschesautoservice.aed leads and engages them on WhatsApp with Layla Core in under 4 seconds, booking service slots autonomously.

Could I text you a live sandbox simulator link to show you the speed?

Best regards,
Anas Wahab
Founder, Speed To Lead™`
}

function getDrafts() {
  const prospects = getProspects()
  return prospects.map(p => ({
    ...p,
    draftMessage: draftOutreach(p)
  }))
}

module.exports = {
  getDrafts,
  draftOutreach
}
