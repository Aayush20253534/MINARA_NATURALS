import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import WishlistService from "../../../../modules/wishlist/service"
import { saveWishlistWorkflow } from "../../../../workflows/save-wishlist"
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<WishlistService>("wishlist")
  const items = await service.listWishlistItems({ customer_id: req.auth_context.actor_id }, { take: 100, order: { created_at: "DESC" } })
  if (!items.length) { res.json({ products: [] }); return }
  const { data } = await req.scope.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "product", fields: ["id", "title", "handle", "thumbnail", "sales_channels.id"], filters: { id: items.map(i => i.product_id), status: "published" } })
  const channels = req.publishable_key_context?.sales_channel_ids ?? []
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ products: data.filter(p => p.sales_channels?.some(c => Boolean(c && channels.includes(c.id)))).map(({ id, title, handle, thumbnail }) => ({ id, title, handle, thumbnail })) })
}
export async function POST(req: AuthenticatedMedusaRequest<{ product_id: string; saved: boolean }>, res: MedusaResponse) {
  const { result } = await saveWishlistWorkflow(req.scope).run({ input: { ...req.validatedBody, customer_id: req.auth_context.actor_id, sales_channel_ids: req.publishable_key_context?.sales_channel_ids ?? [] } })
  res.json(result)
}
