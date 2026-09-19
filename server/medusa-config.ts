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
const configuredRedisUrl = process.env.REDIS_URL?.trim()
// A stale remote Redis URL should not make local UI development unusable.
// Production still requires Redis; local development opts in explicitly.
const useRedisInDevelopment = process.env.USE_REDIS_IN_DEVELOPMENT === "true"
const redisUrl = production || useRedisInDevelopment ? configuredRedisUrl : undefined
const workerMode = (process.env.MEDUSA_WORKER_MODE?.trim() || "shared") as
  | "shared"
  | "server"
  | "worker"

if (production && !configuredRedisUrl) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "REDIS_URL is required in production so server and worker share infrastructure state"
  )
}

const modules: Record<string, unknown>[] = [{ resolve: "./src/modules/wishlist" }]

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

const checkoutEnabled = process.env.CHECKOUT_ENABLED === "true"
const cashfreeFields = ["CASHFREE_CLIENT_ID", "CASHFREE_CLIENT_SECRET"]
const cashfreeEnvironment = process.env.CASHFREE_ENV?.trim() || "sandbox"
const cashfreeApiVersion = process.env.CASHFREE_API_VERSION?.trim() || "2025-01-01"

// Payment credentials are deliberately optional while checkout is disabled.
// This lets staging/production boot safely before the merchant account is ready.
if (checkoutEnabled) {
  if (!allPresent(cashfreeFields)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Checkout requires Cashfree credentials: ${cashfreeFields.join(", ")}`
    )
  }
  if (!['sandbox', 'production'].includes(cashfreeEnvironment)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "CASHFREE_ENV must be sandbox or production"
    )
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cashfreeApiVersion)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "CASHFREE_API_VERSION must use YYYY-MM-DD"
    )
  }

  let storefront: URL
  let backend: URL
  try {
    storefront = new URL(process.env.STOREFRONT_URL || "")
    backend = new URL(backendUrl)
  } catch {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Checkout requires valid STOREFRONT_URL and MEDUSA_BACKEND_URL values"
    )
  }
  if (production && (storefront.protocol !== "https:" || backend.protocol !== "https:")) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Production checkout requires HTTPS storefront and backend URLs"
    )
  }

  modules.push({
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        {
          resolve: "./src/modules/cashfree",
          id: "cashfree",
          options: {
            client_id: process.env.CASHFREE_CLIENT_ID,
            client_secret: process.env.CASHFREE_CLIENT_SECRET,
            environment: cashfreeEnvironment,
            api_version: cashfreeApiVersion,
            storefront_url: storefront.toString().replace(/\/$/, ""),
            backend_url: backend.toString().replace(/\/$/, ""),
          },
        },
      ],
    },
  })
}

const cloudinaryFields = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
]

if (allPresent(cloudinaryFields)) {
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "./src/modules/cloudinary",
          id: "cloudinary",
          options: {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            folder: process.env.CLOUDINARY_FOLDER || "minara",
          },
        },
      ],
    },
  })
} else if (production) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `Cloudinary is incomplete. Required: ${cloudinaryFields.join(", ")}`
  )
}

const resendApiKeyConfigured = Boolean(process.env.RESEND_API_KEY?.trim())
const resendFromConfigured = Boolean(process.env.RESEND_FROM_EMAIL?.trim())
const resendConfigured = resendApiKeyConfigured && resendFromConfigured
const requireResendInProduction = process.env.REQUIRE_RESEND_IN_PRODUCTION === "true"

if (resendApiKeyConfigured !== resendFromConfigured) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "Resend configuration is incomplete. Set both RESEND_API_KEY and RESEND_FROM_EMAIL, or leave both empty."
  )
}

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

if (production && (requireResendInProduction || checkoutEnabled) && !resendConfigured) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "RESEND_API_KEY and RESEND_FROM_EMAIL are required for production checkout or REQUIRE_RESEND_IN_PRODUCTION=true"
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
