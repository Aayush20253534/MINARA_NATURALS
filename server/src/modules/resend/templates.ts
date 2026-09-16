type TemplateData = Record<string, unknown>

export type MinaraEmailTemplate =
  | "minara-test"
  | "order-placed"
  | "email-verification"
  | "password-reset"
  | "user-invited"
  | "inquiry-received"
  | "franchise-application-received"

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f3f8f4;font-family:Arial,sans-serif;color:#17211a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dfe7e1;border-radius:18px;overflow:hidden"><tr><td style="background:#14532d;color:#ffffff;padding:24px 28px"><strong style="font-size:20px;letter-spacing:.04em">MINARA NATURALS</strong><div style="font-size:12px;opacity:.8;margin-top:4px">Freshness · Quality · Trust</div></td></tr><tr><td style="padding:30px 28px"><h1 style="font-size:24px;margin:0 0 16px">${escapeHtml(title)}</h1>${body}</td></tr></table></td></tr></table></body></html>`
}

export function renderMinaraEmail(template: string, data: TemplateData = {}) {
  const name = escapeHtml(data.name || "there")
  const reference = escapeHtml(data.reference || data.id || "")
  const actionUrl = escapeHtml(data.action_url || data.url || "")

  const templates: Record<string, { subject: string; text: string; html: string }> = {
    "minara-test": {
      subject: "MINARA email delivery test",
      text: "MINARA NATURALS transactional email is configured correctly.",
      html: layout("Email delivery test", "<p>This confirms that the MINARA NATURALS transactional email provider is configured correctly.</p>"),
    },
    "order-placed": {
      subject: reference ? `Order received · ${reference}` : "We received your order",
      text: `Hello ${name}. We received your MINARA NATURALS order${reference ? ` ${reference}` : ""}.`,
      html: layout("We received your order", `<p>Hello ${name},</p><p>Thank you. Your MINARA NATURALS order${reference ? ` <strong>${reference}</strong>` : ""} has been received.</p>`),
    },
    "email-verification": {
      subject: "Verify your MINARA NATURALS email",
      text: `Verify your email${actionUrl ? `: ${actionUrl}` : "."}`,
      html: layout("Verify your email", `<p>Hello ${name},</p><p>Use the secure verification link from your MINARA NATURALS account flow.</p>${actionUrl ? `<p><a href="${actionUrl}" style="color:#14532d;font-weight:700">Verify email</a></p>` : ""}`),
    },
    "password-reset": {
      subject: "Reset your MINARA NATURALS password",
      text: `Reset your password${actionUrl ? `: ${actionUrl}` : "."}`,
      html: layout("Reset your password", `<p>Hello ${name},</p><p>A password reset was requested for your account.</p>${actionUrl ? `<p><a href="${actionUrl}" style="color:#14532d;font-weight:700">Reset password</a></p>` : ""}`),
    },
    "user-invited": {
      subject: "You have been invited to MINARA NATURALS",
      text: `Complete your invitation${actionUrl ? `: ${actionUrl}` : "."}`,
      html: layout("Administrator invitation", `<p>You have been invited to the MINARA NATURALS administration workspace.</p>${actionUrl ? `<p><a href="${actionUrl}" style="color:#14532d;font-weight:700">Accept invitation</a></p>` : ""}`),
    },
    "inquiry-received": {
      subject: reference ? `Inquiry received · ${reference}` : "We received your inquiry",
      text: `Hello ${name}. Your MINARA NATURALS inquiry has been received.`,
      html: layout("Inquiry received", `<p>Hello ${name},</p><p>We have received your inquiry and the MINARA team can now review it.</p>`),
    },
    "franchise-application-received": {
      subject: reference ? `Franchise application received · ${reference}` : "Franchise application received",
      text: `Hello ${name}. Your MINARA NATURALS franchise application has been received.`,
      html: layout("Franchise application received", `<p>Hello ${name},</p><p>Your franchise application has been received for review.</p>`),
    },
  }

  return templates[template] || {
    subject: "MINARA NATURALS notification",
    text: "You have a new notification from MINARA NATURALS.",
    html: layout("MINARA NATURALS", "<p>You have a new notification from MINARA NATURALS.</p>"),
  }
}
