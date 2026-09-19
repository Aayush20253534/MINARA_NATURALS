import "server-only";
import { cookies } from "next/headers";
import { medusaConfig } from "./medusa";
import { siteUrl } from "./site";
import type { Customer } from "./customer";
export const authCookie = "minara_auth";
export class StoreError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const privateJson = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
      "Referrer-Policy": "no-referrer",
    },
  });
export async function storeRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
  token?: string | null,
): Promise<T> {
  const auth =
    token === undefined ? (await cookies()).get(authCookie)?.value : token;
  let response: Response;
  try {
    response = await fetch(`${medusaConfig.backendUrl}${path}`, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": medusaConfig.publishableKey ?? "",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new StoreError(503, "We couldn’t reach the shop. Please try again.");
  }
  if (!response.ok)
    throw new StoreError(
      response.status,
      response.status === 401
        ? "Please sign in again to continue."
        : response.status === 429
          ? "Too many attempts. Please try again in a few minutes."
          : response.status === 404
            ? "This item is no longer available."
            : "We couldn’t save that change. Check your details and try again.",
    );
  if (response.status === 204) return {} as T;
  return response.json();
}
export async function requireCustomer() {
  if (!(await cookies()).has(authCookie))
    throw new StoreError(401, "Please sign in to continue.");
  return (await storeRequest<{ customer: Customer }>("/store/customers/me"))
    .customer;
}
export async function readMutation(
  request: Request,
): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    ![new URL(request.url).origin, siteUrl().origin].includes(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new StoreError(403, "Please refresh this page and try again.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new StoreError(415, "Invalid request.");
  if (Number(request.headers.get("content-length")) > 12000)
    throw new StoreError(413, "Request too large.");
  const text = await request.text();
  if (text.length > 12000) throw new StoreError(413, "Request too large.");
  try {
    const value = JSON.parse(text);
    if (value && typeof value === "object" && !Array.isArray(value))
      return value;
  } catch {}
  throw new StoreError(400, "Invalid request.");
}
export function apiFailure(error: unknown) {
  return privateJson(
    {
      error:
        error instanceof StoreError
          ? error.message
          : "The shop is temporarily unavailable. Please try again.",
    },
    error instanceof StoreError ? error.status : 503,
  );
}
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 86400,
  };
}
