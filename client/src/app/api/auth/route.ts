import { cookies } from "next/headers";
import {
  apiFailure,
  authCookie,
  cookieOptions,
  privateJson,
  readMutation,
  requireCustomer,
  StoreError,
  storeRequest,
} from "@/lib/customer-server";
import { validEmail, validPassword } from "@/lib/customer";
export async function GET() {
  try {
    return privateJson({ customer: await requireCustomer() });
  } catch (e) {
    return apiFailure(e);
  }
}
export async function POST(request: Request) {
  try {
    const input = await readMutation(request);
    const jar = await cookies();
    if (input.action === "logout") {
      jar.delete(authCookie);
      jar.delete("minara_cart");
      return privateJson({ ok: true });
    }
    if (input.action === "reset") {
      if (
        !validPassword(input.password) ||
        typeof input.token !== "string" ||
        input.token.length > 4096
      )
        throw new StoreError(
          400,
          "Use a password with 12–128 characters and a valid reset link.",
        );
      try {
        await storeRequest(
          "/auth/customer/emailpass/update",
          "POST",
          { password: input.password },
          input.token,
        );
      } catch (e) {
        if (e instanceof StoreError && [400, 401, 403].includes(e.status))
          throw new StoreError(
            400,
            "This reset link has expired or already been used. Request a new one.",
          );
        throw e;
      }
      jar.delete(authCookie);
      jar.delete("minara_cart");
      return privateJson({ ok: true });
    }
    if (!validEmail(input.email))
      throw new StoreError(400, "Enter a valid email address.");
    const email = input.email.trim().toLowerCase();
    if (input.action === "forgot") {
      await storeRequest(
        "/auth/customer/emailpass/reset-password",
        "POST",
        { identifier: email },
        null,
      );
      return privateJson({
        message:
          "If an account uses that email, a reset link will arrive shortly. Check your spam folder too.",
      });
    }
    if (
      !["login", "register"].includes(String(input.action)) ||
      typeof input.password !== "string" ||
      input.password.length > 128 ||
      !input.password
    )
      throw new StoreError(400, "Enter your email and password.");
    if (
      input.action === "register" &&
      (!validPassword(input.password) ||
        typeof input.first_name !== "string" ||
        !input.first_name.trim() ||
        input.first_name.length > 100 ||
        typeof input.last_name !== "string" ||
        !input.last_name.trim() ||
        input.last_name.length > 100)
    )
      throw new StoreError(
        400,
        "Enter your name and a password with at least 12 characters.",
      );
    const credentials = { email, password: input.password };
    let token: string;
    if (input.action === "register") {
      try {
        token = (
          await storeRequest<{ token: string }>(
            "/auth/customer/emailpass/register",
            "POST",
            credentials,
            null,
          )
        ).token;
      } catch (e) {
        // Recover an auth identity whose customer creation was interrupted; login must prove ownership.
        if (!(e instanceof StoreError) || e.status >= 500 || e.status === 429)
          throw e;
        try {
          token = (
            await storeRequest<{ token: string }>(
              "/auth/customer/emailpass",
              "POST",
              credentials,
              null,
            )
          ).token;
        } catch {
          throw new StoreError(
            400,
            "We couldn’t create this account. Try signing in or resetting your password.",
          );
        }
      }
      try {
        await storeRequest("/store/customers/me", "GET", undefined, token);
      } catch (e) {
        if (!(e instanceof StoreError) || ![401, 403, 404].includes(e.status))
          throw e;
        await storeRequest(
          "/store/customers",
          "POST",
          { email, first_name: input.first_name, last_name: input.last_name },
          token,
        );
      }
    }
    try {
      token = (
        await storeRequest<{ token: string }>(
          "/auth/customer/emailpass",
          "POST",
          credentials,
          null,
        )
      ).token;
    } catch (e) {
      if (e instanceof StoreError && [400, 401].includes(e.status))
        throw new StoreError(
          401,
          "That email and password didn’t match. Try again or reset your password.",
        );
      throw e;
    }
    const { customer } = await storeRequest<{ customer: unknown }>(
      "/store/customers/me",
      "GET",
      undefined,
      token,
    );
    // Discard a bag tied to another customer; never transfer ownership silently.
    const cartId = jar.get("minara_cart")?.value;
    if (cartId && /^cart_[a-zA-Z0-9_-]+$/.test(cartId)) {
      try {
        const current = await storeRequest<{
          cart: { customer_id?: string; completed_at?: string };
        }>(
          `/store/carts/${cartId}?fields=id,customer_id,completed_at`,
          "GET",
          undefined,
          token,
        );
        if (!current.cart.customer_id && !current.cart.completed_at)
          await storeRequest(
            `/store/carts/${cartId}/customer`,
            "POST",
            {},
            token,
          );
      } catch (e) {
        if (e instanceof StoreError && [401, 403, 404].includes(e.status))
          jar.delete(
            "minara_cart",
          ); /* checkout retries transient association failures */
      }
    }
    jar.set(authCookie, token, cookieOptions());
    return privateJson({ customer });
  } catch (e) {
    return apiFailure(e);
  }
}
