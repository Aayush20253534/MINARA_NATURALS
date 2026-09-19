import { Migration } from "@medusajs/framework/mikro-orm/migrations";
export class Migration20260919000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "wishlist_item" ("id" text not null, "customer_id" text not null, "product_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wishlist_item_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create unique index if not exists "IDX_wishlist_customer_product" on "wishlist_item" ("customer_id", "product_id") where deleted_at IS NULL;`,
    );
    this.addSql(
      `create index if not exists "IDX_wishlist_item_deleted_at" on "wishlist_item" ("deleted_at") where deleted_at IS NULL;`,
    );
  }
  async down(): Promise<void> {
    this.addSql(`drop table if exists "wishlist_item" cascade;`);
  }
}
