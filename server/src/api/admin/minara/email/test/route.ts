import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendMinaraTestEmailWorkflow } from "../../../../../workflows/send-minara-test-email"

export type AdminEmailTestBody = { to: string }

export async function POST(
  req: AuthenticatedMedusaRequest<AdminEmailTestBody>,
  res: MedusaResponse
) {
  await sendMinaraTestEmailWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(202).json({ accepted: true })
}
