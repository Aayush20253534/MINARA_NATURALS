import { createHash, randomUUID } from "crypto"
import { PassThrough, Readable, type Writable } from "stream"
import type { FileTypes, Logger } from "@medusajs/framework/types"
import {
  AbstractFileProviderService,
  MedusaError,
} from "@medusajs/framework/utils"

type InjectedDependencies = {
  logger: Logger
}

type CloudinaryOptions = {
  cloud_name: string
  api_key: string
  api_secret: string
  folder?: string
}

type CloudinaryResourceType = "image" | "video" | "raw"

type StoredCloudinaryKey = {
  v: 1
  publicId: string
  resourceType: CloudinaryResourceType
  format?: string
  url: string
}

type UploadIdentity = {
  publicId: string
  resourceType: CloudinaryResourceType
  format?: string
  expectedUrl: string
  key: string
}

type CloudinaryUploadResponse = {
  public_id?: string
  resource_type?: CloudinaryResourceType
  format?: string
  secure_url?: string
  error?: { message?: string }
}

const KEY_PREFIX = "cld:"

function decodeFileContent(content: string, mimeType?: string): Buffer {
  const decodedBase64 = Buffer.from(content, "base64")
  if (decodedBase64.toString("base64") === content) {
    return decodedBase64
  }

  const isText =
    mimeType?.startsWith("text/") ||
    mimeType?.includes("csv") ||
    mimeType?.includes("json") ||
    mimeType?.includes("xml")

  return Buffer.from(content, isText ? "utf8" : "binary")
}

function sanitizeFilename(filename: string) {
  const basename = filename.replace(/\\/g, "/").split("/").pop() || "asset"
  const withoutExtension = basename.replace(/\.[^.]+$/, "")
  const safe = withoutExtension
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()

  return safe || "asset"
}

function formatFromMimeType(mimeType?: string) {
  const normalized = mimeType?.toLowerCase()
  if (normalized === "image/jpeg") return "jpg"
  if (normalized === "image/png") return "png"
  if (normalized === "image/webp") return "webp"
  if (normalized === "image/avif") return "avif"
  if (normalized === "image/gif") return "gif"
  return undefined
}

function resourceTypeFromMimeType(mimeType?: string): CloudinaryResourceType {
  if (mimeType?.startsWith("image/")) return "image"
  if (mimeType?.startsWith("video/") || mimeType?.startsWith("audio/")) return "video"
  return "raw"
}

class CloudinaryFileProviderService extends AbstractFileProviderService {
  static identifier = "cloudinary"

  private readonly logger: Logger
  private readonly options: Required<CloudinaryOptions>

  constructor({ logger }: InjectedDependencies, options: CloudinaryOptions) {
    super()
    this.logger = logger
    this.options = {
      cloud_name: options.cloud_name,
      api_key: options.api_key,
      api_secret: options.api_secret,
      folder: (options.folder || "minara").replace(/^\/+|\/+$/g, ""),
    }
  }

