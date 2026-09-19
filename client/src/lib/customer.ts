export type Address = {
  id?: string;
  address_name?: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
  phone: string;
};
export type Customer = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
};
export type Order = {
  id: string;
  display_id: number;
  created_at: string;
  currency_code: string;
  total: number;
  subtotal: number;
  item_subtotal: number;
  shipping_subtotal: number;
  discount_subtotal: number;
  credit_line_total: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  items: {
    id: string;
    product_title: string;
    variant_title: string;
    quantity: number;
    total: number;
  }[];
  shipping_address?: Address;
  fulfillments?: {
    id: string;
    shipped_at?: string;
    delivered_at?: string;
    canceled_at?: string;
    labels?: { tracking_number: string; tracking_url: string }[];
  }[];
};
export const orderFields =
  "id,display_id,created_at,currency_code,total,subtotal,item_subtotal,shipping_subtotal,discount_subtotal,credit_line_total,shipping_total,tax_total,discount_total,status,payment_status,fulfillment_status,*items,*shipping_address,*fulfillments,*fulfillments.labels";
export function safeReturn(value: unknown) {
  return value === "/checkout" ? "/checkout" : "/account";
}
export function validEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}
export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 12 && value.length <= 128;
}
export function parseAddress(value: unknown): Address | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const key of [
    "first_name",
    "last_name",
    "address_1",
    "address_2",
    "city",
    "province",
    "postal_code",
    "phone",
    "address_name",
  ]) {
    if (input[key] !== undefined && typeof input[key] !== "string") return null;
    result[key] = String(input[key] ?? "").trim();
    if (result[key].length > 200) return null;
  }
  if (
    !["first_name", "last_name", "address_1", "city", "province"].every(
      (k) => result[k],
    )
  )
    return null;
  if (
    !/^[1-9][0-9]{5}$/.test(result.postal_code) ||
    !/^\+?[0-9 ()-]{10,20}$/.test(result.phone)
  )
    return null;
  if (input.country_code !== "in") return null;
  return { ...result, country_code: "in" } as Address;
}
