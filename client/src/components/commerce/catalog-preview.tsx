import Image from "next/image";
import { Container } from "@/components/layout/container";
import { ArrowIcon, LeafIcon } from "@/components/ui/icons";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import styles from "./catalog-preview.module.css";

const categoryCopy: Record<string, { note: string; tone: string }> = {
  "fresh-produce": { note: "Fruit & vegetables", tone: "fresh" },
  groceries: { note: "Everyday pantry", tone: "grain" },
  spices: { note: "Kitchen essentials", tone: "spice" },
  "minara-pickles": { note: "Signature range", tone: "pickle" },
  "pooja-samagri": { note: "Ritual essentials", tone: "pooja" },
  "household-personal-care": { note: "Daily-use essentials", tone: "home" },
};

function formatPrice(product: CatalogProduct) {
  const prices = (product.variants ?? [])
    .map((variant) => variant.calculated_price?.calculated_amount)
    .filter((amount): amount is number => typeof amount === "number");

  if (!prices.length) return null;
  const amount = Math.min(...prices);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

  return prices.length > 1 ? `From ${formatted}` : formatted;
}

function getStockState(product: CatalogProduct) {
  const quantities = (product.variants ?? [])
    .map((variant) => variant.inventory_quantity)
    .filter((quantity): quantity is number => typeof quantity === "number");

  if (!quantities.length)
    return { label: "Stock tracked", state: "neutral" as const };
  if (quantities.every((quantity) => quantity <= 0)) {
    return { label: "Out of stock", state: "out" as const };
  }
  if (quantities.some((quantity) => quantity > 0 && quantity <= 5)) {
    return { label: "Limited stock", state: "low" as const };
  }
  return { label: "In stock", state: "in" as const };
}

function CategoryCard({
  category,
  index,
}: {
  category: CatalogCategory;
  index: number;
}) {
  const presentation = categoryCopy[category.handle] ?? {
    note: `${category.category_children?.length ?? 0} collections`,
    tone: "fresh",
  };

  return (
    <article
      className={`${styles.categoryCard} ${styles[`tone_${presentation.tone}`]}`}
    >
      <div className={styles.categoryTopline}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span>{category.category_children?.length ?? 0} collections</span>
      </div>
      <div className={styles.categoryArtwork} aria-hidden="true">
        <span className={styles.categoryOrb} />
        <span className={styles.categoryLeaf} />
      </div>
      <div className={styles.categoryCopy}>
        <span>{presentation.note}</span>
        <h3>{category.name}</h3>
        <div className={styles.categoryAction}>
          Explore assortment <ArrowIcon width={15} height={15} />
        </div>
      </div>
    </article>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const metadata = product.metadata ?? {};
  const price = formatPrice(product);
  const stock = getStockState(product);
  const productImage = product.thumbnail || product.images?.[0]?.url || null;
  const category = product.categories?.[0]?.name ?? "MINARA catalogue";
  const brand =
    typeof metadata.brand === "string" ? metadata.brand : "MINARA NATURALS";
  const badge = typeof metadata.badge === "string" ? metadata.badge : null;
  const packs = [
    ...new Set((product.variants ?? []).map((variant) => variant.title)),
  ].slice(0, 3);

  return (
    <article className={styles.productCard}>
      <div className={styles.productVisual}>
        {productImage ? (
          <Image
            src={productImage}
            alt={product.title}
            fill
            sizes="(max-width: 700px) 86vw, (max-width: 1100px) 42vw, 280px"
            className={styles.productImage}
          />
        ) : (
          <div className={styles.productPlaceholder} aria-hidden="true">
            <span className={styles.placeholderHalo} />
            <span className={styles.placeholderLeaf}>
              <LeafIcon width={34} height={34} />
            </span>
            <strong>MINARA</strong>
            <small>{category}</small>
          </div>
        )}
        {badge && <span className={styles.productBadge}>{badge}</span>}
        <span
          className={`${styles.stockBadge} ${styles[`stock_${stock.state}`]}`}
        >
          {stock.label}
        </span>
      </div>

      <div className={styles.productBody}>
        <div className={styles.productMeta}>
          <span>{brand}</span>
          <span>{category}</span>
        </div>
        <h3>{product.title}</h3>
        {product.subtitle && <p>{product.subtitle}</p>}

        <div className={styles.packRow} aria-label="Available pack sizes">
          {packs.map((pack) => (
            <span key={pack}>{pack}</span>
          ))}
        </div>

        <div className={styles.productFooter}>
          <div>
            <small>Starting at</small>
            <strong>{price ?? "Price configured"}</strong>
          </div>
          <span className={styles.detailsCue} aria-hidden="true">
            <ArrowIcon width={17} height={17} />
          </span>
        </div>
      </div>
    </article>
  );
}

export function CatalogPreview({
  categories,
  products,
  connected,
}: {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  connected: boolean;
}) {
  return (
    <section className={styles.catalogSection} id="categories">
      <Container>
        <div className={styles.headingRow}>
          <div>
            <p className="eyebrow">Shop by category</p>
            <h2>
              Everything your home reaches for, in one thoughtful catalogue.
            </h2>
          </div>
          <p>
            MINARA is structured for fresh food, pantry staples, signature
            products, pooja essentials and daily-care categories without making
            the storefront feel crowded.
          </p>
        </div>

        {categories.length ? (
          <div className={styles.categoryGrid}>
            {categories.map((category, index) => (
              <CategoryCard
                category={category}
                index={index}
                key={category.id}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <LeafIcon width={24} height={24} />
            <div>
              <strong>Catalogue categories are being prepared.</strong>
              <span>
                {connected
                  ? "No root categories are published yet."
                  : "The commerce API is temporarily unavailable."}
              </span>
            </div>
          </div>
        )}

        <div className={styles.productsHeading}>
          <div>
            <p className="eyebrow">Featured assortment</p>
            <h2>Commerce-ready products, not decorative placeholders.</h2>
          </div>
          <div className={styles.dataPill}>
            <span /> Live Medusa catalogue
          </div>
        </div>

        {products.length ? (
          <div className={styles.productGrid}>
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <LeafIcon width={24} height={24} />
            <div>
              <strong>No representative products are available yet.</strong>
              <span>
                Run the Phase 1.1 seed to populate the commerce catalogue.
              </span>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
