# How to Find Railway Application Logs

**IMPORTANT**: All logs should be copied to `logs.txt` file in the project root for analysis.

## Step-by-Step Instructions

### Step 1: Access Railway Dashboard
1. Go to https://railway.app
2. Log in to your Railway account
3. Navigate to your project

### Step 2: Select Your Service
1. Click on your Medusa backend service (e.g., "robert-gaunce-art-medusa-production")
2. This opens the service details page

### Step 3: Navigate to Logs
1. Look for a **"Logs"** tab in the service page navigation
2. Click on **"Logs"** tab
3. You should see multiple log views available

### Step 4: Select Deploy Logs (Application Runtime Logs)
Railway shows these log types:
- **Build Logs** - Shows build process (`npm install`, `npm run build`)
- **Deploy Logs** - Shows runtime application output ✅ **THIS IS WHAT WE NEED**
- **HTTP Logs** - Shows HTTP requests/responses (proxy/access logs - what you shared earlier)

**Note:** Railway doesn't have a dedicated "Application Logs" tab. Runtime application output (console.log, errors) appears in **"Deploy Logs"** tab.

**How to identify Deploy Logs with application output:**
- Should show console.log output from your application
- Should show error messages with stack traces
- Should show your Stripe debug output: `🔍 STRIPE CONFIG DEBUG:`
- Will have actual error messages, not just HTTP status codes
- Shows output from `npm start` command (your Medusa server)

### Step 5: Filter by Timestamp
1. Look for a timestamp filter or search box
2. Enter or navigate to: `2025-10-31T04:00:40` (or a range around it)
3. This is when the payment session creation error occurred

### Step 6: Search for Errors
Look for keywords:
- `"error"` - General error messages
- `"Stripe"` - Stripe-related errors
- `"payment"` - Payment workflow errors
- `"provider"` - Provider-related errors
- Stack traces with line numbers

### Alternative: Railway CLI
If you have Railway CLI installed:
```bash
railway logs --service <your-service-name>
```

## Adding Logs to logs.txt

After finding logs in Railway:
1. Copy relevant error messages, stack traces, and debug output
2. Add them to `logs.txt` file in the project root
3. Include timestamps and context
4. The `logs.txt` file will be used for all diagnostic analysis

## What to Look For

### Expected Stripe Debug Output (During Startup):
```
🔍 STRIPE CONFIG DEBUG:
- API Key present: true
- Webhook Secret present: true
✅ Stripe is configured, adding payment module
```

### Error Patterns to Search For:
- `TypeError:`
- `Error:`
- `payment provider`
- `Stripe API`
- `provider not found`
- `Module not loaded`
- Stack traces showing file paths and line numbers

## What You're Looking For

The application logs should contain:
1. **The actual error message** (not just "500 Internal Server Error")
2. **Stack trace** showing where in the code the error occurred
3. **Stripe API error messages** if the issue is with Stripe API keys
4. **Module loading errors** if the Stripe module didn't initialize correctly

---

## Important Note

**Access Logs (what you shared earlier)** only show:
- HTTP method (POST)
- Path (/store/payment-collections/...)
- Status code (500)
- Duration (97ms)

**Application Logs (what we need)** show:
- Actual error messages
- Stack traces
- Console.log output
- Module initialization details
- Detailed error information

