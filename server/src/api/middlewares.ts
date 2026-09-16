import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
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
