# Ticket Form Site

External ticket registration form that submits data to Acodera CRM.

## Setup

1. **Create an API key** in Acodera CRM (Admin → API Keys) for the partner branch that will receive submissions.

2. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_CRM_API_URL=https://rthxlprgtfuhntpcdhsh.supabase.co/functions/v1/api
VITE_CRM_API_KEY=acd_your_api_key_here
```

3. **Add tickets and payment options** in the CRM dashboard for that branch:
   - Go to Tickets → Add events
   - Go to Admin → Payment Options → Add bank/e-wallet/QR accounts

## Development

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api/*` requests to the CRM Edge Functions, injecting the API key from `.env`.

## Production (Netlify)

1. Set environment variables in Netlify dashboard (Site settings → Environment variables):
   - `CRM_API_URL` — CRM Edge Functions URL
   - `CRM_API_KEY` — Partner API key from CRM

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Update `CORS_ORIGIN` in the CRM's Supabase Edge Function to include the new Netlify domain (comma-separated).

## How it works

1. Visitor fills in name, email, phone, selects an event and payment method
2. Form submits to `/api/submit` (Netlify proxy)
3. Proxy fetches ticket price from CRM, builds full transaction payload
4. Transaction is created in CRM database (visible in CRM → Tickets → Transactions)
5. Success confirmation shown to visitor

## API endpoints used

| Path | Method | Purpose |
|------|--------|---------|
| /api/external/tickets | GET | Fetch available tickets |
| /api/external/payment_options | GET | Fetch payment options |
| /api/submit | POST | Create transaction |
# ticket-Form-site
