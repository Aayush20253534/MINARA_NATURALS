import {
  apiFailure,
  privateJson,
  readMutation,
  requireCustomer,
  StoreError,
  storeRequest,
} from "@/lib/customer-server";
import { orderFields, parseAddress } from "@/lib/customer";
const id = (value: unknown) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,180}$/.test(value)
    ? value
    : null;
export async function GET(request: Request) {
  try {
    const customer = await requireCustomer();
    const params = new URL(request.url).searchParams;
    if (params.get("view") === "orders") {
      const offset = Math.max(
        0,
        Math.min(100000, Number(params.get("offset")) || 0),
      );
      return privateJson(
        await storeRequest(
          `/store/orders?limit=10&offset=${Math.floor(offset)}&fields=${encodeURIComponent(orderFields)}`,
        ),
      );
    }
    if (params.get("view") === "order") {
      const orderId = id(params.get("id"));
      if (!orderId) throw new StoreError(400, "Invalid order.");
      return privateJson(
        await storeRequest(
          `/store/orders/${orderId}?fields=${encodeURIComponent(orderFields)}`,
        ),
      );
    }
    if (params.get("view") === "wishlist")
      return privateJson(await storeRequest("/store/minara/wishlist"));
    return privateJson({
      customer,
      ...(await storeRequest<object>(
        "/store/customers/me/addresses?limit=100",
      )),
    });
  } catch (e) {
    return apiFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    const input = await readMutation(request);
    await requireCustomer();
    if (input.action === "profile") {
      const fields: Record<string, string> = {};
      for (const key of ["first_name", "last_name", "phone"]) {
        if (typeof input[key] !== "string" || input[key].length > 100)
          throw new StoreError(400, "Check your profile details.");
        fields[key] = input[key].trim();
      }
      if (!fields.first_name || !fields.last_name)
        throw new StoreError(400, "Enter your first and last name.");
      return privateJson(
        await storeRequest("/store/customers/me", "POST", fields),
      );
    }
    if (input.action === "address-save") {
      const address = parseAddress(input.address);
      if (!address || (input.id !== undefined && !id(input.id)))
        throw new StoreError(
          400,
          "Enter a complete Indian delivery address, phone number and six-digit PIN code.",
        );
      return privateJson(
        await storeRequest(
          `/store/customers/me/addresses${input.id ? `/${id(input.id)}` : ""}`,
          "POST",
          address,
        ),
      );
    }
    if (input.action === "address-delete" && id(input.id))
      return privateJson(
        await storeRequest(
          `/store/customers/me/addresses/${id(input.id)}`,
          "DELETE",
        ),
      );
    if (
      input.action === "wishlist" &&
      id(input.product_id) &&
      typeof input.saved === "boolean"
    )
      return privateJson(
        await storeRequest("/store/minara/wishlist", "POST", {
          product_id: input.product_id,
          saved: input.saved,
        }),
      );
    throw new StoreError(400, "Invalid request.");
  } catch (e) {
    return apiFailure(e);
  }
}
