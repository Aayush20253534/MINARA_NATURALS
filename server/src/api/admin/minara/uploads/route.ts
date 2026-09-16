import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import { assertMediaFile } from "../../../../utils/media-policy"

type UploadedFile = {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const files = ((req as AuthenticatedMedusaRequest & { files?: UploadedFile[] }).files || [])

  if (!files.length) {
    return res.status(400).json({ message: "Attach at least one image under the `files` field." })
  }

  files.forEach(assertMediaFile)

  const { result } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: files.map((file) => ({
        filename: file.originalname,
        mimeType: file.mimetype,
        content: file.buffer.toString("base64"),
        access: "public" as const,
      })),
    },
  })

  res.status(201).json({ files: result })
}
