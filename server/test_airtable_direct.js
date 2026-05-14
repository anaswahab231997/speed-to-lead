require('dotenv').config({ path: 'server/.env' });
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function testFetch() {
  const tableId = 'tblhrMiIjvR7OndME';
  try {
    console.log('Attempting fetch from:', tableId);
    const records = await base(tableId).select({ maxRecords: 3 }).all();
    console.log('Success! Found', records.length, 'records.');
    if (records.length > 0) {
      console.log('Sample Fields:', Object.keys(records[0].fields));
      console.log('Sample Data:', records[0].fields);
    }
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

testFetch();
