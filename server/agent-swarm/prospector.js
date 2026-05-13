/**
 * 🛰️ SPEED TO LEAD™ SWARM OS — AGENT D: THE PROSPECTOR (RECONNAISSANCE)
 * Constrained intelligence gathering across high-tier target segments.
 */

const targetLeads = [
  {
    showroom: "Sun City Motors Dubai",
    website: "suncitymotors.net",
    region: "UAE",
    decisionMaker: "Marcus Vance",
    role: "General Manager",
    email: "marcus.vance@suncitymotors.net",
    news: "Recently announced showroom extension on Sheikh Zayed Road to house new hypercar stock. Currently has a 4.2-hour average manual response delay on digital inquiries.",
    painPoint: "High response latency is leaking an estimated AED 140,000 monthly in premium vehicle sales commissions."
  },
  {
    showroom: "Infinity Cars India",
    website: "infinitycars.co.in",
    region: "India",
    decisionMaker: "Rajesh Malhotra",
    role: "Sales Director",
    email: "rajesh.m@infinitycars.co.in",
    news: "Currently scaling their luxury EV line-up with Audi e-tron and Porsche Taycan models. Website contact form lacks any instant WhatsApp click-to-chat capabilities.",
    painPoint: "Customers drop off digital channels due to lack of conversational closer engagement."
  },
  {
    showroom: "Deutsches Auto Service Dubai",
    website: "deutschesautoservice.aed",
    region: "UAE",
    decisionMaker: "Dieter Mueller",
    role: "Service & Sales Director",
    email: "d.mueller@das.ae",
    news: "Experiencing huge inbound organic search traffic volume following recent PR campaign for carbon-ceramic brake service packages.",
    painPoint: "Struggling to route and follow-up hot inquiries across multiple sales divisions."
  }
]

function getProspects() {
  return targetLeads
}

module.exports = {
  getProspects
}
