import { CatalogueView } from "@/components/commerce/catalogue-view";
import { catalogueMetadata } from "@/lib/catalogue-metadata";
import type { SearchParams } from "@/lib/catalogue-query";
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<SearchParams> };
export async function generateMetadata({ searchParams }: Props) {
  return catalogueMetadata(
    "/shop",
    "Shop everyday essentials",
    await searchParams,
  );
}
export default async function ShopPage({ searchParams }: Props) {
  return <CatalogueView path="/shop" searchParams={await searchParams} />;
}
