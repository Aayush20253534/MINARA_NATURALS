import type { MetadataRoute } from "next";
import { getCatalogCategories } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: new URL("/", siteUrl()).toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/shop", siteUrl()).toString(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
  try {
    const categories = await getCatalogCategories();
    for (const category of categories)
      entries.push({
        url: new URL(
          `/category/${encodeURIComponent(category.handle)}`,
          siteUrl(),
        ).toString(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
  } catch {
    /* Keep the basic sitemap valid during temporary commerce outages. */
  }
  return entries;
}
