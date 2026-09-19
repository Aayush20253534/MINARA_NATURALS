/** Public catalogue projection. Never return arbitrary product metadata. */
export type CatalogueVariant = {
  id: string;
  title: string;
  sku?: string | null;
  manage_inventory?: boolean;
  allow_backorder?: boolean;
  inventory_quantity?: number | null;
  calculated_price?: {
    calculated_amount?: number | null;
    currency_code?: string | null;
  } | null;
};
export type CatalogueProduct = {
  id: string;
  handle: string;
  title: string;
  subtitle?: string | null;
  thumbnail?: string | null;
  created_at?: string | Date;
  metadata?: Record<string, unknown> | null;
  categories?: { id: string; name: string; handle: string }[];
  variants?: CatalogueVariant[];
};
export type CatalogueCategory = {
  id: string;
  name: string;
  handle: string;
  parent_category_id?: string | null;
};
export type CatalogueFilters = {
  q?: string;
  category?: string;
  brand?: string[];
  pack?: string[];
  min?: number;
  max?: number;
  availability?: "in" | "out";
  sort?: "featured" | "price-asc" | "price-desc" | "newest" | "name";
  page: number;
  limit: number;
};

export function variantStock(
  variant: CatalogueVariant,
): "in" | "out" | "unknown" {
  if (variant.manage_inventory === false || variant.allow_backorder)
    return "in";
  if (typeof variant.inventory_quantity !== "number") return "unknown";
  return variant.inventory_quantity > 0 ? "in" : "out";
}
const price = (v: CatalogueVariant) => {
  const amount = v.calculated_price?.calculated_amount;
  return typeof amount === "number" && Number.isFinite(amount) ? amount : null;
};
const brandOf = (p: CatalogueProduct) =>
  typeof p.metadata?.brand === "string" ? p.metadata.brand : "";
const flag = (value: unknown) => value === true;

export function queryCatalogue(
  products: CatalogueProduct[],
  categories: CatalogueCategory[],
  filters: CatalogueFilters,
) {
  const category = filters.category
    ? categories.find((c) => c.handle === filters.category)
    : undefined;
  const ids = new Set(category ? [category.id] : []);
  // A visited set handles arbitrary depth and protects against malformed cycles.
  for (let changed = true; changed;) {
    changed = false;
    for (const child of categories) {
      if (
        child.parent_category_id &&
        ids.has(child.parent_category_id) &&
        !ids.has(child.id)
      ) {
        ids.add(child.id);
        changed = true;
      }
    }
  }
  const terms = (filters.q ?? "")
    .toLocaleLowerCase("en-IN")
    .split(/\s+/)
    .filter(Boolean);
  const scoped = products.filter((p) => {
    if (
      filters.category &&
      (!category || !p.categories?.some((c) => ids.has(c.id)))
    )
      return false;
    const text = [
      p.title,
      p.subtitle,
      brandOf(p),
      ...(p.categories ?? []).map((c) => c.name),
    ]
      .join(" ")
      .toLocaleLowerCase("en-IN");
    return terms.every((term) => text.includes(term));
  });
  const facets = {
    brands: [...new Set(scoped.map(brandOf).filter(Boolean))].sort(),
    packs: [
      ...new Set(scoped.flatMap((p) => (p.variants ?? []).map((v) => v.title))),
    ].sort((a, b) => a.localeCompare(b, "en", { numeric: true })),
  };
  const hasVariantFilter = !!(
    filters.pack?.length ||
    filters.min !== undefined ||
    filters.max !== undefined ||
    filters.availability
  );
  const matches = scoped.flatMap((p) => {
    if (filters.brand?.length && !filters.brand.includes(brandOf(p))) return [];
    // All variant conditions must hold on THE SAME pack, not different variants.
    const variants = (p.variants ?? []).filter((v) => {
      if (filters.pack?.length && !filters.pack.includes(v.title)) return false;
      const amount = price(v);
      if (
        filters.min !== undefined &&
        (amount === null || amount < filters.min)
      )
        return false;
      if (
        filters.max !== undefined &&
        (amount === null || amount > filters.max)
      )
        return false;
      if (filters.availability && variantStock(v) !== filters.availability)
        return false;
      return true;
    });
    if (hasVariantFilter && !variants.length) return [];
    return [{ ...p, variants: hasVariantFilter ? variants : p.variants }];
  });
  const minimum = (p: CatalogueProduct) => {
    const prices = (p.variants ?? [])
      .map(price)
      .filter((n): n is number => n !== null);
    return prices.length ? Math.min(...prices) : null;
  };
  matches.sort((a, b) => {
    let order = 0;
    if (filters.sort === "price-asc" || filters.sort === "price-desc") {
      const left = minimum(a),
        right = minimum(b);
      order =
        left === null
          ? right === null
            ? 0
            : 1
          : right === null
            ? -1
            : (left - right) * (filters.sort === "price-desc" ? -1 : 1);
    } else if (filters.sort === "newest") {
      order =
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime();
    } else if (filters.sort !== "name") {
      const rank = (p: CatalogueProduct) =>
        Number(flag(p.metadata?.featured)) * 2 +
        Number(flag(p.metadata?.popular));
      order = rank(b) - rank(a);
    }
    return (
      order ||
      a.title.localeCompare(b.title, "en-IN") ||
      a.id.localeCompare(b.id)
    );
  });
  const count = matches.length;
  const page = Math.min(
    filters.page,
    Math.max(1, Math.ceil(count / filters.limit)),
  );
  return {
    products: matches.slice((page - 1) * filters.limit, page * filters.limit),
    categories,
    category: category ?? null,
    facets,
    count,
    page,
    limit: filters.limit,
  };
}
