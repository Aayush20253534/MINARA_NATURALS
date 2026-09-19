import { WishlistButton } from "@/components/commerce/account-client";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { ProductPurchase } from "@/components/commerce/product-purchase";
import { ProductCard } from "@/components/commerce/product-card";
import {
  catalogProductImage,
  getCatalogue,
  getProductByHandle,
} from "@/lib/catalog";
import {
  publicDescription,
  variantAvailability,
  variantPrice,
} from "@/lib/commerce";
import { siteUrl } from "@/lib/site";
import styles from "@/components/commerce/product-detail.module.css";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ handle: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  try {
    const product = await getProductByHandle(handle);
    if (!product)
      return { title: "Product not found", robots: { index: false } };
    const image = catalogProductImage(product);
    const description =
      publicDescription(product) ??
      `Explore ${product.title}, available pack sizes, prices and product information at MINARA NATURALS.`;
    return {
      title: product.title,
      description,
      alternates: { canonical: `/product/${encodeURIComponent(handle)}` },
      openGraph: {
        title: product.title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return { title: "MINARA product", robots: { index: false } };
  }
}
export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();
  const category = product.categories?.[0];
  const metadata = product.metadata ?? {};
  const brand =
    typeof metadata.brand === "string" && metadata.brand !== "Catalogue Sample"
      ? metadata.brand
      : null;
  const images = [
    ...new Set(
      [
        product.thumbnail,
        ...(product.images ?? []).map((image) => image.url),
      ].flatMap((src) => {
        const valid = catalogProductImage({
          ...product,
          thumbnail: src,
          images: [],
        });
        return valid ? [valid] : [];
      }),
    ),
  ].slice(0, 12);
  const details = [
    ["Ingredients", metadata.ingredients],
    ["Shelf life", metadata.shelf_life],
    ["Storage", metadata.storage],
    ["Origin", metadata.origin],
  ].filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim().length > 0,
  );
  const description = publicDescription(product);
  const variants = product.variants ?? [];
  // Explicit MRP data is pack/SKU-specific and denominated in INR; never invent it from a sale price.
  const rawMrp = metadata.mrp_by_sku;
  const mrpBySku = Object.fromEntries(
    variants.flatMap((variant) => {
      const value =
        rawMrp && typeof rawMrp === "object" && variant.sku
          ? (rawMrp as Record<string, unknown>)[variant.sku]
          : null;
      return variant.sku &&
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0
        ? [[variant.sku, value]]
        : [];
    }),
  );
  const url = new URL(
    `/product/${encodeURIComponent(handle)}`,
    siteUrl(),
  ).toString();
  const offers = variants.flatMap((variant) => {
    const price = variantPrice(variant);
    const stock = variantAvailability(variant);
    return price === null || stock.state === "unknown"
      ? []
      : [
          {
            "@type": "Offer",
            url: `${url}?variant=${encodeURIComponent(variant.id)}`,
            name: variant.title,
            ...(variant.sku ? { sku: variant.sku } : {}),
            price,
            priceCurrency: "INR",
            availability: `https://schema.org/${stock.state === "in" ? (variant.allow_backorder ? "BackOrder" : "InStock") : "OutOfStock"}`,
          },
        ];
  });
  const structured = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url,
    ...(description ? { description } : {}),
    ...(images.length
      ? { image: images.map((image) => new URL(image, siteUrl()).toString()) }
      : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(category ? { category: category.name } : {}),
    ...(offers.length ? { offers } : {}),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
        }}
      />
      <section className={styles.page}>
        <Container>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/shop">Shop</Link>
            {category && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/category/${encodeURIComponent(category.handle)}`}>
                  {category.name}
                </Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.title}</span>
          </nav>
          <div className={styles.productGrid}>
            <ProductGallery images={images} title={product.title} />
            <div className={styles.info}>
              <div className={styles.productEyebrow}>
                {brand ?? category?.name ?? "The MINARA collection"}
                {metadata.minara_owned === true && (
                  <span>MINARA selection</span>
                )}
              </div>
              <h1>{product.title}</h1>
              {product.subtitle && (
                <p className={styles.subtitle}>{product.subtitle}</p>
              )}
              <ProductPurchase
                variants={variants.map((variant) => ({
                  id: variant.id,
                  title: variant.title,
                  sku: variant.sku,
                  manage_inventory: variant.manage_inventory,
                  allow_backorder: variant.allow_backorder,
                  inventory_quantity: variant.inventory_quantity,
                  calculated_price: variant.calculated_price,
                }))}
                mrpBySku={mrpBySku}
              />
              {description && (
                <div className={styles.description}>
                  <h2>A little about this product</h2>
                  <p>{description}</p>
                </div>
              )}
              {details.length > 0 && (
                <div className={styles.details}>
                  {details.map(([label, value]) => (
                    <details key={label} open={label === "Ingredients"}>
                      <summary>
                        {label}
                        <span aria-hidden="true">+</span>
                      </summary>
                      <p>{value}</p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
      <Suspense fallback={null}>
        <RelatedProducts productId={product.id} categoryId={category?.id} />
      </Suspense>
              <WishlistButton productId={product.id} />
    </>
  );
}

async function RelatedProducts({
  productId,
  categoryId,
}: {
  productId: string;
  categoryId?: string;
}) {
  let related: Awaited<ReturnType<typeof getCatalogue>>["products"] = [];
  try {
    const navigation = await getCatalogue(new URLSearchParams({ limit: "1" }));
    const selectedCategory = navigation.categories.find(
      (c) => c.id === categoryId,
    );
    const parent = navigation.categories.find(
      (c) => c.id === selectedCategory?.parent_category_id,
    );
    const query = new URLSearchParams({ limit: "5" });
    if (parent || selectedCategory)
      query.set("category", (parent ?? selectedCategory)!.handle);
    related = (await getCatalogue(query)).products
      .filter((p) => p.id !== productId)
      .slice(0, 4);
  } catch {
    /* Product purchase remains available if related merchandising cannot load. */
  }
  return (
    <>
      {related.length > 0 && (
        <section className={styles.related}>
          <Container>
            <div className={styles.relatedHeading}>
              <div>
                <p className="eyebrow">More to make room for</p>
                <h2>You might like these, too.</h2>
              </div>
              <Link href="/shop">Explore the shop ↗</Link>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
