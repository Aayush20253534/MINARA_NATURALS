import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";
import {
  catalogProductImage,
  formatCatalogPrice,
  getCatalogStockState,
  type CatalogProduct,
} from "@/lib/catalog";
import { ProductImage } from "./product-image";
import styles from "./product-card.module.css";
export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const stock = getCatalogStockState(product);
  const packs = [...new Set((product.variants ?? []).map((v) => v.title))];
  const brand =
    typeof product.metadata?.brand === "string" &&
    product.metadata.brand !== "Catalogue Sample"
      ? product.metadata.brand
      : product.categories?.[0]?.name;
  return (
    <Link
      className={styles.card}
      href={`/product/${encodeURIComponent(product.handle)}`}
    >
      <div className={styles.visual}>
        <ProductImage
          src={catalogProductImage(product)}
          alt={product.title}
          priority={priority}
        />
        {product.metadata?.minara_owned === true && (
          <span className={styles.badge}>MINARA selection</span>
        )}
        {stock.state === "out" && (
          <span className={styles.stock}>Out of stock</span>
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.brand}>{brand ?? "Everyday essentials"}</p>
        <h3>{product.title}</h3>
        <p className={styles.packs}>
          {packs.slice(0, 3).join(" · ") || "See product details"}
          {packs.length > 3 ? ` +${packs.length - 3}` : ""}
        </p>
        <div className={styles.footer}>
          <strong>{formatCatalogPrice(product) ?? "Price unavailable"}</strong>
          <span className={styles.arrow} aria-hidden="true">
            <ArrowIcon width={17} height={17} />
          </span>
        </div>
        <span className={styles.view}>
          View product <span aria-hidden="true">↗</span>
        </span>
      </div>
    </Link>
  );
}
