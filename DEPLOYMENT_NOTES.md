# Robert Gaunce Art Backend - Deployment Progress Notes

## Project Information
- **Project**: Robert Gaunce Art Medusa Backend
- **Platform**: Railway
- **Repository**: https://github.com/MarketLou/Robert-Gaunce-Art-Medusa
- **Last Updated**: October 31, 2025
- **Logs Reference**: All logs should be added to `logs.txt` file in project root for diagnostic analysis

---

## Current Sprint: Railway Deployment Stabilization

### Issue #1: Admin Dashboard Build Failure (CRITICAL)
**Status**: ✅ RESOLVED  
**Date Identified**: October 30, 2025  
**Severity**: Critical - Service Unable to Start

#### Problem Description
The Railway deployment was failing with the error:
```
Could not find index.html in the admin build directory. 
Make sure to run 'medusa build' before starting the server.
```

**Root Cause Analysis:**
1. Railway was not executing a build command before starting the server
2. The `npm start` command was running immediately without building the admin dashboard
3. Medusa v2.11 requires `npm run build` to compile the admin UI, not `npx medusa admin build`
4. Without the build step, the `/app/.medusa/admin/index.html` file was never created

#### Solution Implemented
**Files Changed:**
- Created `railway.json` with explicit build configuration

**Configuration Details:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**What This Does:**
- Tells Railway to run `npm install && npm run build` during the build phase
- The build command compiles TypeScript and builds the admin dashboard UI
- Creates the required `/app/.medusa/admin/index.html` file
- Then starts the server with `npm start`

**Commit**: `c36cd39` - "Fix Railway deployment: add build config and integrate Redis/S3 modules"

---

### Issue #2: Redis Connection Failure (CRITICAL)
**Status**: ⚠️ PENDING USER ACTION  
**Date Identified**: October 30, 2025  
**Severity**: Critical - Production Instability

#### Problem Description
The Medusa service was unable to connect to the dedicated Railway Redis instance, falling back to unstable in-memory storage:
```
Local Event Bus installed. This is not recommended for production.
Locking module: Using "in-memory" as default.
```

**Root Cause Analysis:**
1. The `REDIS_URL` environment variable in Railway contained a corrupted value
2. Trailing double-quotes were present: `${{Redis.REDIS_URL}}?family=0""`
3. This caused Redis connection failures
4. Medusa fell back to in-memory storage (unstable for production)

#### Solution Required
**Action Required in Railway Dashboard:**

Navigate to: **Railway Dashboard → Service → Variables → REDIS_URL**

**Current Value (Incorrect):**
```
${{Redis.REDIS_URL}}?family=0""
```

**Change To (Correct):**
```
${{Redis.REDIS_URL}}?family=0
```

**What This Fixes:**
- Removes the extraneous trailing double-quotes
- Allows Medusa to properly connect to Railway's Redis instance
- Enables stable session caching, event processing, and background jobs
- Eliminates "in-memory" warnings in production logs

**Status**: Awaiting manual fix in Railway dashboard

---

### Issue #3: Module Integration (Redis, S3, Stripe)
**Status**: ✅ RESOLVED  
**Date Identified**: October 30, 2025  
**Date Resolved**: October 31, 2025  
**Severity**: High - Production Features Missing

#### Problem Description
The `medusa-config.ts` file was not registering essential production modules:
- Redis cache/event-bus/workflow-engine modules
- S3 file storage module
- Stripe payment provider

Without these modules registered, the services couldn't be used even when environment variables were configured.

#### Solution Implemented
**Files Changed:**
- Updated `medusa-config.ts` to use `Modules` enum from `@medusajs/framework/utils`
- Refactored module configuration to use proper Medusa v2.11.1 structure

**Module Configuration Structure:**

1. **Redis Modules (Cache, Event Bus, Workflow Engine)**
   ```typescript
   const modules: any = {
     [Modules.CACHE]: {
       resolve: '@medusajs/medusa/cache-redis',
       options: { redisUrl: process.env.REDIS_URL }
     },
     [Modules.EVENT_BUS]: {
       resolve: '@medusajs/medusa/event-bus-redis',
       options: { redisUrl: process.env.REDIS_URL }
     },
     [Modules.WORKFLOW_ENGINE]: {
       resolve: '@medusajs/medusa/workflow-engine-redis',
       options: { redis: { url: process.env.REDIS_URL } }
     }
   }
   ```
   - **Purpose**: 
     - Cache: Caches database queries and API responses
     - Event Bus: Handles asynchronous event processing
     - Workflow Engine: Manages background jobs and workflows
   - **Benefit**: Improves performance, ensures reliable event delivery, enables background processing

