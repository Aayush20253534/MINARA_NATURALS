import { decorateCartTotals } from "@medusajs/framework/utils";
import { createHmac } from "node:crypto";
import RazorpayProvider, { toPaise, validWebhook } from "../service";
const options = {
  key_id: "rzp_test_fixture",
  key_secret: "server_secret",
  webhook_secret: "webhook_secret",
};
const data = {
  order_id: "order_gateway123",
  amount: 19800,
  currency: "INR",
  session_id: "payses_fixture",
  key_id: options.key_id,
};
const order = {
  id: data.order_id,
  amount: data.amount,
  currency: "INR",
  notes: { medusa_session_id: data.session_id },
};
const payment = {
  id: "pay_verified",
  order_id: data.order_id,
  amount: data.amount,
  currency: "INR",
  status: "captured",
};
let fetchMock: jest.SpyInstance;
function respond(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, "fetch");
});
afterEach(() => jest.restoreAllMocks());
it("converts Medusa major-unit INR amounts exactly and rejects invalid precision", () => {
  expect(toPaise(198)).toBe(19800);
  expect(toPaise("10.25")).toBe(1025);
  for (const value of [0, -1, Infinity, "abc", 0.001, Number.MAX_SAFE_INTEGER])
    expect(() => toPaise(value)).toThrow();
});
it("creates gateway orders with the trusted session and never exposes secrets", async () => {
  fetchMock.mockResolvedValue(respond(order));
  const result = await new RazorpayProvider({}, options).initiatePayment({
    amount: 198,
    currency_code: "inr",
    context: { idempotency_key: "payses_fixture" },
  });
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.amount).toBe(19800);
  expect(body.notes.medusa_session_id).toBe("payses_fixture");
  expect(JSON.stringify(result)).not.toContain(options.key_secret);
  expect(result.data.key_id).toBe(options.key_id);
});
it("does not authorize a client claim without a gateway payment", async () => {
  fetchMock.mockImplementation(async (url: string) =>
    respond(url.endsWith("/payments") ? { items: [] } : order),
  );
  const result = await new RazorpayProvider({}, options).authorizePayment({
    data: { ...data, payment_id: "pay_forged", status: "captured" },
  });
  expect(result.status).toBe("requires_more");
});
it("authorizes a matching captured payment fetched from Razorpay", async () => {
  fetchMock.mockImplementation(async (url: string) =>
    respond(url.endsWith("/payments") ? { items: [payment] } : order),
  );
  const result = await new RazorpayProvider({}, options).authorizePayment({
    data,
  });
  expect(result.status).toBe("captured");
  expect(result.data.payment_id).toBe(payment.id);
});
it("rejects a gateway amount mismatch", async () => {
  fetchMock.mockImplementation(async (url: string) =>
    respond(
      url.endsWith("/payments")
        ? { items: [payment] }
        : { ...order, amount: 1 },
    ),
  );
  await expect(
    new RazorpayProvider({}, options).authorizePayment({ data }),
  ).rejects.toThrow("mismatch");
});
it("never changes the amount after a payment session starts", async () => {
  await expect(
    new RazorpayProvider({}, options).updatePayment({
      data,
      amount: 199,
      currency_code: "inr",
    }),
  ).rejects.toThrow("cannot be changed");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("capture retries do not capture an already captured payment again", async () => {
  fetchMock.mockImplementation(async (url: string) =>
    respond(url.endsWith("/payments") ? { items: [payment] } : order),
  );
  await new RazorpayProvider({}, options).capturePayment({ data });
  expect(fetchMock.mock.calls.every(([, init]) => !init?.body)).toBe(true);
});
it("validates exact raw webhook bytes and rejects malformed signatures", () => {
  const raw = '{"event":"payment.captured"}';
  const signature = createHmac("sha256", options.webhook_secret)
    .update(raw)
    .digest("hex");
  expect(validWebhook(raw, signature, options.webhook_secret)).toBe(true);
  expect(validWebhook(raw + " ", signature, options.webhook_secret)).toBe(
    false,
  );
  expect(validWebhook(raw, "bad", options.webhook_secret)).toBe(false);
  expect(validWebhook(raw, undefined, options.webhook_secret)).toBe(false);
});
it("ignores forged parsed data and derives the webhook session from the signed order", async () => {
  fetchMock.mockResolvedValue(respond(order));
  const raw = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: payment } },
  });
  const result = await new RazorpayProvider(
    {},
    options,
  ).getWebhookActionAndData({
    rawData: Buffer.from(raw),
    data: { session_id: "foreign" },
    headers: {
      "x-razorpay-signature": createHmac("sha256", options.webhook_secret)
        .update(raw)
        .digest("hex"),
    },
  });
  expect(result.action).toBe("captured");
  expect(result.data?.session_id).toBe(data.session_id);
  expect(Number(String(result.data?.amount))).toBe(198);
});
it("unsigned webhooks fail before any API call", async () => {
  await expect(
    new RazorpayProvider({}, options).getWebhookActionAndData({
      rawData: "{}",
      data: {},
      headers: {},
    }),
  ).rejects.toThrow("signature");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("refund retries reconcile the reference before making another charge reversal", async () => {
  fetchMock.mockImplementation(async (url: string) =>
    respond(
      url.includes("/refunds")
        ? { items: [{ receipt: "ref_123", amount: 1000, status: "processed" }] }
        : url.endsWith("/payments")
          ? { items: [payment] }
          : order,
    ),
  );
  await new RazorpayProvider({}, options).refundPayment({
    data,
    amount: 10,
    context: { idempotency_key: "ref_123" },
  });
  expect(fetchMock.mock.calls.every(([, init]) => !init?.body)).toBe(true);
});
it("cannot cancel a paid payment as though it were unpaid", async () => {
  fetchMock.mockImplementation(async (url: string) =>
    respond(url.endsWith("/payments") ? { items: [payment] } : order),
  );
  await expect(
    new RazorpayProvider({}, options).cancelPayment({ data }),
  ).rejects.toThrow("Refund");
});

it("recognizes a completed full refund when the original response was lost", async () => {
  fetchMock.mockImplementation(async (url: string) =>
    respond(
      url.includes("/refunds")
        ? {
            items: [
              { receipt: "ref_full", amount: data.amount, status: "processed" },
            ],
          }
        : url.endsWith("/payments")
          ? { items: [{ ...payment, status: "refunded" }] }
          : order,
    ),
  );
  await new RazorpayProvider({}, options).refundPayment({
    data,
    amount: 198,
    context: { idempotency_key: "ref_full" },
  });
  expect(fetchMock.mock.calls.every(([, init]) => !init?.body)).toBe(true);
});

it("uses native tax-exclusive summary components without counting delivery twice", () => {
  const totals = decorateCartTotals(
    {
      currency_code: "inr",
      items: [
        {
          id: "item",
          unit_price: 100,
          is_tax_inclusive: false,
          quantity: 1,
          tax_lines: [{ rate: 10 }],
          adjustments: [{ amount: 10, is_tax_inclusive: false }],
        },
      ],
      shipping_methods: [
        { id: "shipping", amount: 20, is_tax_inclusive: false, tax_lines: [{ rate: 10 }] },
      ],
    },
    { includeTaxes: true },
  );
  expect(Number(String(totals.subtotal))).toBe(120);
  expect(Number(String(totals.shipping_total))).toBe(22);
  expect(Number(String(totals.item_subtotal))).toBe(100);
  expect(Number(String(totals.shipping_subtotal))).toBe(20);
  expect(Number(String((totals as typeof totals & { discount_subtotal: unknown }).discount_subtotal))).toBe(10);
  expect(Number(String(totals.tax_total))).toBe(11);
  expect(Number(String(totals.total))).toBe(121);
});
