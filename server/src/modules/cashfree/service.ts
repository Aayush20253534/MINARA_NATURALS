import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import type {
  AuthorizePaymentInput,
  CancelPaymentInput,
  CapturePaymentInput,
  DeletePaymentInput,
  GetPaymentStatusInput,
  InitiatePaymentInput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RetrievePaymentInput,
  UpdatePaymentInput,
  WebhookActionResult,
} from "@medusajs/framework/types";

type CashfreeEnvironment = "sandbox" | "production";
type Options = {
  client_id: string;
  client_secret: string;
  environment: CashfreeEnvironment;
  api_version: string;
  storefront_url: string;
  backend_url: string;
};

type CheckoutInput = {
  customer_id?: unknown;
  customer_email?: unknown;
  customer_phone?: unknown;
  customer_name?: unknown;
};

type CashfreeOrder = {
  cf_order_id?: string;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status?: string;
  payment_session_id?: string;
  order_tags?: Record<string, string> | null;
};

type CashfreePayment = {
  cf_payment_id: string | number;
  order_id: string;
  payment_amount: number;
  payment_currency: string;
  payment_status: string;
};

type CashfreeRefund = {
  refund_id: string;
  refund_amount: number;
  refund_currency?: string;
  refund_status: string;
  cf_refund_id?: string;
};

type Data = {
  order_id: string;
  amount: number;
  currency: "INR";
  session_id: string;
  payment_session_id: string;
  mode: CashfreeEnvironment;
  cf_payment_id?: string;
};

function text(value: unknown, max = 180) {
  return typeof value === "string" && value.trim() && value.length <= max
    ? value.trim()
    : null;
}

export function toCashfreeAmount(value: unknown) {
  const amount = Number(String(value));
  const paise = Math.round(amount * 100);
  if (
    !Number.isFinite(amount) ||
    !Number.isSafeInteger(paise) ||
    paise <= 0 ||
    Math.abs(amount * 100 - paise) > 0.00001
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid INR payment amount",
    );
  }
  return paise / 100;
}

function deterministicUuid(value: string) {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32);
  const chars = hex.split("");
  chars[12] = "5";
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  const stable = chars.join("");
  return `${stable.slice(0, 8)}-${stable.slice(8, 12)}-${stable.slice(12, 16)}-${stable.slice(16, 20)}-${stable.slice(20)}`;
}

function merchantOrderId(sessionId: string) {
  return `mn_${createHash("sha256").update(sessionId).digest("hex").slice(0, 32)}`;
}

function merchantRefundId(reference: string) {
  return `rf_${createHash("sha256").update(reference).digest("hex").slice(0, 30)}`;
}

function headerValue(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

export function validCashfreeWebhook(
  raw: string | Buffer,
  timestamp: unknown,
  signature: unknown,
  secret: string,
) {
  const ts = headerValue(timestamp);
  const provided = headerValue(signature);
  if (!ts || !/^\d{10,16}$/.test(ts) || !provided) return false;
  const rawText = Buffer.isBuffer(raw) ? raw.toString("utf8") : raw;
  const expected = createHmac("sha256", secret)
    .update(`${ts}${rawText}`)
    .digest("base64");
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right);
}

export default class CashfreeProvider extends AbstractPaymentProvider<Options> {
  static identifier = "cashfree";
  private options: Options;

  constructor(container: Record<string, unknown>, options: Options) {
    super(container, options);
    this.options = options;
  }