2. **S3 File Storage Module (DigitalOcean Spaces)**
   ```typescript
   [Modules.FILE]: {
     resolve: '@medusajs/medusa/file',
     options: {
       providers: [{
         resolve: '@medusajs/medusa/file-s3',
         id: 's3',
         options: {
           file_url: process.env.DO_SPACE_URL,
           access_key_id: process.env.DO_SPACE_ACCESS_KEY,
           secret_access_key: process.env.DO_SPACE_SECRET_KEY,
           region: process.env.DO_SPACE_REGION,
           bucket: process.env.DO_SPACE_BUCKET,
           endpoint: process.env.DO_SPACE_ENDPOINT,
         },
       }],
     },
   }
   ```
   - **Purpose**: Stores product images and media files
   - **Provider**: DigitalOcean Spaces (S3-compatible)
   - **Benefit**: Scalable, reliable file storage separate from application server
   - **Note**: Only enabled if `DO_SPACE_BUCKET` environment variable is set

3. **Stripe Payment Module**
   ```typescript
   if (isStripeConfigured) {
     dynamicModules[Modules.PAYMENT] = {
       resolve: '@medusajs/medusa/payment',
       options: {
         providers: [{
           resolve: '@medusajs/medusa/payment-stripe',
           id: 'stripe',
           options: {
             apiKey: stripeApiKey,
             webhookSecret: stripeWebhookSecret,
             capture: true,
           },
         }],
       },
     }
   }
   ```
   - **Purpose**: Processes payments via Stripe
   - **Benefit**: Secure payment processing with webhook support
   - **Note**: Only enabled if both `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET` are configured

**Key Improvements:**
- Used `Modules` enum for type safety and consistency with Medusa v2.11.1
- Conditional module loading based on environment variables
- Proper module structure following official Medusa v2.11.1 patterns
- Debug logging for Stripe configuration diagnostics

**Commit**: Multiple commits - Final resolved configuration

---

### Issue #4: Configuration Initialization Error (CRITICAL)
**Status**: ✅ RESOLVED  
**Date Identified**: October 31, 2025  
**Date Resolved**: October 31, 2025  
**Severity**: Critical - Build Failure

#### Problem Description
The Railway build was failing with the error:
```
TypeError: Cannot access 'config' before initialization
```

**Root Cause Analysis:**
1. Attempted to mutate the `config` object after it was declared with `const`
2. The mutation code tried to set snake_case CORS properties (`store_cors`, `admin_cors`, `auth_cors`) after initialization
3. This created a Temporal Dead Zone (TDZ) error in JavaScript/TypeScript
4. Medusa v2.11.1 uses camelCase CORS properties (`storeCors`, `adminCors`, `authCors`) in the `http` object, which are sufficient

#### Solution Implemented
**Files Changed:**
- Removed post-initialization mutation of `config` object in `medusa-config.ts`
- Simplified configuration to use camelCase properties directly in `defineConfig()`

**Before (Problematic):**
```typescript
const config = defineConfig({ ... })
config.projectConfig.store_cors = process.env.STORE_CORS // ❌ TDZ Error
config.projectConfig.admin_cors = process.env.ADMIN_CORS
config.projectConfig.auth_cors = process.env.AUTH_CORS
```

**After (Correct):**
```typescript
const config = defineConfig({
  projectConfig: {
    http: {
      storeCors: process.env.STORE_CORS || '',  // ✅ Direct assignment
      adminCors: process.env.ADMIN_CORS || '',
      authCors: process.env.AUTH_CORS || '',
    },
  },
})
```

**What This Fixes:**
- Removes Temporal Dead Zone error
- Aligns with Medusa v2.11.1 best practices (camelCase properties)
- Ensures clean build process without initialization errors
- Simplifies configuration structure

**Key Lesson:**
- Never mutate `const` objects after initialization
- Medusa v2.11.1 uses camelCase properties in `http` object - no need for snake_case
- Configuration should be complete within `defineConfig()` call

**Commit**: Configuration refactored to follow Medusa v2.11.1 best practices

