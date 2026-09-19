import { createHash, randomUUID } from "node:crypto";
import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http";
import type {
  ICachingModuleService,
  ILockingModule,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
export const razorpayProvider = "pp_razorpay_razorpay";
export function checkoutEnabled() {
  return (
    process.env.CHECKOUT_ENABLED === "true" &&
    ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"].every(
      (k) => Boolean(process.env[k]),
    )
  );
}
export async function orderOwner(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const { data } = await req.scope
    .resolve(ContainerRegistrationKeys.QUERY)
    .graph({
      entity: "order",
      fields: ["id"],
      filters: { id: req.params.id, customer_id: req.auth_context.actor_id },
    });
  if (!data.length) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  next();
}
// Serialize Store mutations and payment initialization across tabs and backend instances.
// A dropped connection keeps the lease until expiry; it must not unlock an in-flight write.
async function mutationLease(
  req: MedusaRequest,
  res: MedusaResponse,
  cartId: string,
) {
  const locking = req.scope.resolve<ILockingModule>(Modules.LOCKING);
  const key = `minara:cart:${cartId}`;
  const ownerId = randomUUID();
  try {
    await locking.acquire(key, { ownerId, expire: 120 });
  } catch {
    res
      .status(409)
      .json({ message: "Another bag update is in progress. Please refresh." });
    return false;
  }
  res.once("finish", () => {
    void locking.release(key, { ownerId }).catch(() => {});
  });
  return true;
}
export async function cartOwner(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const id = req.path.split("/")[3];
  if (req.method !== "GET" && !(await mutationLease(req, res, id))) return;
  const { data } = await req.scope
    .resolve(ContainerRegistrationKeys.QUERY)
    .graph({
      entity: "cart",
      fields: [
        "id",
        "customer_id",
        "completed_at",
        "payment_collection.payment_sessions.provider_id",
        "payment_collection.payment_sessions.status",
      ],
      filters: { id },
    });
  const cart = data[0];
  if (
    !cart ||
    (cart.customer_id && cart.customer_id !== req.auth_context?.actor_id)
  ) {
    res.status(404).json({ message: "Bag not found" });
    return;
  }
  const complete = req.path.endsWith("/complete");
  if (
    complete &&
    ((!checkoutEnabled() && !cart.completed_at) ||
      !cart.customer_id ||
      !req.auth_context?.actor_id)
  ) {
    res.status(403).json({ message: "Checkout is not available" });
    return;
  }
  if (
    complete &&
    !cart.completed_at &&
    (!cart.payment_collection?.payment_sessions?.length ||
      cart.payment_collection.payment_sessions.some(
        (s) => s?.provider_id !== razorpayProvider,
      ))
  ) {
    res.status(400).json({ message: "Select a supported payment method" });
    return;
  }
  if (
    !complete &&
    req.method !== "GET" &&
    !req.path.endsWith("/customer") &&
    cart.payment_collection?.payment_sessions?.some(
      (s) => s?.provider_id === razorpayProvider,
    )
  ) {
    res
      .status(409)
      .json({
        message: "Payment has started. Resume checkout to finish this bag.",
      });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  next();
}
export async function paymentOwner(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  if (!checkoutEnabled()) {
    res.status(503).json({ message: "Checkout is not available" });
    return;
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const body = req.body as {
    cart_id?: string;
    provider_id?: string;
    data?: unknown;
  };
  let cartId = body.cart_id;
  if (req.params.id) {
    const { data } = await query.graph({
      entity: "cart_payment_collection",
      fields: ["cart_id"],
      filters: { payment_collection_id: req.params.id },
    });
    cartId = data[0]?.cart_id;
    // Native route accepts arbitrary provider data; never pass caller-controlled order/session IDs.
    if (
      body.provider_id !== razorpayProvider ||
      (body.data && Object.keys(body.data).length)
    ) {
      res.status(400).json({ message: "Unsupported payment request" });
      return;
    }
  }
  if (!cartId) {
    res.status(404).json({ message: "Bag not found" });
    return;
  }
  if (!(await mutationLease(req, res, cartId))) return;
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "customer_id",
      "completed_at",
      "shipping_address.id",
      "shipping_methods.id",
      "payment_collection.*",
      "payment_collection.payment_sessions.*",
    ],
    filters: { id: cartId, customer_id: req.auth_context.actor_id },
  });
  if (!data[0] || data[0].completed_at) {
    res.status(404).json({ message: "Bag not found" });
    return;
  }
  if (!data[0].shipping_address || !data[0].shipping_methods?.length) {
    res
      .status(400)
      .json({ message: "Choose a delivery address and method first" });
    return;
  }
  const collection = data[0].payment_collection;
  if (req.params.id && collection?.payment_sessions?.length) {
    if (
      collection.payment_sessions.some(
        (s) => s?.provider_id !== razorpayProvider,
      )
    ) {
      res
        .status(409)
        .json({ message: "This bag uses an unsupported payment session" });
      return;
    }
    res.json({ payment_collection: collection });
    return;
  }
  next();
}
export function passwordPolicy(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const body = req.body as { email?: unknown; password?: unknown };
  if (
    typeof body.password !== "string" ||
    body.password.length < 12 ||
    body.password.length > 128
  ) {
    res.status(400).json({ message: "Use a password with 12–128 characters" });
    return;
  }
  next();
}
// Shared caching + distributed locking keep limits effective across Render workers.
// Email keys are hashed; no passwords, tokens or email addresses are cached or logged.
export async function authRateLimit(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const caching = req.scope.resolve<ICachingModuleService>(Modules.CACHING);
  const locking = req.scope.resolve<ILockingModule>(Modules.LOCKING);
  const body = (req.body || {}) as Record<string, unknown>;
  const identifier = String(body.email || body.identifier || "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
  const window = Math.floor(Date.now() / 900000);
  const keys = [
    { value: `ip:${req.ip}`, max: 300 },
    ...(identifier ? [{ value: `email:${identifier}`, max: 15 }] : []),
  ];
  for (const { value, max } of keys) {
    const key = `minara:auth:${window}:${createHash("sha256").update(value).digest("hex")}`;
    const allowed = await locking.execute(key, async () => {
      const count = Number((await caching.get({ key }))?.count || 0);
      if (count >= max) return false;
      await caching.set({ key, data: { count: count + 1 }, ttl: 900 });
      return true;
    });
    if (!allowed) {
      res.setHeader("Retry-After", "900");
      res.status(429).json({ message: "Please try again later" });
      return;
    }
  }
  next();
}
