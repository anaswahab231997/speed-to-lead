const express = require('express')
const router = express.Router()
const { supabase } = require('./supabase');

// Mock route for dealer imports
router.post('/import', async (req, res) => {
  res.json({ success: true, message: 'Import logic migrated to Supabase.' });
});

module.exports = router;
