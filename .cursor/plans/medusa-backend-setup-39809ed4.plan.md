<!-- 39809ed4-9579-42b4-9708-57c0e7cf0522 c3a47b31-7bd5-4473-86a0-531876058caa -->
# Medusa v2 Backend + Nuxt 4.2 Frontend Integration Plan

## Phase 1: Local Medusa v2 Project Initialization

**Initialize Fresh Medusa v2 Project**

- Run `npx create-medusa-app@latest` to scaffold the project in this workspace
- Select PostgreSQL as database (prepare for Railway connection)
- Configure project for Medusa v2.11.1+ with latest stable packages
- Set up initial `.env` file with local development variables

**Key Files to Configure:**

- `medusa-config.ts` - Core Medusa configuration (database, Redis, CORS, modules)
- `package.json` - Ensure correct build/start scripts for Railway deployment
- `.env` - Environment variables (will mirror to Railway later)

## Phase 2: Database & Redis Configuration for Railway

**Configure Railway Service Connections**

- Update `medusa-config.ts` with Railway PostgreSQL connection string format
- Configure Redis connection for both cache and event queue
- Set up environment variable mapping for Railway's auto-generated credentials
- Add CORS configuration for `https://robertgaunceart.com` and `http://localhost:3000`

**Critical Environment Variables to Set:**

```
DATABASE_URL (Railway PostgreSQL)
REDIS_URL (Railway Redis)
STORE_CORS=http://localhost:3000,https://robertgaunceart.com
ADMIN_CORS=http://localhost:3000,https://robertgaunceart.com
JWT_SECRET
COOKIE_SECRET
```

## Phase 3: DigitalOcean Spaces (S3) File Storage

**Install and Configure S3 Module**

- Install `@medusajs/file-s3` module
- Configure in `medusa-config.ts` with DigitalOcean Spaces endpoints
- Set up bucket for product images (e.g., `robert-gaunce-art-media`)

**Required DO Spaces Credentials:**

- Space name (bucket)
- Access Key ID
- Secret Access Key
- Endpoint (e.g., `nyc3.digitaloceanspaces.com`)
- CDN URL (optional, for faster delivery)

## Phase 4: Stripe Payment Integration

**Install Stripe Payment Provider**

- Install `@medusajs/medusa-payment-stripe` module
- Configure Stripe in `medusa-config.ts`
- Add Stripe webhook endpoint configuration for order fulfillment
- Set up test mode keys initially, swap to live keys for production

**Environment Variables:**

```
STRIPE_API_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Phase 5: Product & Shipping Configuration

**Configure for Physical Canvas Sales**

- Create Region (e.g., "North America")
- Set up Shipping Options (Standard, Express) with carriers
- Configure Tax Rates (if applicable)
- Enable inventory management for physical products
- Set up Fulfillment Provider (manual or integrate with shipping API)

**Admin Tasks (via Medusa Admin):**

- Add initial product: Canvas artwork with variants (sizes, framing options)
- Upload product images (test S3 upload)
- Set pricing, inventory quantities
- Configure shipping profiles

## Phase 6: Railway Deployment Configuration

**Prepare for Multi-Service Deployment**

- Configure `package.json` scripts:
  - `build`: Compile Medusa for production
  - `start`: Run primary API server
  - `start:worker`: Run background job processor
- Create Railway-specific configuration (if needed)
- Set up database migrations to run on deployment

**Railway Service Architecture:**

1. **Primary Node (API)**: Handles HTTP requests, admin dashboard
2. **Worker Node**: Processes background jobs (emails, inventory, webhooks)
3. **PostgreSQL**: Shared database
4. **Redis**: Shared cache and job queue

**Deployment Steps:**

- Push code to GitHub repository
- Connect Railway services to GitHub repo
- Configure environment variables in Railway dashboard
- Deploy primary service, run migrations
- Deploy worker service

## Phase 7: Admin User & Dashboard Access

**Create Admin User**

- Run `npx medusa user -e admin@robertgaunceart.com -p [secure-password]`
- Access admin dashboard at `https://[railway-url]/app`
- Verify all modules loaded (Products, Orders, Settings)
- Test product creation and image upload

