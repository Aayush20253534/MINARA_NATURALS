// Isolated test-only Store API. Never imported by the application or used in production.
import http from "node:http";
import { customerFixture } from "./qa-customer.mjs";
import { randomUUID } from "node:crypto";
import {
  PHASE_ONE_PRODUCTS,
  PHASE_ONE_ROOT_CATEGORIES,
  PHASE_ONE_CHILD_CATEGORIES,
} from "../../server/src/data/phase-one-catalog.ts";
import { queryCatalogue } from "../../server/src/utils/catalogue.ts";
const categories = [
  ...PHASE_ONE_ROOT_CATEGORIES,
  ...PHASE_ONE_CHILD_CATEGORIES,
].map((c) => ({
  id: c.handle,
  name: c.name,
  handle: c.handle,
  parent_category_id: c.parentHandle || null,
}));
const products = PHASE_ONE_PRODUCTS.map((p, i) => ({
  ...p,
  id: `product_${i}`,
  categories: categories.filter((c) => c.handle === p.categoryHandle),
  variants: p.variants.map((v, j) => ({
    id: `variant_${i}_${j}`,
    title: v.title,
    sku: v.sku,
    manage_inventory: true,
    allow_backorder: false,
    inventory_quantity: v.stock,
    calculated_price: { calculated_amount: v.price, currency_code: "inr" },
  })),
}));
const carts = new Map();
let failNextMutation = false;
let failAfterWrite = false;
const json = (res, data, status = 200) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};
function totals(cart) {
  cart.items.forEach((item) => {
    item.total = item.unit_price * item.quantity;
  });
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.total, 0);
  cart.discount_total = 0;
  cart.tax_total = 0;
  cart.shipping_total = (cart.shipping_methods || []).reduce((sum,m)=>sum+m.amount,0);
  cart.item_subtotal = cart.subtotal;
  cart.shipping_subtotal = cart.shipping_total;
  cart.discount_subtotal = 0;
  cart.credit_line_total = 0;
  cart.subtotal += cart.shipping_subtotal;
  cart.total = cart.subtotal;
  return cart;
}
const handleCustomer = customerFixture({carts,products,json,totals});
http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1:9101");
    let body = {};
    if (req.method !== "GET") {
      let text = "";
      for await (const chunk of req) text += chunk;
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        return json(res, {}, 400);
      }
    }
    if (await handleCustomer(req,res,url,body)) return;
    if (url.pathname === "/__qa/control") {
      if (body.variantId) {
        const variant = products
          .flatMap((p) => p.variants)
          .find((v) => v.id === body.variantId);
        if (variant) variant.inventory_quantity = body.stock;
      }
      if (body.productId) {
        const product = products.find((p) => p.id === body.productId);
        if (product) {
          if (body.images) product.images = body.images.map((url) => ({ url }));
          if (body.mrp) product.metadata.mrp_by_sku = body.mrp;
        }
      }
      if (body.failNextMutation) failNextMutation = true;
      if (body.failAfterWrite) failAfterWrite = true;
      return json(res, { ok: true });
    }
    if (url.pathname === "/store/minara/catalogue") {
      const input = Object.fromEntries(url.searchParams);
      for (const key of ["brand", "pack"])
        input[key] = url.searchParams.getAll(key);
      for (const key of ["min", "max", "page", "limit"])
        if (input[key] !== undefined) input[key] = Number(input[key]);
      return json(
        res,
        queryCatalogue(products, categories, { page: 1, limit: 12, ...input }),
      );
    }
    if (url.pathname === "/store/regions")
      return json(res, {
        regions: [
          { id: "india", currency_code: "inr", countries: [{ iso_2: "in" }] },
        ],
      });
    if (url.pathname === "/store/products") {
      const ids = url.searchParams.getAll("id[]");
      return json(res, {
        products: products.filter((p) =>
          ids.length
            ? ids.includes(p.id)
            : p.handle === url.searchParams.get("handle"),
        ),
      });
    }
    if (url.pathname === "/store/carts" && req.method === "POST") {
      const cart = totals({
        id: `cart_${randomUUID()}`,
        region_id: "india",
        currency_code: "inr",
        completed_at: null,
        items: [],
        shipping_methods: [],
      });
      carts.set(cart.id, cart);
      return json(res, { cart });
    }
    const route = url.pathname.match(
      /^\/store\/carts\/(cart_[\w-]+)(?:\/line-items(?:\/([\w-]+))?)?$/,
    );
    if (route) {
      const cart = carts.get(route[1]);
      if (!cart) return json(res, { message: "Cart not found" }, 404);
      if (req.method === "GET") return json(res, { cart });
      if (failNextMutation) {
        failNextMutation = false;
        return json(res, { message: "Temporary server error" }, 503);
      }
      const lineId = route[2];
      if (req.method === "DELETE") {
        cart.items = cart.items.filter((item) => item.id !== lineId);
        return json(res, { id: lineId, deleted: true, parent: totals(cart) });
      }
      let item = lineId
        ? cart.items.find((line) => line.id === lineId)
        : cart.items.find((line) => line.variant_id === body.variant_id);
      const variantId = lineId ? item?.variant_id : body.variant_id;
      const product = products.find((p) =>
        p.variants.some((v) => v.id === variantId),
      );
      const variant = product?.variants.find((v) => v.id === variantId);
      if (!variant) return json(res, { message: "Variant not found" }, 400);
      const quantity = lineId
        ? body.quantity
        : (item?.quantity ?? 0) + body.quantity;
      if (quantity > variant.inventory_quantity)
        return json(res, { message: "Insufficient inventory" }, 400);
      if (!item) {
        item = {
          id: `cali_${randomUUID()}`,
          variant_id: variantId,
          product_id: product.id,
          product_title: product.title,
          product_handle: product.handle,
          variant_title: variant.title,
          thumbnail: null,
          unit_price: variant.calculated_price.calculated_amount,
        };
        cart.items.push(item);
      }
      item.quantity = quantity;
      totals(cart);
      if (failAfterWrite) {
        failAfterWrite = false;
        return json(res, { message: "Response lost after commit" }, 503);
      }
      return json(res, { cart });
    }
    json(res, {}, 404);
  })
  .listen(9101, "127.0.0.1", () =>
    console.log("Test catalogue and cart listening on 9101"),
  );
