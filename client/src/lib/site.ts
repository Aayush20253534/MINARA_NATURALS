export const siteConfig = {
  name: "MINARA NATURALS",
  tagline: "Freshness · Quality · Trust",
  description:
    "A modern MINARA NATURALS commerce experience for fresh produce, groceries, spices, pickles, pooja essentials, household goods and business partnerships.",
  nav: [
    { label: "Shop", href: "/shop" },
    { label: "Our Story", href: "/#story" },
    { label: "Bulk & Wholesale", href: "/#business" },
    { label: "Export", href: "/#business" },
    { label: "Franchise", href: "/#business" },
  ],
} as const;

export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    return new URL(configured || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}
