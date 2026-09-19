"use client";

import { SearchIcon } from "@/components/ui/icons";

export function SearchShell({ compact = false }: { compact?: boolean }) {
  return (
    <form
      className={`search-shell${compact ? " search-shell--compact" : ""}`}
      role="search"
      action="/shop"
      method="get"
    >
      <SearchIcon />
      <label className="sr-only" htmlFor={compact ? "mobile-search" : "site-search"}>
        Search MINARA
      </label>
      <input
        id={compact ? "mobile-search" : "site-search"}
        name="q"
        placeholder="Search groceries, spices, pickles…"
        autoComplete="off"
      />
      <button
        className="search-shell__hint"
        type="submit"
        style={{ border: 0, cursor: "pointer" }}
      >
        Search
      </button>
    </form>
  );
}
