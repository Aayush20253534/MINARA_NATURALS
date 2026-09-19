export const siteConfig = {
  name: "MINARA NATURALS",
  tagline: "Freshness · Quality · Trust",
  description:
    "Fresh produce, pantry staples, signature MINARA pickles and everyday essentials. Discover something good for your home.",
  nav: [
    { label: "All products", href: "/shop" },
    { label: "Fresh produce", href: "/category/fresh-produce" },
    { label: "MINARA Pickles", href: "/category/minara-pickles" },
    { label: "Pooja Samagri", href: "/category/pooja-samagri" },
    { label: "Our Story", href: "/#story" },
    { label: "Business & partnerships", href: "/#business" },
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
