import { model } from "@medusajs/framework/utils";
export const WishlistItem = model
  .define("wishlist_item", {
    id: model.id({ prefix: "wish" }).primaryKey(),
    customer_id: model.text(),
    product_id: model.text(),
  })
  .indexes([
    {
      name: "IDX_wishlist_customer_product",
      on: ["customer_id", "product_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ]);
