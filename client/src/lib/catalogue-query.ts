export type SearchParams = Record<string, string | string[] | undefined>;
export const SORTS = [
  ["featured", "Recommended"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["newest", "Newest arrivals"],
  ["name", "Name: A–Z"],
] as const;
export function catalogueParams(input: SearchParams) {
  const params = new URLSearchParams();
  const first = (key: string) =>
    (Array.isArray(input[key]) ? input[key][0] : input[key])?.trim();
  const q = first("q");
  if (q) params.set("q", q.slice(0, 120));
  for (const key of ["brand", "pack"]) {
    const values = input[key];
    for (const value of [
      ...new Set(Array.isArray(values) ? values : values ? [values] : []),
    ].slice(0, 30)) {
      if (value.trim()) params.append(key, value.trim().slice(0, 100));
    }
  }
  for (const key of ["min", "max"]) {
    const raw = first(key);
    if (
      raw &&
      Number.isFinite(Number(raw)) &&
      Number(raw) >= 0 &&
      Number(raw) <= 10000000
    )
      params.set(key, String(Number(raw)));
  }
  if (
    params.has("min") &&
    params.has("max") &&
    Number(params.get("min")) > Number(params.get("max"))
  ) {
    const min = params.get("min")!;
    params.set("min", params.get("max")!);
    params.set("max", min);
  }
  const availability = first("availability");
  if (availability === "in" || availability === "out")
    params.set("availability", availability);
  const sort = first("sort");
  if (SORTS.some(([value]) => value === sort) && sort !== "featured")
    params.set("sort", sort!);
  const page = Number(first("page"));
  if (Number.isInteger(page) && page > 1 && page <= 100000)
    params.set("page", String(page));
  return params;
}
export function catalogueHref(path: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
