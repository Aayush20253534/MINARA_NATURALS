import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { siteConfig, siteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: "MINARA NATURALS", template: "%s | MINARA NATURALS" },
  description: siteConfig.description,
  applicationName: "MINARA NATURALS",
  keywords: ["MINARA NATURALS", "groceries", "fresh produce", "spices", "pickles", "pooja samagri"],
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "MINARA NATURALS", title: "MINARA NATURALS", description: siteConfig.description },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={manrope.variable}><body><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader /><main id="main-content">{children}</main><SiteFooter /></body></html>;
}
