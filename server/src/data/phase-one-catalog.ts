export type PhaseOneCategory = {
  name: string
  handle: string
  parentHandle?: string
}

export type PhaseOneVariant = {
  title: string
  packSize: string
  sku: string
  price: number
  stock: number
}

export type PhaseOneProduct = {
  title: string
  handle: string
  subtitle?: string
  description: string
  categoryHandle: string
  metadata: Record<string, string | number | boolean>
  variants: PhaseOneVariant[]
}

export const PHASE_ONE_ROOT_CATEGORIES: PhaseOneCategory[] = [
  { name: "Fresh Produce", handle: "fresh-produce" },
  { name: "Groceries", handle: "groceries" },
  { name: "Spices", handle: "spices" },
  { name: "MINARA Pickles", handle: "minara-pickles" },
  { name: "Pooja Samagri", handle: "pooja-samagri" },
  { name: "Household & Personal Care", handle: "household-personal-care" },
]

export const PHASE_ONE_CHILD_CATEGORIES: PhaseOneCategory[] = [
  { name: "Fruits", handle: "fruits", parentHandle: "fresh-produce" },
  { name: "Vegetables", handle: "vegetables", parentHandle: "fresh-produce" },
  { name: "Rice & Grains", handle: "rice-grains", parentHandle: "groceries" },
  { name: "Pulses & Lentils", handle: "pulses-lentils", parentHandle: "groceries" },
  { name: "Flour & Staples", handle: "flour-staples", parentHandle: "groceries" },
  { name: "Salt & Sugar", handle: "salt-sugar", parentHandle: "groceries" },
  { name: "Ground Spices", handle: "ground-spices", parentHandle: "spices" },
  { name: "Whole Spices", handle: "whole-spices", parentHandle: "spices" },
  { name: "Mango Pickles", handle: "mango-pickles", parentHandle: "minara-pickles" },
  { name: "Mixed Pickles", handle: "mixed-pickles", parentHandle: "minara-pickles" },
  { name: "Citrus Pickles", handle: "citrus-pickles", parentHandle: "minara-pickles" },
  { name: "Incense & Dhoop", handle: "incense-dhoop", parentHandle: "pooja-samagri" },
  { name: "Puja Essentials", handle: "puja-essentials", parentHandle: "pooja-samagri" },
  { name: "Household Care", handle: "household-care", parentHandle: "household-personal-care" },
  { name: "Personal Care", handle: "personal-care", parentHandle: "household-personal-care" },
]

const baseMetadata = {
  seed_catalog: "phase-1-1",
  catalogue_status: "representative",
}

