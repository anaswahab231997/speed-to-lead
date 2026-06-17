const { supabase } = require('../supabase');
const { sendEmail } = require('./google_auth');

async function runInventoryAgent() {
  console.log('🚙 [AGENT 5: INVENTORY] Analyzing Inventory...');
  
  try {
    const { data: records, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('status', 'Available');
      
    if (error) throw error;
    if (!records || records.length === 0) {
      return 'No available inventory to analyze.';
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const staleCars = records.filter(r => {
      const createdDate = new Date(r.created_at);
      return createdDate < fourteenDaysAgo;
    });

    if (staleCars.length > 0) {
      console.log(`⚠️ [INVENTORY AGENT] Found ${staleCars.length} stale cars.`);
      
      let emailBody = 'The following cars have been in inventory for over 14 days and may need a price adjustment:\n\n';
      staleCars.forEach(car => {
        emailBody += `- ${car.name} (Price: ${car.price})\n`;
      });
      
      await sendEmail(
        'nexlifyhq@gmail.com',
        'nexlifyhq@gmail.com',
        '[INVENTORY ALERT] Stale Vehicles Detected',
        emailBody
      );
      
      return `Alerted on ${staleCars.length} stale cars.`;
    }
    
    return 'All inventory is fresh.';
  } catch (err) {
    console.error('[AGENT 5: INVENTORY] Error:', err.message);
    return 'Agent failed gracefully.';
  }
}

module.exports = { runInventoryAgent };
