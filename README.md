# COORDINATEZ — Matcha Shop

Static client demo + full-stack ready backend.

- **Static demo (live now):** https://parth-oza.github.io/coordinatez-demo/ — GitHub Pages serves `index.html` only. Cart works in the browser; checkout shows demo mode.
- **Full stack:** run `server.js` on any Node host and the same storefront gets a real products API, order storage, contact-form storage, and Stripe checkout.

## Run locally

```bash
npm install
npm start          # http://localhost:3000
```

Works immediately with no keys — checkout records demo orders to `orders.json`.

## Enable real payments (Stripe test mode)

1. Create a Stripe account → https://dashboard.stripe.com
2. Copy `env.example` values into your host's environment settings:
   - `STRIPE_SECRET_KEY` — Developers → API keys (start with `sk_test_...`)
   - `STRIPE_WEBHOOK_SECRET` — Developers → Webhooks → add endpoint `https://<your-host>/api/stripe/webhook`, event `checkout.session.completed`
   - `ADMIN_TOKEN` — any long random string
   - `BASE_URL` — your deployed URL
3. Checkout now redirects to Stripe's hosted payment page; paid orders land in `orders.json`.

## Deploy (Render — free tier)

1. render.com → New → Web Service → connect this GitHub repo
2. Build command: `npm install` — Start command: `npm start`
3. Add the environment variables above → Deploy

Railway, Fly.io, or any Node host works the same way.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Server + Stripe status |
| GET | `/api/products` | Product catalog (`products.json`) |
| POST | `/api/checkout` | `{items:[{id,qty}]}` → Stripe Checkout URL (or demo order) |
| POST | `/api/contact` | Store contact-form message |
| POST | `/api/stripe/webhook` | Stripe payment confirmations |
| GET | `/api/orders` | Order list (`Authorization: Bearer <ADMIN_TOKEN>`) |

## Notes

- Orders/messages persist to JSON files — swap for a database when volume demands it.
- Images: Unsplash (free license). Hero video: Pexels (free license).
- All contact details in the footer are placeholders.