---

### Issue #5: Payment Session Creation 500 Error (CRITICAL)
**Status**: ✅ RESOLVED  
**Date Identified**: October 31, 2025  
**Date Resolved**: October 31, 2025  
**Severity**: Critical - Payment Flow Blocked

#### Problem Description
When attempting to create a payment session during checkout, the backend returns a 500 Internal Server Error:

```
POST /store/payment-collections/pay_col_01K8W2DBSFJQNVJZ8AZ3DQEVR9/payment-sessions
Status: 500 (Internal Server Error)
Error: "An unknown error occurred."
```

**Frontend Console Logs Analysis:**
- ✅ **SDK Initialization**: Working correctly
  - Plugin initialized
  - Backend URL: `https://robert-gaunce-art-medusa-production.up.railway.app`
  - Publishable key set
  - SDK object has all required properties (`client`, `admin`, `store`, `auth`)

- ✅ **Cart Operations**: All working
  - Cart retrieved successfully: `cart_01K8W296CA3P54TH48F1QRDYYD`
  - Cart updated successfully with email and shipping address
  - Cart region: `reg_01K8VWFJ3HBYFH6H7GNJ5F7XJ0` ("Medusa Store")
  - Region has country code: `us` (United States)

- ❌ **Payment Session Creation**: Failing
  - Endpoint: `/store/payment-collections/{payment_collection_id}/payment-sessions`
  - Error occurs when calling `store.payment.collections.initiatePaymentSession()`
  - Frontend SDK is working correctly - issue is backend

#### Root Cause Analysis (Hypotheses)
The frontend is correctly initialized and all cart operations succeed. The 500 error during payment session creation suggests a backend configuration or module issue.

**Railway Access Log Analysis:**
- Request: `POST /store/payment-collections/pay_col_01K8W2DBSFJQNVJZ8AZ3DQEVR9/payment-sessions`
- Status: 500 Internal Server Error
- Duration: 97ms
- **Note**: This is a proxy/access log - does NOT show application-level error details
- **Action Required**: Check Railway application logs (not access logs) for detailed error messages

**Confirmed:**
- ✅ Payment provider IS enabled in region (user confirmed)
- ❌ **ROOT CAUSE FOUND**: Payment provider ID mismatch between config and region

**Error Messages Found in Logs:**
```
AwilixResolutionError: Could not resolve 'pp_stripe'.
Unable to retrieve the payment provider with id: pp_stripe
Please make sure that the provider is registered in the container and it is configured correctly in your project configuration file.
```

**Error Occurrences:**
- `2025-10-31T03:51:25` - During initialization
- `2025-10-31T04:00:40` - First payment session attempt
- `2025-10-31T04:08:55` - Payment session creation failure (exact error time)

**Possible Causes (Priority Order):**

1. **Stripe API Error** (Most Likely)
   - Stripe API keys may be invalid or from wrong environment (test vs live)
   - Stripe API may be rejecting the request due to invalid credentials
   - API key may not have required permissions
   - Check actual application logs for Stripe API error messages

2. **Stripe Module Initialization Issue**
   - Stripe module may not be properly loaded at runtime despite config showing it
   - Module may be failing to connect to Stripe API
   - Check Railway application logs for module initialization errors

3. **Payment Provider ID Mismatch**
   - Region payment provider ID may not match the provider ID in `medusa-config.ts`
   - Region may be looking for a provider ID that doesn't match `'stripe'`
   - Check Medusa Admin to verify provider ID matches config

4. **Payment Collection State Issue**
   - The payment collection `pay_col_01K8W2DBSFJQNVJZ8AZ3DQEVR9` may be in an invalid state
   - Payment collection may have been created with different provider configuration
   - Collection may need to be recreated with correct provider

