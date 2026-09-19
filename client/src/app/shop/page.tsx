import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/commerce/product-card";
import { getCatalogProducts } from "@/lib/catalog";
import styles from "../catalogue-pages.module.css";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const products = await getCatalogProducts();
  const normalized = query.toLowerCase();
  const visibleProducts = normalized
    ? products.filter((product) => {
        const categoryText = product.categories?.map((category) => category.name).join(" ") ?? "";
        const brand = typeof product.metadata?.brand === "string" ? product.metadata.brand : "";
        return `${product.title} ${product.subtitle ?? ""} ${categoryText} ${brand}`
          .toLowerCase()
          .includes(normalized);
      })
    : products;

  return (
    <>
      <section className={styles.pageHero}>
        <Container className={styles.pageHeroInner}>
          <div>
            <p className="eyebrow">MINARA catalogue</p>
            <h1>{query ? `Results for “${query}”` : "Shop everyday essentials."}</h1>
          </div>
          <p>
            Browse fresh produce, pantry staples, MINARA specialities and daily
            essentials in one organised catalogue.
          </p>
        </Container>
      </section>
      <section className={styles.catalogue}>
        <Container>
          <div className={styles.catalogueBar}>
            <strong>{visibleProducts.length} products</strong>
            <span>{query ? "Search result" : "Current assortment"}</span>
          </div>
          {visibleProducts.length ? (
            <div className={styles.grid}>
              {visibleProducts.map((product) => <ProductCard product={product} key={product.id} />)}
            </div>
          ) : (
            <div className={styles.empty}>
              <div><strong>No matching products.</strong><span>Try a broader search term.</span></div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
