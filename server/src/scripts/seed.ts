import type { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types"
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
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  PHASE_ONE_CHILD_CATEGORIES,
  PHASE_ONE_PRODUCTS,
  PHASE_ONE_ROOT_CATEGORIES,
} from "../data/phase-one-catalog"

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

function validateRepresentativeCatalogue() {
  const seenSkus = new Set<string>()
  const rootHandles = new Set(PHASE_ONE_ROOT_CATEGORIES.map((category) => category.handle))
  const childHandles = new Set(PHASE_ONE_CHILD_CATEGORIES.map((category) => category.handle))

  for (const category of PHASE_ONE_CHILD_CATEGORIES) {
    if (!category.parentHandle || !rootHandles.has(category.parentHandle)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Phase 1.1 category ${category.handle} has an invalid parent category.`
      )
    }
  }

  for (const product of PHASE_ONE_PRODUCTS) {
    if (!rootHandles.has(product.categoryHandle) && !childHandles.has(product.categoryHandle)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Phase 1.1 product ${product.handle} references an unknown category.`
      )
    }

    for (const variant of product.variants) {
      if (!variant.sku.startsWith("MNR-")) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Phase 1.1 SKU ${variant.sku} must use the MNR- prefix.`
        )
      }
      if (seenSkus.has(variant.sku)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Duplicate Phase 1.1 SKU: ${variant.sku}`
        )
      }
      seenSkus.add(variant.sku)
    }
  }
}

