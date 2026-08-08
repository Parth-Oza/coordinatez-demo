// COORDINATEZ — full-stack server
// Serves the storefront + products API + Stripe test-mode checkout + order log.
// Run: npm install && npm start   (set env vars per .env.example for live checkout)

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const stripe = STRIPE_KEY ? require('stripe')(STRIPE_KEY) : null;
const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
const ORDERS_FILE = path.join(__dirname, 'orders.json');

function readOrders() {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch { return []; }
}
function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Stripe webhook needs the raw body — register before json parser
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(400).send('webhook not configured');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const orders = readOrders();
    orders.push({
      id: s.id,
      email: s.customer_details ? s.customer_details.email : null,
      amount_total: s.amount_total,
      currency: s.currency,
      status: 'paid',
      created: new Date().toISOString()
    });
    writeOrders(orders);
  }
  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(__dirname, { extensions: ['html'] }));

// ---- API ----
app.get('/api/health', (_req, res) => res.json({ ok: true, stripe: !!stripe }));

app.get('/api/products', (_req, res) => res.json(products));

// Create a Stripe Checkout session from cart items [{id, qty}]
app.post('/api/checkout', async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const line_items = items
    .map(({ id, qty }) => {
      const p = products.find(x => x.id === id);
      if (!p || !Number.isInteger(qty) || qty < 1 || qty > 99) return null;
      return {
        quantity: qty,
        price_data: {
          currency: p.currency,
          unit_amount: p.price,
          product_data: { name: p.name, images: [p.image] }
        }
      };
    })
    .filter(Boolean);

  if (!line_items.length) return res.status(400).json({ error: 'Cart is empty or invalid.' });

  if (!stripe) {
    // Backend running but Stripe not configured — record a demo order instead
    const orders = readOrders();
    const order = {
      id: 'demo_' + Date.now(),
      items,
      amount_total: line_items.reduce((s, li) => s + li.price_data.unit_amount * li.quantity, 0),
      currency: 'usd',
      status: 'demo (no payment configured)',
      created: new Date().toISOString()
    };
    orders.push(order);
    writeOrders(orders);
    return res.json({ demo: true, orderId: order.id });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${BASE_URL}/?checkout=success`,
      cancel_url: `${BASE_URL}/?checkout=cancelled`
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple order list for the owner (set ADMIN_TOKEN env var)
app.get('/api/orders', (req, res) => {
  if (!ADMIN_TOKEN || req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  res.json(readOrders());
});

// Contact form -> stored as message (swap for an email service later)
app.post('/api/contact', (req, res) => {
  const { firstName, lastName, email, message } = req.body || {};
  if (!firstName || !email || !message) return res.status(400).json({ error: 'missing fields' });
  const file = path.join(__dirname, 'messages.json');
  let msgs = [];
  try { msgs = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  msgs.push({ firstName, lastName, email, message: String(message).slice(0, 5000), created: new Date().toISOString() });
  fs.writeFileSync(file, JSON.stringify(msgs, null, 2));
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`COORDINATEZ running on ${BASE_URL} (stripe: ${!!stripe})`));
