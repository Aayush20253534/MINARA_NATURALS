import test from "node:test";
import assert from "node:assert/strict";
import { catalogueParams, catalogueHref } from "../src/lib/catalogue-query.ts";
test("retains repeated facets and removes invalid/unknown state", () => {
  const query = catalogueParams({
    q: "  rice ",
    brand: ["A", "A", "B"],
    pack: ["1kg", "5kg"],
    page: "-9",
    sort: "evil",
    injected: "yes",
  });
  assert.equal(query.get("q"), "rice");
  assert.deepEqual(query.getAll("brand"), ["A", "B"]);
  assert.deepEqual(query.getAll("pack"), ["1kg", "5kg"]);
  assert.equal(query.has("page"), false);
  assert.equal(query.has("sort"), false);
  assert.equal(query.has("injected"), false);
});
test("normalizes pasted inverted ranges and ignores invalid prices", () => {
  assert.equal(
    catalogueParams({ min: "500", max: "100" }).toString(),
    "min=100&max=500",
  );
  assert.equal(catalogueParams({ min: "-1", max: "Infinity" }).size, 0);
});
test("encodes meaningful queries and retains page/sort/back navigation state", () => {
  const query = catalogueParams({
    brand: "A & B",
    sort: "price-desc",
    page: "3",
    availability: "out",
  });
  assert.equal(
    catalogueHref("/shop", query),
    "/shop?brand=A+%26+B&availability=out&sort=price-desc&page=3",
  );
  assert.equal(catalogueHref("/shop", new URLSearchParams()), "/shop");
});