export default async function seed({ container }: ExecArgs) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Development seed is blocked in production. Set ALLOW_DEMO_SEED=true only intentionally."
    )
  }

  validateRepresentativeCatalogue()

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storeModule = container.resolve(Modules.STORE)
  const productModule = container.resolve(Modules.PRODUCT)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const apiKeyModule = container.resolve(Modules.API_KEY)
  const regionModule = container.resolve(Modules.REGION)
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)

  const [store] = await storeModule.listStores()
  if (!store) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Medusa store was not initialized"
    )
  }

  logger.info("Seeding MINARA Phase 1.1 commerce foundation...")

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

  let [indiaRegion] = await regionModule.listRegions({ name: "India" })
  if (!indiaRegion) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "India",
            currency_code: "inr",
            countries: ["in"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    })
    indiaRegion = result[0]
  }

  const { data: indiaTaxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
    filters: { country_code: "in" },
  })
  if (!indiaTaxRegions.length) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "in", provider_id: "tp_system" }],
    })
  }

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

  let [stockLocation] = await stockLocationModule.listStockLocations({
    name: "MINARA Development Stock",
  })
  if (!stockLocation) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "MINARA Development Stock",
            address: {
              address_1: "Development seed location",
              city: "Delhi",
              country_code: "IN",
            },
          },
        ],
      },
    })
    stockLocation = result[0]
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: salesChannel.id,
        default_location_id: stockLocation.id,
      },
    },
  })

  const { data: stockLocationRows } = await query.graph({
    entity: "stock_location",
    fields: ["id", "sales_channels.id"],
    filters: { id: stockLocation.id },
  })
  const linkedSalesChannels = (
    stockLocationRows[0] as { sales_channels?: Array<{ id: string }> } | undefined
  )?.sales_channels ?? []
  if (!linkedSalesChannels.some((channel) => channel.id === salesChannel.id)) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [salesChannel.id] },
    })
  }

  const existingCategories = await productModule.listProductCategories({}, { take: 200 })
  const existingHandles = new Set(existingCategories.map((category) => category.handle))
  const missingRootCategories = PHASE_ONE_ROOT_CATEGORIES.filter(
    (category) => !existingHandles.has(category.handle)
  ).map((category) => ({
    name: category.name,
    handle: category.handle,
    is_active: true,
  }))

  if (missingRootCategories.length) {
    await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missingRootCategories },
    })
  }

  let categoryRows = await productModule.listProductCategories({}, { take: 200 })
  let categoryId = new Map(categoryRows.map((category) => [category.handle, category.id]))
  const childHandles = new Set(categoryRows.map((category) => category.handle))
  const missingChildCategories = PHASE_ONE_CHILD_CATEGORIES.filter(
    (category) => !childHandles.has(category.handle)
  ).map((category) => {
    const parentId = category.parentHandle ? categoryId.get(category.parentHandle) : undefined
    if (!parentId) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Parent category ${category.parentHandle} is missing for ${category.handle}.`
      )
    }
    return {
      name: category.name,
      handle: category.handle,
      is_active: true,
      parent_category_id: parentId,
    }
  })

  if (missingChildCategories.length) {
    await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missingChildCategories },
    })
  }

  categoryRows = await productModule.listProductCategories({}, { take: 200 })
  categoryId = new Map(categoryRows.map((category) => [category.handle, category.id]))

  const existingProducts = await productModule.listProducts({}, { take: 500 })
  const productHandles = new Set(existingProducts.map((product) => product.handle))
  const mediaBaseUrl = process.env.MINARA_SEED_MEDIA_BASE_URL?.trim().replace(/\/$/, "")

  const representativeProducts = PHASE_ONE_PRODUCTS.filter(
    (product) => !productHandles.has(product.handle)
  ).map((product) => {
    const productCategoryId = categoryId.get(product.categoryHandle)
    if (!productCategoryId) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Category ${product.categoryHandle} is missing for product ${product.handle}.`
      )
    }

    const imageUrl = mediaBaseUrl ? `${mediaBaseUrl}/${product.handle}.webp` : undefined

    return {
      title: product.title,
      handle: product.handle,
      subtitle: product.subtitle,
      description: product.description,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      category_ids: [productCategoryId],
      sales_channels: [{ id: salesChannel.id }],
      metadata: product.metadata,
      thumbnail: imageUrl,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      options: [
        {
          title: "Pack Size",
          values: product.variants.map((variant) => variant.packSize),
        },
      ],
      variants: product.variants.map((variant) => ({
        title: variant.title,
        sku: variant.sku,
        options: { "Pack Size": variant.packSize },
        manage_inventory: true,
        allow_backorder: false,
        prices: [{ amount: variant.price, currency_code: "inr" }],
      })),
    }
  })

  if (representativeProducts.length) {
    const { result } = await createProductsWorkflow(container).run({
      input: { products: representativeProducts },
    })
    logger.info(`Created ${result.length} Phase 1.1 representative products.`)
  } else {
    logger.info("Phase 1.1 representative products are already present.")
  }

  const stockBySku = new Map(
    PHASE_ONE_PRODUCTS.flatMap((product) =>
      product.variants.map((variant) => [variant.sku, variant.stock] as const)
    )
  )

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  })
  const seededInventoryItems = inventoryItems.filter(
    (item) => item.sku && stockBySku.has(item.sku)
  )

  const { data: existingInventoryLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["inventory_item_id", "location_id"],
    filters: { location_id: stockLocation.id },
  })
  const inventoryItemsWithLevels = new Set(
    existingInventoryLevels.map((level) => level.inventory_item_id)
  )

  const inventoryLevels: CreateInventoryLevelInput[] = seededInventoryItems
    .filter((item) => !inventoryItemsWithLevels.has(item.id))
    .map((item) => ({
      location_id: stockLocation.id,
      stocked_quantity: stockBySku.get(item.sku!) ?? 0,
      inventory_item_id: item.id,
    }))

  if (inventoryLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: inventoryLevels },
    })
    logger.info(`Created ${inventoryLevels.length} Phase 1.1 inventory levels.`)
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

  logger.info(`India pricing region ready: ${indiaRegion.id}`)
  logger.info(`Catalogue categories ready: ${categoryRows.length}`)
  logger.info(`Representative products configured: ${PHASE_ONE_PRODUCTS.length}`)
  logger.info("MINARA Phase 1.1 seed completed.")
  logger.info(`Publishable key: ${publishableKey.token}`)
}