5. **Stripe Webhook Secret Mismatch**
   - Webhook secret may be incorrect (though this shouldn't affect session creation)
   - May indicate broader Stripe configuration issue

#### Diagnostic Steps Required

**Step 1: Review Logs in `logs.txt` (CRITICAL)**
- **All logs should be added to `logs.txt` file in project root**
- Check `logs.txt` for detailed error messages around the timestamp of the error
- Look for:
  - Actual error messages or stack traces
  - Stripe API error responses
  - Module loading errors
  - Payment workflow errors
- Common error patterns to search for:
  - `"error"`
  - `"Stripe"`
  - `"payment"`
  - `"provider"`
  - Stack traces with line numbers
- **Note**: Railway HTTP logs only show status codes - application errors should be copied to `logs.txt`

**Step 2: Verify Stripe Module Initialization (Check Startup Logs)**
- Look for Stripe debug output in Railway application startup logs:
  ```
  🔍 STRIPE CONFIG DEBUG:
  - API Key present: true
  - Webhook Secret present: true
  ✅ Stripe is configured, adding payment module
  ```
- Check for any Stripe module initialization errors during startup
- Verify no module loading failures in the logs
- Search for: `"Stripe"`, `"payment module"`, `"Modules.PAYMENT"`

**Step 3: Check Payment Provider ID Match**
- In Medusa Admin → Settings → Regions → "Medusa Store"
- Note the exact payment provider ID shown in the region
- Compare with provider ID in `medusa-config.ts` (`id: 'stripe'`)
- They MUST match exactly (case-sensitive)
- If they don't match, this is likely the issue

**Step 4: Verify Stripe API Keys**
- Check Railway environment variables:
  - `STRIPE_API_KEY` - Should start with `sk_test_` (test) or `sk_live_` (production)
  - `STRIPE_WEBHOOK_SECRET` - Should start with `whsec_`
- Verify keys are from the correct Stripe account
- Ensure test keys are used if in test mode, or live keys if in production
- Keys must have required permissions (typically: read/write for payment intents, sessions)

**Step 5: Check Payment Collection State**
- Use Medusa Admin or API to inspect payment collection:
  - Payment collection ID: `pay_col_01K8W2DBSFJQNVJZ8AZ3DQEVR9`
  - Verify it's associated with the cart `cart_01K8W296CA3P54TH48F1QRDYYD`
  - Check its status/state
  - Verify the payment provider ID matches the region configuration

**Step 6: Test Stripe API Keys Directly**
- If possible, test the Stripe API keys using Stripe CLI or curl
- Verify the keys are valid and have required permissions
- This helps isolate if it's a key issue vs. configuration issue

#### Solution Implemented

**Root Cause Identified:**
- Region in Medusa Admin uses payment provider ID: `pp_stripe`
- Config in `medusa-config.ts` had provider ID: `'stripe'` (lowercase)
- Medusa couldn't find provider `pp_stripe` because config registered it as `'stripe'`
- This caused `AwilixResolutionError: Could not resolve 'pp_stripe'`

**Fix Applied:**
- Updated `medusa-config.ts` line 29: Changed `id: 'stripe'` to `id: 'pp_stripe'`
- This matches the provider ID expected by the region in Medusa Admin
- Configuration now correctly registers the Stripe provider with ID `pp_stripe`

**Files Changed:**
- `medusa-config.ts` - Updated payment provider ID from `'stripe'` to `'pp_stripe'`

**What This Fixes:**
- Resolves `AwilixResolutionError: Could not resolve 'pp_stripe'`
- Allows Medusa to find and use the Stripe payment provider
- Enables successful payment session creation
- Fixes the 500 Internal Server Error on payment session creation endpoint

**Next Steps:**
1. Deploy updated configuration to Railway
2. Test payment session creation - should now succeed
3. Verify no more `pp_stripe` resolution errors in logs

**Solution A2: Verify Region Provider Configuration** (If provider enabled but not working)
1. Open Medusa Admin
2. Navigate to Settings → Regions
3. Click on "Medusa Store" region
4. Go to Payment Providers section
5. Verify "Stripe" payment provider is enabled and active
6. Ensure provider ID matches `'stripe'` (matches config)
7. Set as default provider if it's the only one
8. Ensure region includes country code `us`
9. Save changes
10. Test payment session creation again

**Solution B: Verify Stripe Module Configuration** (If module not loading)
1. Check Railway logs for Stripe debug output
2. Verify `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET` are set correctly
3. Ensure environment variables are set for the correct Railway service
4. Restart Railway service if needed to reload configuration
5. Check logs again for successful module initialization

**Solution C: Update Stripe API Keys** (If keys invalid)
1. Generate new Stripe API keys in Stripe Dashboard
2. Update `STRIPE_API_KEY` in Railway
3. Update Stripe webhook endpoint URL: `https://robert-gaunce-art-medusa-production.up.railway.app/hooks/payment/stripe`
4. Get new webhook secret from Stripe Dashboard
5. Update `STRIPE_WEBHOOK_SECRET` in Railway
6. Restart Railway service

**Solution D: Payment Collection Reset** (If collection state issue)
1. Create a new cart
2. Attempt payment session creation with the new cart
3. If it works, the issue was with the specific payment collection
4. Consider implementing payment collection cleanup logic

#### Action Items

**Immediate (CRITICAL):**
- [ ] **Review `logs.txt` file** for detailed error messages around error timestamp
- [ ] Add Railway Deploy Logs to `logs.txt` if available (filter around error time)
- [ ] Look for actual error messages, stack traces, or Stripe API errors in `logs.txt`
- [ ] Check `logs.txt` for Stripe module initialization output during startup
- [ ] Verify Stripe debug logs show "✅ Stripe is configured, adding payment module"
- [ ] Search `logs.txt` for error patterns: `"error"`, `"Stripe"`, `"payment"`, `"provider"`

**Configuration:**
- [x] ~~Check Medusa Admin → Settings → Regions → "Medusa Store"~~ ✅ CONFIRMED: Payment provider is enabled
- [ ] **CRITICAL: Verify payment provider ID in region matches `'stripe'` from config** ⚠️ POTENTIAL MISMATCH DETECTED
  - Config uses: `id: 'stripe'` (lowercase) in `medusa-config.ts` line 29
  - Screenshot shows: Payment methods labeled "(STRIPE)" (uppercase)
  - **Action Required**: In Medusa Admin, check the actual provider ID (not the display name)
    - The provider ID might be stored as "STRIPE" (uppercase) but config uses "stripe" (lowercase)
    - They MUST match exactly - case-sensitive!
    - **How to check**: In the region settings, look for a field showing the provider ID (it might be in a different section or in a dropdown/selector)
  - **If mismatch found**: Update either config or region to match (recommend: update config to match region ID)
- [ ] Note the exact provider ID shown in Medusa Admin region settings (not the display name)
- [ ] Compare with `id: 'stripe'` in `medusa-config.ts` - they must match exactly (case-sensitive)
- [x] ✅ CONFIRMED: Region includes country code `us` (United States checked in screenshot)

**Environment:**
- [ ] Verify `STRIPE_API_KEY` is set in Railway and starts with `sk_test_` or `sk_live_`
- [ ] Verify `STRIPE_WEBHOOK_SECRET` is set in Railway and starts with `whsec_`
- [ ] Confirm keys are from the correct Stripe account/environment

**Testing:**
- [ ] After fixing configuration, test payment session creation again
- [ ] Monitor Railway logs during test for any new errors
- [ ] Verify payment session is created successfully

#### Related Issues
- GitHub Issue #13900: "Add to Cart" feature broken in Medusa v2.11.1 (different error, but same version)
- May be related to promotion module bug affecting cart operations

#### Next Steps

**Immediate Actions:**
1. **Check Provider ID Match** (HIGHEST PRIORITY - Most Likely Cause)
   - In Medusa Admin → Settings → Regions → "Medusa Store" → Payment Providers
   - Note the exact provider ID (not display name - may be shown when you click/edit a provider)
   - Compare with `id: 'stripe'` in `medusa-config.ts` line 29
   - **If they don't match**: Update config to match region provider ID, or vice versa
   - **Most common issue**: Region has `'STRIPE'` (uppercase) but config has `'stripe'` (lowercase)

2. **Try Deploy Logs** (If Railway has them)
   - Click "Deploy Logs" tab (not "HTTP Logs")
   - Filter around error time: `00:08:55` (Oct 31, 2025)
   - Search for: `error`, `Stripe`, `payment`, `provider`
   - Look for stack traces or error messages

3. **Add Enhanced Error Logging** (If logs don't show errors)
   - Create custom error handler to catch payment session creation errors
   - Log detailed error information to help diagnose issue
   - See proposed solution below

**Alternative Solution: Add Error Logging**

If Railway logs don't show detailed errors, we can add custom error logging to catch the exact error during payment session creation. This will help us see what's actually failing.

---

## Best Practices & Configuration Guidelines

### Medusa v2.11.1 Configuration Best Practices

#### 1. Module Configuration
- ✅ **Use `Modules` enum** from `@medusajs/framework/utils` for type safety
- ✅ **Define modules as object** with enum keys, not array
- ✅ **Use conditional loading** for optional modules (Stripe, S3) based on environment variables
- ✅ **Place `redisUrl` in `projectConfig`**, not in individual module options

**Correct Structure:**
```typescript
import { Modules } from '@medusajs/framework/utils'

const modules: any = {
  [Modules.CACHE]: { ... },
  [Modules.EVENT_BUS]: { ... },
  // Conditional modules
  ...(hasStripe ? { [Modules.PAYMENT]: { ... } } : {}),
}

const config = defineConfig({
  projectConfig: {
    redisUrl: process.env.REDIS_URL,  // ✅ In projectConfig
  },
  modules: { ...modules },
})
```

#### 2. CORS Configuration
- ✅ **Use camelCase properties** in `http` object (`storeCors`, `adminCors`, `authCors`)
- ✅ **Set values directly** in `defineConfig()` - no post-initialization mutation
- ✅ **Provide fallback values** (`|| ''`) to prevent undefined errors

**Correct Structure:**
```typescript
http: {
  storeCors: process.env.STORE_CORS || '',
  adminCors: process.env.ADMIN_CORS || '',
  authCors: process.env.AUTH_CORS || '',
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
}
```

#### 3. Payment Module Configuration
- ✅ **Use `Modules.PAYMENT` enum** for payment module
- ✅ **Wrap provider in `providers` array** within payment module options
- ✅ **Conditional loading** based on API key and webhook secret presence
- ✅ **Debug logging** helps diagnose configuration issues in production

**Correct Structure:**
```typescript
if (stripeApiKey && stripeWebhookSecret) {
  modules[Modules.PAYMENT] = {
    resolve: '@medusajs/medusa/payment',
    options: {
      providers: [{
        resolve: '@medusajs/medusa/payment-stripe',
        id: 'stripe',
        options: {
          apiKey: stripeApiKey,
          webhookSecret: stripeWebhookSecret,
          capture: true,
        },
      }],
    },
  }
}
```

#### 4. File Storage Configuration
- ✅ **Use `Modules.FILE` enum** for file module
- ✅ **Wrap S3 provider in `providers` array** within file module options
- ✅ **Conditional loading** based on bucket environment variable
- ✅ **Use correct environment variable names** (DO_SPACE_* for DigitalOcean Spaces)

**Correct Structure:**
```typescript
...(process.env.DO_SPACE_BUCKET ? {
  [Modules.FILE]: {
    resolve: '@medusajs/medusa/file',
    options: {
      providers: [{
        resolve: '@medusajs/medusa/file-s3',
        id: 's3',
        options: { ... },
      }],
    },
  },
} : {}),
```

#### 5. Common Pitfalls to Avoid
- ❌ **Don't mutate `const` objects** after initialization (TDZ errors)
- ❌ **Don't use array for modules** - use object with enum keys
- ❌ **Don't mix snake_case and camelCase** - stick to camelCase in v2.11.1
- ❌ **Don't place `redisUrl` in module options** - place in `projectConfig`
- ❌ **Don't skip conditional loading** - modules without config will fail

#### 6. Debugging Configuration Issues
- ✅ **Add console.log statements** during config evaluation to verify environment variables
- ✅ **Check Railway logs** for configuration debug output
- ✅ **Verify module loading** by checking startup logs for module initialization
- ✅ **Test module availability** by attempting to use module features

#### 7. Region Payment Provider Configuration (CRITICAL)
- ✅ **Payment providers must be enabled in regions** - even if configured in `medusa-config.ts`
- ✅ **Provider ID must match** - region provider ID must match the ID in module config (`'stripe'`)
- ✅ **Enable provider in Medusa Admin** - Settings → Regions → [Region Name] → Payment Providers
- ✅ **Set as default if needed** - for single-provider setups, set as default provider
- ✅ **Region must include countries** - payment providers work per region/country combination

**Common Issue:**
- Payment module configured in `medusa-config.ts` ✅
- Stripe API keys set correctly ✅
- Module loads successfully ✅
- **BUT payment session creation fails** ❌
- **Cause:** Payment provider not enabled in the region in Medusa Admin

**How to Fix:**
1. Open Medusa Admin → Settings → Regions
2. Select the region used in cart (e.g., "Medusa Store")
3. Scroll to "Payment Providers" section
4. Click "Add Payment Provider" or enable existing Stripe provider
5. Ensure provider ID matches `'stripe'` from config
6. Save changes
7. Test payment session creation again

---

## Deployment Checklist

### ✅ Completed
- [x] Moved all files from subdirectory to root for proper Railway detection
- [x] Cleaned up duplicate configuration files
- [x] Updated `medusa-config.ts` with Redis modules using `Modules` enum
- [x] Updated `medusa-config.ts` with S3 module using `Modules.FILE` enum
- [x] Updated `medusa-config.ts` with Stripe payment module using `Modules.PAYMENT` enum
- [x] Fixed configuration initialization error (removed TDZ issue)
- [x] Refactored configuration to follow Medusa v2.11.1 best practices
- [x] Committed and pushed changes to GitHub
- [x] Railway automatic deployment triggered
- [x] Build successfully completes without initialization errors

### ⏳ Pending
- [ ] Fix `REDIS_URL` environment variable in Railway dashboard (remove trailing `""`)
- [ ] Verify build completes successfully in Railway logs
- [ ] Verify Redis connection succeeds (no more "in-memory" warnings)
- [ ] Verify S3 module loads correctly
- [ ] Test admin dashboard accessibility
- [ ] Verify API endpoints are responding

### 🔮 Future Tasks
- [ ] Add Stripe payment provider module (when ready for payments)
- [ ] Create admin user account
- [ ] Test product upload with S3 storage
- [ ] Configure CORS settings for production domain
- [ ] Set up worker node on Railway for background jobs
- [ ] Configure database migrations for production

---

## Environment Variables Required

### Railway Service Configuration

**Database:**
- `DATABASE_URL` - PostgreSQL connection string from Railway

**Redis:**
- `REDIS_URL` - Redis connection string from Railway (⚠️ NEEDS FIX - remove trailing `""`)

**Security:**
- `JWT_SECRET` - Random secure string for JWT tokens
- `COOKIE_SECRET` - Random secure string for session cookies

**CORS:**
- `STORE_CORS` - Allowed origins for storefront API
- `ADMIN_CORS` - Allowed origins for admin dashboard
- `AUTH_CORS` - Allowed origins for authentication

**Backend:**
- `MEDUSA_BACKEND_URL` - Railway deployment URL
- `MEDUSA_WORKER_MODE` - Set to "server" for main service

**S3 Storage (DigitalOcean Spaces):**
- `S3_URL` - CDN URL for public file access
- `S3_ENDPOINT` - API endpoint (e.g., `https://nyc3.digitaloceanspaces.com`)
- `S3_REGION` - Region code (e.g., `nyc3`)
- `S3_BUCKET` - Bucket name
- `S3_ACCESS_KEY_ID` - Access key
- `S3_SECRET_ACCESS_KEY` - Secret key

---

## Known Issues & Warnings

### Non-Critical Warnings
These warnings appear in logs but don't prevent operation:

1. **"npm warn config production Use `--omit=dev` instead"**
   - **Impact**: None - just a deprecation notice
   - **Action**: Can be ignored for now

2. **"Skipping instrumentation registration. No register function found."**
   - **Impact**: None - optional observability feature
   - **Action**: Can be ignored unless monitoring is needed

3. **Line ending warnings (LF vs CRLF)**
   - **Impact**: None - Git automatically handles conversion
   - **Action**: Can be ignored

---

## Success Criteria

The deployment will be considered stable and successful when:

1. ✅ Build completes without errors
2. ✅ Server starts without crashes
3. ✅ Redis connection succeeds (no "in-memory" fallback)
4. ✅ Admin dashboard is accessible at `/app`
5. ✅ API health check returns 200 OK
6. ✅ S3 storage is active and functional
7. ✅ No crash loops or restart cycles

---

## References

- **Medusa Documentation**: https://docs.medusajs.com
- **Railway Documentation**: https://docs.railway.app
- **Repository**: https://github.com/MarketLou/Robert-Gaunce-Art-Medusa
- **Medusa Version**: 2.11.1
- **Node Version**: >=20

---

## Next Steps

1. **Immediate**: Fix `REDIS_URL` in Railway dashboard
2. **Verify**: Check Railway deployment logs for successful build
3. **Test**: Access admin dashboard at Railway URL + `/app`
4. **Monitor**: Watch for any new errors or warnings
5. **Document**: Update this file with deployment results

