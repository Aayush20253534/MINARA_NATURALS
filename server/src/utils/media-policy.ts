import { MedusaError } from "@medusajs/framework/utils"

export const ALLOWED_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
])

export function maxMediaBytes() {
  const configured = Number(process.env.MEDIA_MAX_FILE_SIZE_MB || 10)
  const sizeMb = Number.isFinite(configured) && configured > 0 ? configured : 10
  return sizeMb * 1024 * 1024
}

export function assertMediaFile(input: { mimetype: string; size: number }) {
  if (!ALLOWED_MEDIA_MIME_TYPES.has(input.mimetype)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Unsupported media type. Use JPEG, PNG, WebP, or AVIF."
    )
  }
  if (input.size <= 0 || input.size > maxMediaBytes()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Media file must be between 1 byte and ${maxMediaBytes()} bytes.`
    )
  }
}
