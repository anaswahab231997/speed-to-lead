const fs = require('fs');
const path = require('path');

const filesToFix = [
  'server/airtable.js',
  'server/dealerApi.js',
  'server/agents/agent_inventory.js',
  'server/agents/agent_health.js',
  'server/agents/agent_dealer.js'
];

filesToFix.forEach(relPath => {
  const absPath = path.join(__dirname, relPath);
  if (!fs.existsSync(absPath)) return;

  let content = fs.readFileSync(absPath, 'utf8');
  
  // Replace the naked Airtable initialization with a hardened one
  const target = /const base = new Airtable\(\{ apiKey: process\.env\.AIRTABLE_API_KEY \}\)\.base\(([^)]+)\)/g;
  
  const replacement = `const apiKey = process.env.AIRTABLE_API_KEY;\nif (!apiKey) console.warn('⚠️ [AIRTABLE] Missing API Key in ${relPath}');\nconst base = new Airtable({ apiKey: apiKey || 'missing' }).base($1)`;

  if (target.test(content)) {
    const newContent = content.replace(target, replacement);
    fs.writeFileSync(absPath, newContent);
    console.log(`Fixed ${relPath}`);
  }
});
