import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

const dynamicModules = {};

const stripeApiKey = process.env.STRIPE_API_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Debug logging
console.log('🔍 STRIPE CONFIG DEBUG:');
console.log('- API Key present:', Boolean(stripeApiKey));
console.log('- Webhook Secret present:', Boolean(stripeWebhookSecret));
console.log('- API Key length:', stripeApiKey?.length || 0);
console.log('- Webhook Secret length:', stripeWebhookSecret?.length || 0);
console.log('- Worker Mode:', process.env.MEDUSA_WORKER_MODE);
console.log('- Node Environment:', process.env.NODE_ENV);

const isStripeConfigured = Boolean(stripeApiKey) && Boolean(stripeWebhookSecret);

if (isStripeConfigured) {
  console.log('✅ Stripe is configured, adding payment module');
  dynamicModules[Modules.PAYMENT] = {
    resolve: '@medusajs/medusa/payment',
    options: {
      providers: [
        {
          resolve: '@medusajs/medusa/payment-stripe',
          id: 'stripe',
                      options: {
              apiKey: stripeApiKey,
              webhookSecret: stripeWebhookSecret,
              capture: true,
              // Add error handling for payment session cleanup
              disableRetry: false,
              retryOnFailure: true,
            },
        },
      ],
    },
  };
} else {
  console.log('❌ Stripe not configured - missing API key or webhook secret');
}

const modules = {
  [Modules.FILE]: {
    resolve: '@medusajs/medusa/file',
    options: {
      providers: [
        {
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
        },
      ],
    },
  },
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
            enableEmails: process.env.ENABLE_EMAIL_NOTIFICATIONS || 'false',
          },
        },
      ],
    },
  },
  [Modules.CACHE]: {
    resolve: '@medusajs/medusa/cache-redis',
    options: {
      redisUrl: process.env.REDIS_URL,
    },
  },
  [Modules.EVENT_BUS]: {
    resolve: '@medusajs/medusa/event-bus-redis',
    options: {
      redisUrl: process.env.REDIS_URL,
    },
  },
  [Modules.WORKFLOW_ENGINE]: {
    resolve: '@medusajs/medusa/workflow-engine-redis',
    options: {
      redis: {
        url: process.env.REDIS_URL,
      },
    },
  },
};

// Define the configuration in the format TypeScript expects
const config = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server',
    http: {
      storeCors: process.env.STORE_CORS || '',
      adminCors: process.env.ADMIN_CORS || '',
      authCors: process.env.AUTH_CORS || '',
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    backendUrl: process.env.BACKEND_URL || 'https://xclusive-medusa-production.up.railway.app',
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
  },
  modules: {
    ...modules,
    ...dynamicModules,
  },
});

// Manually add the snake_case properties that the runtime server needs for CORS.
// We cast the config object to `any` to bypass the strict TypeScript check for this specific fix.
(config.projectConfig as any).store_cors = process.env.STORE_CORS || '';
(config.projectConfig as any).admin_cors = process.env.ADMIN_CORS || '';
(config.projectConfig as any).auth_cors = process.env.AUTH_CORS || '';

// Export the final, modified config
module.exports = config;