export const PHASE_ONE_PRODUCTS: PhaseOneProduct[] = [
  {
    title: "Classic Mango Pickle",
    handle: "classic-mango-pickle",
    subtitle: "MINARA signature pickle range",
    description:
      "A representative MINARA pickle product used to validate pack-size selection, pricing, merchandising metadata and inventory behaviour.",
    categoryHandle: "mango-pickles",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      ingredients: "Raw mango, edible oil, salt and spices",
      shelf_life: "12 months",
      storage: "Store in a cool, dry place. Use a clean, dry spoon.",
      origin: "India",
      featured: true,
      popular: true,
      minara_owned: true,
      badge: "Signature range",
    },
    variants: [
      { title: "250g", packSize: "250g", sku: "MNR-PKL-MANGO-250G", price: 149, stock: 42 },
      { title: "500g", packSize: "500g", sku: "MNR-PKL-MANGO-500G", price: 279, stock: 18 },
      { title: "1kg", packSize: "1kg", sku: "MNR-PKL-MANGO-1KG", price: 519, stock: 0 },
    ],
  },
  {
    title: "Mixed Vegetable Pickle",
    handle: "mixed-vegetable-pickle",
    subtitle: "Classic mixed pickle",
    description:
      "A balanced mixed-pickle catalogue example with two pack sizes and independently tracked stock.",
    categoryHandle: "mixed-pickles",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      ingredients: "Mixed vegetables, edible oil, salt and spices",
      shelf_life: "12 months",
      storage: "Store in a cool, dry place after opening.",
      origin: "India",
      featured: true,
      minara_owned: true,
      badge: "MINARA favourite",
    },
    variants: [
      { title: "250g", packSize: "250g", sku: "MNR-PKL-MIXED-250G", price: 139, stock: 28 },
      { title: "500g", packSize: "500g", sku: "MNR-PKL-MIXED-500G", price: 259, stock: 14 },
    ],
  },
  {
    title: "Lemon Pickle",
    handle: "lemon-pickle",
    subtitle: "Bright, tangy pantry staple",
    description:
      "A representative citrus pickle product used to exercise related-product and pack-size catalogue behaviour.",
    categoryHandle: "citrus-pickles",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      ingredients: "Lemon, salt and spices",
      shelf_life: "12 months",
      storage: "Keep tightly closed and away from direct sunlight.",
      origin: "India",
      popular: true,
      minara_owned: true,
    },
    variants: [
      { title: "250g", packSize: "250g", sku: "MNR-PKL-LEMON-250G", price: 129, stock: 22 },
      { title: "500g", packSize: "500g", sku: "MNR-PKL-LEMON-500G", price: 239, stock: 10 },
    ],
  },
  {
    title: "Lakadong Turmeric Powder",
    handle: "lakadong-turmeric-powder",
    subtitle: "Ground spice assortment",
    description:
      "Representative turmeric pricing and pack-size data for the MINARA spice catalogue.",
    categoryHandle: "ground-spices",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      ingredients: "Turmeric",
      shelf_life: "12 months",
      storage: "Store airtight in a cool, dry place.",
      origin: "India",
      featured: true,
      minara_owned: true,
      badge: "Kitchen essential",
    },
    variants: [
      { title: "100g", packSize: "100g", sku: "MNR-SPC-TURMERIC-100G", price: 79, stock: 48 },
      { title: "250g", packSize: "250g", sku: "MNR-SPC-TURMERIC-250G", price: 169, stock: 26 },
    ],
  },
  {
    title: "Kashmiri Red Chilli Powder",
    handle: "kashmiri-red-chilli-powder",
    subtitle: "Ground spice assortment",
    description:
      "Representative chilli-powder product data for category, pricing and stock-state testing.",
    categoryHandle: "ground-spices",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      ingredients: "Dried red chilli",
      shelf_life: "12 months",
      storage: "Store airtight and protect from moisture.",
      origin: "India",
      popular: true,
      minara_owned: true,
    },
    variants: [
      { title: "100g", packSize: "100g", sku: "MNR-SPC-CHILLI-100G", price: 89, stock: 36 },
      { title: "250g", packSize: "250g", sku: "MNR-SPC-CHILLI-250G", price: 189, stock: 17 },
    ],
  },
  {
    title: "Coriander Powder",
    handle: "coriander-powder",
    subtitle: "Everyday spice essential",
    description:
      "A representative everyday spice with two pack sizes and independently managed inventory.",
    categoryHandle: "ground-spices",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      ingredients: "Coriander seeds",
      shelf_life: "12 months",
      storage: "Store airtight in a cool, dry place.",
      origin: "India",
      minara_owned: true,
    },
    variants: [
      { title: "100g", packSize: "100g", sku: "MNR-SPC-CORIANDER-100G", price: 69, stock: 44 },
      { title: "250g", packSize: "250g", sku: "MNR-SPC-CORIANDER-250G", price: 149, stock: 21 },
    ],
  },
  {
    title: "Premium Basmati Rice",
    handle: "premium-basmati-rice",
    subtitle: "Daily pantry staple",
    description:
      "Representative rice product for large-pack pricing, inventory and grocery-category behaviour.",
    categoryHandle: "rice-grains",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      shelf_life: "18 months",
      storage: "Store in a clean, dry and airtight container.",
      origin: "India",
      featured: true,
      minara_owned: true,
      badge: "Pantry staple",
    },
    variants: [
      { title: "1kg", packSize: "1kg", sku: "MNR-GRC-RICE-1KG", price: 179, stock: 32 },
      { title: "5kg", packSize: "5kg", sku: "MNR-GRC-RICE-5KG", price: 829, stock: 8 },
    ],
  },
  {
    title: "Toor Dal",
    handle: "toor-dal",
    subtitle: "Pulses & lentils",
    description:
      "Representative pulse product used to validate grocery navigation and pack-size pricing.",
    categoryHandle: "pulses-lentils",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      shelf_life: "12 months",
      storage: "Store in a cool, dry place in an airtight container.",
      origin: "India",
      popular: true,
      minara_owned: true,
    },
    variants: [
      { title: "500g", packSize: "500g", sku: "MNR-GRC-TOOR-500G", price: 109, stock: 35 },
      { title: "1kg", packSize: "1kg", sku: "MNR-GRC-TOOR-1KG", price: 209, stock: 16 },
    ],
  },
  {
    title: "Whole Wheat Atta",
    handle: "whole-wheat-atta",
    subtitle: "Flour & staples",
    description:
      "Representative flour product for household-size variants and stock-aware pricing.",
    categoryHandle: "flour-staples",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      ingredients: "Whole wheat",
      shelf_life: "6 months",
      storage: "Store sealed away from moisture and heat.",
      origin: "India",
      minara_owned: true,
    },
    variants: [
      { title: "1kg", packSize: "1kg", sku: "MNR-GRC-ATTA-1KG", price: 69, stock: 40 },
      { title: "5kg", packSize: "5kg", sku: "MNR-GRC-ATTA-5KG", price: 319, stock: 11 },
    ],
  },
  {
    title: "Himalayan Pink Salt",
    handle: "himalayan-pink-salt",
    subtitle: "Single-variant catalogue case",
    description:
      "A single-variant grocery product used to verify that the storefront does not assume every product has multiple packs.",
    categoryHandle: "salt-sugar",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      shelf_life: "24 months",
      storage: "Keep dry and tightly sealed.",
      origin: "India",
      minara_owned: true,
    },
    variants: [
      { title: "1kg", packSize: "1kg", sku: "MNR-GRC-SALT-1KG", price: 119, stock: 37 },
    ],
  },
  {
    title: "Farm Fresh Tomatoes",
    handle: "farm-fresh-tomatoes",
    subtitle: "Fresh vegetable assortment",
    description:
      "Representative fresh-produce data with deliberately sparse optional metadata to validate clean empty states.",
    categoryHandle: "vegetables",
    metadata: {
      ...baseMetadata,
      brand: "Catalogue Sample",
      origin: "India",
      popular: true,
    },
    variants: [
      { title: "500g", packSize: "500g", sku: "MNR-FRS-TOMATO-500G", price: 39, stock: 25 },
      { title: "1kg", packSize: "1kg", sku: "MNR-FRS-TOMATO-1KG", price: 69, stock: 9 },
    ],
  },
  {
    title: "Banana Value Pack",
    handle: "banana-value-pack",
    subtitle: "Fresh fruit assortment",
    description:
      "Representative fresh-fruit product for quantity-style pack labels and availability testing.",
    categoryHandle: "fruits",
    metadata: {
      ...baseMetadata,
      brand: "Catalogue Sample",
      storage: "Keep at room temperature and consume fresh.",
      origin: "India",
    },
    variants: [
      { title: "6 pcs", packSize: "6 pcs", sku: "MNR-FRS-BANANA-6PC", price: 49, stock: 31 },
      { title: "12 pcs", packSize: "12 pcs", sku: "MNR-FRS-BANANA-12PC", price: 89, stock: 12 },
    ],
  },
  {
    title: "Premium Incense Sticks",
    handle: "premium-incense-sticks",
    subtitle: "Pooja samagri assortment",
    description:
      "Representative pooja-samagri item used to validate category styling and non-food product metadata.",
    categoryHandle: "incense-dhoop",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      storage: "Keep dry and away from direct moisture.",
      origin: "India",
      featured: true,
      minara_owned: true,
      badge: "Pooja essential",
    },
    variants: [
      { title: "20 sticks", packSize: "20 sticks", sku: "MNR-PUJ-INCENSE-20", price: 59, stock: 50 },
      { title: "40 sticks", packSize: "40 sticks", sku: "MNR-PUJ-INCENSE-40", price: 99, stock: 24 },
    ],
  },
  {
    title: "Pure Camphor Tablets",
    handle: "pure-camphor-tablets",
    subtitle: "Puja essentials",
    description:
      "Representative camphor item with weight-based variants for the pooja catalogue.",
    categoryHandle: "puja-essentials",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      storage: "Store sealed in a cool and dry place.",
      origin: "India",
      minara_owned: true,
    },
    variants: [
      { title: "50g", packSize: "50g", sku: "MNR-PUJ-CAMPHOR-50G", price: 79, stock: 29 },
      { title: "100g", packSize: "100g", sku: "MNR-PUJ-CAMPHOR-100G", price: 139, stock: 13 },
    ],
  },
  {
    title: "Natural Dishwash Bar",
    handle: "natural-dishwash-bar",
    subtitle: "Household care",
    description:
      "Representative household-care product for non-food catalogue and inventory behaviour.",
    categoryHandle: "household-care",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      storage: "Keep dry between uses.",
      origin: "India",
      minara_owned: true,
    },
    variants: [
      { title: "200g", packSize: "200g", sku: "MNR-HOM-DISH-200G", price: 45, stock: 46 },
      { title: "400g", packSize: "400g", sku: "MNR-HOM-DISH-400G", price: 79, stock: 20 },
    ],
  },
  {
    title: "Herbal Handwash",
    handle: "herbal-handwash",
    subtitle: "Personal care",
    description:
      "Representative personal-care product for volume variants and low-stock UI states.",
    categoryHandle: "personal-care",
    metadata: {
      ...baseMetadata,
      brand: "MINARA NATURALS",
      storage: "Store at room temperature away from direct sunlight.",
      origin: "India",
      minara_owned: true,
      badge: "Daily care",
    },
    variants: [
      { title: "250ml", packSize: "250ml", sku: "MNR-PER-HANDWASH-250ML", price: 99, stock: 16 },
      { title: "500ml", packSize: "500ml", sku: "MNR-PER-HANDWASH-500ML", price: 179, stock: 4 },
    ],
  },
]
