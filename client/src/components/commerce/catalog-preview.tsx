import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ArrowIcon } from "@/components/ui/icons";
import {
  catalogProductImage,
  type CatalogCategory,
  type CatalogProduct,
} from "@/lib/catalog";
import { CategoryGlyph } from "./category-glyph";
import styles from "./catalog-preview.module.css";
const copy: Record<string, string> = {
  "fresh-produce": "Fresh for your table",
  groceries: "Pantry, well stocked",
  spices: "A little more flavour",
  "minara-pickles": "Meet your mealtime favourites",
  "pooja-samagri": "For your daily rituals",
  "household-personal-care": "Care for every day",
};
export function CatalogPreview({
  categories,
  products,
  connected,
}: {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  connected: boolean;
}) {
  const roots = categories.filter((c) => !c.parent_category_id).slice(0, 6);
  function categoryImage(root: CatalogCategory) {
    const ids = new Set([root.id]);
    for (let changed = true; changed;) {
      changed = false;
      for (const c of categories)
        if (
          c.parent_category_id &&
          ids.has(c.parent_category_id) &&
          !ids.has(c.id)
        ) {
          ids.add(c.id);
          changed = true;
        }
    }
    const product = products.find(
      (p) => p.categories?.some((c) => ids.has(c.id)) && catalogProductImage(p),
    );
    return product ? catalogProductImage(product) : null;
  }
  return (
    <section className={styles.section} id="categories">
      <Container>
        <div className={styles.heading}>
          <div>
            <p className="eyebrow">Find your everyday</p>
            <h2>What’s on your list?</h2>
          </div>
          <Link href="/shop">
            Browse everything <ArrowIcon width={17} height={17} />
          </Link>
        </div>
        {roots.length ? (
          <div className={styles.grid}>
            {roots.map((category) => {
              const image = categoryImage(category);
              return (
                <Link
                  className={styles.card}
                  href={`/category/${category.handle}`}
                  key={category.id}
                >
                  <div className={styles.art} data-category={category.handle}>
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(max-width: 560px) 42vw, (max-width: 1000px) 28vw, 180px"
                        className={styles.image}
                      />
                    ) : (
                      <CategoryGlyph
                        handle={category.handle}
                        width={54}
                        height={66}
                      />
                    )}
                  </div>
                  <h3>{category.name}</h3>
                  <p>{copy[category.handle] ?? "Explore the collection"}</p>
                  <span className={styles.arrow} aria-hidden="true">
                    ↗
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty} role="status">
            <div>
              <strong>
                {connected
                  ? "Good things are on their way."
                  : "Our shelves are taking a little longer to load."}
              </strong>
              <p>
                {connected
                  ? "Our collection is being prepared. Please check back soon."
                  : "Please try the shop again in a moment."}
              </p>
            </div>
            <Link className="link-button link-button--secondary" href="/shop">
              {connected ? "Visit the shop" : "Try the shop again"}
              <ArrowIcon width={17} height={17} />
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
