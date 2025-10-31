# Payment Provider Debug Guide

## Overview
This guide explains the diagnostic logging we've added to troubleshoot the payment provider ID resolution issue.

## Console Logs Added

### 1. Configuration Loading Logs (Startup)

**Location:** `medusa-config.ts`

**What it logs:**
- Stripe configuration status
- Provider ID being registered (`pp_stripe`)
- Full payment module configuration
- All modules being registered
- Provider IDs for each module

**Look for in logs:**
```
🔍 STRIPE CONFIG DEBUG:
- API Key present: true/false
- Webhook Secret present: true/false
✅ Stripe is configured, adding payment module
🔧 PAYMENT PROVIDER CONFIG:
- Provider ID being registered: pp_stripe
✅ Payment module configured with provider ID: pp_stripe
📦 [CONFIG] Final modules being registered:
- Module "PAYMENT" providers: [{ id: 'pp_stripe', resolve: '@medusajs/medusa/payment-stripe' }]
✅ [CONFIG] Configuration loaded successfully
```

### 2. Diagnostic API Routes

**Two new diagnostic endpoints have been created:**

#### Endpoint 1: Check Available Payment Providers
**GET** `/store/custom/payment-providers-debug`

**Purpose:** Lists all payment providers that can be resolved from the container

**Usage:**
```bash
curl https://robert-gaunce-art-medusa-production.up.railway.app/store/custom/payment-providers-debug
```

**What it logs:**
- Tests resolution of different provider IDs: `pp_stripe`, `stripe`, `STRIPE`, `pp_stripe_payment`
- Shows which provider IDs successfully resolve
- Shows which provider IDs fail and why
- Attempts to list providers via payment module service

**Response:**
```json
{
  "success": true,
  "providers": [
    { "id": "pp_stripe", "status": "resolved" },
    { "id": "stripe", "status": "not_resolved", "error": "..." }
  ],
  "providerIds": ["pp_stripe"],
  "timestamp": "2025-10-31T...",
  "message": "Payment provider diagnostic completed. Check server logs for details."
}
```

#### Endpoint 2: Test Payment Session Creation
**POST** `/store/custom/payment-session-debug`

**Purpose:** Tests payment session creation with detailed logging

**Usage:**
```bash
curl -X POST https://robert-gaunce-art-medusa-production.up.railway.app/store/custom/payment-session-debug \
  -H "Content-Type: application/json" \
  -d '{"payment_collection_id": "pay_col_01K8W91VG96CKQB8HM28X9QXSX"}'
```

**What it logs:**
- Payment collection details (ID, amount, region, expected provider ID)
- Provider resolution attempts
- Provider resolution success/failure with detailed errors
- Attempts alternative provider IDs if resolution fails
- Payment session creation attempt

**Response:**
```json
{
  "success": true,
  "session": { ... },
  "message": "Payment session created successfully"
}
```

**Or if there's an error:**
```json
{
  "success": false,
  "error": "Cannot resolve payment provider",
  "expectedProviderId": "pp_stripe",
  "details": "Could not resolve 'pp_stripe'...",
  "stack": "..."
}
```

## How to Use These Logs

### Step 1: Check Startup Logs
After deployment, check Railway logs for:
- ✅ `✅ Payment module configured with provider ID: pp_stripe`
- ✅ `📦 [CONFIG] Final modules being registered`
- Look for any errors during configuration loading

### Step 2: Test Provider Resolution
Call the diagnostic endpoint:
```bash
GET /store/custom/payment-providers-debug
```

This will tell you:
- Which provider IDs are actually registered in the container
- Which provider IDs fail to resolve
- What errors occur during resolution

### Step 3: Test Payment Session Creation
Call the payment session diagnostic endpoint with a real payment collection ID:
```bash
POST /store/custom/payment-session-debug
Body: { "payment_collection_id": "pay_col_01K8W91VG96CKQB8HM28X9QXSX" }
```

This will tell you:
- What provider ID the payment collection expects
- Whether that provider can be resolved
- Detailed error messages if resolution fails
- Whether alternative provider IDs work

### Step 4: Review Logs
Check `logs.txt` for:
- All log entries prefixed with `🔍 [PAYMENT DEBUG]` or `🔍 [PAYMENT SESSION DEBUG]`
- Provider resolution attempts and results
- Detailed error messages and stack traces

## Expected Log Output

### If Provider is Correctly Registered:
```
✅ [PAYMENT DEBUG] Provider ID "pp_stripe" RESOLVES successfully
✅ [PAYMENT SESSION DEBUG] Provider resolved successfully!
✅ [PAYMENT SESSION DEBUG] Payment session created successfully!
```

### If Provider ID Mismatch:
```
❌ [PAYMENT DEBUG] Provider ID "pp_stripe" FAILS: Could not resolve 'pp_stripe'
✅ [PAYMENT DEBUG] Provider ID "stripe" RESOLVES successfully
❌ [PAYMENT SESSION DEBUG] Provider resolution failed: Could not resolve 'pp_stripe'
✅ [PAYMENT SESSION DEBUG] Alternative ID "stripe" works!
```

This would indicate the region expects `pp_stripe` but the provider is registered as `stripe`.

## Next Steps Based on Results

### Scenario 1: Provider ID `pp_stripe` Resolves Successfully
- **Action:** Check if the region provider ID matches
- **Check:** Medusa Admin → Regions → Payment Providers → Provider ID

### Scenario 2: Provider ID `stripe` Resolves but `pp_stripe` Doesn't
- **Action:** Update `medusa-config.ts` to use `id: 'stripe'` instead of `id: 'pp_stripe'`
- **OR:** Update the region in Medusa Admin to use provider ID `stripe`

### Scenario 3: Neither Provider ID Resolves
- **Action:** Check module initialization logs
- **Check:** Verify Stripe module is actually loading
- **Check:** Verify environment variables are set correctly

## Troubleshooting Tips

1. **Check logs.txt** - All diagnostic output will be in the logs file
2. **Search for prefixes** - Look for `🔍 [PAYMENT`, `✅ [PAYMENT`, `❌ [PAYMENT`
3. **Compare provider IDs** - Match what's registered vs what's expected
4. **Check timestamps** - Ensure you're looking at logs after the latest deployment

---

## Quick Test Commands

### Test 1: Check Available Providers
```bash
curl https://robert-gaunce-art-medusa-production.up.railway.app/store/custom/payment-providers-debug
```

### Test 2: Test Payment Session Creation
```bash
curl -X POST https://robert-gaunce-art-medusa-production.up.railway.app/store/custom/payment-session-debug \
  -H "Content-Type: application/json" \
  -d '{"payment_collection_id": "YOUR_PAYMENT_COLLECTION_ID"}'
```

Replace `YOUR_PAYMENT_COLLECTION_ID` with the actual payment collection ID from your cart.

