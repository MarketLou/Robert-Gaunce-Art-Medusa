import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const dynamicModules: any = {}

const stripeApiKey = process.env.STRIPE_API_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Debug logging for Stripe configuration
console.log('🔍 STRIPE CONFIG DEBUG:')
console.log('- API Key present:', Boolean(stripeApiKey))
console.log('- Webhook Secret present:', Boolean(stripeWebhookSecret))
console.log('- API Key length:', stripeApiKey?.length || 0)
console.log('- Webhook Secret length:', stripeWebhookSecret?.length || 0)
console.log('- Worker Mode:', process.env.MEDUSA_WORKER_MODE)
console.log('- Node Environment:', process.env.NODE_ENV)

const isStripeConfigured = Boolean(stripeApiKey) && Boolean(stripeWebhookSecret)

if (isStripeConfigured) {
  console.log('✅ Stripe is configured, adding payment module')
  console.log('🔧 PAYMENT PROVIDER CONFIG:')
  console.log('- Provider ID being registered: pp_stripe')
  console.log('- Provider resolve path: @medusajs/medusa/payment-stripe')
  dynamicModules[Modules.PAYMENT] = {
    resolve: '@medusajs/medusa/payment',
    options: {
      providers: [
        {
          resolve: '@medusajs/medusa/payment-stripe',
          id: 'pp_stripe',
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
  }
  console.log('✅ Payment module configured with provider ID: pp_stripe')
  console.log('📋 Full payment module config:', JSON.stringify(dynamicModules[Modules.PAYMENT], null, 2))
} else {
  console.log('❌ Stripe not configured - missing API key or webhook secret')
}

const modules: any = {
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
  // Enable DigitalOcean Spaces FILE provider only if configured
  ...(process.env.DO_SPACE_BUCKET ? {
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
  } : {}),
}

// Define the configuration in the format TypeScript expects
const config = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server' || 'shared',
    http: {
      storeCors: process.env.STORE_CORS || '',
      adminCors: process.env.ADMIN_CORS || '',
      authCors: process.env.AUTH_CORS || '',
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000',
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
  },
  modules: {
    ...modules,
    ...dynamicModules,
  },
})

// Log final module configuration
console.log('📦 [CONFIG] Final modules being registered:')
console.log('- Modules count:', Object.keys(config.modules || {}).length)
console.log('- Module keys:', Object.keys(config.modules || {}))
if (config.modules && typeof config.modules === 'object') {
  Object.keys(config.modules).forEach(key => {
    const module = (config.modules as any)[key]
    if (module && module.options && module.options.providers) {
      console.log(`- Module "${key}" providers:`, module.options.providers.map((p: any) => ({ id: p.id, resolve: p.resolve })))
    }
  })
}
console.log('✅ [CONFIG] Configuration loaded successfully')

// Export the config
module.exports = config
