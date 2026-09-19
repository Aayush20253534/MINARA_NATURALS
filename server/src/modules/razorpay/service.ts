import { createHmac, timingSafeEqual } from "node:crypto";
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import type {
  InitiatePaymentInput,
  UpdatePaymentInput,
  AuthorizePaymentInput,
  CapturePaymentInput,
  RefundPaymentInput,
  CancelPaymentInput,
  DeletePaymentInput,
  GetPaymentStatusInput,
  RetrievePaymentInput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types";
type Options = { key_id: string; key_secret: string; webhook_secret: string };
type GatewayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
};
type GatewayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  amount_refunded?: number;
};
type Data = {
  order_id: string;
  amount: number;
  currency: string;
  session_id: string;
  key_id: string;
  payment_id?: string;
};
export function toPaise(value: unknown) {
  const amount = Number(String(value));
  const paise = Math.round(amount * 100);
  if (
    !Number.isFinite(amount) ||
    !Number.isSafeInteger(paise) ||
    paise <= 0 ||
    Math.abs(amount * 100 - paise) > 0.00001
  )
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid INR payment amount",
    );
  return paise;
}
export function validWebhook(
  raw: string | Buffer,
  signature: unknown,
  secret: string,
) {
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature))
    return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export default class RazorpayProvider extends AbstractPaymentProvider<Options> {
  static identifier = "razorpay";
  private options: Options;
  constructor(container: Record<string, unknown>, options: Options) {
    super(container, options);
    this.options = options;
  }
  static validateOptions(options: Record<string, unknown>) {
    if (
      !["key_id", "key_secret", "webhook_secret"].every(
        (k) => typeof options[k] === "string" && options[k],
      )
    )
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Razorpay credentials are incomplete",
      );
  }
  private async api<T>(path: string, body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`https://api.razorpay.com/v1${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.options.key_id}:${this.options.key_secret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Payment provider unavailable; check payment status before retrying",
      );
    }
    if (!response.ok)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Payment provider request failed (${response.status})`,
      );
    return response.json() as Promise<T>;
  }
  private data(value: Record<string, unknown> | undefined): Data {
    const d = value as Data | undefined;
    if (
      !d ||
      !/^order_[a-zA-Z0-9]+$/.test(d.order_id) ||
      !Number.isSafeInteger(d.amount) ||
      d.currency !== "INR" ||
      !d.session_id
    )
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid payment session",
      );
    return d;
  }
  private async paid(data: Data, includeRefunded = false) {
    const [order, payments] = await Promise.all([
      this.api<GatewayOrder>(`/orders/${data.order_id}`),
      this.api<{ items: GatewayPayment[] }>(
        `/orders/${data.order_id}/payments`,
      ),
    ]);
    if (
      order.amount !== data.amount ||
      order.currency !== data.currency ||
      order.notes?.medusa_session_id !== data.session_id
    )
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payment amount or session mismatch",
      );
    return payments.items.find(
      (p) =>
        p.order_id === order.id &&
        p.amount === data.amount &&
        p.currency === data.currency &&
        (includeRefunded
          ? ["authorized", "captured", "refunded"]
          : ["authorized", "captured"]
        ).includes(p.status),
    );
  }
  async initiatePayment(input: InitiatePaymentInput) {
    if (input.currency_code.toLowerCase() !== "inr")
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Only INR payments are supported",
      );
    const session = input.context?.idempotency_key;
    if (!session)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing payment session",
      );
    const amount = toPaise(input.amount);
    const order = await this.api<GatewayOrder>("/orders", {
      amount,
      currency: "INR",
      receipt: session.slice(0, 40),
      notes: { medusa_session_id: session },
    });
    return {
      id: order.id,
      status: PaymentSessionStatus.PENDING,
      data: {
        order_id: order.id,
        amount,
        currency: "INR",
        session_id: session,
        key_id: this.options.key_id,
      },
    };
  }
  async authorizePayment(input: AuthorizePaymentInput) {
    const data = this.data(input.data);
    const payment = await this.paid(data);
    return {
      status:
        payment?.status === "captured"
          ? PaymentSessionStatus.CAPTURED
          : payment
            ? PaymentSessionStatus.AUTHORIZED
            : PaymentSessionStatus.REQUIRES_MORE,
      data: { ...data, ...(payment ? { payment_id: payment.id } : {}) },
    };
  }
  async capturePayment(input: CapturePaymentInput) {
    const data = this.data(input.data);
    const payment = await this.paid(data);
    if (!payment)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Payment is not authorized",
      );
    if (payment.status !== "captured")
      await this.api(`/payments/${payment.id}/capture`, {
        amount: data.amount,
        currency: data.currency,
      });
    return { data: { ...data, payment_id: payment.id } };
  }
  async getPaymentStatus(input: GetPaymentStatusInput) {
    const result = await this.authorizePayment(input);
    return { status: result.status };
  }
  async retrievePayment(input: RetrievePaymentInput) {
    const data = this.data(input.data);
    await this.paid(data);
    return { data: { ...data } };
  }
  async updatePayment(input: UpdatePaymentInput) {
    const data = this.data(input.data);
    if (
      data.amount !== toPaise(input.amount) ||
      input.currency_code.toUpperCase() !== data.currency
    )
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Payment has started; the bag cannot be changed",
      );
    return {
      data: { ...data },
      status: (await this.getPaymentStatus(input)).status,
    };
  }
  async cancelPayment(input: CancelPaymentInput) {
    const data = this.data(input.data);
    const payment = await this.paid(data);
    // Razorpay orders cannot be cancelled. Never falsely report a paid payment as cancelled.
    if (payment)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Refund this payment through the order before cancelling",
      );
    return { data: { ...data } };
  }
  async deletePayment(input: DeletePaymentInput) {
    return this.cancelPayment(input);
  }
  async refundPayment(input: RefundPaymentInput) {
    const data = this.data(input.data);
    const payment = await this.paid(data, true);
    if (!payment || !["captured", "refunded"].includes(payment.status))
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only captured payments can be refunded",
      );
    const receipt = input.context?.idempotency_key;
    if (!receipt)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing refund reference",
      );
    // Reconcile ambiguous retries against gateway records before making another refund.
    let skip = 0;
    let found = false;
    for (;;) {
      const page = await this.api<{
        items: { receipt?: string; amount: number; status: string }[];
      }>(`/payments/${payment.id}/refunds?count=100&skip=${skip}`);
      const prior = page.items.find((r) => r.receipt === receipt);
      if (prior) {
        if (prior.amount !== toPaise(input.amount) || prior.status === "failed")
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            "Refund requires manual review",
          );
        found = true;
        break;
      }
      if (page.items.length < 100) break;
      skip += 100;
    }
    if (!found && payment.status === "refunded")
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This payment is already fully refunded",
      );
    if (!found)
      await this.api(`/payments/${payment.id}/refund`, {
        amount: toPaise(input.amount),
        receipt,
        notes: { medusa_refund_id: receipt },
      });
    return { data: { ...data, payment_id: payment.id } };
  }
  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    if (
      !validWebhook(
        payload.rawData,
        payload.headers["x-razorpay-signature"],
        this.options.webhook_secret,
      )
    )
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Invalid webhook signature",
      );
    // Parse the signed bytes, never trust a separately supplied parsed object.
    const event = JSON.parse(payload.rawData.toString()) as {
      event: string;
      payload?: { payment?: { entity?: GatewayPayment } };
    };
    if (!["payment.authorized", "payment.captured"].includes(event.event))
      return { action: "not_supported" };
    const entity = event.payload?.payment?.entity;
    if (!entity?.order_id || !/^order_[a-zA-Z0-9]+$/.test(entity.order_id))
      return { action: "not_supported" };
    const order = await this.api<GatewayOrder>(`/orders/${entity.order_id}`);
    const session = order.notes?.medusa_session_id;
    if (
      !session ||
      entity.amount !== order.amount ||
      order.currency !== "INR" ||
      entity.currency !== "INR"
    )
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Webhook amount or session mismatch",
      );
    return {
      action: event.event === "payment.captured" ? "captured" : "authorized",
      data: { session_id: session, amount: new BigNumber(order.amount / 100) },
    };
  }
}
