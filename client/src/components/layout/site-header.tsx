"use client";

import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { BagIcon, HeartIcon, MenuIcon, UserIcon } from "@/components/ui/icons";
import { Drawer } from "@/components/ui/drawer";
import { siteConfig } from "@/lib/site";
import { SearchShell } from "./search-shell";
import { Container } from "./container";

function FutureAction({ label, children }: { label: string; children: ReactNode }) {
  return <span className="header-action is-pending" aria-label={`${label} — available with customer commerce in Phase 1`} title={`${label} is enabled in Phase 1`}>{children}</span>;
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = useCallback(() => setMobileOpen(false), []);
  return (
    <header className="site-header">
      <div className="announcement"><Container>Freshness, quality and trust across everyday essentials and MINARA specialities.</Container></div>
      <Container className="site-header__main">
        <button className="mobile-menu-button" type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><MenuIcon /></button>
        <Wordmark />
        <div className="site-header__search"><SearchShell /></div>
        <div className="site-header__actions">
          <FutureAction label="Account"><UserIcon /></FutureAction>
          <FutureAction label="Wishlist"><HeartIcon /></FutureAction>
          <FutureAction label="Cart"><BagIcon /></FutureAction>
        </div>
      </Container>
      <nav className="desktop-nav" aria-label="Primary navigation"><Container className="desktop-nav__inner">{siteConfig.nav.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}</Container></nav>
      <Drawer open={mobileOpen} onClose={close} title="MINARA Menu">
        <div className="mobile-nav-search"><SearchShell compact /></div>
        <nav className="mobile-nav" aria-label="Mobile navigation">{siteConfig.nav.map((item) => <Link key={item.label} href={item.href} onClick={close}>{item.label}</Link>)}</nav>
        <div className="mobile-nav-note">Customer account, wishlist and cart activate with the Phase 1 commerce flows.</div>
      </Drawer>
    </header>
  );
}
