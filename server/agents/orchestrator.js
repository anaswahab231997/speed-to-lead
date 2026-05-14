const cron = require('node-cron');
const { runDealerAgent } = require('./agent_dealer');
const { runHealthAgent } = require('./agent_health');
const { runInventoryAgent } = require('./agent_inventory');
const { runEmailAgent } = require('./agent_email');

const agentState = {
  agent_lead: { id: 'Lead Response Agent', status: '🟢 Running', lastRun: 'Continuous', nextRun: 'Continuous', lastResult: 'Monitoring Webhook' },
  agent_email: { id: 'Email Triage Agent', status: '🟡 Sleeping', lastRun: 'Never', nextRun: 'Every 30m', lastResult: 'Waiting to start' },
  agent_dealer: { id: 'Dealer Outreach Agent', status: '🟡 Sleeping', lastRun: 'Never', nextRun: 'Every 24h', lastResult: 'Waiting to start' },
  agent_health: { id: 'System Health Monitor', status: '🟡 Sleeping', lastRun: 'Never', nextRun: 'Every 1h', lastResult: 'Waiting to start' },
  agent_inventory: { id: 'Inventory Intelligence Agent', status: '🟡 Sleeping', lastRun: 'Never', nextRun: 'Every 3h', lastResult: 'Waiting to start' }
};

function updateState(agentId, status, result) {
  if (agentState[agentId]) {
    agentState[agentId].status = status;
    if (result) agentState[agentId].lastResult = result;
    if (status === '🟢 Running') agentState[agentId].lastRun = new Date().toISOString();
  }
}

async function executeAgent(agentId, runFn) {
  console.log(`\n🤖 [ORCHESTRATOR] Starting ${agentState[agentId].id}...`);
  updateState(agentId, '🟢 Running', 'Executing...');
  
  try {
    const result = await runFn();
    updateState(agentId, '🟡 Sleeping', result || 'Completed Successfully');
    console.log(`✅ [ORCHESTRATOR] ${agentState[agentId].id} completed: ${result}`);
  } catch (err) {
    updateState(agentId, '🔴 Error', err.message);
    console.error(`❌ [ORCHESTRATOR] ${agentState[agentId].id} failed:`, err.message);
  }
}

function startOrchestrator() {
  console.log('🌐 [ORCHESTRATOR] Multi-Agent System initializing...');

  // Agent 2: Email Triage Agent (Every 30 mins)
  cron.schedule('*/30 * * * *', () => executeAgent('agent_email', runEmailAgent));

  // Agent 3: Dealer Outreach Agent (Once every 24 hours at 9:00 AM)
  cron.schedule('0 9 * * *', () => executeAgent('agent_dealer', runDealerAgent));

  // Agent 4: System Health Monitor Agent (Every hour)
  cron.schedule('0 * * * *', () => executeAgent('agent_health', runHealthAgent));

  console.log('✅ [ORCHESTRATOR] All reactive agents scheduled.');
}

function getAgentStatus() {
  return Object.values(agentState);
}

module.exports = { startOrchestrator, getAgentStatus, executeAgent, agentState };
