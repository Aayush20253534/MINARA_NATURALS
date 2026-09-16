"use client";

import { useState } from "react";
import { SearchIcon } from "@/components/ui/icons";

export function SearchShell({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <form className={`search-shell${compact ? " search-shell--compact" : ""}`} role="search" onSubmit={(event) => event.preventDefault()}>
      <SearchIcon />
      <label className="sr-only" htmlFor={compact ? "mobile-search" : "site-search"}>Search MINARA</label>
      <input id={compact ? "mobile-search" : "site-search"} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search groceries, spices, pickles…" autoComplete="off" />
      <span className="search-shell__hint" title="Catalogue search is wired in Phase 1">Search</span>
    </form>
  );
}
