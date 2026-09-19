"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { ArrowIcon, MenuIcon } from "@/components/ui/icons";
import { Drawer } from "@/components/ui/drawer";
import { siteConfig } from "@/lib/site";
import { SearchShell } from "./search-shell";
import { Container } from "./container";
import { CartButton } from "@/components/commerce/cart-view";
export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = useCallback(() => setMobileOpen(false), []);
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="announcement">
        <Container>
          <span>Freshness. Quality. Trust.</span>
          <Link href="/#story">
            A little more care in every day <span aria-hidden="true">↗</span>
          </Link>
        </Container>
      </div>
      <Container className="site-header__main">
        <button
          className="mobile-menu-button icon-button"
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <MenuIcon />
        </button>
        <Wordmark />
        <div className="site-header__search">
          <SearchShell />
        </div>
        <div className="site-header__actions">
          <Link
            href="/account"
            className="account-header-link"
            aria-label="Your account"
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
            </svg>
            <span>Account</span>
          </Link>
          <CartButton />
        </div>
      </Container>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <Container className="desktop-nav__inner">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </Container>
      </nav>
      <Drawer open={mobileOpen} onClose={close} title="Explore MINARA">
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <Link href="/account" onClick={close}>
            Your account <ArrowIcon width={16} height={16} />
          </Link>
          {siteConfig.nav.map((item) => (
            <Link key={item.label} href={item.href} onClick={close}>
              {item.label}
              <ArrowIcon width={16} height={16} />
            </Link>
          ))}
        </nav>
        <p className="mobile-nav-note">
          Fresh produce, familiar flavours and the little essentials that make a
          home.
        </p>
      </Drawer>
    </header>
  );
}
