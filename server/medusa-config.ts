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

const paymentFields = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]
if (paymentFields.some(name => Boolean(process.env[name])) && !allPresent(paymentFields)) {
  throw new MedusaError(MedusaError.Types.INVALID_DATA, "Razorpay configuration is incomplete")
}
if (allPresent(paymentFields)) modules.push({
  resolve: "@medusajs/medusa/payment",
  options: { providers: [{ resolve: "./src/modules/razorpay", id: "razorpay", options: {
    key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET, webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
  } }] },
})
if (process.env.CHECKOUT_ENABLED === "true" && (!allPresent(paymentFields) || !process.env.STOREFRONT_URL)) {
  throw new MedusaError(MedusaError.Types.INVALID_DATA, "Checkout requires Razorpay and a canonical STOREFRONT_URL")
}

if (process.env.CHECKOUT_ENABLED === "true") {
  let storefront: URL
  try { storefront = new URL(process.env.STOREFRONT_URL!) }
  catch { throw new MedusaError(MedusaError.Types.INVALID_DATA, "STOREFRONT_URL must be a valid URL") }
  if (production && storefront.protocol !== "https:") throw new MedusaError(MedusaError.Types.INVALID_DATA, "Production checkout requires an HTTPS storefront")
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

if (production && (requireResendInProduction || process.env.CHECKOUT_ENABLED === "true") && !resendConfigured) {
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
