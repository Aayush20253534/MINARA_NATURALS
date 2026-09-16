import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.status(200).json({
    status: "ok",
    service: "minara-commerce",
    mode: process.env.MEDUSA_WORKER_MODE || "shared",
    timestamp: new Date().toISOString(),
  })
}
