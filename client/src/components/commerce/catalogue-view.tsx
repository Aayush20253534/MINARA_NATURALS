import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { SearchIcon, ArrowIcon } from "@/components/ui/icons";
import {
  catalogueHref,
  catalogueParams,
  type SearchParams,
} from "@/lib/catalogue-query";
import { getCatalogue } from "@/lib/catalog";
import { ProductCard } from "./product-card";
import { CatalogueFilters, CatalogueSort } from "./catalogue-controls";
import { CategoryGlyph } from "./category-glyph";
import styles from "./catalogue.module.css";
export async function CatalogueView({
  path,
  handle,
  searchParams,
  search = false,
}: {
  path: string;
  handle?: string;
  searchParams: SearchParams;
  search?: boolean;
}) {
  const params = catalogueParams(searchParams);
  const request = new URLSearchParams(params);
  if (handle) request.set("category", handle);
  const result = await getCatalogue(request);
  if (handle && !result.category) notFound();
  if (Number(params.get("page") ?? 1) !== result.page) {
    const canonical = new URLSearchParams(params);
    if (result.page > 1) canonical.set("page", String(result.page));
    else canonical.delete("page");
    redirect(catalogueHref(path, canonical));
  }
  const category = result.category;
  const query = params.get("q");
  const title = query
    ? `Results for “${query}”`
    : (category?.name ??
      (search ? "Find your next favourite." : "Good things for every day."));
  const description = query
    ? "A little search. Something good to discover."
    : category
      ? "Explore the collection and find the right pack for your home."
      : "Fresh favourites, pantry staples and little essentials. All in one place.";
  const roots = result.categories.filter((c) => !c.parent_category_id);
  const children = category
    ? result.categories.filter((c) => c.parent_category_id === category.id)
    : [];
  const parent = result.categories.find(
    (c) => c.id === category?.parent_category_id,
  );
  const chips = [...params].filter(([key]) => !["sort", "page"].includes(key));
  const clear = new URLSearchParams();
  if (query) clear.set("q", query);
  const pages = Math.max(1, Math.ceil(result.count / result.limit));
  function pageLink(page: number) {
    const next = new URLSearchParams(params);
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    return catalogueHref(path, next);
  }
  function categoryLink(nextPath: string) {
    const next = new URLSearchParams(params);
    next.delete("page");
    return catalogueHref(nextPath, next);
  }
  return (
    <>
      <section className={styles.hero} data-category={category?.handle}>
        <Container>
          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            {category || search ? (
              <>
                <Link href="/shop">Shop</Link>
                <span aria-hidden="true">/</span>
              </>
            ) : null}
            {parent && (
              <>
                <Link href={`/category/${parent.handle}`}>{parent.name}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span aria-current="page">
              {category?.name ?? (search ? "Search" : "All products")}
            </span>
          </nav>
          <div className={styles.heroHeading}>
            <div>
              <p className="eyebrow">
                {category ? "The MINARA collections" : "Your everyday shop"}
              </p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {category && (
              <CategoryGlyph
                handle={parent?.handle ?? category.handle}
                width={65}
                height={80}
              />
            )}
          </div>
          {search && (
            <form
              className={styles.searchForm}
              action="/search"
              method="get"
              role="search"
            >
              <label className="sr-only" htmlFor="results-search">
                Search the catalogue
              </label>
              <SearchIcon />
              <input
                id="results-search"
                type="search"
                name="q"
                maxLength={120}
                placeholder="What’s on your list?"
                defaultValue={query ?? ""}
              />
              <button type="submit">
                Search <ArrowIcon width={16} height={16} />
              </button>
            </form>
          )}
          {children.length > 0 && (
            <nav className={styles.subcategories} aria-label="Subcategories">
              {children.map((c) => (
                <Link key={c.id} href={categoryLink(`/category/${c.handle}`)}>
                  {c.name} <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </nav>
          )}
        </Container>
      </section>
      <section className={styles.section}>
        <Container>
          <nav className={styles.categories} aria-label="Browse categories">
            <Link
              href={categoryLink("/shop")}
              aria-current={!category ? "page" : undefined}
            >
              All products
            </Link>
            {roots.map((c) => (
              <Link
                key={c.id}
                href={categoryLink(`/category/${c.handle}`)}
                aria-current={
                  c.id === category?.id || c.id === parent?.id
                    ? "page"
                    : undefined
                }
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <CatalogueFilters
                path={path}
                query={params.toString()}
                facets={result.facets}
              />
            </aside>
            <div className={styles.results}>
              <div className={styles.toolbar}>
                <p role="status" aria-live="polite">
                  <strong>{result.count}</strong>{" "}
                  {result.count === 1 ? "product" : "products"}
                  {result.count > result.limit && (
                    <span>
                      {" "}
                      · {(result.page - 1) * result.limit + 1}–
                      {Math.min(result.page * result.limit, result.count)} shown
                    </span>
                  )}
                </p>
                <CatalogueSort path={path} query={params.toString()} />
              </div>
              {chips.length > 0 && (
                <div className={styles.chips} aria-label="Applied filters">
                  {chips.map(([key, value], index) => {
                    const next = new URLSearchParams(params);
                    next.delete(key, value);
                    next.delete("page");
                    const label =
                      key === "min"
                        ? `From ₹${value}`
                        : key === "max"
                          ? `Up to ₹${value}`
                          : key === "availability"
                            ? value === "in"
                              ? "In stock"
                              : "Out of stock"
                            : key === "q"
                              ? `“${value}”`
                              : value;
                    return (
                      <Link
                        href={catalogueHref(path, next)}
                        className={styles.chip}
                        aria-label={`Remove ${label}`}
                        key={`${key}-${index}`}
                      >
                        {label}
                        <span aria-hidden="true">×</span>
                      </Link>
                    );
                  })}
                  <Link className={styles.clear} href={path}>
                    Clear all
                  </Link>
                </div>
              )}
              {result.products.length > 0 ? (
                <div className={styles.grid}>
                  {result.products.map((p, i) => (
                    <ProductCard key={p.id} product={p} priority={i < 3} />
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  <SearchIcon width={30} height={30} />
                  <h2>
                    {chips.length
                      ? "No matches just yet."
                      : "Something good is on its way."}
                  </h2>
                  <p>
                    {chips.length
                      ? "Try a different search, a wider price range or fewer filters."
                      : "There are no products in this collection yet. Explore the rest of the shop."}
                  </p>
                  <Link
                    className="link-button link-button--primary"
                    href={chips.length ? catalogueHref(path, clear) : "/shop"}
                  >
                    {chips.length ? "Reset filters" : "Browse all products"}
                    <ArrowIcon width={17} height={17} />
                  </Link>
                  {query && (
                    <Link className={styles.clear} href={path}>
                      Clear search
                    </Link>
                  )}
                </div>
              )}
              {pages > 1 && (
                <nav className={styles.pagination} aria-label="Product pages">
                  {result.page > 1 ? (
                    <Link href={pageLink(result.page - 1)} rel="prev">
                      ← Previous
                    </Link>
                  ) : (
                    <span aria-disabled="true">← Previous</span>
                  )}
                  <div>
                    {Array.from(
                      new Set([
                        1,
                        result.page - 1,
                        result.page,
                        result.page + 1,
                        pages,
                      ]),
                    )
                      .filter((n) => n > 0 && n <= pages)
                      .sort((a, b) => a - b)
                      .map((n, i, all) => (
                        <span key={n}>
                          {i > 0 && n - all[i - 1] > 1 ? (
                            <span className={styles.ellipsis}>…</span>
                          ) : null}
                          <Link
                            href={pageLink(n)}
                            aria-label={`Page ${n}`}
                            aria-current={
                              n === result.page ? "page" : undefined
                            }
                          >
                            {n}
                          </Link>
                        </span>
                      ))}
                  </div>
                  {result.page < pages ? (
                    <Link href={pageLink(result.page + 1)} rel="next">
                      Next →
                    </Link>
                  ) : (
                    <span aria-disabled="true">Next →</span>
                  )}
                </nav>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
