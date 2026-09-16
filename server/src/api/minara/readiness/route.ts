import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeModule = req.scope.resolve(Modules.STORE)
    await storeModule.listStores({}, { take: 1 })

    res.status(200).json({
      status: "ready",
      dependencies: {
        database: true,
        redisConfigured: Boolean(process.env.REDIS_URL),
        cloudinaryConfigured: Boolean(
          process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        ),
        resendConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      },
    })
  } catch {
    res.status(503).json({ status: "not_ready", dependencies: { database: false } })
  }
}
