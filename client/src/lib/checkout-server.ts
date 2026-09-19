import "server-only";
import { cookies } from "next/headers";
import { storeRequest, StoreError } from "./customer-server";
import type { CheckoutCart, ShippingOption } from "./checkout";
export const providerId = "pp_razorpay_razorpay";
const fields =
  "id,customer_id,region_id,completed_at,email,currency_code,subtotal,item_subtotal,shipping_subtotal,discount_subtotal,credit_line_total,shipping_total,tax_total,discount_total,total,*items,*shipping_address,*billing_address,*shipping_methods,*payment_collection,*payment_collection.payment_sessions";
export async function checkoutCart() {
  const id = (await cookies()).get("minara_cart")?.value;
  if (!id || !/^cart_[a-zA-Z0-9_-]{1,150}$/.test(id)) return null;
  try {
    return (
      await storeRequest<{ cart: CheckoutCart }>(
        `/store/carts/${id}?fields=${encodeURIComponent(fields)}`,
      )
    ).cart;
  } catch (e) {
    if (e instanceof StoreError && e.status === 404) return null;
    throw e;
  }
}
export async function shippingOptions(
  cart: CheckoutCart,
): Promise<ShippingOption[]> {
  if (!cart.shipping_address || cart.completed_at) return [];
  const { shipping_options } = await storeRequest<{
    shipping_options: ShippingOption[];
  }>(`/store/shipping-options?cart_id=${cart.id}`);
  return Promise.all(
    shipping_options.map(async (option) => {
      if (option.price_type !== "calculated") return option;
      const { shipping_option } = await storeRequest<{
        shipping_option: ShippingOption;
      }>(`/store/shipping-options/${option.id}/calculate`, "POST", {
        cart_id: cart.id,
      });
      return {
        ...option,
        amount:
          shipping_option.calculated_price?.calculated_amount ??
          shipping_option.amount,
      };
    }),
  );
}
export function paymentLocked(cart: CheckoutCart) {
  return Boolean(
    cart.payment_collection?.payment_sessions?.some(
      (s) => s.provider_id === providerId,
    ),
  );
}
export function publicCart(cart: CheckoutCart | null) {
  if (!cart) return null;
  return {
    ...cart,
    payment_collection: cart.payment_collection
      ? {
          id: cart.payment_collection.id,
          payment_sessions: cart.payment_collection.payment_sessions?.map(
            ({ id, provider_id, status }) => ({ id, provider_id, status }),
          ),
        }
      : undefined,
  };
}
