/**
 * 🛰️ SPEED TO LEAD™ SWARM OS — AGENT B: THE STRATEGIST
 * Proposes tone adjustments and conversion psychology strategies.
 */

function getProposals() {
  return [
    {
      id: "prop_layla_urgency",
      agent: "Agent B (The Strategist)",
      title: "Introduce Sheikh Zayed Luxury Urgency Bias",
      description: "Analysis of Dubai showroom interactions shows high response rates when Layla emphasizes limited weekend viewing slots. We propose appending a weekend scheduling rule to Layla's core instruction block.",
      status: "PENDING_APPROVAL",
      timestamp: new Date().toISOString()
    }
  ]
}

module.exports = {
  getProposals
}
