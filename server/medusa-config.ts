import { defineConfig, loadEnv, MedusaError } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const production = process.env.NODE_ENV === "production"

function requiredInProduction(name: string, fallback: string): string {
  const value = process.env[name]?.trim()
  if (value) return value
  if (production) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${name} is required in production`
    )
  }
  return fallback
}

function allPresent(names: string[]) {
  return names.every((name) => Boolean(process.env[name]?.trim()))
}

const databaseUrl = requiredInProduction(
  "DATABASE_URL",
  "postgres://postgres:postgres@localhost:5432/minara"
)
const backendUrl = process.env.MEDUSA_BACKEND_URL?.trim() || "http://localhost:9000"
const redisUrl = process.env.REDIS_URL?.trim()
const workerMode = (process.env.MEDUSA_WORKER_MODE?.trim() || "shared") as
  | "shared"
  | "server"
  | "worker"

if (production && !redisUrl) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "REDIS_URL is required in production so server and worker share infrastructure state"
  )
}

const modules: Record<string, unknown>[] = []

if (redisUrl) {
  modules.push(
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: { redisUrl },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { redisUrl } },
    },
    {
      resolve: "@medusajs/medusa/caching",
      options: {
        providers: [
          {
            resolve: "@medusajs/caching-redis",
            id: "redis",
            is_default: true,
            options: { redisUrl },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-redis",
            id: "redis",
            is_default: true,
            options: { redisUrl },
          },
        ],
      },
    }
  )
}

const spacesFields = [
  "SPACES_ENDPOINT",
  "SPACES_REGION",
  "SPACES_BUCKET",
  "SPACES_ACCESS_KEY_ID",
  "SPACES_SECRET_ACCESS_KEY",
  "SPACES_CDN_URL",
]

if (allPresent(spacesFields)) {
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-s3",
          id: "spaces",
          options: {
            file_url: process.env.SPACES_CDN_URL,
            access_key_id: process.env.SPACES_ACCESS_KEY_ID,
            secret_access_key: process.env.SPACES_SECRET_ACCESS_KEY,
            region: process.env.SPACES_REGION,
            bucket: process.env.SPACES_BUCKET,
            endpoint: process.env.SPACES_ENDPOINT,
            prefix: process.env.SPACES_PREFIX || "minara",
            cache_control:
              process.env.SPACES_CACHE_CONTROL || "public, max-age=31536000, immutable",
          },
        },
      ],
    },
  })
} else if (production) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `DigitalOcean Spaces is incomplete. Required: ${spacesFields.join(", ")}`
  )
}

const resendConfigured = allPresent(["RESEND_API_KEY", "RESEND_FROM_EMAIL"])
const emailProvider = resendConfigured
  ? {
      resolve: "./src/modules/resend",
      id: "resend",
      options: {
        channels: ["email"],
        api_key: process.env.RESEND_API_KEY,
        from: process.env.RESEND_FROM_EMAIL,
        reply_to: process.env.RESEND_REPLY_TO,
        dev_recipient: process.env.RESEND_DEV_RECIPIENT,
        enforce_dev_recipient:
          process.env.RESEND_ENFORCE_DEV_RECIPIENT !== "false" && !production,
      },
    }
  : {
      resolve: "@medusajs/medusa/notification-local",
      id: "local-email",
      options: { channels: ["email"] },
    }

modules.push({
  resolve: "@medusajs/medusa/notification",
  options: {
    providers: [
      {
        resolve: "@medusajs/medusa/notification-local",
        id: "local-feed",
        options: { channels: ["feed"] },
      },
      emailProvider,
    ],
  },
})

if (production && !resendConfigured) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "RESEND_API_KEY and RESEND_FROM_EMAIL are required in production"
  )
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl,
    redisUrl,
    workerMode,
    http: {
      storeCors: requiredInProduction("STORE_CORS", "http://localhost:3000"),
      adminCors: requiredInProduction("ADMIN_CORS", "http://localhost:9000"),
      authCors: requiredInProduction(
        "AUTH_CORS",
        "http://localhost:3000,http://localhost:9000"
      ),
      jwtSecret: requiredInProduction("JWT_SECRET", "minara-local-jwt-change-me"),
      cookieSecret: requiredInProduction("COOKIE_SECRET", "minara-local-cookie-change-me"),
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true" || workerMode === "worker",
    backendUrl,
    storefrontUrl: process.env.STOREFRONT_URL?.trim() || "http://localhost:3000",
  },
  modules,
})
