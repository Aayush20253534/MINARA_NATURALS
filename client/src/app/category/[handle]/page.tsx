import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/commerce/product-card";
import { getCategoryWithProducts } from "@/lib/catalog";
import styles from "../../catalogue-pages.module.css";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { category, products } = await getCategoryWithProducts(handle);
  if (!category) notFound();

  return (
    <>
      <section className={styles.pageHero}>
        <Container className={styles.pageHeroInner}>
          <div>
            <p className="eyebrow">Shop by category</p>
            <h1>{category.name}</h1>
          </div>
          <p>
            Browse available products and pack sizes across this MINARA category.
          </p>
        </Container>
      </section>
      <section className={styles.catalogue}>
        <Container>
          <div className={styles.catalogueBar}>
            <strong>{products.length} products</strong>
            <span>{category.category_children?.length ?? 0} collections</span>
          </div>
          {products.length ? (
            <div className={styles.grid}>
              {products.map((product) => <ProductCard product={product} key={product.id} />)}
            </div>
          ) : (
            <div className={styles.empty}>
              <div><strong>No products are published here yet.</strong><span>Explore another MINARA category.</span></div>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
