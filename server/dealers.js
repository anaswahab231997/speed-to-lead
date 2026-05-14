const express = require('express');
const router = express.Router();
const { saveDealerCredentials, getDealerById } = require('./db');
const { authMiddleware } = require('./auth');

// Update dealer credentials
router.post('/credentials', authMiddleware, async (req, res) => {
  const { dealership_name, waba_id, phone_number_id, meta_access_token, airtable_base_id, airtable_api_key } = req.body;
  const dealerId = req.dealer.id;

  const current = await getDealerById(dealerId);
  if (!current) return res.status(404).json({ success: false, error: 'Dealer not found' });

  // Update existing record
  const updated = await saveDealerCredentials({
    dealer_id: dealerId,
    dealership_name: dealership_name || current.dealership_name,
    waba_id: waba_id || current.waba_id,
    phone_number_id: phone_number_id || current.phone_number_id,
    meta_access_token: meta_access_token || current.meta_access_token,
    // Add additional fields as needed
    email: current.email,
    password: current.password, // Keep existing password
    subscription_status: current.subscription_status
  });

  // Note: For Airtable, we might want to store base_id and api_key separately or in a config object
  // For now, I'm just showing the flow.

  res.json({ success: true, dealer: updated });
});

module.exports = router;
