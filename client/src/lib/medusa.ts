type HealthPayload = { status?: string; service?: string };

type StoreProductsPayload = {
  products?: Array<{ id: string }>;
};

const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "");
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim();

export const medusaConfig = {
  backendUrl,
  publishableKey,
  configured: Boolean(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL && publishableKey),
};

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const headers: HeadersInit = {};
    if (publishableKey) headers["x-publishable-api-key"] = publishableKey;

    const response = await fetch(`${backendUrl}${path}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getFoundationConnection() {
  const health = await safeFetch<HealthPayload>("/minara/health");
  const products = publishableKey
    ? await safeFetch<StoreProductsPayload>("/store/products?limit=1&fields=id")
    : null;

  return {
    backendReachable: health?.status === "ok" && health?.service === "minara-commerce",
    publishableKeyConfigured: Boolean(publishableKey),
    storeApiReachable: Boolean(products?.products),
  };
}
