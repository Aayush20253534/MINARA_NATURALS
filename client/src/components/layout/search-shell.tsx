"use client";
import { useId } from "react";
import { SearchIcon } from "@/components/ui/icons";
export function SearchShell({ onSubmit }: { onSubmit?: () => void }) {
  const id = useId();
  return (
    <form
      className="search-shell"
      role="search"
      action="/search"
      method="get"
      onSubmit={onSubmit}
    >
      <SearchIcon />
      <label className="sr-only" htmlFor={id}>
        Search products
      </label>
      <input
        id={id}
        type="search"
        name="q"
        maxLength={120}
        placeholder="Try “mango pickle” or “rice”"
        autoComplete="off"
      />
      <button
        className="search-shell__submit"
        type="submit"
        aria-label="Search"
      >
        Search <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
