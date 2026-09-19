import type { Metadata } from "next";
import { catalogueParams, type SearchParams } from "./catalogue-query";
export function catalogueMetadata(
  path: string,
  title: string,
  input: SearchParams,
  search = false,
): Metadata {
  const params = catalogueParams(input);
  const filtered = [...params.keys()].some((key) => key !== "page");
  const page = params.get("page");
  return {
    title: `${title}${page ? ` — Page ${page}` : ""}`,
    description:
      "Browse MINARA NATURALS: compare prices and pack sizes across fresh produce, groceries, pickles and everyday essentials.",
    alternates: {
      canonical: `${path}${page && !filtered ? `?page=${page}` : ""}`,
    },
    robots: { index: !search && !filtered, follow: true },
  };
}