  static validateOptions(options: Record<string, unknown>) {
    for (const key of [
      "client_id",
      "client_secret",
      "api_version",
      "storefront_url",
      "backend_url",
    ]) {
      if (typeof options[key] !== "string" || !options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cashfree credentials or URLs are incomplete",
        );
      }
    }
    if (!['sandbox', 'production'].includes(String(options.environment))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cashfree environment must be sandbox or production",
      );
    }
  }

  private get baseUrl() {
    return this.options.environment === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
  }

  private async api<T>(
    path: string,
    options: {
      method?: "GET" | "POST";
      body?: unknown;
      idempotencyKey?: string;
    } = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method || (options.body === undefined ? "GET" : "POST"),
        headers: {
          "Content-Type": "application/json",
          "x-api-version": this.options.api_version,
          "x-client-id": this.options.client_id,
          "x-client-secret": this.options.client_secret,
          "x-request-id": randomUUID(),
          ...(options.idempotencyKey
            ? { "x-idempotency-key": options.idempotencyKey }
            : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Payment provider unavailable; check payment status before retrying",
      );
    }
    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Cashfree request failed (${response.status})`,
      );
    }
    return response.json() as Promise<T>;
  }

  private data(value: Record<string, unknown> | undefined): Data {
    const data = value as Data | undefined;
    if (
      !data ||
      !/^mn_[a-f0-9]{32}$/.test(data.order_id) ||
      typeof data.amount !== "number" ||
      data.amount <= 0 ||
      data.currency !== "INR" ||
      !data.session_id ||
      !data.payment_session_id ||
      !['sandbox', 'production'].includes(data.mode)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid Cashfree payment session",
      );
    }
    return data;
  }

  private async verifiedPayment(data: Data) {
    const [order, payments] = await Promise.all([
      this.api<CashfreeOrder>(`/orders/${encodeURIComponent(data.order_id)}`),
      this.api<CashfreePayment[]>(
        `/orders/${encodeURIComponent(data.order_id)}/payments`,
      ),
    ]);
    if (
      order.order_id !== data.order_id ||
      toCashfreeAmount(order.order_amount) !== data.amount ||
      order.order_currency !== data.currency ||
      order.order_tags?.medusa_session_id !== data.session_id
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cashfree payment amount or session mismatch",
      );
    }
    return payments.find(
      (payment) =>
        payment.order_id === data.order_id &&
        payment.payment_status === "SUCCESS" &&
        toCashfreeAmount(payment.payment_amount) === data.amount &&
        payment.payment_currency === data.currency,
    );
  }

  async initiatePayment(input: InitiatePaymentInput) {
    if (input.currency_code.toLowerCase() !== "inr") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Only INR payments are supported",
      );
    }
    const sessionId = text(input.context?.idempotency_key, 180);
    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing payment session",
      );
    }
    const checkout = (input.data || {}) as CheckoutInput;
    const customerId = text(checkout.customer_id, 50);
    const customerEmail = text(checkout.customer_email, 254);
    const customerPhone = text(checkout.customer_phone, 20);
    const customerName = text(checkout.customer_name, 100);
    if (
      !customerId ||
      !customerEmail ||
      !customerEmail.includes("@") ||
      !customerPhone ||
      !/^\+?[0-9]{10,15}$/.test(customerPhone)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cashfree requires the verified customer email and delivery phone number",
      );
    }
    const amount = toCashfreeAmount(input.amount);
    const orderId = merchantOrderId(sessionId);
    const order = await this.api<CashfreeOrder>("/orders", {
      method: "POST",
      idempotencyKey: deterministicUuid(`cashfree-order:${sessionId}`),
      body: {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: customerId,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          ...(customerName ? { customer_name: customerName } : {}),
        },
        order_meta: {
          return_url: `${this.options.storefront_url}/checkout?cashfree_order_id={order_id}`,
          notify_url: `${this.options.backend_url}/hooks/payment/cashfree_cashfree`,
        },
        order_tags: { medusa_session_id: sessionId },
      },
    });
    if (
      order.order_id !== orderId ||
      !text(order.payment_session_id, 500) ||
      toCashfreeAmount(order.order_amount) !== amount ||
      order.order_currency !== "INR"
    ) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Cashfree returned an invalid order response",
      );
    }
    return {
      id: order.order_id,
      status: PaymentSessionStatus.PENDING,
      data: {
        order_id: order.order_id,
        amount,
        currency: "INR",
        session_id: sessionId,
        payment_session_id: order.payment_session_id!,
        mode: this.options.environment,
      },
    };
  }

  async authorizePayment(input: AuthorizePaymentInput) {
    const data = this.data(input.data);
    const payment = await this.verifiedPayment(data);
    return {
      status: payment
        ? PaymentSessionStatus.CAPTURED
        : PaymentSessionStatus.REQUIRES_MORE,
      data: {
        ...data,
        ...(payment ? { cf_payment_id: String(payment.cf_payment_id) } : {}),
      },
    };
  }

  async capturePayment(input: CapturePaymentInput) {
    const data = this.data(input.data);
    const payment = await this.verifiedPayment(data);
    if (!payment) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cashfree payment is not successful",
      );
    }
    // Cashfree hosted checkout returns SUCCESS only after the payment is captured.
    return { data: { ...data, cf_payment_id: String(payment.cf_payment_id) } };
  }

  async getPaymentStatus(input: GetPaymentStatusInput) {
    const result = await this.authorizePayment(input);
    return { status: result.status };
  }

  async retrievePayment(input: RetrievePaymentInput) {
    const data = this.data(input.data);
    const payment = await this.verifiedPayment(data);
    return {
      data: {
        ...data,
        ...(payment ? { cf_payment_id: String(payment.cf_payment_id) } : {}),
      },
    };
  }

  async updatePayment(input: UpdatePaymentInput) {
    const data = this.data(input.data);
    if (
      data.amount !== toCashfreeAmount(input.amount) ||
      input.currency_code.toUpperCase() !== data.currency
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Payment has started; the bag cannot be changed",
      );
    }
    return {
      data: { ...data },
      status: (await this.getPaymentStatus(input)).status,
    };
  }

  async cancelPayment(input: CancelPaymentInput) {
    const data = this.data(input.data);
    const payment = await this.verifiedPayment(data);
    if (payment) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Refund this Cashfree payment through the order before cancelling",
      );
    }
    return { data: { ...data } };
  }

  async deletePayment(input: DeletePaymentInput) {
    return this.cancelPayment(input);
  }

  async refundPayment(input: RefundPaymentInput) {
    const data = this.data(input.data);
    const payment = await this.verifiedPayment(data);
    if (!payment) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only successful Cashfree payments can be refunded",
      );
    }
    const reference = text(input.context?.idempotency_key, 180);
    if (!reference) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing refund reference",
      );
    }
    const amount = toCashfreeAmount(input.amount);
    const refund = await this.api<CashfreeRefund>(
      `/orders/${encodeURIComponent(data.order_id)}/refunds`,
      {
        method: "POST",
        idempotencyKey: deterministicUuid(`cashfree-refund:${reference}`),
        body: {
          refund_amount: amount,
          refund_id: merchantRefundId(reference),
          refund_note: "MINARA order refund",
          refund_speed: "STANDARD",
        },
      },
    );
    if (
      toCashfreeAmount(refund.refund_amount) !== amount ||
      refund.refund_status === "CANCELLED"
    ) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Cashfree refund requires manual review",
      );
    }
    return {
      data: { ...data, cf_payment_id: String(payment.cf_payment_id) },
    };
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    if (
      !validCashfreeWebhook(
        payload.rawData,
        payload.headers["x-webhook-timestamp"],
        payload.headers["x-webhook-signature"],
        this.options.client_secret,
      )
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Invalid Cashfree webhook signature",
      );
    }
    const event = JSON.parse(payload.rawData.toString()) as {
      type?: string;
      data?: {
        order?: {
          order_id?: string;
          order_amount?: number;
          order_currency?: string;
        };
        payment?: CashfreePayment;
      };
    };
    if (
      event.type !== "PAYMENT_SUCCESS_WEBHOOK" ||
      event.data?.payment?.payment_status !== "SUCCESS"
    ) {
      return { action: "not_supported" };
    }
    const orderId = event.data.order?.order_id;
    if (!orderId || !/^mn_[a-f0-9]{32}$/.test(orderId)) {
      return { action: "not_supported" };
    }
    const order = await this.api<CashfreeOrder>(
      `/orders/${encodeURIComponent(orderId)}`,
    );
    const payment = event.data.payment;
    const sessionId = order.order_tags?.medusa_session_id;
    if (
      !sessionId ||
      order.order_id !== orderId ||
      order.order_currency !== "INR" ||
      payment.order_id !== orderId ||
      payment.payment_currency !== "INR" ||
      toCashfreeAmount(payment.payment_amount) !==
        toCashfreeAmount(order.order_amount)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cashfree webhook amount or session mismatch",
      );
    }
    return {
      action: "captured",
      data: {
        session_id: sessionId,
        amount: new BigNumber(order.order_amount),
      },
    };
  }
}
