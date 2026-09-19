import { cookies } from "next/headers";
import {
  CartError,
  cartFetch,
  cartPath,
  createCart,
  presentCart,
  type StoreCart,
} from "@/lib/cart-server";
import { parseCartAction } from "@/lib/commerce";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
const cookieName = "minara_cart";
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
async function currentCart() {
  const jar = await cookies();
  const id = jar.get(cookieName)?.value;
  if (!id) return { cart: null };
  if (!/^cart_[a-zA-Z0-9_-]{1,150}$/.test(id)) {
    jar.delete(cookieName);
    return { cart: null, notice: "Your previous bag has expired." };
  }
  try {
    const { cart } = await cartFetch<{ cart: StoreCart }>(cartPath(id));
    if (cart.completed_at) {
      // Keep the opaque ID until a new bag starts so a delayed payment can be reconciled.
      return {
        cart: null,
        notice:
          "Your previous bag was completed. Start a new bag whenever you’re ready.",
      };
    }
    return { cart };
  } catch (error) {
    if (error instanceof CartError && error.status === 404) {
      jar.delete(cookieName);
      return {
        cart: null,
        notice: "Your previous bag has expired. You can start a new one.",
      };
    }
    throw error;
  }
}
function failure(error: unknown) {
  if (error instanceof CartError)
    return json(
      { error: error.message },
      error.status >= 500 ? 503 : error.type === "stock" ? 409 : 400,
    );
  return json(
    { error: "Your bag is temporarily unavailable. Please try again." },
    503,
  );
}
export async function GET() {
  try {
    const result = await currentCart();
    return json(result.cart ? await presentCart(result.cart) : result);
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  // Cookie-based mutations require a same-origin JSON request. No cart ID or price is accepted from clients.
  const origin = request.headers.get("origin");
  if (
    !origin ||
    ![new URL(request.url).origin, siteUrl().origin].includes(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return json({ error: "Please refresh the page and try again." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "Invalid request." }, 415);
  let input;
  try {
    if (Number(request.headers.get("content-length")) > 2048)
      return json({ error: "Request too large." }, 413);
    const text = await request.text();
    if (text.length > 2048) return json({ error: "Request too large." }, 413);
    input = parseCartAction(JSON.parse(text));
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (!input)
    return json(
      { error: "Choose a valid pack and a quantity between 1 and 99." },
      400,
    );
  try {
    let { cart } = await currentCart();
    if (!cart && input.action !== "add")
      return json(
        {
          cart: null,
          error: "This bag has expired. Please add your products again.",
        },
        409,
      );
    if (!cart) {
      cart = await createCart();
      (await cookies()).set(cookieName, cart.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    if (
      input.action !== "add" &&
      !cart.items.some((item) => item.id === input.itemId)
    )
      return json(
        { error: "That item is no longer in this bag. Please refresh." },
        409,
      );
    if (input.action === "add") {
      const existing = cart.items.find(
        (item) => item.variant_id === input.variantId,
      );
      if ((existing?.quantity ?? 0) + input.quantity > 99)
        return json(
          {
            error:
              "You can add up to 99 of each pack. Update its quantity in your bag.",
          },
          400,
        );
      if (!existing && cart.items.length >= 100)
        return json(
          { error: "Your bag can hold up to 100 different packs." },
          400,
        );
      cart = (
        await cartFetch<{ cart: StoreCart }>(
          cartPath(cart.id, "/line-items"),
          "POST",
          { variant_id: input.variantId, quantity: input.quantity },
        )
      ).cart;
    } else if (input.action === "update") {
      cart = (
        await cartFetch<{ cart: StoreCart }>(
          cartPath(cart.id, `/line-items/${input.itemId}`),
          "POST",
          { quantity: input.quantity },
        )
      ).cart;
    } else {
      cart = (
        await cartFetch<{ parent: StoreCart }>(
          cartPath(cart.id, `/line-items/${input.itemId}`),
          "DELETE",
        )
      ).parent;
    }
    return json(await presentCart(cart));
  } catch (error) {
    return failure(error);
  }
}
