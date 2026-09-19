import { validWebhook } from "../modules/razorpay/service"
import { authRateLimit, cartOwner, orderOwner, paymentOwner, passwordPolicy } from "./commerce-guards"
import { authenticate, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import multer from "multer"
import { z } from "@medusajs/framework/zod"
import { ALLOWED_MEDIA_MIME_TYPES, maxMediaBytes } from "../utils/media-policy"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMediaBytes(), files: 8 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MEDIA_MIME_TYPES.has(file.mimetype)) {
      callback(new Error("Unsupported media type"))
      return
    }
    callback(null, true)
  },
})

const AdminEmailTestSchema = z.object({
  to: z.string().trim().email().max(320),
})

export default defineMiddlewares({
  routes: [
    { matcher: "/auth/customer/emailpass/register", method: "POST", middlewares: [passwordPolicy] },
    { matcher: "/auth/customer/emailpass/update", method: "POST", middlewares: [passwordPolicy] },
    { matcher: "/hooks/payment/razorpay_razorpay", method: "POST", bodyParser: { preserveRawBody: true }, middlewares: [(req, res, next) => {
      if (!process.env.RAZORPAY_WEBHOOK_SECRET || !req.rawBody || !validWebhook(req.rawBody, req.headers["x-razorpay-signature"], process.env.RAZORPAY_WEBHOOK_SECRET)) { res.status(401).json({ message: "Invalid webhook signature" }); return }
      next()
    }] },
    { matcher: "/auth/customer/emailpass*", method: "POST", middlewares: [authRateLimit] },
    { matcher: "/store/orders/:id", method: "GET", middlewares: [authenticate("customer", ["bearer", "session"]), orderOwner] },
    { matcher: "/store/carts/:id*", middlewares: [authenticate("customer", ["bearer", "session"], { allowUnauthenticated: true }), cartOwner] },
    { matcher: "/store/payment-collections", method: "POST", middlewares: [authenticate("customer", ["bearer", "session"]), paymentOwner] },
    { matcher: "/store/payment-collections/:id/payment-sessions", method: "POST", middlewares: [authenticate("customer", ["bearer", "session"]), paymentOwner] },
    { matcher: "/store/minara/wishlist", middlewares: [authenticate("customer", ["bearer", "session"])] },
    { matcher: "/store/minara/wishlist", method: "POST", middlewares: [validateAndTransformBody(z.object({ product_id: z.string().regex(/^prod_[a-zA-Z0-9_-]+$/).max(180), saved: z.boolean() }).strict())] },
    {
      matcher: "/admin/minara/email/test",
      method: "POST",
      middlewares: [validateAndTransformBody(AdminEmailTestSchema)],
    },
    {
      matcher: "/admin/minara/uploads",
      method: "POST",
      middlewares: [upload.array("files", 8)],
    },
  ],
})
