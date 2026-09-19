import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ArrowIcon, LeafIcon } from "@/components/ui/icons";
import {
  catalogProductImage,
  formatCatalogPrice,
  getCatalogStockState,
  getProductByHandle,
} from "@/lib/catalog";
import styles from "../../catalogue-pages.module.css";

export const dynamic = "force-dynamic";

function textMetadata(value: string | number | boolean | null | undefined) {
  return typeof value === "string" && value.trim() ? value : null;
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const image = catalogProductImage(product);
  const price = formatCatalogPrice(product);
  const stock = getCatalogStockState(product);
  const category = product.categories?.[0];
  const metadata = product.metadata ?? {};
  const rawDetails: Array<[string, string | null]> = [
    ["Ingredients", textMetadata(metadata.ingredients)],
    ["Shelf life", textMetadata(metadata.shelf_life)],
    ["Storage", textMetadata(metadata.storage)],
    ["Origin", textMetadata(metadata.origin)],
  ];
  const details = rawDetails.filter((item): item is [string, string] => item[1] !== null);
  const description = product.description && !/representative|used to validate|development/i.test(product.description)
    ? product.description
    : "Available pack sizes, pricing and product details are shown below.";

  return (
    <section className={styles.productPage}>
      <Container>
        <div className={styles.breadcrumbs}>
          <Link href="/shop">Shop</Link><span>/</span>
          {category ? <><Link href={`/category/${category.handle}`}>{category.name}</Link><span>/</span></> : null}
          <span>{product.title}</span>
        </div>
        <div className={styles.productGrid}>
          <div className={styles.productMedia}>
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 980px) 92vw, 600px"
                className={styles.productImage}
              />
            ) : (
              <div className={styles.productFallback}><LeafIcon width={50} height={50} /></div>
            )}
          </div>
          <div className={styles.productInfo}>
            <p className={styles.productCategory}>{category?.name ?? "MINARA NATURALS"}</p>
            <h1>{product.title}</h1>
            {product.subtitle && <p className={styles.subtitle}>{product.subtitle}</p>}
            <div className={styles.price}>{price ?? "Price available by variant"}</div>
            <span className={styles.stockLine}>{stock.label}</span>
            <p className={styles.description}>
              {description}
            </p>

            <div className={styles.variantSection}>
              <h2>Available pack sizes</h2>
              <div className={styles.variantGrid}>
                {(product.variants ?? []).map((variant) => (
                  <div className={styles.variantCard} key={variant.id}>
                    <strong>{variant.title}</strong>
                    <span>
                      {typeof variant.calculated_price?.calculated_amount === "number"
                        ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(variant.calculated_price.calculated_amount)
                        : "Price configured"}
                      {variant.sku ? ` · ${variant.sku}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {details.length > 0 && (
              <div className={styles.detailSection}>
                <h2>Product details</h2>
                <div className={styles.detailList}>
                  {details.map(([label, value]) => (
                    <div className={styles.detailRow} key={label}>
                      <span>{label}</span><strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link className={styles.backLink} href="/shop">
              Back to catalogue <ArrowIcon width={15} height={15} />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
