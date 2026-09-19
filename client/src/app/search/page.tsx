import { CatalogueView } from "@/components/commerce/catalogue-view";
import { catalogueMetadata } from "@/lib/catalogue-metadata";
import type { SearchParams } from "@/lib/catalogue-query";
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<SearchParams> };
export async function generateMetadata({ searchParams }: Props) {
  return catalogueMetadata(
    "/search",
    "Search the shop",
    await searchParams,
    true,
  );
}
export default async function SearchPage({ searchParams }: Props) {
  return (
    <CatalogueView path="/search" searchParams={await searchParams} search />
  );
}
