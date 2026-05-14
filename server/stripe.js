const express = require('express');
const router = express.Router();
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn('⚠️ [STRIPE] STRIPE_SECRET_KEY is missing from process.env! Payments will not work.');
}
const stripe = require('stripe')(stripeKey || 'sk_test_missing_key_please_set_in_env');
const { updateDealerSubscription, getDealerById } = require('./db');
const { authMiddleware } = require('./auth');

// Create a Stripe Checkout Session for subscription
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  const { priceId } = req.body; // e.g., 'price_H5gg...'
  const dealerId = req.dealer.id;

  const dealer = await getDealerById(dealerId);
  if (!dealer) return res.status(404).json({ success: false, error: 'Dealer not found' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: dealer.email,
      line_items: [
        {
          price: priceId || 'price_1R1p78InA8iR2Zp8q2p8q2p8', // Fallback or use real price ID
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cancel`,
      metadata: {
        dealer_id: dealerId,
      },
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('[STRIPE ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stripe Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const dealerId = session.metadata.dealer_id;
      
      await updateDealerSubscription(dealerId, {
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: 'active',
        plan: 'Premium'
      });
      
      console.log(`✅ Subscription activated for Dealer: ${dealerId}`);
      break;
    
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Find dealer by stripe_customer_id and set status to inactive
      // (Would need a getDealerByStripeCustomerId function)
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
