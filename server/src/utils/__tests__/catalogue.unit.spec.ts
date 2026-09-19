import {
  queryCatalogue,
  variantStock,
  type CatalogueProduct,
  type CatalogueVariant,
} from "../catalogue";
const categories = [
  { id: "root", handle: "pickles", name: "Pickles" },
  { id: "child", handle: "mango", name: "Mango", parent_category_id: "root" },
  {
    id: "grandchild",
    handle: "hot-mango",
    name: "Hot mango",
    parent_category_id: "child",
  },
];
function pack(
  id: string,
  title: string,
  amount: number | null,
  quantity = 10,
): CatalogueVariant {
  return {
    id,
    title,
    manage_inventory: true,
    inventory_quantity: quantity,
    calculated_price: { calculated_amount: amount, currency_code: "inr" },
  };
}
const products: CatalogueProduct[] = [
  {
    id: "a",
    title: "Mango Pickle",
    handle: "mango",
    categories: [categories[2]],
    metadata: { brand: "MINARA", featured: true },
    variants: [
      pack("a1", "250g", 149),
      pack("a2", "500g", 279),
      pack("a3", "1kg", 519, 0),
    ],
  },
  {
    id: "b",
    title: "Lemon Pickle",
    handle: "lemon",
    categories: [categories[0]],
    metadata: { brand: "MINARA" },
    variants: [pack("b1", "500g", 199)],
  },
  {
    id: "c",
    title: "Brand New Rice",
    handle: "rice",
    metadata: { brand: "Another brand" },
    variants: [pack("c1", "1kg", 99)],
  },
  {
    id: "d",
    title: "Unpriced Product",
    handle: "unpriced",
    variants: [pack("d1", "1kg", null)],
  },
];
const run = (filters = {}, items = products) =>
  queryCatalogue(items, categories, { page: 1, limit: 12, ...filters });
describe("Public catalogue filtering", () => {
  it("does not require the development seed marker", () =>
    expect(run().count).toBe(4));
  it("includes all descendants, not only direct category children", () =>
    expect(run({ category: "pickles" }).products.map((p) => p.id)).toEqual([
      "a",
      "b",
    ]));
  it("distinguishes an unknown category from an empty category", () =>
    expect(run({ category: "missing" })).toMatchObject({
      category: null,
      count: 0,
    }));
  it("combines pack and price on the same variant", () =>
    expect(run({ pack: ["500g"], max: 200 }).products.map((p) => p.id)).toEqual(
      ["b"],
    ));
  it("combines stock with the selected pack, not another in-stock pack", () =>
    expect(run({ q: "mango", pack: ["1kg"], availability: "in" }).count).toBe(
      0,
    ));
  it("returns only the matching pack, so card prices reflect filters", () =>
    expect(
      run({
        q: "mango",
        pack: ["1kg"],
        availability: "out",
      }).products[0].variants?.map((v) => v.id),
    ).toEqual(["a3"]));
  it("combines brands, text, category, price and pack", () =>
    expect(
      run({
        q: "MINARA pickle",
        category: "pickles",
        brand: ["MINARA"],
        pack: ["500g"],
        min: 190,
        max: 220,
        availability: "in",
      }).products.map((p) => p.id),
    ).toEqual(["b"]));
  it("treats multiple values as OR within one facet", () =>
    expect(run({ brand: ["MINARA", "Another brand"] }).count).toBe(3));
  it("keeps missing prices out of numeric ranges", () =>
    expect(run({ min: 0, max: 500 }).products.some((p) => p.id === "d")).toBe(
      false,
    ));
  it("sorts by matching pack prices globally before pagination", () =>
    expect(run({ sort: "price-desc", limit: 1 }).products[0].id).toBe("b"));
  it("puts unavailable prices last in either price order", () => {
    expect(run({ sort: "price-asc" }).products.at(-1)?.id).toBe("d");
    expect(run({ sort: "price-desc" }).products.at(-1)?.id).toBe("d");
  });
  it("keeps page boundaries stable and clamps pages beyond the last", () => {
    expect(run({ sort: "name", limit: 2, page: 99 })).toMatchObject({
      page: 2,
      count: 4,
    });
    const first = run({ limit: 2, page: 1 }).products.map((p) => p.id);
    expect(
      run({ limit: 2, page: 2 }).products.every((p) => !first.includes(p.id)),
    ).toBe(true);
  });
  it("searches beyond the old 100-product window", () => {
    const many = Array.from({ length: 130 }, (_, n) => ({
      ...products[0],
      id: `p${n}`,
      title: n === 129 ? "Rare saffron" : `Product ${n}`,
    }));
    expect(run({ q: "saffron" }, many)).toMatchObject({
      count: 1,
      products: [{ id: "p129" }],
    });
  });
  it("derives facets from the search/category scope, preserving alternative choices", () =>
    expect(run({ category: "pickles", pack: ["500g"] }).facets).toEqual({
      brands: ["MINARA"],
      packs: ["1kg", "250g", "500g"],
    }));
  it("does not mutate the cached snapshot", () => {
    const before = JSON.stringify(products);
    run({ pack: ["1kg"], sort: "price-asc" });
    expect(JSON.stringify(products)).toBe(before);
  });
  it("has deterministic ties", () => {
    const a = { ...products[0], title: "Same", metadata: {} };
    const b = { ...products[1], title: "Same", metadata: {} };
    expect(run({ sort: "name" }, [b, a]).products.map((p) => p.id)).toEqual([
      "a",
      "b",
    ]);
  });
});
describe("Inventory semantics", () => {
  it("respects unmanaged inventory and backorders", () => {
    expect(
      variantStock({ ...pack("v", "1kg", 90, 0), manage_inventory: false }),
    ).toBe("in");
    expect(
      variantStock({ ...pack("v", "1kg", 90, 0), allow_backorder: true }),
    ).toBe("in");
  });
  it("does not call missing inventory in stock", () =>
    expect(
      variantStock({ id: "v", title: "1kg", manage_inventory: true }),
    ).toBe("unknown"));
});
