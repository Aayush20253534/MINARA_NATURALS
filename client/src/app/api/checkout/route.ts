import {
  apiFailure,
  privateJson,
  readMutation,
  requireCustomer,
  storeRequest,
  StoreError,
} from "@/lib/customer-server";
import {
  checkoutCart,
  paymentLocked,
  providerId,
  publicCart,
  shippingOptions,
} from "@/lib/checkout-server";
import { parseAddress, type Address } from "@/lib/customer";
import type { CheckoutCart } from "@/lib/checkout";
export async function GET() {
  try {
    const customer = await requireCustomer();
    const [cart, config, { addresses }] = await Promise.all([
      checkoutCart(),
      storeRequest<{ enabled: boolean }>("/store/minara/checkout"),
      storeRequest<{ addresses: Address[] }>(
        "/store/customers/me/addresses?limit=100",
      ),
    ]);
    const [{ payment_providers }, options] = await Promise.all([
      cart
        ? storeRequest<{ payment_providers: { id: string }[] }>(
            `/store/payment-providers?region_id=${cart.region_id}`,
          )
        : Promise.resolve({ payment_providers: [] }),
      cart ? shippingOptions(cart) : Promise.resolve([]),
    ]);
    return privateJson({
      cart: publicCart(cart),
      customer,
      addresses,
      shipping_options: options,
      enabled: config.enabled,
      payment_available: payment_providers.some((p) => p.id === providerId),
      locked: cart ? paymentLocked(cart) : false,
    });
  } catch (e) {
    return apiFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    const input = await readMutation(request);
    const customer = await requireCustomer();
    let cart = await checkoutCart();
    if (!cart?.items.length)
      throw new StoreError(
        409,
        "Your bag is empty. Add something good before checking out.",
      );
    if (cart.customer_id && cart.customer_id !== customer.id)
      throw new StoreError(404, "Bag not found.");
    if (!cart.customer_id) {
      await storeRequest(`/store/carts/${cart.id}/customer`, "POST", {});
      cart = (await checkoutCart())!;
    }
    if (input.action === "complete") {
      // Native completion verifies authorization, inventory and totals, and is idempotent per cart.
      const result = await storeRequest<{
        type: string;
        order?: { id: string };
        error?: unknown;
      }>(`/store/carts/${cart.id}/complete`, "POST", {});
      if (result.type !== "order" || !result.order?.id)
        throw new StoreError(
          409,
          "Payment is not confirmed yet. Check its status before trying to pay again.",
        );
      return privateJson({ order_id: result.order.id });
    }
    if (cart.completed_at)
      throw new StoreError(
        409,
        "This order has already been placed. Check its status below.",
      );
    if (input.action === "address") {
      if (paymentLocked(cart))
        throw new StoreError(
          409,
          "Payment has started. Resume payment to finish this order.",
        );
      const address = parseAddress(input.address);
      if (!address)
        throw new StoreError(
          400,
          "Enter a complete Indian address, phone number and six-digit PIN code.",
        );
      await storeRequest(`/store/carts/${cart.id}`, "POST", {
        email: customer.email,
        shipping_address: address,
        billing_address: address,
      });
      return privateJson({ ok: true });
    }
    if (input.action === "shipping") {
      if (paymentLocked(cart))
        throw new StoreError(
          409,
          "Payment has started. Resume payment to finish this order.",
        );
      const options = await shippingOptions(cart);
      if (
        typeof input.option_id !== "string" ||
        !options.some((o) => o.id === input.option_id)
      )
        throw new StoreError(400, "Choose an available delivery option.");
      await storeRequest(`/store/carts/${cart.id}/shipping-methods`, "POST", {
        option_id: input.option_id,
      });
      return privateJson({ ok: true });
    }
    if (input.action === "payment") {
      const { enabled } = await storeRequest<{ enabled: boolean }>(
        "/store/minara/checkout",
      );
      if (!enabled)
        throw new StoreError(
          503,
          "Online ordering is not open yet. Your bag is saved.",
        );
      if (
        !cart.shipping_address ||
        !cart.shipping_methods.length ||
        !cart.email
      )
        throw new StoreError(
          400,
          "Save your delivery address and choose delivery first.",
        );
      let collection = cart.payment_collection;
      if (!collection)
        collection = (
          await storeRequest<{
            payment_collection: NonNullable<CheckoutCart["payment_collection"]>;
          }>("/store/payment-collections", "POST", { cart_id: cart.id })
        ).payment_collection;
      let session = collection.payment_sessions?.find(
        (s) => s.provider_id === providerId,
      );
      if (!session) {
        collection = (
          await storeRequest<{
            payment_collection: NonNullable<CheckoutCart["payment_collection"]>;
          }>(
            `/store/payment-collections/${collection.id}/payment-sessions`,
            "POST",
            { provider_id: providerId },
          )
        ).payment_collection;
        session = collection.payment_sessions?.find(
          (s) => s.provider_id === providerId,
        );
      }
      if (!session?.data)
        throw new StoreError(
          503,
          "Payment could not be opened. Please try again.",
        );
      // Public checkout configuration only. Secrets and customer session tokens never leave the server.
      const { order_id, amount, currency, key_id } = session.data;
      if (
        typeof order_id !== "string" ||
        typeof amount !== "number" ||
        typeof key_id !== "string" ||
        currency !== "INR"
      )
        throw new StoreError(503, "Payment configuration is unavailable.");
      return privateJson({ order_id, amount, currency, key_id });
    }
    throw new StoreError(400, "Invalid checkout request.");
  } catch (e) {
    return apiFailure(e);
  }
}
