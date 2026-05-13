/**
 * 🛰️ SPEED TO LEAD™ SWARM OS — AGENT A: THE MARKET INTEL GATHERER
 * Analyzes competitor SaaS pricing structures, features, and marketing campaigns.
 */

const competitorIntel = [
  {
    competitor: "AiSensy Premium",
    pricing: "AED 3,600 / mo + extra template costs",
    friction: "Lacks dedicated AI auto-closers. Requires manual dashboard setup of rigid keyword rules.",
    opportunity: "Our pre-trained conversational closer (Layla) responds in 4 seconds and handles luxury trade-in valuations out-of-the-box."
  },
  {
    competitor: "Intercom Enterprise",
    pricing: "AED 4,500 / mo base flat",
    friction: "Requires complex manual integration flows. Inquiries are routed to manual agents with high lag over weekends.",
    opportunity: "Speed To Lead offers 24/7 autonomous booking and secure multi-tenant CRM isolation with zero maintenance for AED 2,950."
  }
]

function getProposals() {
  return [
    {
      id: "prop_pricing_position",
      agent: "Agent A (Market Intel)",
      title: "Hardening AED 2950 Competitive Moat",
      description: "Based on analysis of AiSensy and Intercom pricing, our AED 2950 tier provides an unmatched 35% discount margin while delivering autonomous conversational closing. We propose adding a competitive pricing comparison matrix on the sales splash page.",
      status: "PENDING_APPROVAL",
      timestamp: new Date().toISOString()
    }
  ]
}

module.exports = {
  getProposals,
  competitorIntel
}
