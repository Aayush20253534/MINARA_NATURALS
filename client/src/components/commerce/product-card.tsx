import Image from "next/image";
import Link from "next/link";
import { ArrowIcon, LeafIcon } from "@/components/ui/icons";
import {
  catalogProductImage,
  formatCatalogPrice,
  getCatalogStockState,
  type CatalogProduct,
} from "@/lib/catalog";
import styles from "./product-card.module.css";

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const metadata = product.metadata ?? {};
  const image = catalogProductImage(product);
  const price = formatCatalogPrice(product);
  const stock = getCatalogStockState(product);
  const category = product.categories?.[0]?.name ?? "MINARA catalogue";
  const badge = typeof metadata.badge === "string" ? metadata.badge : null;
  const packs = [...new Set((product.variants ?? []).map((variant) => variant.title))].slice(0, 3);

  return (
    <Link className={styles.card} href={`/product/${product.handle}`}>
      <div className={styles.visual}>
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 88vw, (max-width: 980px) 45vw, 280px"
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <LeafIcon width={34} height={34} />
            <strong>MINARA</strong>
          </div>
        )}
        {badge && <span className={styles.badge}>{badge}</span>}
        <span className={`${styles.stock} ${styles[`stock_${stock.state}`]}`}>
          {stock.label}
        </span>
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <span>{category}</span>
          <span>{packs.join(" · ") || "Standard pack"}</span>
        </div>
        <h3>{product.title}</h3>
        <div className={styles.footer}>
          <div>
            <small>Price</small>
            <strong>{price ?? "View product"}</strong>
          </div>
          <span className={styles.arrow} aria-hidden="true">
            <ArrowIcon width={17} height={17} />
          </span>
        </div>
      </div>
    </Link>
  );
}
