import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { Modules } from "@medusajs/framework/utils";
import seed from "../../src/scripts/seed";

jest.setTimeout(120_000);
// Real Medusa contract: run against an isolated PostgreSQL database before deployment.
medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: Record<string, string>;
    let regionId: string;
    let variants: { id: string; title: string }[];
    beforeAll(async () => {
      const container = getContainer();
      await seed({ container, args: [] });
      const keys = await container
        .resolve(Modules.API_KEY)
        .listApiKeys({ title: "MINARA Storefront" });
      headers = { "x-publishable-api-key": keys[0].token };
      const regions = await api.get("/store/regions", { headers });
      regionId = regions.data.regions.find(
        (region: { currency_code: string }) => region.currency_code === "inr",
      ).id;
      const result = await api.get(
        `/store/products?handle=classic-mango-pickle&region_id=${regionId}&fields=id,*variants,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder`,
        { headers },
      );
      variants = result.data.products[0].variants;
    });
    it("adds the selected pack, merges quantities, updates totals and deletes", async () => {
      const { data: created } = await api.post(
        "/store/carts",
        { region_id: regionId },
        { headers },
      );
      const path = `/store/carts/${created.cart.id}`;
      const selected = variants.find((variant) => variant.title === "500g")!;
      const first = await api.post(
        `${path}/line-items`,
        { variant_id: selected.id, quantity: 2 },
        { headers },
      );
      expect(first.data.cart.items[0].variant_id).toBe(selected.id);
      expect(first.data.cart.items[0].unit_price).toBe(279);
      const second = await api.post(
        `${path}/line-items`,
        { variant_id: selected.id, quantity: 1 },
        { headers },
      );
      expect(second.data.cart.items).toHaveLength(1);
      expect(second.data.cart.items[0].quantity).toBe(3);
      const lineId = second.data.cart.items[0].id;
      const updated = await api.post(
        `${path}/line-items/${lineId}?fields=id,total,subtotal,items.id,items.total,items.quantity`,
        { quantity: 1 },
        { headers },
      );
      expect(updated.data.cart.items[0].total).toBeGreaterThanOrEqual(279);
      const removed = await api.delete(`${path}/line-items/${lineId}`, {
        headers,
      });
      expect(removed.data.parent.items).toHaveLength(0);
    });
    it("rejects sold-out variants and amounts above channel inventory", async () => {
      const created = await api.post(
        "/store/carts",
        { region_id: regionId },
        { headers },
      );
      const path = `/store/carts/${created.data.cart.id}/line-items`;
      for (const [pack, quantity] of [
        ["1kg", 1],
        ["500g", 19],
      ] as const) {
        const variant = variants.find((entry) => entry.title === pack)!;
        const result = await api.post(
          path,
          { variant_id: variant.id, quantity },
          { headers, validateStatus: () => true },
        );
        expect(result.status).toBeGreaterThanOrEqual(400);
        expect(result.status).toBeLessThan(500);
      }
      const cart = await api.get(`/store/carts/${created.data.cart.id}`, {
        headers,
      });
      expect(cart.data.cart.items).toHaveLength(0);
    });
    it("allows the exact storefront cart and inventory projections", async () => {
      const created = await api.post(
        "/store/carts",
        { region_id: regionId },
        { headers },
      );
      const variant = variants.find((entry) => entry.title === "250g")!;
      await api.post(
        `/store/carts/${created.data.cart.id}/line-items`,
        { variant_id: variant.id, quantity: 1 },
        { headers },
      );
      const fields =
        "id,region_id,currency_code,completed_at,subtotal,discount_total,tax_total,shipping_total,total,items.id,items.variant_id,items.product_id,items.product_title,items.product_handle,items.variant_title,items.thumbnail,items.quantity,items.unit_price,items.total";
      const cart = await api.get(
        `/store/carts/${created.data.cart.id}?${new URLSearchParams({ fields })}`,
        { headers },
      );
      expect(typeof cart.data.cart.items[0].total).toBe("number");
      const query = new URLSearchParams({
        cart_id: created.data.cart.id,
        region_id: regionId,
        country_code: "in",
        fields:
          "id,*variants,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder",
        "id[]": cart.data.cart.items[0].product_id,
      });
      const products = await api.get(`/store/products?${query}`, { headers });
      expect(
        products.data.products[0].variants.find(
          (entry: { id: string }) => entry.id === variant.id,
        ).inventory_quantity,
      ).toBe(42);
    });
  },
});
