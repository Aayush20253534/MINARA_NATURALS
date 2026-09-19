import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { checkoutEnabled } from "../../../commerce-guards"
export async function GET(_req: MedusaRequest, res: MedusaResponse) { res.setHeader("Cache-Control", "no-store"); res.json({ enabled: checkoutEnabled() }) }
