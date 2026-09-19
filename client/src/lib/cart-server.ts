import "server-only";
import { cookies } from "next/headers";
import { medusaConfig } from "./medusa";
import { variantAvailability, type Cart, type CartItem } from "./commerce";
import type { CatalogProduct } from "./catalog";

export class CartError extends Error {
  constructor(
    public status: number,
    public type: string,
    message: string,
  ) {
    super(message);
  }
}
export type StoreCart = Omit<Cart, "items"> & {
  id: string;
  region_id: string;
  completed_at?: string | null;
  credit_line_total: number;
  item_subtotal: number;
  shipping_subtotal: number;
  discount_subtotal: number;
  items: Omit<CartItem, "stock">[];
};
const fields =
  "id,region_id,currency_code,completed_at,subtotal,credit_line_total,item_subtotal,shipping_subtotal,discount_subtotal,discount_total,tax_total,shipping_total,total,items.id,items.variant_id,items.product_id,items.product_title,items.product_handle,items.variant_title,items.thumbnail,items.quantity,items.unit_price,items.total";
export async function cartFetch<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (!medusaConfig.publishableKey)
    throw new CartError(
      503,
      "configuration",
      "The shop is temporarily unavailable.",
    );
  let response: Response;
  try {
    response = await fetch(`${medusaConfig.backendUrl}${path}`, {
      method,
      headers: {
        "x-publishable-api-key": medusaConfig.publishableKey,
        "Content-Type": "application/json",
        ...((await cookies()).get("minara_auth")?.value
          ? {
              Authorization: `Bearer ${(await cookies()).get("minara_auth")!.value}`,
            }
          : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new CartError(
      503,
      "connection",
      "We couldn’t confirm the change. Refresh your bag before trying again.",
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const stock = /stock|inventory/i.test(String(data.message ?? ""));
    throw new CartError(
      response.status,
      stock ? "stock" : "upstream",
      /Payment has started/i.test(String(data.message ?? ""))
        ? "Payment has started for this bag. Open checkout to resume it."
        : stock
          ? "That quantity is no longer available. Reduce it or choose another pack."
          : "We couldn’t update your bag. Refresh it and try again.",
    );
  }
  return response.json();
}
export function cartPath(id: string, suffix = "") {
  return `/store/carts/${encodeURIComponent(id)}${suffix}?${new URLSearchParams({ fields })}`;
}
export async function createCart() {
  const { regions } = await cartFetch<{
    regions: {
      id: string;
      currency_code: string;
      countries: { iso_2: string }[];
    }[];
  }>("/store/regions?limit=100");
  const region = regions.find(
    (r) =>
      r.currency_code === "inr" && r.countries?.some((c) => c.iso_2 === "in"),
  );
  if (!region)
    throw new CartError(
      503,
      "configuration",
      "The shop is temporarily unavailable.",
    );
  return (
    await cartFetch<{ cart: StoreCart }>(
      `/store/carts?${new URLSearchParams({ fields })}`,
      "POST",
      { region_id: region.id },
    )
  ).cart;
}
export async function presentCart(
  cart: StoreCart,
): Promise<{ cart: Cart; notice?: string }> {
  let products: CatalogProduct[] | null = [];
  const ids = [...new Set(cart.items.map((item) => item.product_id))];
  // Native product queries calculate inventory at this cart's sales-channel locations.
  try {
    for (let offset = 0; offset < ids.length; offset += 50) {
      const params = new URLSearchParams({
        cart_id: cart.id,
        region_id: cart.region_id,
        country_code: "in",
        limit: "50",
        fields:
          "id,*variants,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder",
      });
      ids.slice(offset, offset + 50).forEach((id) => params.append("id[]", id));
      products.push(
        ...(
          await cartFetch<{ products: CatalogProduct[] }>(
            `/store/products?${params}`,
          )
        ).products,
      );
    }
  } catch {
    products = null;
  }
  const variants = new Map(
    products?.flatMap((p) => (p.variants ?? []).map((v) => [v.id, v] as const)),
  );
  const items = cart.items.map((item) => ({
    id: item.id,
    variant_id: item.variant_id,
    product_id: item.product_id,
    product_title: item.product_title,
    product_handle: item.product_handle,
    variant_title: item.variant_title,
    thumbnail: item.thumbnail,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
    stock:
      products !== null && !variants.has(item.variant_id)
        ? { state: "out" as const, limit: 0, label: "No longer available" }
        : variantAvailability(variants.get(item.variant_id)),
  }));
  return {
    cart: {
      items,
      currency_code: cart.currency_code,
      subtotal: cart.item_subtotal,
      credit_total: cart.credit_line_total,
      discount_total: cart.discount_subtotal,
      tax_total: cart.tax_total,
      shipping_total: cart.shipping_subtotal,
      total: cart.total,
    },
    ...(products === null
      ? {
          notice:
            "Stock could not be refreshed. We’ll check availability when you update your bag.",
        }
      : {}),
  };
}
