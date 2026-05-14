require('dotenv').config({ path: 'server/.env' });
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function checkInventory() {
  const tableId = process.env.AIRTABLE_TABLE_ID || 'tblhrMiIjvR7OndME';
  console.log('Checking Table:', tableId);
  try {
    const records = await base(tableId).select({ maxRecords: 1 }).all();
    if (records.length > 0) {
      console.log('Fields found:', Object.keys(records[0].fields));
    } else {
      console.log('Table is empty or not found.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkInventory();
