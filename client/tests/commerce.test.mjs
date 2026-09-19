import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCartAction,
  variantAvailability,
  variantPrice,
} from "../src/lib/commerce.ts";
test("cart input accepts only bounded, integer quantities and identifiers", () => {
  assert.deepEqual(
    parseCartAction({ action: "add", variantId: "variant_1", quantity: 2 }),
    { action: "add", variantId: "variant_1", quantity: 2 },
  );
  for (const quantity of [0, -1, 1.5, 100, "2", NaN])
    assert.equal(
      parseCartAction({ action: "add", variantId: "variant_1", quantity }),
      null,
    );
  for (const variantId of ["../other", "", "x".repeat(151), 123])
    assert.equal(
      parseCartAction({ action: "add", variantId, quantity: 1 }),
      null,
    );
});
test("clients cannot inject prices, cart identities or metadata", () => {
  for (const extra of [
    { unit_price: 0 },
    { cartId: "cart_other" },
    { metadata: {} },
    { currency_code: "usd" },
  ])
    assert.equal(
      parseCartAction({
        action: "add",
        variantId: "v1",
        quantity: 1,
        ...extra,
      }),
      null,
    );
  assert.deepEqual(parseCartAction({ action: "remove", itemId: "cali_1" }), {
    action: "remove",
    itemId: "cali_1",
  });
  assert.equal(
    parseCartAction({ action: "remove", itemId: "cali_1", quantity: 0 }),
    null,
  );
});
test("inventory distinguishes sold out, unknown, unmanaged and backorders", () => {
  const base = { id: "v", title: "500g", manage_inventory: true };
  assert.equal(variantAvailability(base).state, "unknown");
  assert.equal(
    variantAvailability({ ...base, inventory_quantity: 0 }).state,
    "out",
  );
  assert.equal(
    variantAvailability({ ...base, inventory_quantity: 4 }).limit,
    4,
  );
  assert.equal(
    variantAvailability({ ...base, manage_inventory: false }).limit,
    99,
  );
  assert.equal(
    variantAvailability({
      ...base,
      inventory_quantity: 0,
      allow_backorder: true,
    }).state,
    "in",
  );
});
test("prices preserve decimal and zero values but reject missing/invalid currencies", () => {
  const variant = (amount, currency = "inr") => ({
    id: "v",
    title: "250g",
    calculated_price: { calculated_amount: amount, currency_code: currency },
  });
  assert.equal(variantPrice(variant(129.5)), 129.5);
  assert.equal(variantPrice(variant(0)), 0);
  for (const amount of [null, -1, NaN, Infinity, "149"])
    assert.equal(variantPrice(variant(amount)), null);
  assert.equal(variantPrice(variant(149, "usd")), null);
});
