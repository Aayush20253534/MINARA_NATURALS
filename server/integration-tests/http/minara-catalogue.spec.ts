import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { Modules } from "@medusajs/framework/utils";
import seed from "../../src/scripts/seed";

jest.setTimeout(120_000);

// Requires an isolated PostgreSQL test database (see server/.env.test).
// This exercises the real Medusa graph, pricing and channel inventory, not the UI fixture.
medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: Record<string, string>;
    beforeAll(async () => {
      const container = getContainer();
      await seed({ container, args: [] });
      const keys = await container
        .resolve(Modules.API_KEY)
        .listApiKeys({ title: "MINARA Storefront" });
      headers = { "x-publishable-api-key": keys[0].token };
    });
    it("requires a valid publishable key", async () => {
      const response = await api.get("/store/minara/catalogue", {
        validateStatus: () => true,
      });
      expect(response.status).toBe(400);
    });
    it("returns a bounded page with prices and public categories", async () => {
      const { data } = await api.get("/store/minara/catalogue?limit=4", {
        headers,
      });
      expect(data.products).toHaveLength(4);
      expect(data.count).toBeGreaterThanOrEqual(16);
      expect(data.products[0].variants[0].calculated_price.currency_code).toBe(
        "inr",
      );
      expect(data.products[0].metadata.seed_catalog).toBeUndefined();
    });
    it("honours real pack inventory rather than another variant's stock", async () => {
      const { data } = await api.get(
        "/store/minara/catalogue?q=mango&pack=1kg&availability=in",
        { headers },
      );
      expect(data.count).toBe(0);
      const out = await api.get(
        "/store/minara/catalogue?q=mango&pack=1kg&availability=out",
        { headers },
      );
      expect(out.data.products[0].handle).toBe("classic-mango-pickle");
      expect(out.data.products[0].variants[0].inventory_quantity).toBe(0);
    });
    it("finds nested category products and combines pack/price predicates", async () => {
      const { data } = await api.get(
        "/store/minara/catalogue?category=minara-pickles&pack=500g&max=260",
        { headers },
      );
      expect(data.products.map((p: { handle: string }) => p.handle)).toEqual(
        expect.arrayContaining(["mixed-vegetable-pickle", "lemon-pickle"]),
      );
      expect(
        data.products.some(
          (p: { handle: string }) => p.handle === "classic-mango-pickle",
        ),
      ).toBe(false);
    });
    it("rejects invalid filters before querying commerce", async () => {
      const response = await api.get(
        "/store/minara/catalogue?min=300&max=100",
        { headers, validateStatus: () => true },
      );
      expect(response.status).toBe(400);
    });
  },
});
