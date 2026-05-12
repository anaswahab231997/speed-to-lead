const Airtable = require('airtable');

// Load environment variables
require('dotenv').config();

const AIRTABLE_API_KEY= process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_LEADS_TABLE_ID = process.env.AIRTABLE_LEADS_TABLE_ID || 'tblhrMiIjvR7OndME'; // Fallback if not set

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Airtable API Key or Base ID is missing. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.');
    // In a production scenario, you might want to throw an error or have a more robust fallback
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * Retrieves lead data from Airtable based on the sender's phone number.
 * @param {string} phoneNumber - The phone number of the sender (e.g., '+14155238886').
 * @returns {Promise<object|null>} - A promise that resolves with the Airtable record or null if not found.
 */
async function getAirtable(phoneNumber) {
    if (!phoneNumber) {
        console.warn('getAirtable called with empty phoneNumber.');
        return null;
    }
    try {
        // Assuming the primary field in Airtable (often 'Name' or a unique ID) can be searched by phone number.
        // You might need to adjust the formula based on your actual Airtable schema.
        // Example: If phone numbers are stored in a field named 'Phone Number'.
        const query = `{Phone Number} = "${phoneNumber}"`; 
        
        const records = await base(AIRTABLE_LEADS_TABLE_ID).select({
            filterByFormula: query,
            maxRecords: 1 // We expect only one matching lead
        }).firstPage();

        if (records.length > 0) {
            console.log(`Found Airtable record for ${phoneNumber}: ${records[0].id}`);
            return records[0]; // Return the first matching record
        } else {
            console.log(`No Airtable record found for ${phoneNumber}.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching Airtable record for ${phoneNumber}:`, error);
        // Consider notifying Sentinel about critical Airtable errors
        // pingAlert(`Airtable Error: Failed to fetch lead for ${phoneNumber}. ${error.message}`);
        throw error; // Re-throw to be handled by the calling function
    }
}

/**
 * Updates or creates a lead record in Airtable.
 * @param {string} phoneNumber - The phone number of the lead to update/create.
 * @param {object} data - An object containing the fields to update (e.g., {"Latest Layla Response": "...", "Conversation History": "..."}).
 * @returns {Promise<object|null>} - A promise that resolves with the updated/created Airtable record or null on failure.
 */
async function updateAirtableLead(phoneNumber, data) {
    if (!phoneNumber) {
        console.warn('updateAirtableLead called with empty phoneNumber.');
        return null;
    }
    
    try {
        let record = await getAirtable(phoneNumber);
        
        if (record) {
            // Update existing record
            const updatedRecord = await base(AIRTABLE_LEADS_TABLE_ID).update(record.id, data);
            console.log(`Updated Airtable record ${record.id} for ${phoneNumber}.`);
            return updatedRecord;
        } else {
            // Create new record if not found
            // Ensure 'Phone Number' field is included for new records, and any other required fields.
            const newData = { ...data, 'Phone Number': phoneNumber }; 
            const createdRecord = await base(AIRTABLE_LEADS_TABLE_ID).create(newData);
            console.log(`Created new Airtable record ${createdRecord.id} for ${phoneNumber}.`);
            return createdRecord;
        }
    } catch (error) {
        console.error(`Error updating/creating Airtable record for ${phoneNumber}:`, error);
        // Consider notifying Sentinel about critical Airtable errors
        // pingAlert(`Airtable Error: Failed to update/create lead for ${phoneNumber}. ${error.message}`);
        throw error;
    }
}

module.exports = {
    getAirtable,
    updateAirtableLead
};
