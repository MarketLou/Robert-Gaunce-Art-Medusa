import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server" || "shared",
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL,
        },
      },
    },
    // S3/DigitalOcean Spaces - Only enabled if configured
    ...(process.env.DO_SPACE_BUCKET ? [{
      resolve: "@medusajs/file-s3",
      options: {
        file_url: process.env.DO_SPACE_URL,
        access_key_id: process.env.DO_SPACE_ACCESS_KEY,
        secret_access_key: process.env.DO_SPACE_SECRET_KEY,
        region: process.env.DO_SPACE_REGION,
        bucket: process.env.DO_SPACE_BUCKET,
        endpoint: process.env.DO_SPACE_ENDPOINT,
        additional_client_config: {
          forcePathStyle: true,
        },
      },
    }] : []),
  ],
})
