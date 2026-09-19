import type { CatalogProduct, CatalogVariant } from "./catalog";

export const MAX_CART_QUANTITY = 99;
export function money(amount: number, currency = "inr") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
export function variantAvailability(variant?: CatalogVariant) {
  if (!variant)
    return { state: "unknown", limit: 0, label: "Unavailable" } as const;
  if (variant.manage_inventory === false || variant.allow_backorder)
    return {
      state: "in",
      limit: MAX_CART_QUANTITY,
      label: variant.allow_backorder ? "Available to order" : "Available",
    } as const;
  const stock = variant.inventory_quantity;
  if (typeof stock !== "number" || !Number.isFinite(stock))
    return {
      state: "unknown",
      limit: 0,
      label: "Availability unconfirmed",
    } as const;
  return stock > 0
    ? ({
        state: "in",
        limit: Math.min(MAX_CART_QUANTITY, Math.floor(stock)),
        label: "In stock",
      } as const)
    : ({ state: "out", limit: 0, label: "Out of stock" } as const);
}
export function variantPrice(variant?: CatalogVariant) {
  const price = variant?.calculated_price;
  return price &&
    typeof price.calculated_amount === "number" &&
    Number.isFinite(price.calculated_amount) &&
    price.calculated_amount >= 0 &&
    price.currency_code?.toLowerCase() === "inr"
    ? price.calculated_amount
    : null;
}
export function publicDescription(product: CatalogProduct) {
  const text = product.description?.trim();
  return text &&
    !/representative|used to validate|catalogue example|development|exercise related/i.test(
      text,
    )
    ? text
    : null;
}
export type CartAction =
  | { action: "add"; variantId: string; quantity: number }
  | { action: "update"; itemId: string; quantity: number }
  | { action: "remove"; itemId: string };
const identifier = (value: unknown) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,150}$/.test(value);
export function parseCartAction(value: unknown): CartAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const keys =
    input.action === "add"
      ? ["action", "variantId", "quantity"]
      : input.action === "update"
        ? ["action", "itemId", "quantity"]
        : input.action === "remove"
          ? ["action", "itemId"]
          : [];
  if (!keys.length || Object.keys(input).some((key) => !keys.includes(key)))
    return null;
  if (!identifier(input.action === "add" ? input.variantId : input.itemId))
    return null;
  if (
    input.action !== "remove" &&
    (!Number.isInteger(input.quantity) ||
      Number(input.quantity) < 1 ||
      Number(input.quantity) > MAX_CART_QUANTITY)
  )
    return null;
  return input as CartAction;
}
export type CartItem = {
  id: string;
  variant_id: string;
  product_id: string;
  product_title: string;
  product_handle: string | null;
  variant_title: string;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  stock: { state: "in" | "out" | "unknown"; limit: number; label: string };
};
export type Cart = {
  items: CartItem[];
  currency_code: string;
  subtotal: number;
  credit_total?: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  total: number;
};
export type CartResponse = {
  cart?: Cart | null;
  error?: string;
  notice?: string;
};
