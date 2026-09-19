import { GET, CatalogueQuery } from "../../api/store/minara/catalogue/route";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type {
  MedusaStoreRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

// This suite verifies the public route contract. Native database integration is separate.
describe("Catalogue request validation", () => {
  it.each([
    { min: -1 },
    { min: 200, max: 100 },
    { limit: 500 },
    { page: 0 },
    { page: "bad" },
    { sort: "drop table" },
    { q: "x".repeat(121) },
    { secret: "x" },
  ])("rejects malformed/bounded input %j", (query) =>
    expect(CatalogueQuery.safeParse(query).success).toBe(false),
  );
  it("normalizes repeated facet parameters", () =>
    expect(
      CatalogueQuery.parse({ brand: "MINARA", pack: ["250g", "500g"] }),
    ).toMatchObject({
      brand: ["MINARA"],
      pack: ["250g", "500g"],
      limit: 12,
      page: 1,
    }));
});
describe("Catalogue request scope", () => {
  function request(channels: string[], cached: unknown = null) {
    const graph = jest.fn(async ({ entity }) => ({
      data:
        entity === "region"
          ? [
              {
                id: "india",
                currency_code: "inr",
                countries: [{ iso_2: "in" }],
              },
            ]
          : [],
    }));
    const cache = {
      get: jest.fn(async () => cached),
      set: jest.fn(async () => {}),
    };
    const req = {
      query: {},
      publishable_key_context: { sales_channel_ids: channels },
      scope: {
        resolve: (key: string) =>
          key === ContainerRegistrationKeys.QUERY
            ? { graph }
            : key === Modules.CACHING
              ? cache
              : undefined,
      },
    } as unknown as MedusaStoreRequest;
    const res = {
      json: jest.fn(),
      setHeader: jest.fn(),
    } as unknown as MedusaResponse;
    return { req, res, graph, cache };
  }
  it.each([[[]], [["one", "two"]]])(
    "fails closed without one explicit sales-channel scope: %j",
    async (channels) => {
      const { req, res, graph } = request(channels);
      await expect(GET(req, res)).rejects.toThrow("one sales channel");
      expect(graph).not.toHaveBeenCalled();
    },
  );
  it("reads products only through the authorized channel link", async () => {
    const { req, res, graph, cache } = request(["authorized"]);
    await GET(req, res);
    expect(graph).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "product_sales_channel",
        filters: { sales_channel_id: "authorized" },
      }),
    );
    expect(cache.set).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "minara:catalogue:v1:authorized:inr:guest",
        ttl: 30,
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ products: [], count: 0 }),
    );
  });
  it("paginates the cached projection without another database scan", async () => {
    const { req, res, graph, cache } = request(["authorized"], {
      categories: [],
      products: Array.from({ length: 130 }, (_, i) => ({
        id: `p${i}`,
        handle: `p${i}`,
        title: `Product ${i}`,
      })),
    });
    req.query = { page: "2", limit: "12" };
    await GET(req, res);
    expect(cache.get).toHaveBeenCalledWith({
      key: "minara:catalogue:v1:authorized:inr:guest",
    });
    expect(graph).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 130,
        page: 2,
        products: expect.any(Array),
      }),
    );
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.products).toHaveLength(12);
  });
});
