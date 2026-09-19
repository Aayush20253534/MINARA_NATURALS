"use client";
import { useCallback, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { SORTS } from "@/lib/catalogue-query";
import styles from "./catalogue.module.css";
type Props = {
  path: string;
  query: string;
  facets: { brands: string[]; packs: string[] };
};
function FilterForm({
  path,
  query,
  facets,
  onApplied,
}: Props & { onApplied?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const params = new URLSearchParams(query);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const min = form.get("min"),
      max = form.get("max");
    if (min && max && Number(min) > Number(max)) {
      setError("Minimum price must be less than or equal to maximum price.");
      return;
    }
    setError("");
    const next = new URLSearchParams();
    form.forEach((value, key) => {
      if (String(value).trim()) next.append(key, String(value));
    });
    startTransition(() => {
      router.push(`${path}${next.size ? `?${next}` : ""}`);
      onApplied?.();
    });
  }
  return (
    <form
      action={path}
      method="get"
      onSubmit={submit}
      className={styles.filterForm}
      aria-busy={pending}
    >
      {params.get("q") && (
        <input type="hidden" name="q" value={params.get("q")!} />
      )}
      {params.get("sort") && (
        <input type="hidden" name="sort" value={params.get("sort")!} />
      )}
      <fieldset>
        <legend>
          Price range <span>₹</span>
        </legend>
        <div className={styles.priceInputs}>
          <label>
            Minimum
            <input
              name="min"
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              placeholder="0"
              defaultValue={params.get("min") ?? ""}
            />
          </label>
          <span aria-hidden="true">–</span>
          <label>
            Maximum
            <input
              name="max"
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              placeholder="Any"
              defaultValue={params.get("max") ?? ""}
            />
          </label>
        </div>
      </fieldset>
      {[
        { key: "brand", label: "Brand", items: facets.brands },
        { key: "pack", label: "Pack size", items: facets.packs },
      ].map(({ key, label, items }) => {
        const values = [...new Set([...items, ...params.getAll(key)])];
        return (
          values.length > 0 && (
            <fieldset key={key}>
              <legend>{label}</legend>
              <div className={styles.checkList}>
                {values.map((value) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      name={key}
                      value={value}
                      defaultChecked={params.getAll(key).includes(value)}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )
        );
      })}
      <fieldset>
        <legend>Availability</legend>
        {[
          ["", "All products"],
          ["in", "In stock"],
          ["out", "Out of stock"],
        ].map(([value, label]) => (
          <label className={styles.checkLabel} key={value}>
            <input
              type="radio"
              name="availability"
              value={value}
              defaultChecked={(params.get("availability") ?? "") === value}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p className={styles.validation} role="alert">
          {error}
        </p>
      )}
      <button
        className="link-button link-button--primary"
        type="submit"
        disabled={pending}
      >
        {pending ? "Updating…" : "Apply filters"}
      </button>
      <a
        className={styles.reset}
        href={`${path}${params.get("q") ? `?q=${encodeURIComponent(params.get("q")!)}` : ""}`}
      >
        Reset filters
      </a>
    </form>
  );
}
export function CatalogueFilters(props: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const count = [...new URLSearchParams(props.query)].filter(([k]) =>
    ["min", "max", "brand", "pack", "availability"].includes(k),
  ).length;
  return (
    <>
      <div className={styles.desktopFilters}>
        <h2>Refine your search</h2>
        <FilterForm key={props.query} {...props} />
      </div>
      <button
        type="button"
        className={styles.mobileFilterButton}
        onClick={() => setOpen(true)}
        aria-expanded={open}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 17h16" />
          <circle cx="9" cy="7" r="3" fill="white" />
          <circle cx="15" cy="17" r="3" fill="white" />
        </svg>
        Filters{count ? <span>{count}</span> : null}
      </button>
      <Drawer open={open} onClose={close} title="Refine your search">
        <FilterForm key={props.query} {...props} onApplied={close} />
      </Drawer>
    </>
  );
}
export function CatalogueSort({
  path,
  query,
}: {
  path: string;
  query: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const params = new URLSearchParams(query);
  return (
    <form
      className={styles.sort}
      action={path}
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const next = new URLSearchParams();
        new FormData(event.currentTarget).forEach((value, key) =>
          next.append(key, String(value)),
        );
        startTransition(() => router.push(`${path}?${next}`));
      }}
      aria-busy={pending}
    >
      {[...params]
        .filter(([k]) => k !== "sort" && k !== "page")
        .map(([key, value], i) => (
          <input key={`${key}-${i}`} type="hidden" name={key} value={value} />
        ))}
      <label htmlFor="catalogue-sort">Sort by</label>
      <select
        id="catalogue-sort"
        aria-label="Sort by"
        name="sort"
        value={params.get("sort") ?? "featured"}
        disabled={pending}
        onChange={(event) => {
          const next = new URLSearchParams(query);
          next.set("sort", event.target.value);
          next.delete("page");
          startTransition(() => router.push(`${path}?${next}`));
        }}
      >
        {SORTS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit">Sort</button>
      </noscript>
    </form>
  );
}
