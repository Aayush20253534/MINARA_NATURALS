"use client";
import Link from "next/link";
import { BagIcon, ArrowIcon } from "@/components/ui/icons";
import { Drawer } from "@/components/ui/drawer";
import { catalogProductImage } from "@/lib/catalog";
import { money, type CartItem } from "@/lib/commerce";
import { ProductImage } from "./product-image";
import { useCart } from "./cart-provider";
import styles from "./cart.module.css";

export function CartButton() {
  const { cart, loaded, setOpen } = useCart();
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return (
    <button
      type="button"
      className={styles.bagButton}
      onClick={() => setOpen(true)}
      aria-label={
        loaded
          ? `Shopping bag, ${count} ${count === 1 ? "item" : "items"}`
          : "Shopping bag"
      }
    >
      <BagIcon />
      <span className={styles.bagLabel}>My bag</span>
      <span className={styles.count}>{loaded ? count : "–"}</span>
    </button>
  );
}
export function CartDrawer() {
  const { open, setOpen } = useCart();
  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title="Your shopping bag"
      side="right"
    >
      <CartContents compact onNavigate={() => setOpen(false)} />
    </Drawer>
  );
}
function LineItem({
  item,
  currency,
  onNavigate,
}: {
  item: CartItem;
  currency: string;
  onNavigate?: () => void;
}) {
  const { pending, mutate } = useCart();
  const label = `${item.product_title}, ${item.variant_title}`;
  const overStock =
    item.stock.state !== "unknown" && item.quantity > item.stock.limit;
  const href = item.product_handle
    ? `/product/${encodeURIComponent(item.product_handle)}?variant=${encodeURIComponent(item.variant_id)}`
    : null;
  const title = (
    <>
      <strong>{item.product_title}</strong>
      <span>Pack: {item.variant_title}</span>
    </>
  );
  return (
    <li className={styles.item}>
      <div className={styles.itemImage}>
        <ProductImage
          src={catalogProductImage({
            id: item.product_id,
            title: item.product_title,
            handle: item.product_handle ?? "",
            thumbnail: item.thumbnail,
          })}
          alt={item.product_title}
        />
      </div>
      <div className={styles.itemBody}>
        {href ? (
          <Link className={styles.itemTitle} href={href} onClick={onNavigate}>
            {title}
          </Link>
        ) : (
          <div className={styles.itemTitle}>{title}</div>
        )}
        <p className={styles.unitPrice}>
          {money(item.unit_price, currency)} each
        </p>
        {overStock && (
          <p className={styles.stockWarning} role="status">
            {item.stock.limit > 0
              ? `Only ${item.stock.limit} available. Please reduce the quantity.`
              : "Currently unavailable. Please remove this item."}
          </p>
        )}
        <div className={styles.itemControls}>
          <div className={styles.quantity}>
            <button
              type="button"
              aria-label={`Decrease quantity of ${label}`}
              disabled={pending || item.quantity <= 1}
              onClick={() =>
                void mutate({
                  action: "update",
                  itemId: item.id,
                  quantity: item.quantity - 1,
                })
              }
            >
              −
            </button>
            <select
              aria-label={`Quantity for ${label}`}
              value={item.quantity}
              disabled={pending}
              onChange={(e) =>
                void mutate({
                  action: "update",
                  itemId: item.id,
                  quantity: Number(e.target.value),
                })
              }
            >
              {Array.from(
                {
                  length: Math.max(
                    item.quantity,
                    item.stock.state === "unknown" ? 99 : item.stock.limit,
                    1,
                  ),
                },
                (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ),
              )}
            </select>
            <button
              type="button"
              aria-label={`Increase quantity of ${label}`}
              disabled={
                pending ||
                item.quantity >=
                  (item.stock.state === "unknown" ? 99 : item.stock.limit)
              }
              onClick={() =>
                void mutate({
                  action: "update",
                  itemId: item.id,
                  quantity: item.quantity + 1,
                })
              }
            >
              +
            </button>
          </div>
          <button
            type="button"
            className={styles.remove}
            disabled={pending}
            aria-label={`Remove ${label}`}
            onClick={() => void mutate({ action: "remove", itemId: item.id })}
          >
            Remove
          </button>
        </div>
      </div>
      <strong className={styles.lineTotal}>
        {money(item.total, currency)}
      </strong>
    </li>
  );
}
export function CartContents({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { cart, loaded, pending, error, notice, refresh } = useCart();
  const hasItems = Boolean(cart?.items.length);
  return (
    <div
      className={`${styles.contents} ${compact ? styles.compact : ""}`}
      aria-busy={pending || !loaded}
    >
      <div aria-live="polite" className={styles.srStatus}>
        {pending
          ? "Updating your bag…"
          : loaded && hasItems
            ? "Bag updated."
            : ""}
      </div>
      {error && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => void refresh()}
          >
            Refresh bag
          </button>
        </div>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      {!loaded ? (
        <div className={styles.loading}>
          <div className="ui-skeleton" />
          <div className="ui-skeleton" />
          <p>Loading your bag…</p>
        </div>
      ) : !hasItems ? (
        <div className={styles.empty}>
          <BagIcon width={46} height={46} />
          <h2>
            {error ? "Let’s reconnect your bag." : "Good things belong here."}
          </h2>
          <p>
            {error
              ? "Your saved items will appear once the shop reconnects."
              : "Your bag is empty. Find a favourite and make it yours."}
          </p>
          <Link
            href="/shop"
            className="link-button link-button--primary"
            onClick={onNavigate}
          >
            Explore the shop <ArrowIcon width={17} height={17} />
          </Link>
        </div>
      ) : (
        cart && (
          <div className={styles.cartGrid}>
            <div>
              <div className={styles.listHeading}>
                <span>YOUR SELECTION</span>
                <span>
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0) ===
                  1
                    ? "item"
                    : "items"}
                </span>
              </div>
              <ul className={styles.items}>
                {cart.items.map((item) => (
                  <LineItem
                    key={item.id}
                    item={item}
                    currency={cart.currency_code}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
              <Link
                className={styles.continue}
                href="/shop"
                onClick={onNavigate}
              >
                ← Continue shopping
              </Link>
            </div>
            <aside className={styles.summary} aria-label="Bag summary">
              <p className="eyebrow">A few good choices</p>
              <h2>Bag summary</h2>
              <dl>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(cart.subtotal, cart.currency_code)}</dd>
                </div>
                {cart.discount_total > 0 && (
                  <div>
                    <dt>Discounts</dt>
                    <dd>−{money(cart.discount_total, cart.currency_code)}</dd>
                  </div>
                )}
                <div>
                  <dt>Tax calculated so far</dt>
                  <dd>{money(cart.tax_total, cart.currency_code)}</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>
                    {cart.shipping_total > 0
                      ? money(cart.shipping_total, cart.currency_code)
                      : "Not selected"}
                  </dd>
                </div>
                {Boolean(cart.credit_total) && (
                  <div>
                    <dt>Credits</dt>
                    <dd>−{money(cart.credit_total!, cart.currency_code)}</dd>
                  </div>
                )}
                <div className={styles.total}>
                  <dt>Current total</dt>
                  <dd data-testid="cart-total">
                    {money(cart.total, cart.currency_code)}
                  </dd>
                </div>
              </dl>
              <p className={styles.summaryNote}>
                Delivery and final taxes depend on your address. Items aren’t
                reserved until an order is placed.
              </p>
              {compact ? (
                <Link
                  className="link-button link-button--primary"
                  href="/cart"
                  onClick={onNavigate}
                >
                  View your bag <ArrowIcon width={17} height={17} />
                </Link>
              ) : (
                <Link
                  href="/checkout"
                  className="link-button link-button--primary"
                >
                  Continue to checkout <ArrowIcon width={17} height={17} />
                </Link>
              )}
            </aside>
          </div>
        )
      )}
    </div>
  );
}
