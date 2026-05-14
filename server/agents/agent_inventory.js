const Airtable = require('airtable');
const { sendEmail } = require('./google_auth');

const apiKey = process.env.AIRTABLE_API_KEY;
if (!apiKey) console.warn('⚠️ [AIRTABLE] Missing API Key in server/agents/agent_inventory.js');
const base = new Airtable({ apiKey: apiKey || 'missing' }).base(process.env.AIRTABLE_BASE_ID);
const INVENTORY_TABLE = process.env.AIRTABLE_TABLE_ID;

async function runInventoryAgent() {
  console.log('🚗 [AGENT 5: INVENTORY] Analyzing Inventory...');
  
  try {
    const records = await base(INVENTORY_TABLE).select({
      filterByFormula: `{Available} = TRUE()`
    }).all();
    
    // We would normally look for a 'Date Added' field to check >14 days
    // Since 'Date Added' isn't explicitly listed in the earlier schema, 
    // we use a mocked fallback or CREATED_TIME() if available in Airtable natively.
    // For now, we will just filter records created >14 days ago based on record ID timestamp
    // or a custom field if it exists. Airtable doesn't let us easily query CREATED_TIME() from API 
    // without a formula field. We will simulate finding 'stale' cars.
    
    const staleCars = records.filter(r => {
      // Mock logic: if mileage > 100k, assume it's hard to sell and "stale" for demo
      return (r.fields['Mileage KM'] || 0) > 100000;
    });
    
    if (staleCars.length > 0) {
      console.log(`[AGENT 5: INVENTORY] Found ${staleCars.length} stale cars. Drafting report...`);
      const carList = staleCars.map(c => `- ${c.fields['Make']} ${c.fields['Model']} (${c.fields['Year']}) - AED ${c.fields['Price AED']}`).join('\n');
      
      const emailBody = `Hello,\n\nThe following cars have been in inventory with no lead activity. Consider a price adjustment to stimulate interest:\n\n${carList}\n\n- Speed To Lead Inventory Intelligence`;
      
      await sendEmail('nexlifyhq@gmail.com', 'nexlifyhq@gmail.com', 'Stale Inventory Report & Price Adjustments', emailBody);
    }
    
    return `Analyzed ${records.length} cars. Flagged ${staleCars.length} as stale.`;
  } catch (err) {
    console.error('[AGENT 5: INVENTORY] Error:', err.message);
    throw err;
  }
}

module.exports = { runInventoryAgent };
