require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { handleInboundMessage } = require('./layla');
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const LEADS_TABLE = 'tbly7iJArFklrO8yd';
const BUYER_PHONE = '+971509998887';

async function verifyAirtableLead() {
  console.log('==================================================');
  console.log('🧪 TESTING LIVE AIRTABLE CRM MEMORY TRIGGER...');
  console.log('==================================================\n');

  console.log(`👤 Simulating inbound buyer message from ${BUYER_PHONE}...`);
  const text = 'Hi, I am looking for a Toyota Pajero under 70000 AED, is it in stock?';
  
  console.log('⏳ Invoking Layla AI conversational engine...');
  const result = await handleInboundMessage({
    from: BUYER_PHONE,
    text: text,
    messageId: `test_verification_${Date.now()}`
  });

  console.log('\n✅ Layla Replied successfully!');
  console.log(`🤖 Layla's Reply: "${result.reply}"`);
  console.log(`📊 Lead Score: ${result.score}/10 | State: ${result.emotionalState}`);
  
  console.log('\n🔍 Verifying database write in Airtable Table (tbly7iJArFklrO8yd)...');
  
  // Wait a moment for Airtable API replication
  await new Promise(r => setTimeout(r, 2000));

  try {
    const records = await base(LEADS_TABLE).select({
      filterByFormula: `{Phone} = '${BUYER_PHONE}'`
    }).all();

    if (records.length > 0) {
      console.log(`\n🎉 CONFIRMATION: Record successfully written to Airtable!`);
      records.forEach((r, i) => {
        console.log(`--------------------------------------------------`);
        console.log(`Record ID     : ${r.id}`);
        console.log(`Buyer Name    : ${r.fields['Name']}`);
        console.log(`Phone Number  : ${r.fields['Phone']}`);
        console.log(`Car Interest  : ${r.fields['Car Interest']}`);
        console.log(`AI Reasoning  : ${r.fields['AI Reasoning']}`);
        console.log(`Lead Score    : ${r.fields[' Lead Score'] || r.fields['Lead Score']}`);
        console.log(`Status        : ${r.fields[' Status'] || r.fields['Status']}`);
        console.log(`Submitted At  : ${r.fields['Submitted At']}`);
        console.log(`--------------------------------------------------`);
      });
    } else {
      console.log('❌ Error: Could not find the record in Airtable Leads Table.');
    }
  } catch (err) {
    console.error('❌ Error querying Airtable:', err.message);
  }
}

verifyAirtableLead();
