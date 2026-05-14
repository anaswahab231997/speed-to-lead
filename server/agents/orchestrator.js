const cron = require('node-cron');
const { runDealerAgent } = require('./agent_dealer');
const { runHealthAgent } = require('./agent_health');
const { runHermesAgent } = require('./hermes');

const agentState = {
  agent_hermes: { id: 'Hermes Master Agent', status: '🟢 Running', lastRun: 'Initial', nextRun: 'Every 6h', lastResult: 'System Audit' },
  agent_lead: { id: 'Lead Response Agent', status: '🟢 Running', lastRun: 'Continuous', nextRun: 'Continuous', lastResult: 'Monitoring Webhook' },
  agent_dealer: { id: 'Dealer Outreach Agent', status: '🟡 Sleeping', lastRun: 'Never', nextRun: 'Every 24h', lastResult: 'Waiting to start' },
  agent_health: { id: 'System Health Monitor', status: '🟡 Sleeping', lastRun: 'Never', nextRun: 'Every 1h', lastResult: 'Waiting to start' }
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
  console.log('🌐 [ORCHESTRATOR] Hermes-Driven System initializing...');

  // 🏛️ Master Agent: Hermes (Every 6 hours)
  cron.schedule('0 */6 * * *', () => executeAgent('agent_hermes', runHermesAgent));

  // Agent 3: Dealer Outreach Agent (Once every 24 hours at 9:00 AM)
  cron.schedule('0 9 * * *', () => executeAgent('agent_dealer', runDealerAgent));

  // Agent 4: System Health Monitor Agent (Every hour)
  cron.schedule('0 * * * *', () => executeAgent('agent_health', runHealthAgent));

  // Run Hermes immediately on startup to verify the pipeline
  executeAgent('agent_hermes', runHermesAgent);

  console.log('✅ [ORCHESTRATOR] Active agents scheduled with Hermes Oversight.');
}

function getAgentStatus() {
  return Object.values(agentState);
}

module.exports = { startOrchestrator, getAgentStatus, executeAgent, agentState };
