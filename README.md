# Robert Gaunce Art - Medusa Backend

E-commerce backend built with Medusa v2 for selling original canvas artwork.

## Tech Stack
- **Framework:** Medusa.js v2.11.1+
- **Database:** PostgreSQL (Railway)
- **Cache/Queue:** Redis (Railway)
- **Storage:** DigitalOcean Spaces (S3-compatible)
- **Payments:** Stripe
- **Hosting:** Railway

## Project Structure
```
├── src/
│   ├── api/          # Custom API routes
│   ├── workflows/    # Custom business logic workflows
│   ├── subscribers/  # Event subscribers
│   └── scripts/      # Seed and utility scripts
├── medusa-config.ts  # Main configuration
├── package.json
└── .env             # Environment variables (not committed)
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.template` to `.env` and fill in your Railway database URLs and API keys:
```bash
cp .env.template .env
```

Required variables:
- `DATABASE_URL` - Railway PostgreSQL connection string
- `REDIS_URL` - Railway Redis connection string
- `JWT_SECRET` & `COOKIE_SECRET` - Random secure strings
- `S3_*` - DigitalOcean Spaces credentials
- `STRIPE_API_KEY` & `STRIPE_WEBHOOK_SECRET` - Stripe credentials

### 3. Run Database Migrations
```bash
npm run db:migrate
```

### 4. Create Admin User
```bash
npx medusa user --email admin@robertgaunceart.com --password [your-secure-password]
```

### 5. Start Development Server
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:9000/app`

## Railway Deployment

### Services Required:
1. **Primary Node** - Main API server (`npm start`)
2. **Worker Node** - Background job processor (`npm run start:worker`)
3. **PostgreSQL** - Database
4. **Redis** - Cache and event queue

### Environment Variables to Set in Railway:
All variables from `.env.template` must be configured in the Railway dashboard for both Primary and Worker services.

### Deployment Commands:
- Build: `npm run build`
- Start (Primary): `npm start`
- Start (Worker): `npm run start:worker`

## Frontend Integration

The Nuxt 4.2 storefront connects to this backend via the Medusa JS SDK:

```typescript
import Medusa from "@medusajs/js-sdk"

const medusa = new Medusa({
  baseUrl: "https://your-railway-url.railway.app",
  auth: {
    type: "session"
  }
})
```

## Product Configuration

Physical canvas products require:
- Inventory tracking enabled
- Shipping profile configured
- Fulfillment provider set up (manual or automated)
- Product images uploaded to S3

## Support

For issues or questions, contact: admin@robertgaunceart.com

