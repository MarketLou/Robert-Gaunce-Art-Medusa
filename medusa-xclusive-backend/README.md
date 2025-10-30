<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

## Compatibility

This starter is compatible with versions >= 2 of `@medusajs/medusa`. 

## Getting Started

Visit the [Quickstart Guide](https://docs.medusajs.com/learn/installation) to set up a server.

Visit the [Docs](https://docs.medusajs.com/learn/installation#get-started) to learn more about our system requirements.

## What is Medusa

Medusa is a set of commerce modules and tools that allow you to build rich, reliable, and performant commerce applications without reinventing core commerce logic. The modules can be customized and used to build advanced ecommerce stores, marketplaces, or any product that needs foundational commerce primitives. All modules are open-source and freely available on npm.

Learn more about [Medusa's architecture](https://docs.medusajs.com/learn/introduction/architecture) and [commerce modules](https://docs.medusajs.com/learn/fundamentals/modules/commerce-modules) in the Docs.

## 🎯 Custom Invite System Implementation ✅ COMPLETED & WORKING

This Medusa v2.8.4 backend includes a **fully functional invite system** with email notifications via Resend. The system is now **production-ready and working end-to-end**. Below is the complete implementation and troubleshooting guide.

### ✅ **Major Breakthrough: enableEmails Boolean/String Fix**

**🚨 CRITICAL FIX DISCOVERED:**

The most significant issue was a type mismatch in the notification service configuration:

**The Problem:**
- `enableEmails` was being passed as a **boolean** (`true`/`false`) from `medusa-config.ts`
- But the Resend service was expecting a **string** so it could call `.toLowerCase()` on it
- This caused the error: `this.options.enableEmails.toLowerCase is not a function`

**The Solution:**
```typescript
// ❌ WRONG (in medusa-config.ts)
enableEmails: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',

// ✅ CORRECT (in medusa-config.ts)
enableEmails: process.env.ENABLE_EMAIL_NOTIFICATIONS || 'false',
```

**Result:** Now it passes the actual string value (`'true'` or `'false'`) instead of a boolean, allowing the service to properly check email enablement.

### ✅ **Final Breakthrough: Admin Dashboard vs API Path**

**🎯 CRITICAL DISCOVERY:**

The final issue was using the wrong URL path for invite acceptance:

**The Problem:**
- Email template was generating API paths: `/admin/invites/accept?token=xxx`
- But invite acceptance is handled by the **admin dashboard UI**, not the API
- This caused "Unauthorized" errors when users clicked the invite links

**The Solution:**
```typescript
// ❌ WRONG (API path)
const inviteLink = `${baseUrl}/admin/invites/accept?token=${data.token}`;

// ✅ CORRECT (Admin dashboard path)
const inviteLink = `${baseUrl}/app/invite?token=${data.token}`;
```

**Result:** Invite links now properly redirect to the admin dashboard invite acceptance page, allowing users to successfully accept invites and create accounts.

### 📋 **Complete Implementation**

#### **1. File Structure**
```
src/
├── subscribers/
│   └── user-invite-handler.ts        # Event handler (MUST be in src/subscribers/)
├── modules/
│   └── resend-notification/
│       ├── service.ts                # Resend notification service
│       ├── index.ts                  # Module configuration
│       └── email-templates/
│           └── invite-created.tsx    # Email template
```

#### **2. Key Components**

**Event Handler (`src/subscribers/user-invite-handler.ts`)**:
- Listens for `invite.created` and `invite.resent` events
- Uses query service to retrieve full invite details from database
- Sends email notification via Resend service

**Resend Service (`src/modules/resend-notification/service.ts`)**:
- Handles email sending with proper error handling
- Supports multiple email templates (order, reset password, invite)
- Configurable email enablement

**Email Template (`src/modules/resend-notification/email-templates/invite-created.tsx`)**:
- React-based email template
- Generates proper invite acceptance URL
- Uses production backend URL

#### **3. Critical Configuration**

**medusa-config.ts**:
```typescript
[Modules.NOTIFICATION]: {
  resolve: '@medusajs/medusa/notification',
  options: {
    providers: [
      {
        resolve: './src/modules/resend-notification',
        id: 'resend-notification',
        options: {
          channels: ['email'],
          apiKey: process.env.RESEND_API_KEY,
          fromEmail: process.env.RESEND_FROM_EMAIL,
          replyToEmail: process.env.RESEND_REPLY_TO_EMAIL,
          toEmail: process.env.TO_EMAIL,
          enableEmails: process.env.ENABLE_EMAIL_NOTIFICATIONS || 'false', // STRING not boolean!
        },
      },
    ],
  },
}
```

#### **4. Environment Variables Required**
```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_REPLY_TO_EMAIL=support@yourdomain.com
TO_EMAIL=admin@yourdomain.com
ENABLE_EMAIL_NOTIFICATIONS=true

# Backend URL for email links
BACKEND_URL=https://your-production-url.com
```

### 🔧 **Troubleshooting Guide**

#### **Common Issues & Solutions:**

1. **"Processing invite.created which has 0 subscribers"**
   - **Solution**: Move handler to `src/subscribers/` directory (not `src/modules/`)
   - Medusa v2 auto-discovers subscribers only in `src/subscribers/`

2. **"this.options.enableEmails.toLowerCase is not a function"**
   - **Solution**: Use string value instead of boolean in config
   - `enableEmails: process.env.ENABLE_EMAIL_NOTIFICATIONS || 'false'`

3. **"Value for Notification.to is required, 'undefined' found"**
   - **Solution**: Use query service to retrieve full invite details
   - Event data only contains `{ id: "invite_xxx" }`, not email/token

4. **"Not authorized" when clicking invite link**
   - **Solution**: Use admin dashboard path instead of API path
   - Correct: `/app/invite?token=xxx` (admin dashboard)
   - Wrong: `/admin/invites/accept?token=xxx` (API path)

5. **Localhost URL in production emails**
   - **Solution**: Set proper environment variable
   - Use `BACKEND_URL` not `MEDUSA_BACKEND_URL`

### 📊 **Implementation Progress - ALL COMPLETED ✅**

✅ **Handler Detection**: Fixed (moved to `src/subscribers/`)  
✅ **Event Data Retrieval**: Fixed (using query service)  
✅ **Email & Token Extraction**: Fixed (database query working)  
✅ **Configuration Type Error**: Fixed (string instead of boolean)  
✅ **Production URL**: Fixed (correct environment variable)  
✅ **Invite Acceptance**: Fixed (admin dashboard path)  
✅ **End-to-End Testing**: WORKING IN PRODUCTION

### 🚀 **Final Working Flow - VERIFIED WORKING**

1. Admin creates invite in dashboard ✅
2. `invite.created` event triggered ✅
3. Handler retrieves invite details from database ✅
4. Email sent via Resend with proper production URL ✅
5. Recipient clicks link → `https://your-domain.com/app/invite?token=xxx` ✅
6. Invite successfully accepted and user can set up account ✅

**Status: PRODUCTION READY** 🎉

### 📧 **Email Template Features**

- Professional HTML email template
- Secure token-based authentication
- Production-ready URLs
- Proper fallback text for email clients
- Recipient email validation

---

*This implementation provides a complete, production-ready invite system for Medusa v2.8.4 with comprehensive error handling and logging.*

## Community & Contributions

The community and core team are available in [GitHub Discussions](https://github.com/medusajs/medusa/discussions), where you can ask for support, discuss roadmap, and share ideas.

Join our [Discord server](https://discord.com/invite/medusajs) to meet other community members.

## Other channels

- [GitHub Issues](https://github.com/medusajs/medusa/issues)
- [Twitter](https://twitter.com/medusajs)
- [LinkedIn](https://www.linkedin.com/company/medusajs)
- [Medusa Blog](https://medusajs.com/blog/)
