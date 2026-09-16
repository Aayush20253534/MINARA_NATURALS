import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { Resend } from "resend"
import { renderMinaraEmail } from "./templates"

type ResendOptions = {
  api_key: string
  from: string
  reply_to?: string
  dev_recipient?: string
  enforce_dev_recipient?: boolean
}

type InjectedDependencies = { logger: Logger }

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  private readonly client: Resend
  private readonly options: ResendOptions
  private readonly logger: Logger

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.client = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resend option `api_key` is required.")
    }
    if (!options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resend option `from` is required.")
    }
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const rendered = renderMinaraEmail(String(notification.template), (notification.data || {}) as Record<string, unknown>)
    const originalRecipient = Array.isArray(notification.to) ? notification.to[0] : notification.to
    if (!originalRecipient) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Email notification recipient is required.")
    }

    const recipient =
      this.options.enforce_dev_recipient && this.options.dev_recipient
        ? this.options.dev_recipient
        : originalRecipient

    if (this.options.enforce_dev_recipient && !this.options.dev_recipient) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "RESEND_ENFORCE_DEV_RECIPIENT is enabled but RESEND_DEV_RECIPIENT is empty."
      )
    }

    const { data, error } = await this.client.emails.send({
      from: this.options.from,
      to: [recipient],
      replyTo: this.options.reply_to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    })

    if (error || !data?.id) {
      this.logger.error(`Resend delivery failed: ${error?.message || "unknown provider error"}`)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Transactional email delivery failed.")
    }

    return { id: data.id }
  }
}

export default ResendNotificationProviderService
