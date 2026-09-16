import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(60_000)

medusaIntegrationTestRunner({
  testSuite: ({ api }) => {
    describe("GET /minara/health", () => {
      it("returns a stable health contract", async () => {
        const response = await api.get("/minara/health")
        expect(response.status).toBe(200)
        expect(response.data).toMatchObject({ status: "ok", service: "minara-commerce" })
      })
    })
  },
})
