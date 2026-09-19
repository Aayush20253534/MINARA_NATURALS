import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CatalogPreview } from "@/components/commerce/catalog-preview";
import { ProductCard } from "@/components/commerce/product-card";
import { Container } from "@/components/layout/container";
import {
  ArrowIcon,
  GlobeIcon,
  LeafIcon,
  PackageIcon,
  StoreIcon,
} from "@/components/ui/icons";
import { getCatalogPreview } from "@/lib/catalog";
import styles from "./home.module.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "MINARA NATURALS — Good things, every day",
  alternates: { canonical: "/" },
};
export default async function Home() {
  const catalog = await getCatalogPreview();
  const featured = catalog.products
    .filter((p) => p.metadata?.featured === true)
    .slice(0, 4);
  const favourites = featured.length ? featured : catalog.products.slice(0, 4);
  const everyday = catalog.products
    .filter((p) => !favourites.some((f) => f.id === p.id))
    .slice(0, 4);
  return (
    <>
      <section className={styles.hero}>
        <Container>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>
                <span /> The everyday, thoughtfully chosen
              </p>
              <h1>
                Good things.
                <br />
                <em>For your everyday.</em>
              </h1>
              <p className={styles.heroLead}>
                From fresh mornings to flavourful meals. Discover pantry
                favourites, MINARA pickles and little essentials for a home well
                cared for.
              </p>
              <div className={styles.heroActions}>
                <Link className="link-button link-button--primary" href="/shop">
                  Explore the shop <ArrowIcon width={18} height={18} />
                </Link>
                <Link className={styles.quietLink} href="#categories">
                  Find your favourites <span aria-hidden="true">↘</span>
                </Link>
              </div>
              <div className={styles.heroSignature}>
                <LeafIcon width={18} height={18} />
                <span>
                  Freshness <i /> Quality <i /> Trust
                </span>
              </div>
            </div>
            <div className={styles.heroMedia}>
              <Image
                src="/images/minara-market.webp"
                alt="A basket of vegetables, spices and pantry staples on a sunlit kitchen counter"
                fill
                priority
                sizes="(max-width: 800px) 95vw, 55vw"
                className={styles.heroImage}
              />
              <div className={styles.heroCaption}>
                <span>A little fresh. A little familiar.</span>
                <strong>A whole lot of home.</strong>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <CatalogPreview
        categories={catalog.categories}
        products={catalog.products}
        connected={catalog.connected}
      />
      {favourites.length > 0 && (
        <section className={styles.productSection}>
          <Container>
            <div className={styles.sectionHeading}>
              <div>
                <p className="eyebrow">The MINARA selection</p>
                <h2>A taste of something special.</h2>
              </div>
              <Link className={styles.textLink} href="/shop">
                Explore all products <ArrowIcon width={17} height={17} />
              </Link>
            </div>
            <div className={styles.productGrid}>
              {favourites.map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          </Container>
        </section>
      )}
      <section className={styles.pantrySection}>
        <Container>
          <div className={styles.pantry}>
            <div className={styles.pantryCopy}>
              <p className="eyebrow">The pickle collection</p>
              <h2>
                A familiar flavour.
                <br />
                <em>A favourite at every table.</em>
              </h2>
              <p>
                Mango, mixed vegetables or a little tangy lemon. Meet the MINARA
                pickle collection and find your mealtime companion.
              </p>
              <Link
                className="link-button link-button--primary"
                href="/category/minara-pickles"
              >
                Discover MINARA Pickles <ArrowIcon width={18} height={18} />
              </Link>
            </div>
            <div className={styles.pantryType} aria-hidden="true">
              <span>MINARA</span>
              <strong>
                A little
                <br />
                <em>extra</em>
                <br />
                flavour.
              </strong>
              <span>THE PICKLE COLLECTION</span>
            </div>
          </div>
        </Container>
      </section>
      {everyday.length > 0 && (
        <section className={styles.productSection}>
          <Container>
            <div className={styles.sectionHeading}>
              <div>
                <p className="eyebrow">Stock up on the good things</p>
                <h2>Everyday essentials, sorted.</h2>
              </div>
              <Link className={styles.textLink} href="/shop">
                Browse the shop <ArrowIcon width={17} height={17} />
              </Link>
            </div>
            <div className={styles.productGrid}>
              {everyday.map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          </Container>
        </section>
      )}
      <section className={styles.storySection} id="story">
        <Container className={styles.storyGrid}>
          <div>
            <p className="eyebrow">Rooted in the everyday</p>
            <h2>
              From local sources
              <br />
              <em>to your home.</em>
            </h2>
          </div>
          <div className={styles.storyCopy}>
            <p>
              Good food is part of the way we live. The spices in a family
              recipe. A spoonful of pickle with lunch. Fresh ingredients for
              whatever the day brings.
            </p>
            <p>
              MINARA brings these familiar essentials together, with a simple
              idea: make it easier to choose well, every day.
            </p>
            <Link className={styles.textLink} href="/shop">
              Make room for something good <ArrowIcon width={17} height={17} />
            </Link>
          </div>
        </Container>
      </section>
      <section className={styles.valuesSection} aria-label="Our approach">
        <Container className={styles.valuesGrid}>
          {[
            {
              icon: LeafIcon,
              title: "Everyday variety",
              copy: "From fresh produce to pantry favourites, find the essentials for your home.",
            },
            {
              icon: PackageIcon,
              title: "Your pack, your choice",
              copy: "Compare pack sizes and prices to find what fits your household.",
            },
            {
              icon: StoreIcon,
              title: "The MINARA collection",
              copy: "Discover our own range of pickles, spices and everyday essentials.",
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div className={styles.value} key={title}>
              <Icon width={27} height={27} />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>
      <section className={styles.businessSection} id="business">
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">Beyond your kitchen</p>
              <h2>Let’s grow something good.</h2>
            </div>
            <p className={styles.businessLead}>
              Discover the next chapter of MINARA.
            </p>
          </div>
          <div className={styles.businessGrid}>
            {[
              {
                id: "wholesale",
                icon: PackageIcon,
                title: "Bulk & wholesale",
                text: "For retailers, hospitality businesses and distributors looking to stock MINARA.",
              },
              {
                id: "export",
                icon: GlobeIcon,
                title: "From local to global",
                text: "Bringing familiar Indian flavours to new markets and international buyers.",
              },
              {
                id: "franchise",
                icon: StoreIcon,
                title: "Grow with MINARA",
                text: "Explore the vision for neighbourhood stores and MINARA partnerships.",
              },
            ].map(({ id, icon: Icon, title, text }) => (
              <article className={styles.businessCard} key={id} id={id}>
                <Icon width={23} height={23} />
                <h3>{title}</h3>
                <p>{text}</p>
                <span>Enquiries opening soon</span>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