  static validateOptions(options: Record<string, unknown>) {
    for (const name of ["cloud_name", "api_key", "api_secret"]) {
      if (!String(options[name] || "").trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Cloudinary option \`${name}\` is required.`
        )
      }
    }
  }

  private apiUrl(resourceType: CloudinaryResourceType, action: "upload" | "destroy") {
    return `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      this.options.cloud_name
    )}/${resourceType}/${action}`
  }

  private sign(params: Record<string, string | number | boolean>) {
    const payload = Object.entries(params)
      .filter(([, value]) => value !== "" && value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${String(value)}`)
      .join("&")

    return createHash("sha1")
      .update(`${payload}${this.options.api_secret}`)
      .digest("hex")
  }

  private encodeKey(value: StoredCloudinaryKey) {
    return `${KEY_PREFIX}${Buffer.from(JSON.stringify(value), "utf8").toString(
      "base64url"
    )}`
  }

  private decodeKey(fileKey: string): StoredCloudinaryKey {
    if (!fileKey?.startsWith(KEY_PREFIX)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The file key was not created by the MINARA Cloudinary provider."
      )
    }

    try {
      const parsed = JSON.parse(
        Buffer.from(fileKey.slice(KEY_PREFIX.length), "base64url").toString("utf8")
      ) as StoredCloudinaryKey

      if (!parsed.publicId || !parsed.resourceType || !parsed.url) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "The Cloudinary file key is incomplete."
        )
      }
      return parsed
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The Cloudinary file key is invalid."
      )
    }
  }

  private deliveryUrl(
    publicId: string,
    resourceType: CloudinaryResourceType,
    format?: string
  ) {
    const encodedId = publicId
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")
    const suffix = format ? `.${encodeURIComponent(format)}` : ""

    return `https://res.cloudinary.com/${encodeURIComponent(
      this.options.cloud_name
    )}/${resourceType}/upload/${encodedId}${suffix}`
  }

  private createIdentity(filename: string, mimeType?: string): UploadIdentity {
    const resourceType = resourceTypeFromMimeType(mimeType)
    const format = resourceType === "image" ? formatFromMimeType(mimeType) : undefined
    const publicId = `${this.options.folder}/${sanitizeFilename(filename)}-${randomUUID()}`
    const expectedUrl = this.deliveryUrl(publicId, resourceType, format)
    const key = this.encodeKey({
      v: 1,
      publicId,
      resourceType,
      format,
      url: expectedUrl,
    })

    return { publicId, resourceType, format, expectedUrl, key }
  }

  private async uploadBuffer(
    identity: UploadIdentity,
    content: Buffer,
    filename: string,
    mimeType?: string,
    access?: "public" | "private"
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (access === "private") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Private Cloudinary assets are not enabled for MINARA. Upload this file as public or add an authenticated-delivery workflow."
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const params = {
      public_id: identity.publicId,
      timestamp,
    }

    const body = new FormData()
    const blobBytes = Uint8Array.from(content)
    body.append("file", new Blob([blobBytes], { type: mimeType || "application/octet-stream" }), filename)
    body.append("api_key", this.options.api_key)
    body.append("public_id", identity.publicId)
    body.append("timestamp", String(timestamp))
    body.append("signature", this.sign(params))

    const response = await fetch(this.apiUrl(identity.resourceType, "upload"), {
      method: "POST",
      body,
    })

    const payload = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse
    if (!response.ok || !payload.secure_url || !payload.public_id) {
      const message = payload.error?.message || `Cloudinary upload failed with HTTP ${response.status}`
      this.logger.error(message)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
    }

    const stored: StoredCloudinaryKey = {
      v: 1,
      publicId: payload.public_id,
      resourceType: payload.resource_type || identity.resourceType,
      format: payload.format || identity.format,
      url: payload.secure_url,
    }

    return {
      url: payload.secure_url,
      key: this.encodeKey(stored),
    }
  }

  async upload(file: FileTypes.ProviderUploadFileDTO): Promise<FileTypes.ProviderFileResultDTO> {
    if (!file?.filename) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A filename is required.")
    }

    const identity = this.createIdentity(file.filename, file.mimeType)
    const content = decodeFileContent(file.content, file.mimeType)

    return await this.uploadBuffer(
      identity,
      content,
      file.filename,
      file.mimeType,
      file.access as "public" | "private" | undefined
    )
  }

  async getUploadStream(file: FileTypes.ProviderUploadStreamDTO): Promise<{
    writeStream: Writable
    promise: Promise<FileTypes.ProviderFileResultDTO>
    url: string
    fileKey: string
  }> {
    if (!file?.filename) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A filename is required.")
    }

    const identity = this.createIdentity(file.filename, file.mimeType)
    const pass = new PassThrough()
    const chunks: Buffer[] = []

    pass.on("data", (chunk) => chunks.push(Buffer.from(chunk)))

    const promise = new Promise<FileTypes.ProviderFileResultDTO>((resolve, reject) => {
      pass.once("error", reject)
      pass.once("end", () => {
        this.uploadBuffer(
          identity,
          Buffer.concat(chunks),
          file.filename,
          file.mimeType,
          file.access as "public" | "private" | undefined
        ).then(resolve, reject)
      })
    })

    return {
      writeStream: pass,
      promise,
      url: identity.expectedUrl,
      fileKey: identity.key,
    }
  }

  async delete(
    files: FileTypes.ProviderDeleteFileDTO | FileTypes.ProviderDeleteFileDTO[]
  ): Promise<void> {
    const list = Array.isArray(files) ? files : [files]

    await Promise.all(
      list.map(async ({ fileKey }) => {
        const stored = this.decodeKey(fileKey)
        const timestamp = Math.floor(Date.now() / 1000)
        const params = {
          invalidate: true,
          public_id: stored.publicId,
          timestamp,
        }
        const body = new URLSearchParams({
          api_key: this.options.api_key,
          invalidate: "true",
          public_id: stored.publicId,
          timestamp: String(timestamp),
          signature: this.sign(params),
        })

        const response = await fetch(this.apiUrl(stored.resourceType, "destroy"), {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        })

        if (!response.ok) {
          const text = await response.text().catch(() => "")
          this.logger.error(
            `Cloudinary delete failed for ${stored.publicId}: HTTP ${response.status} ${text}`
          )
        }
      })
    )
  }

  async getPresignedDownloadUrl(file: FileTypes.ProviderGetFileDTO): Promise<string> {
    return this.decodeKey(file.fileKey).url
  }

  async getPresignedUploadUrl(
    _file: FileTypes.ProviderGetPresignedUploadUrlDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Direct browser-to-Cloudinary presigned uploads are not enabled. Upload through the authenticated Medusa upload workflow."
    )
  }

  async getDownloadStream(file: FileTypes.ProviderGetFileDTO): Promise<Readable> {
    const content = await this.getAsBuffer(file)
    return Readable.from([content])
  }

  async getAsBuffer(file: FileTypes.ProviderGetFileDTO): Promise<Buffer> {
    const url = this.decodeKey(file.fileKey).url
    const response = await fetch(url)

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Cloudinary download failed with HTTP ${response.status}.`
      )
    }

    return Buffer.from(await response.arrayBuffer())
  }
}

export default CloudinaryFileProviderService
