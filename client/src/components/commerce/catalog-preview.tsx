import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ArrowIcon, LeafIcon } from "@/components/ui/icons";
import type { CatalogCategory } from "@/lib/catalog";
import styles from "./catalog-preview.module.css";

const categoryCopy: Record<string, { note: string; tone: string }> = {
  "fresh-produce": { note: "Fruit & vegetables", tone: "fresh" },
  groceries: { note: "Everyday pantry", tone: "grain" },
  spices: { note: "Kitchen essentials", tone: "spice" },
  "minara-pickles": { note: "Signature range", tone: "pickle" },
  "pooja-samagri": { note: "Ritual essentials", tone: "pooja" },
  "household-personal-care": { note: "Daily-use essentials", tone: "home" },
};

function CategoryCard({ category, index }: { category: CatalogCategory; index: number }) {
  const presentation = categoryCopy[category.handle] ?? {
    note: `${category.category_children?.length ?? 0} collections`,
    tone: "fresh",
  };

  return (
    <Link
      className={`${styles.categoryCard} ${styles[`tone_${presentation.tone}`]}`}
      href={`/category/${category.handle}`}
      aria-label={`Shop ${category.name}`}
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
    </Link>
  );
}

export function CatalogPreview({
  categories,
  connected,
}: {
  categories: CatalogCategory[];
  connected: boolean;
}) {
  return (
    <section className={styles.catalogSection} id="categories">
      <Container>
        <div className={styles.headingRow}>
          <div>
            <p className="eyebrow">Shop by category</p>
            <h2>Start with what your home needs today.</h2>
          </div>
          <p>
            Fresh produce, pantry staples, MINARA specialities and daily-care
            essentials, organised into a catalogue that stays easy to browse.
          </p>
        </div>

        {categories.length ? (
          <div className={styles.categoryGrid}>
            {categories.map((category, index) => (
              <CategoryCard category={category} index={index} key={category.id} />
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
      </Container>
    </section>
  );
}
