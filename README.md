# Guard QR Scanner (React + Tailwind)

A minimal guard-facing web app where a guard can:

1. Log in with assigned credentials.
2. Scan a customer's order QR code.
3. Fetch and view order details from `POST /scan/order-qr/`.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set the backend URL in `.env`:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## API expectations

- Login endpoint: `POST /auth/login/` and response includes `token` or `access`.
- Scan endpoint: `POST /scan/order-qr/` with body:

```json
{
  "order_number": "SQORD-1BED3476CA"
}
```

If your backend uses different auth endpoint/response fields, update `src/api.js`.
