import type { ExecArgs } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { sendMinaraTestEmailWorkflow } from "../workflows/send-minara-test-email"

export default async function sendTestEmail({ container }: ExecArgs) {
  const to = process.env.TEST_EMAIL_TO?.trim()
  if (!to) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Set TEST_EMAIL_TO before running npm run email:test"
    )
  }

  await sendMinaraTestEmailWorkflow(container).run({
    input: { to },
  })

  console.log("Email test queued successfully")
}
