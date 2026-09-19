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
  calculated_price?: {
    calculated_amount?: number | null;
    currency_code?: string | null;
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
  metadata?: Record<string, string | number | boolean | null> | null;
  categories?: Array<{ id: string; name: string; handle: string }>;
  variants?: CatalogVariant[];
};

type ProductCategoryListResponse = {
  product_categories?: CatalogCategory[];
};

type ProductListResponse = {
  products?: CatalogProduct[];
};

const productFields =
  "+thumbnail,*images,*variants.calculated_price,+variants.inventory_quantity,+metadata,*categories,*variants.options";

async function storeFetch<T>(path: string): Promise<T | null> {
  if (!medusaConfig.publishableKey) return null;

  try {
    const response = await fetch(`${medusaConfig.backendUrl}${path}`, {
      headers: {
        "x-publishable-api-key": medusaConfig.publishableKey,
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function productRank(product: CatalogProduct) {
  const metadata = product.metadata ?? {};
  return Number(Boolean(metadata.featured)) * 2 + Number(Boolean(metadata.popular));
}

function collectCategoryHandles(category: CatalogCategory, result = new Set<string>()) {
  result.add(category.handle);
  for (const child of category.category_children ?? []) {
    collectCategoryHandles(child, result);
  }
  return result;
}

export function catalogProductImage(product: CatalogProduct) {
  return product.thumbnail || product.images?.[0]?.url || null;
}

export function formatCatalogPrice(product: CatalogProduct) {
  const prices = (product.variants ?? [])
    .map((variant) => variant.calculated_price?.calculated_amount)
    .filter((amount): amount is number => typeof amount === "number");

  if (!prices.length) return null;

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.min(...prices));

  return prices.length > 1 ? `From ${formatted}` : formatted;
}

export function getCatalogStockState(product: CatalogProduct) {
  const quantities = (product.variants ?? [])
    .map((variant) => variant.inventory_quantity)
    .filter((quantity): quantity is number => typeof quantity === "number");

  if (!quantities.length) {
    return { label: "Availability tracked", state: "neutral" as const };
  }
  if (quantities.every((quantity) => quantity <= 0)) {
    return { label: "Out of stock", state: "out" as const };
  }
  if (quantities.some((quantity) => quantity > 0 && quantity <= 5)) {
    return { label: "Limited stock", state: "low" as const };
  }
  return { label: "In stock", state: "in" as const };
}

export async function getCatalogCategories() {
  const query = new URLSearchParams({
    limit: "100",
    include_descendants_tree: "true",
    fields: "*category_children",
  });
  const response = await storeFetch<ProductCategoryListResponse>(
    `/store/product-categories?${query.toString()}`,
  );
  return response?.product_categories ?? [];
}

export async function getCatalogProducts(limit = 100) {
  const query = new URLSearchParams({
    limit: String(limit),
    country_code: "in",
    fields: productFields,
  });
  const response = await storeFetch<ProductListResponse>(
    `/store/products?${query.toString()}`,
  );

  return (response?.products ?? [])
    .filter((product) => product.metadata?.seed_catalog === "phase-1-1")
    .sort((left, right) => productRank(right) - productRank(left));
}

export async function getProductByHandle(handle: string) {
  const products = await getCatalogProducts();
  return products.find((product) => product.handle === handle) ?? null;
}

export async function getCategoryWithProducts(handle: string) {
  const [categories, products] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
  ]);

  const category = categories.find((item) => item.handle === handle) ?? null;
  if (!category) return { category: null, products: [] as CatalogProduct[] };

  const handles = collectCategoryHandles(category);
  const categoryProducts = products.filter((product) =>
    product.categories?.some((item) => handles.has(item.handle)),
  );

  return { category, products: categoryProducts };
}

export async function getCatalogPreview() {
  const [categories, products] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
  ]);

  return {
    categories: categories
      .filter((category) => !category.parent_category_id)
      .slice(0, 6),
    products: products.slice(0, 16),
    connected: Boolean(categories.length || products.length),
  };
}
