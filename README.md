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
2. Copy `.env.example` values into your host's environment settings:
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
| POST | `/api/auth/register` | `{email,password,name}` → session token (passwords scrypt-hashed) |
| POST | `/api/auth/login` | `{email,password}` → session token (30-day expiry) |
| POST | `/api/auth/google` | `{credential}` (Google ID token) → session token; verifies token server-side |
| GET | `/api/config` | Public frontend config (Google client ID) |
| GET | `/api/auth/me` | Current user (`Authorization: Bearer <token>`) |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/checkout` | `{items:[{id,qty}]}` → Stripe Checkout URL (or demo order); ties to user if logged in |
| GET | `/api/orders/mine` | Logged-in user's orders |
| POST | `/api/contact` | Store contact-form message |
| POST | `/api/stripe/webhook` | Stripe payment confirmations |
| GET | `/api/orders` | All orders (`Authorization: Bearer <ADMIN_TOKEN>`) |

## Auth

Two ways in — both issue the same 30-day session token:

1. **Email + password** — passwords scrypt-hashed, never stored in plain text.
2. **Sign in with Google** — set `GOOGLE_CLIENT_ID` (see `env.example`); a "Continue with Google" button then appears in the login modal automatically. The backend verifies every Google ID token against Google's servers (audience, issuer, expiry, verified email) before creating a session. Google-only accounts have no password and can't be logged into with one.

Users are stored in `users.json` (scrypt-hashed passwords, never plain text), sessions in `sessions.json` — both gitignored. The Login link in the nav opens a register/login modal; the session persists in the browser for 30 days. Swap the JSON files for a database when you outgrow them.

## Notes

- Orders/messages persist to JSON files — swap for a database when volume demands it.
- Images: Unsplash (free license). Hero video: Pexels (free license).
- All contact details in the footer are placeholders.
