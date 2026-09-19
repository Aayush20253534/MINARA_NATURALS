import type {
  MedusaStoreRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import type { ICachingModuleService } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
  QueryContext,
  getVariantAvailability,
} from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  queryCatalogue,
  type CatalogueCategory,
  type CatalogueProduct,
  type CatalogueVariant,
} from "../../../../utils/catalogue";

const multi = z
  .union([z.string().max(100), z.array(z.string().max(100)).max(30)])
  .transform((v) => (Array.isArray(v) ? v : [v]))
  .optional();
export const CatalogueQuery = z
  .object({
    q: z.string().trim().max(120).optional(),
    category: z.string().max(120).optional(),
    brand: multi,
    pack: multi,
    min: z.coerce.number().min(0).max(10000000).optional(),
    max: z.coerce.number().min(0).max(10000000).optional(),
    availability: z.enum(["in", "out"]).optional(),
    sort: z
      .enum(["featured", "price-asc", "price-desc", "newest", "name"])
      .default("featured"),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
  })
  .strict()
  .refine((q) => q.min === undefined || q.max === undefined || q.min <= q.max, {
    message: "Minimum price must not exceed maximum price",
  });

type Snapshot = {
  products: CatalogueProduct[];
  categories: CatalogueCategory[];
};
const inFlight = new Map<string, Promise<Snapshot>>();
const PUBLIC_METADATA = [
  "brand",
  "featured",
  "popular",
  "minara_owned",
  "badge",
];

/**
 * Guest/India browse projection, cached in the existing shared Medusa cache.
 * Calculated prices and channel-aware inventory come from Medusa, never raw price tables.
 * A single cached projection avoids re-reading inventory for each filter combination.
 * No gallery, private metadata, or complete catalogue is sent to the browser.
 */
export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const parsed = CatalogueQuery.safeParse(req.query);
  if (!parsed.success)
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid catalogue filters",
    );
  const channels = req.publishable_key_context?.sales_channel_ids ?? [];
  if (channels.length !== 1)
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Catalogue requires a publishable key assigned to one sales channel",
    );
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const cache = req.scope.resolve<ICachingModuleService>(Modules.CACHING, {
    allowUnregistered: true,
  });
  const key = `minara:catalogue:v1:${channels[0]}:inr:guest`;
  let snapshot = (await cache?.get({ key })) as Snapshot | null;
  if (!snapshot) {
    let pending = inFlight.get(key);
    if (!pending) {
      pending = (async () => {
        const { data: regions } = await query.graph({
          entity: "region",
          fields: ["id", "currency_code", "countries.iso_2"],
        });
        const region = regions.find(
          (r) =>
            r.currency_code === "inr" &&
            r.countries?.some((c) => c?.iso_2 === "in"),
        );
        if (!region)
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "An INR region including India is required",
          );
        const categories: CatalogueCategory[] = [];
        for (let skip = 0; ; skip += 200) {
          const { data } = await query.graph({
            entity: "product_category",
            fields: ["id", "name", "handle", "parent_category_id"],
            filters: { is_active: true, is_internal: false },
            pagination: { skip, take: 200, order: { rank: "ASC", id: "ASC" } },
          });
          categories.push(...data);
          if (data.length < 200) break;
        }
        const publicCategoryIds = new Set(categories.map((c) => c.id));
        const products: CatalogueProduct[] = [];
        // Iterate the channel link, not all products: draft/unassigned products never escape.
        for (let skip = 0; ; skip += 100) {
          const { data: links } = await query.graph({
            entity: "product_sales_channel",
            fields: ["product_id"],
            filters: { sales_channel_id: channels[0] },
            pagination: { skip, take: 100, order: { product_id: "ASC" } },
          });
          if (!links.length) break;
          const { data: batch } = await query.graph({
            entity: "product",
            fields: [
              "id",
              "title",
              "handle",
              "subtitle",
              "thumbnail",
              "created_at",
              "metadata",
              "images.url",
              "categories.id",
              "categories.name",
              "categories.handle",
              "variants.id",
              "variants.title",
              "variants.manage_inventory",
              "variants.allow_backorder",
              "variants.calculated_price.*",
            ],
            filters: {
              id: links.map((l) => l.product_id),
              status: ProductStatus.PUBLISHED,
            },
            pagination: { take: links.length },
            context: {
              variants: {
                calculated_price: QueryContext({
                  region_id: region.id,
                  currency_code: "inr",
                }),
              },
            },
          });
          const variants = batch.flatMap((p) => p.variants ?? []);
          const availability = variants.length
            ? await getVariantAvailability(query, {
                variant_ids: variants.map((v) => v.id),
                sales_channel_id: channels[0],
              })
            : {};
          for (const product of batch) {
            products.push({
              id: product.id,
              title: product.title,
              handle: product.handle!,
              subtitle: product.subtitle,
              thumbnail: product.thumbnail || product.images?.[0]?.url,
              created_at: product.created_at,
              categories: product.categories?.flatMap((c) =>
                c && publicCategoryIds.has(c.id)
                  ? [{ id: c.id, name: c.name, handle: c.handle }]
                  : [],
              ),
              metadata: Object.fromEntries(
                PUBLIC_METADATA.filter(
                  (k) => product.metadata?.[k] !== undefined,
                ).map((k) => [k, product.metadata![k]]),
              ),
              variants: (
                product.variants as CatalogueVariant[] | undefined
              )?.map((v) => ({
                id: v.id,
                title: v.title!,
                manage_inventory: v.manage_inventory,
                allow_backorder: v.allow_backorder,
                inventory_quantity: v.manage_inventory
                  ? (availability[v.id]?.availability ?? null)
                  : null,
                calculated_price: v.calculated_price
                  ? {
                      calculated_amount:
                        v.calculated_price.calculated_amount == null
                          ? null
                          : Number(v.calculated_price.calculated_amount),
                      currency_code: v.calculated_price.currency_code,
                    }
                  : null,
              })),
            });
          }
          if (links.length < 100) break;
        }
        const result = { products, categories };
        // A disposable read cache is not a commerce mutation and needs no workflow rollback.
        // eslint-disable-next-line @medusajs/no-service-mutations-in-api-route
        await cache?.set({
          key,
          data: result,
          ttl: 30,
          tags: [
            "Product:list:*",
            "ProductVariant:list:*",
            "ProductCategory:list:*",
            "Price:list:*",
            "InventoryLevel:list:*",
            "ReservationItem:list:*",
          ],
          options: { autoInvalidate: true },
        });
        return result;
      })();
      inFlight.set(key, pending);
    }
    try {
      snapshot = await pending;
    } finally {
      if (inFlight.get(key) === pending) inFlight.delete(key);
    }
  }
  res.setHeader("Cache-Control", "no-store");
  res.json(queryCatalogue(snapshot.products, snapshot.categories, parsed.data));
}
