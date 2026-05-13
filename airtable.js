const Airtable = require('airtable');
require('dotenv').config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base('Leads'); // Ensure your table name is 'Leads'

async function getAirtable(phoneNumber) {
    try {
        // FIXED: Using quotes and ensuring exact field name 'Phone Number'
        const records = await table.select({
            filterByFormula: `{Phone Number} = '${phoneNumber}'`
        }).firstPage();
        return records.length > 0 ? records[0] : null;
    } catch (error) {
        console.error('Error fetching Airtable record:', error);
        throw error;
    }
}

async function updateAirtableLead(phoneNumber, fields) {
    try {
        const record = await getAirtable(phoneNumber);
        if (record) {
            await table.update(record.id, fields);
        } else {
            await table.create({ "Phone Number": phoneNumber, ...fields });
        }
    } catch (error) {
        console.error('Error updating Airtable:', error);
        throw error;
    }
}

module.exports = { getAirtable, updateAirtableLead };
