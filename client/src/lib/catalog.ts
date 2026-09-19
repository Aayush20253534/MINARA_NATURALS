import { cache } from "react";
import { medusaConfig } from "@/lib/medusa";

export type CatalogCategory = {
  id: string;
  name: string;
  handle: string;
  parent_category_id?: string | null;
  category_children?: CatalogCategory[];
};

export type CatalogVariant = {
  id: string;
  title: string;
  sku?: string | null;
  inventory_quantity?: number | null;
  manage_inventory?: boolean;
  allow_backorder?: boolean;
  calculated_price?: {
    calculated_amount?: number | null;
    currency_code?: string | null;
    original_amount?: number | null;
    calculated_price?: { price_list_type?: string | null } | null;
  } | null;
};

export type CatalogProduct = {
  id: string;
  title: string;
  handle: string;
  subtitle?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  images?: Array<{
    id?: string;
    url: string;
  }>;
  metadata?: Record<string, unknown> | null;
  categories?: Array<{ id: string; name: string; handle: string }>;
  variants?: CatalogVariant[];
};

export type CatalogueResult = {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  category: CatalogCategory | null;
  facets: { brands: string[]; packs: string[] };
  count: number;
  page: number;
  limit: number;
};

const productFields =
  "id,title,handle,subtitle,description,thumbnail,*images,*variants,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,+metadata,*categories,*variants.options";

export const storeFetch = cache(async <T>(path: string): Promise<T> => {
  if (!medusaConfig.publishableKey)
    throw new Error("Storefront publishable key is not configured");
  const response = await fetch(`${medusaConfig.backendUrl}${path}`, {
    headers: { "x-publishable-api-key": medusaConfig.publishableKey },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(`Catalogue request failed (${response.status})`);
  return response.json() as Promise<T>;
});

export function getCatalogue(params = new URLSearchParams()) {
  return storeFetch<CatalogueResult>(`/store/minara/catalogue?${params}`);
}
export function catalogProductImage(product: CatalogProduct) {
  const src = product.thumbnail || product.images?.[0]?.url;
  if (!src) return null;
  // Match next/image's trusted media source; never crash a whole grid on bad media.
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com"
      ? src
      : null;
  } catch {
    return src.startsWith("/images/") ? src : null;
  }
}
export function formatCatalogPrice(product: CatalogProduct) {
  const prices = (product.variants ?? [])
    .map((v) => v.calculated_price)
    .filter(
      (p) =>
        p &&
        typeof p.calculated_amount === "number" &&
        Number.isFinite(p.calculated_amount),
    );
  if (!prices.length) return null;
  const currency = prices[0]!.currency_code || "inr";
  const amounts = prices
    .filter((p) => (p!.currency_code || "inr") === currency)
    .map((p) => p!.calculated_amount!);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: /^[a-z]{3}$/i.test(currency) ? currency : "INR",
    maximumFractionDigits: 2,
  }).format(Math.min(...amounts));
  return new Set(amounts).size > 1 ? `From ${formatted}` : formatted;
}
export function getCatalogStockState(product: CatalogProduct) {
  const variants = product.variants ?? [];
  if (variants.some((v) => v.manage_inventory === false || v.allow_backorder))
    return { label: "Available", state: "in" as const };
  const quantities = variants
    .map((v) => v.inventory_quantity)
    .filter((n): n is number => typeof n === "number");
  if (quantities.some((n) => n > 0))
    return { label: "In stock", state: "in" as const };
  if (quantities.length && quantities.length === variants.length)
    return { label: "Out of stock", state: "out" as const };
  return { label: "Check availability", state: "neutral" as const };
}
export async function getCatalogCategories() {
  return (await getCatalogue(new URLSearchParams({ limit: "1" }))).categories;
}
export async function getProductByHandle(handle: string) {
  const { regions } = await storeFetch<{
    regions: Array<{
      id: string;
      currency_code: string;
      countries: Array<{ iso_2: string }>;
    }>;
  }>("/store/regions?limit=100");
  const region = regions.find(
    (r) =>
      r.currency_code === "inr" && r.countries.some((c) => c.iso_2 === "in"),
  );
  if (!region) throw new Error("India pricing region is unavailable");
  const query = new URLSearchParams({
    handle,
    limit: "1",
    region_id: region.id,
    country_code: "in",
    fields: productFields,
  });
  const { products } = await storeFetch<{ products: CatalogProduct[] }>(
    `/store/products?${query}`,
  );
  return products[0] ?? null;
}
export async function getCatalogPreview() {
  try {
    const result = await getCatalogue(new URLSearchParams({ limit: "16" }));
    return { ...result, connected: true };
  } catch {
    return {
      categories: [] as CatalogCategory[],
      products: [] as CatalogProduct[],
      connected: false,
    };
  }
}
