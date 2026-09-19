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

export async function getCatalogPreview() {
  const categoryQuery = new URLSearchParams({
    limit: "100",
    include_descendants_tree: "true",
    fields: "*category_children",
  });

 const productQuery = new URLSearchParams({
  limit: "40",
  country_code: "in",
  fields:
    "+thumbnail,*images,*variants.calculated_price,+variants.inventory_quantity,+metadata,*categories,*variants.options",
});

  const [categoryResponse, productResponse] = await Promise.all([
    storeFetch<ProductCategoryListResponse>(`/store/product-categories?${categoryQuery.toString()}`),
    storeFetch<ProductListResponse>(`/store/products?${productQuery.toString()}`),
  ]);

  const categories = (categoryResponse?.product_categories ?? [])
    .filter((category) => !category.parent_category_id)
    .slice(0, 6);

  const products = (productResponse?.products ?? [])
    .filter((product) => product.metadata?.seed_catalog === "phase-1-1")
    .sort((left, right) => productRank(right) - productRank(left))
    .slice(0, 8);

  return {
    categories,
    products,
    connected: Boolean(categoryResponse && productResponse),
  };
}
