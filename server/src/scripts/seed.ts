import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createApiKeysWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createSalesChannelsWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

const categories = [
  { name: "Fresh Produce", handle: "fresh-produce", is_active: true },
  { name: "Groceries", handle: "groceries", is_active: true },
  { name: "Spices", handle: "spices", is_active: true },
  { name: "MINARA Pickles", handle: "minara-pickles", is_active: true },
  { name: "Pooja Samagri", handle: "pooja-samagri", is_active: true },
  { name: "Household & Personal Care", handle: "household-personal-care", is_active: true },
]

const minaraUpdateStoreCurrencies = createWorkflow(
  "minara-update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[]
    store_id: string
  }) => {
    const normalizedInput = transform({ input }, (data) => ({
      selector: { id: data.input.store_id },
      update: {
        supported_currencies: data.input.supported_currencies.map((currency) => ({
          currency_code: currency.currency_code,
          is_default: currency.is_default ?? false,
        })),
      },
    }))

    const stores = updateStoresStep(normalizedInput)
    return new WorkflowResponse(stores)
  }
)

export default async function seed({ container }: ExecArgs) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Development seed is blocked in production. Set ALLOW_DEMO_SEED=true only intentionally."
    )
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const storeModule = container.resolve(Modules.STORE)
  const productModule = container.resolve(Modules.PRODUCT)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const apiKeyModule = container.resolve(Modules.API_KEY)

  const [store] = await storeModule.listStores()
  if (!store) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Medusa store was not initialized"
    )
  }

  let [salesChannel] = await salesChannelModule.listSalesChannels({ name: "MINARA Web Store" })
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          { name: "MINARA Web Store", description: "Primary website sales channel" },
        ],
      },
    })
    salesChannel = result[0]
  }

  await minaraUpdateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [{ currency_code: "inr", is_default: true }],
    },
  })

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_sales_channel_id: salesChannel.id },
    },
  })

  const shippingProfiles = await fulfillmentModule.listShippingProfiles({ type: "default" })
  let shippingProfile = shippingProfiles[0]
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [
          {
            name: "MINARA Default Shipping Profile",
            type: "default",
          },
        ],
      },
    })
    shippingProfile = result[0]
  }

  const existingCategories = await productModule.listProductCategories({}, { take: 100 })
  const existingHandles = new Set(existingCategories.map((category) => category.handle))
  const missingCategories = categories.filter((category) => !existingHandles.has(category.handle))
  if (missingCategories.length) {
    await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missingCategories },
    })
  }

  const categoryRows = await productModule.listProductCategories({}, { take: 100 })
  const categoryId = new Map(categoryRows.map((category) => [category.handle, category.id]))
  const existingProducts = await productModule.listProducts({}, { take: 100 })
  const productHandles = new Set(existingProducts.map((product) => product.handle))

  const demoProducts = [
    {
      title: "Development Sample Pickle",
      handle: "development-sample-pickle",
      description:
        "Non-production seed product used to validate MINARA pack-size variants and INR pricing.",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      category_ids: [categoryId.get("minara-pickles")].filter(Boolean) as string[],
      sales_channels: [{ id: salesChannel.id }],
      options: [{ title: "Pack Size", values: ["250g", "500g", "1kg"] }],
      variants: [
        {
          title: "250g",
          sku: "DEV-PICKLE-250",
          options: { "Pack Size": "250g" },
          manage_inventory: false,
          prices: [{ amount: 149, currency_code: "inr" }],
        },
        {
          title: "500g",
          sku: "DEV-PICKLE-500",
          options: { "Pack Size": "500g" },
          manage_inventory: false,
          prices: [{ amount: 279, currency_code: "inr" }],
        },
        {
          title: "1kg",
          sku: "DEV-PICKLE-1000",
          options: { "Pack Size": "1kg" },
          manage_inventory: false,
          prices: [{ amount: 519, currency_code: "inr" }],
        },
      ],
    },
    {
      title: "Development Sample Spice",
      handle: "development-sample-spice",
      description:
        "Non-production seed product used to validate the MINARA catalogue and storefront connection.",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      category_ids: [categoryId.get("spices")].filter(Boolean) as string[],
      sales_channels: [{ id: salesChannel.id }],
      options: [{ title: "Pack Size", values: ["100g", "250g"] }],
      variants: [
        {
          title: "100g",
          sku: "DEV-SPICE-100",
          options: { "Pack Size": "100g" },
          manage_inventory: false,
          prices: [{ amount: 69, currency_code: "inr" }],
        },
        {
          title: "250g",
          sku: "DEV-SPICE-250",
          options: { "Pack Size": "250g" },
          manage_inventory: false,
          prices: [{ amount: 149, currency_code: "inr" }],
        },
      ],
    },
  ].filter((product) => !productHandles.has(product.handle))

  if (demoProducts.length) {
    await createProductsWorkflow(container).run({ input: { products: demoProducts } })
  }

  let [publishableKey] = await apiKeyModule.listApiKeys({ title: "MINARA Storefront" })

  if (!publishableKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "MINARA Storefront",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })
    publishableKey = result[0]
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableKey.id, add: [salesChannel.id] },
  })

  logger.info("MINARA development seed completed.")
  logger.info(`Publishable key: ${publishableKey.token}`)
}
