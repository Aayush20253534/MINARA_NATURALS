import Image from "next/image";
import Link from "next/link";
import { CatalogPreview } from "@/components/commerce/catalog-preview";
import { ProductCard } from "@/components/commerce/product-card";
import { Container } from "@/components/layout/container";
import { ArrowIcon, GlobeIcon, LeafIcon, PackageIcon, StoreIcon } from "@/components/ui/icons";
import {
  catalogProductImage,
  formatCatalogPrice,
  getCatalogPreview,
  type CatalogProduct,
} from "@/lib/catalog";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

const business = [
  {
    icon: PackageIcon,
    eyebrow: "Retailers, hospitality & distribution",
    title: "Bulk & Wholesale",
    copy: "A dedicated business path for larger-volume requirements without mixing them into consumer checkout.",
  },
  {
    icon: GlobeIcon,
    eyebrow: "Buyer-led requirements",
    title: "Export",
    copy: "A focused route for destination, volume and product requirement conversations.",
  },
  {
    icon: StoreIcon,
    eyebrow: "Grow with MINARA",
    title: "Franchise Partner",
    copy: "A distinct partner journey for future retail, distribution and MINARA-led franchise opportunities.",
  },
] as const;

const trust = [
  {
    number: "01",
    title: "Freshness-led assortment",
    copy: "Fresh produce, pantry staples and MINARA specialities share one clear retail catalogue.",
  },
  {
    number: "02",
    title: "Pack-aware product information",
    copy: "Pack sizes, prices and availability stay consistent across the catalogue.",
  },
  {
    number: "03",
    title: "Retail and business, clearly separated",
    copy: "Consumer shopping stays focused while wholesale, export and franchise journeys keep their own context.",
  },
] as const;

function uniqueProducts(products: CatalogProduct[], limit: number) {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  }).slice(0, limit);
}

