const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDealerByEmail, saveDealerCredentials } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'cyber-luxe-secret-2026';

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.dealer = decoded;
    next();
  } catch (err) {
    res.status(400).json({ success: false, error: 'Invalid token.' });
  }
};

// Register new dealer
router.post('/register', async (req, res) => {
  const { email, password, dealership_name } = req.body;
  
  if (!email || !password || !dealership_name) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const existing = await getDealerByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, error: 'Dealer already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newDealer = await saveDealerCredentials({
    dealer_id: `dlr_${Date.now()}`,
    dealership_name,
    email,
    password: hashedPassword,
    subscription_status: 'inactive'
  });

  const token = jwt.sign({ id: newDealer.dealer_id, email: newDealer.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({ success: true, token, dealer: { id: newDealer.dealer_id, dealership_name: newDealer.dealership_name, email: newDealer.email } });
});

// Login dealer
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const dealer = await getDealerByEmail(email);
  if (!dealer) return res.status(400).json({ success: false, error: 'Invalid email or password' });

  const validPassword = await bcrypt.compare(password, dealer.password);
  if (!validPassword) return res.status(400).json({ success: false, error: 'Invalid email or password' });

  const token = jwt.sign({ id: dealer.dealer_id, email: dealer.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({ 
    success: true, 
    token, 
    dealer: { 
      id: dealer.dealer_id, 
      dealership_name: dealer.dealership_name, 
      email: dealer.email,
      subscription_status: dealer.subscription_status
    } 
  });
});

// Get current dealer info
router.get('/me', authMiddleware, async (req, res) => {
  const dealer = await getDealerByEmail(req.dealer.email);
  if (!dealer) return res.status(404).json({ success: false, error: 'Dealer not found' });

  res.json({ 
    success: true, 
    dealer: { 
      id: dealer.dealer_id, 
      dealership_name: dealer.dealership_name, 
      email: dealer.email,
      subscription_status: dealer.subscription_status,
      phone_number_id: dealer.phone_number_id,
      waba_id: dealer.waba_id
    } 
  });
});

module.exports = { router, authMiddleware };