## Phase 8: Nuxt 4.2 Frontend Integration

**Install Medusa JS SDK in Nuxt Project**

```bash
npm install @medusajs/js-sdk
```

**Create Medusa API Client (`~/plugins/medusa.ts`)**

- Initialize SDK with Railway backend URL
- Configure for SSR compatibility
- Set up CORS-compliant requests

**Pinia Store Setup**

- `stores/cart.ts` - Cart management (add, update, remove items)
- `stores/products.ts` - Product fetching and display
- `stores/checkout.ts` - Checkout flow, Stripe payment integration
- `stores/auth.ts` - Customer authentication (optional)

**Key Nuxt Pages to Build:**

- `/products` - Product listing page
- `/products/[id]` - Product detail page
- `/cart` - Shopping cart
- `/checkout` - Checkout with Stripe payment
- `/account` - Customer account (orders, profile)

**Integration Points:**

- Fetch products via SDK: `medusa.store.product.list()`
- Add to cart: `medusa.store.cart.lineItems.create()`
- Checkout: `medusa.store.cart.complete()`
- Stripe Elements integration for payment

## Phase 9: Testing & Production Readiness

**Backend Testing**

- Test product CRUD operations in admin
- Verify S3 image uploads
- Test complete checkout flow with Stripe test cards
- Verify webhook handling for order confirmation
- Check worker service processes jobs (emails, notifications)

**Frontend Testing**

- Test product browsing and search
- Verify cart persistence
- Complete test purchase with Stripe test card
- Test responsive design on mobile
- Verify CORS and API connectivity

**Production Checklist:**

- Switch Stripe to live keys
- Update domain CORS to production URL only
- Set `NODE_ENV=production`
- Enable SSL/HTTPS enforcement
- Set up error monitoring (Sentry, LogRocket)
- Configure email provider for transactional emails

## Phase 10: Git Repository & Version Control

**Initialize and Push to GitHub**

- `git init`
- Add `.gitignore` (exclude `.env`, `node_modules`, `dist`)
- Commit initial Medusa backend code
- Add remote: `git remote add origin https://github.com/MarketLou/Robert-Gaunce-Art-Medusa.git`
- Push to GitHub: `git push -u origin main`

**Railway Auto-Deploy Setup**

- Configure Railway to auto-deploy on push to `main` branch
- Set up staging branch for testing (optional)

---

## Critical Files Reference

**Medusa Backend:**

- `medusa-config.ts` - All module and service configurations
- `package.json` - Build and deployment scripts
- `.env` - Environment variables (not committed)
- `src/api/` - Custom API routes (if needed)
- `src/workflows/` - Custom business logic workflows
- `src/subscribers/` - Event subscribers for automation

**Railway Environment Variables (25+ vars):**

- Database, Redis, JWT secrets, Stripe keys, S3 credentials, CORS origins

**Nuxt Frontend (Separate Repo):**

- `plugins/medusa.ts` - Medusa SDK initialization
- `stores/*.ts` - Pinia stores for state management
- `nuxt.config.ts` - Runtime config for Medusa API URL
- `pages/` - E-commerce pages (products, cart, checkout)
- `components/` - Reusable UI components (ProductCard, CartItem, etc.)

---

## Next Steps After Plan Approval

1. Initialize Medusa v2 project in this workspace
2. Configure for Railway deployment
3. Set up S3 and Stripe modules
4. Deploy to Railway and run migrations
5. Create admin user and add test products
6. Provide Nuxt integration code examples and guide

### To-dos

- [ ] Initialize Medusa v2.11.1+ project using create-medusa-app
- [ ] Configure PostgreSQL and Redis connections for Railway
- [ ] Install and configure DigitalOcean Spaces (S3) for product images
- [ ] Install and configure Stripe payment provider
- [ ] Configure regions, shipping options, and fulfillment for physical products
- [ ] Deploy to Railway (primary + worker services) and run migrations
- [ ] Create admin user and verify dashboard access
- [ ] Add test canvas products with images via admin dashboard
- [ ] Create Nuxt 4.2 integration guide with Medusa JS SDK and Pinia stores
- [ ] Initialize git and push to GitHub repository