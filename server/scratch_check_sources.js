const Airtable = require('airtable');
require('dotenv').config({ path: './.env' }); // Since it's in the server directory

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const LEADS_TABLE = 'tbly7iJArFklrO8yd';

async function checkSources() {
  try {
    const records = await base(LEADS_TABLE).select({ maxRecords: 100, fields: ['Source'] }).all();
    const sources = new Set(records.map(r => r.fields['Source']).filter(Boolean));
    console.log('--- EXISTING SOURCES IN AIRTABLE ---');
    console.log(Array.from(sources));
    console.log('------------------------------------');
  } catch (err) {
    console.error('Error checking sources:', err.message);
  }
}

checkSources();
