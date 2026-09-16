import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { sendNotificationsStep } from "@medusajs/medusa/core-flows"

export type SendMinaraTestEmailInput = {
  to: string
}

export const sendMinaraTestEmailWorkflow = createWorkflow(
  "send-minara-test-email",
  (input: SendMinaraTestEmailInput) => {
    const notifications = sendNotificationsStep([
      {
        to: input.to,
        channel: "email",
        template: "minara-test",
        data: {},
      },
    ])

    return new WorkflowResponse(notifications)
  }
)
