"use client";
import { useSearchParams } from "next/navigation";
import { BagIcon } from "@/components/ui/icons";
import type { CatalogVariant } from "@/lib/catalog";
import { money, variantAvailability, variantPrice } from "@/lib/commerce";
import { useState } from "react";
import { useCart } from "./cart-provider";
import styles from "./product-detail.module.css";

function PurchaseActions({
  variant,
  mrp,
}: {
  variant?: CatalogVariant;
  mrp?: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const { cart, loaded, pending, error, mutate, setOpen } = useCart();
  const price = variantPrice(variant);
  const stock = variantAvailability(variant);
  const alreadyInBag =
    cart?.items.find((item) => item.variant_id === variant?.id)?.quantity ?? 0;
  const availableToAdd = Math.max(0, stock.limit - alreadyInBag);
  const canBuy = stock.state === "in" && price !== null;
  const original = variant?.calculated_price?.original_amount;
  const sale =
    variant?.calculated_price?.calculated_price?.price_list_type === "sale" &&
    typeof original === "number" &&
    price !== null &&
    original > price;
  const validMrp =
    typeof mrp === "number" &&
    Number.isFinite(mrp) &&
    price !== null &&
    mrp >= price;
  const selectedQuantity = Math.min(quantity, availableToAdd || 1);
  async function add() {
    if (!variant || !canBuy || !availableToAdd) return;
    if (
      await mutate({
        action: "add",
        variantId: variant.id,
        quantity: selectedQuantity,
      })
    )
      setOpen(true);
  }
  return (
    <>
      <div className={styles.priceRow} aria-live="polite">
        <strong data-testid="variant-price">
          {price !== null ? money(price) : "Price unavailable"}
        </strong>
        {validMrp ? (
          <span>
            MRP <del>{money(mrp)}</del>
          </span>
        ) : sale ? (
          <span>
            Regular price <del>{money(original)}</del>
          </span>
        ) : null}
      </div>
      <div className={styles.stock} data-state={stock.state} aria-live="polite">
        <span aria-hidden="true" />
        {stock.label}
        {variant?.sku && <small>SKU: {variant.sku}</small>}
      </div>
      <p className={styles.priceNote}>
        Final taxes and delivery are calculated at checkout.
      </p>
      {alreadyInBag > 0 && (
        <p className={styles.inBag}>
          {alreadyInBag} of this pack already in your bag.
        </p>
      )}
      <div className={styles.purchaseBar}>
        <div className={styles.quantity}>
          <button
            type="button"
            disabled={!canBuy || pending || selectedQuantity <= 1}
            onClick={() => setQuantity(selectedQuantity - 1)}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <select
            aria-label="Quantity"
            value={selectedQuantity}
            disabled={!canBuy || pending || !availableToAdd}
            onChange={(event) => setQuantity(Number(event.target.value))}
          >
            {Array.from({ length: Math.max(availableToAdd, 1) }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!canBuy || pending || selectedQuantity >= availableToAdd}
            onClick={() => setQuantity(selectedQuantity + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className={styles.addButton}
          disabled={!canBuy || pending || !loaded || !availableToAdd}
          onClick={() => void add()}
        >
          <BagIcon width={19} height={19} />
          {pending
            ? "Adding…"
            : !loaded
              ? "Loading bag…"
              : stock.state === "out"
                ? "Out of stock"
                : !canBuy
                  ? "Currently unavailable"
                  : !availableToAdd
                    ? "Maximum in bag"
                    : "Add to bag"}
        </button>
      </div>
      {error && (
        <p className={styles.purchaseError} role="alert">
          {error}{" "}
          <button type="button" onClick={() => setOpen(true)}>
            Open bag
          </button>
        </p>
      )}
      <p className={styles.purchaseNote}>
        Stock is checked again when you add to your bag.
      </p>
    </>
  );
}
export function ProductPurchase({
  variants,
  mrpBySku,
}: {
  variants: CatalogVariant[];
  mrpBySku: Record<string, number>;
}) {
  const params = useSearchParams();
  const wanted = params.get("variant");
  const selected =
    variants.find((v) => v.id === wanted) ??
    variants.find(
      (v) => variantAvailability(v).state === "in" && variantPrice(v) !== null,
    ) ??
    variants[0];
  function select(id: string) {
    const next = new URLSearchParams(params.toString());
    next.set("variant", id);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${next}`,
    );
  }
  return (
    <div className={styles.purchase}>
      <fieldset className={styles.packs}>
        <legend>
          Choose your pack <span>{selected?.title}</span>
        </legend>
        <div>
          {variants.map((variant) => (
            <label
              key={variant.id}
              className={styles.pack}
              data-unavailable={variantAvailability(variant).state !== "in"}
            >
              <input
                type="radio"
                name="pack"
                value={variant.id}
                checked={selected?.id === variant.id}
                onChange={() => select(variant.id)}
              />
              <span>{variant.title}</span>
              {variantAvailability(variant).state === "out" && (
                <small>Out of stock</small>
              )}
            </label>
          ))}
        </div>
      </fieldset>
      <PurchaseActions
        key={selected?.id ?? "none"}
        variant={selected}
        mrp={selected?.sku ? mrpBySku[selected.sku] : undefined}
      />
    </div>
  );
}
