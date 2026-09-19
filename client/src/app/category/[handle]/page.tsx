import { CatalogueView } from "@/components/commerce/catalogue-view";
import { getCatalogue } from "@/lib/catalog";
import { catalogueMetadata } from "@/lib/catalogue-metadata";
import { catalogueParams, type SearchParams } from "@/lib/catalogue-query";
export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<SearchParams>;
};
export async function generateMetadata({ params, searchParams }: Props) {
  const [{ handle }, input] = await Promise.all([params, searchParams]);
  const query = catalogueParams(input);
  query.set("category", handle);
  const path = `/category/${encodeURIComponent(handle)}`;
  try {
    const result = await getCatalogue(query);
    return catalogueMetadata(
      path,
      result.category?.name ?? "Collection not found",
      input,
    );
  } catch {
    // Preserve useful document metadata while the page renders its retry state.
    return {
      ...catalogueMetadata(path, "MINARA collection", input),
      robots: { index: false, follow: true },
    };
  }
}
export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ handle }, input] = await Promise.all([params, searchParams]);
  return (
    <CatalogueView
      path={`/category/${encodeURIComponent(handle)}`}
      handle={handle}
      searchParams={input}
    />
  );
}