export default async function Home() {
  const catalog = await getCatalogPreview();
  const products = catalog.products;

  const heroProduct =
    products.find((product) => product.handle === "classic-mango-pickle") ?? products[0];
  const supportingProduct =
    products.find((product) => product.handle === "lakadong-turmeric-powder") ?? products[1];
  const storyProduct =
    products.find((product) => product.handle === "farm-fresh-tomatoes") ??
    products.find((product) => product.handle === "banana-value-pack") ??
    products[2];

  const pickleProducts = products.filter((product) =>
    product.categories?.some((category) => category.handle.includes("pickle")),
  );
  const featuredProducts = uniqueProducts(
    [
      ...pickleProducts,
      ...products.filter((product) => Boolean(product.metadata?.featured)),
      ...products,
    ],
    4,
  );
  const popularProducts = uniqueProducts(
    [
      ...products.filter(
        (product) =>
          Boolean(product.metadata?.popular) &&
          !featuredProducts.some((featured) => featured.id === product.id),
      ),
      ...products.filter((product) => !featuredProducts.some((featured) => featured.id === product.id)),
    ],
    4,
  );

  const heroImage = heroProduct ? catalogProductImage(heroProduct) : null;
  const supportingImage = supportingProduct ? catalogProductImage(supportingProduct) : null;
  const storyImage = storyProduct ? catalogProductImage(storyProduct) : null;

  return (
    <>
      <section className={styles.hero}>
        <Container className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>MINARA NATURALS</p>
            <h1>
              Everyday essentials,
              <span>chosen with care.</span>
            </h1>
            <p className={styles.heroLead}>
              Fresh produce, groceries, spices, MINARA pickles, pooja essentials
              and daily-care products brought together in a clean, dependable
              shopping experience.
            </p>
            <div className={styles.heroActions}>
              <Link className="link-button link-button--primary" href="/shop">
                Shop now <ArrowIcon width={17} height={17} />
              </Link>
              <Link className="link-button link-button--secondary" href="#categories">
                Explore categories
              </Link>
            </div>
            <div className={styles.heroProof} aria-label="Catalogue features">
              <span>Live product catalogue</span>
              <span>Pack-size pricing</span>
              <span>Live availability</span>
            </div>
          </div>

          <div className={styles.heroStage} aria-label="Featured MINARA products">
            <div className={styles.heroStageHeader}>
              <span>Featured MINARA</span>
              <span>Freshness · Quality · Trust</span>
            </div>
            <Link
              className={styles.heroPrimary}
              href={heroProduct ? `/product/${heroProduct.handle}` : "/shop"}
            >
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={heroProduct?.title ?? "MINARA product"}
                  fill
                  priority
                  sizes="(max-width: 820px) 92vw, 520px"
                  className={styles.heroProductImage}
                />
              ) : (
                <div className={styles.heroFallback}><LeafIcon width={48} height={48} /></div>
              )}
            </Link>
            <div className={styles.heroStageFooter}>
              <div>
                <small>Signature pick</small>
                <strong>{heroProduct?.title ?? "MINARA assortment"}</strong>
                <span>{heroProduct ? formatCatalogPrice(heroProduct) ?? "View product" : "Explore the catalogue"}</span>
              </div>
              {supportingProduct && supportingImage && (
                <Link className={styles.heroSecondary} href={`/product/${supportingProduct.handle}`}>
                  <Image
                    src={supportingImage}
                    alt={supportingProduct.title}
                    fill
                    sizes="112px"
                    className={styles.heroSecondaryImage}
                  />
                </Link>
              )}
            </div>
          </div>
        </Container>
      </section>

      <CatalogPreview categories={catalog.categories} connected={catalog.connected} />

      <section className={styles.productSection}>
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">MINARA specialities</p>
              <h2>Signature products with the catalogue details that matter.</h2>
            </div>
            <Link href="/category/minara-pickles" className={styles.textLink}>
              Shop MINARA Pickles <ArrowIcon width={16} height={16} />
            </Link>
          </div>
          <div className={styles.productGrid}>
            {featuredProducts.map((product, index) => (
              <ProductCard product={product} priority={index < 2} key={product.id} />
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.trustSection}>
        <Container>
          <div className={styles.trustIntro}>
            <p className="eyebrow">A clearer way to shop</p>
            <h2>Useful information first. Marketing noise second.</h2>
          </div>
          <div className={styles.trustGrid}>
            {trust.map((item) => (
              <article className={styles.trustCard} key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.storySection} id="story">
        <Container className={styles.storyGrid}>
          <div className={styles.storyMedia}>
            {storyImage ? (
              <Image
                src={storyImage}
                alt={storyProduct?.title ?? "MINARA fresh assortment"}
                fill
                sizes="(max-width: 820px) 92vw, 560px"
                className={styles.storyImage}
              />
            ) : (
              <div className={styles.storyFallback}><LeafIcon width={48} height={48} /></div>
            )}
            <div className={styles.storyCaption}>
              <span>From local sources</span>
              <strong>to your home.</strong>
            </div>
          </div>
          <div className={styles.storyCopy}>
            <p className="eyebrow">The MINARA story</p>
            <h2>One thoughtful catalogue for the things families reach for every day.</h2>
            <p>
              MINARA brings fresh produce, pantry essentials and its own speciality
              range into one retail experience. The storefront is designed to keep
              product choice, pack information and availability easy to understand,
              while leaving business requirements to dedicated journeys.
            </p>
            <div className={styles.storyPoints}>
              <div><span>Fresh produce</span><strong>Everyday freshness</strong></div>
              <div><span>MINARA range</span><strong>Signature specialities</strong></div>
              <div><span>Daily essentials</span><strong>One organised catalogue</strong></div>
            </div>
            <Link className={styles.textLink} href="/shop">
              Explore the full catalogue <ArrowIcon width={16} height={16} />
            </Link>
          </div>
        </Container>
      </section>

      <section className={styles.productSectionAlt}>
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">Popular across the catalogue</p>
              <h2>More everyday picks, directly from live product data.</h2>
            </div>
            <Link href="/shop" className={styles.textLink}>
              View all products <ArrowIcon width={16} height={16} />
            </Link>
          </div>
          <div className={styles.productGrid}>
            {popularProducts.map((product) => <ProductCard product={product} key={product.id} />)}
          </div>
        </Container>
      </section>

      <section className={styles.businessSection} id="business">
        <Container>
          <div className={styles.businessHeading}>
            <div>
              <p className="eyebrow">MINARA for business</p>
              <h2>Retail on the front. Dedicated business journeys behind it.</h2>
            </div>
            <p>
              Wholesale, export and franchise requirements are intentionally kept
              separate from normal consumer checkout so each journey can grow without
              making the storefront feel corporate.
            </p>
          </div>
          <div className={styles.businessGrid}>
            {business.map(({ icon: Icon, eyebrow, title, copy }) => (
              <article className={styles.businessCard} key={title}>
                <div className={styles.businessIcon}><Icon width={22} height={22} /></div>
                <p>{eyebrow}</p>
                <h3>{title}</h3>
                <span>{copy}</span>
                <div className={styles.businessStatus}>Dedicated enquiry journey</div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
