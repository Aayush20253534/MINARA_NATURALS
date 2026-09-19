"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/commerce";
import {
  safeReturn,
  type Address,
  type Customer,
  type Order,
} from "@/lib/customer";
import s from "./account.module.css";
export async function clientRequest<T>(
  url: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(45000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
export function Message({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return (
    <>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className={s.notice} role="status">
          {message}
        </p>
      )}
    </>
  );
}
export function AuthForm({
  mode,
  returnTo,
}: {
  mode: "login" | "register" | "forgot" | "reset";
  returnTo?: string;
}) {
  const router = useRouter();
  const token = useRef("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const next = safeReturn(returnTo);
  useEffect(() => {
    if (mode !== "reset") return;
    const readToken = () => {
      token.current =
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      window.history.replaceState(null, "", window.location.pathname);
    };
    readToken();
    const changed = () => {
      readToken();
      setMessage("");
      setError("");
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, [mode]);
  const title = {
    login: "Welcome back.",
    register: "Make yourself at home.",
    forgot: "A fresh start.",
    reset: "Choose a new password.",
  }[mode];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setPending(true);
    setError("");
    setMessage("");
    try {
      const data = await clientRequest<{ message?: string }>("/api/auth", {
        action: mode,
        ...fields,
        ...(mode === "reset" ? { token: token.current } : {}),
      });
      if (mode === "forgot") {
        setMessage(data.message || "Check your email for a reset link.");
        form.reset();
      } else if (mode === "reset") {
        setMessage("Your password has been changed. You can now sign in.");
        form.reset();
      } else {
        window.location.assign(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className={s.page}>
      <div className={s.auth}>
        <aside className={s.story}>
          <div>
            <div className={s.seal} aria-hidden="true">
              m
            </div>
            <p className="eyebrow">A little more care</p>
            <h2>
              Good things.
              <br />
              Closer to home.
            </h2>
            <p>
              Your everyday essentials, saved favourites and familiar flavours.
              All in one place.
            </p>
          </div>
          <Link href="/shop">Explore the shop ↗</Link>
        </aside>
        <section className={s.authForm}>
          <p className="eyebrow">Your MINARA account</p>
          <h1>{title}</h1>
          <p className={s.subtle}>
            {mode === "login"
              ? "Sign in to find your favourites and keep track of every order."
              : mode === "register"
                ? "A few details, and you’re part of the everyday."
                : mode === "forgot"
                  ? "Enter your account email. We’ll send you a secure reset link."
                  : "Use at least 12 characters. Your reset link works once and expires after 15 minutes."}
          </p>
          <Message error={error} message={message} />
          <form className={s.form} onSubmit={submit}>
            {mode === "register" && (
              <div className={s.row}>
                <label>
                  First name
                  <input
                    name="first_name"
                    autoComplete="given-name"
                    maxLength={100}
                    required
                  />
                </label>
                <label>
                  Last name
                  <input
                    name="last_name"
                    autoComplete="family-name"
                    maxLength={100}
                    required
                  />
                </label>
              </div>
            )}
            {mode !== "reset" && (
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </label>
            )}
            {mode !== "forgot" && (
              <label>
                Password
                <input
                  name="password"
                  aria-label="Password"
                  aria-describedby="password-help"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={mode === "login" ? undefined : 12}
                  maxLength={128}
                  required
                />
                <span id="password-help" className={s.subtle}>
                  {mode !== "login" &&
                    "At least 12 characters. Spaces and password managers are welcome."}
                </span>
              </label>
            )}
            {mode === "login" && (
              <Link className={s.textLink} href="/account/forgot-password">
                Forgot your password?
              </Link>
            )}
            <button
              className={s.button}
              disabled={pending || (mode === "reset" && Boolean(message))}
            >
              {pending
                ? "Please wait…"
                : {
                    login: "Sign in",
                    register: "Create account",
                    forgot: "Send reset link",
                    reset: "Save new password",
                  }[mode]}
            </button>
          </form>
          <div className={s.actions}>
            {mode === "login" ? (
              <Link
                className={s.textLink}
                href={`/account/register?next=${encodeURIComponent(next)}`}
              >
                New here? Create an account →
              </Link>
            ) : (
              <Link
                className={s.textLink}
                href={`/account/login?next=${encodeURIComponent(next)}`}
                onClick={() => router.refresh()}
              >
                Back to sign in →
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
export const blankAddress: Address = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "in",
  phone: "",
};
export function AddressFields({
  address = blankAddress,
}: {
  address?: Address;
}) {
  return (
    <>
      <div className={s.row}>
        <label>
          First name
          <input
            name="first_name"
            defaultValue={address.first_name}
            autoComplete="shipping given-name"
            required
            maxLength={100}
          />
        </label>
        <label>
          Last name
          <input
            name="last_name"
            defaultValue={address.last_name}
            autoComplete="shipping family-name"
            required
            maxLength={100}
          />
        </label>
      </div>
      <label>
        Address
        <input
          name="address_1"
          defaultValue={address.address_1}
          autoComplete="shipping address-line1"
          required
          maxLength={200}
        />
      </label>
      <label>
        Apartment, floor or landmark (optional)
        <input
          name="address_2"
          defaultValue={address.address_2}
          autoComplete="shipping address-line2"
          maxLength={200}
        />
      </label>
      <div className={s.row}>
        <label>
          City
          <input
            name="city"
            defaultValue={address.city}
            autoComplete="shipping address-level2"
            required
            maxLength={100}
          />
        </label>
        <label>
          State / union territory
          <input
            name="province"
            defaultValue={address.province}
            autoComplete="shipping address-level1"
            required
            maxLength={100}
          />
        </label>
      </div>
      <div className={s.row}>
        <label>
          PIN code
          <input
            name="postal_code"
            defaultValue={address.postal_code}
            autoComplete="shipping postal-code"
            inputMode="numeric"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            title="Enter a six-digit Indian PIN code"
            required
          />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            defaultValue={address.phone}
            autoComplete="shipping tel"
            minLength={10}
            maxLength={20}
            required
          />
        </label>
      </div>
      <input name="country_code" value="in" type="hidden" />
      <p className={s.subtle}>
        India · Delivery availability is checked at checkout.
      </p>
    </>
  );
}
export function AddressText({ address }: { address: Address }) {
  return (
    <address>
      {address.first_name} {address.last_name}
      <br />
      {address.address_1}
      {address.address_2 && <>, {address.address_2}</>}
      <br />
      {address.city}, {address.province} {address.postal_code}
      <br />
      {address.phone}
    </address>
  );
}
export function AccountNav({ active }: { active: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function logout() {
    setPending(true);
    try {
      await clientRequest("/api/auth", { action: "logout" });
      window.location.assign(new URL("/account/login", window.location.origin));
    } catch {
      setError("Couldn’t sign out. Please try again.");
      setPending(false);
    }
  }
  return (
    <nav className={s.nav} aria-label="Your account">
      {[
        ["Profile", "/account"],
        ["Addresses", "/account/addresses"],
        ["Orders", "/account/orders"],
        ["Wishlist", "/account/wishlist"],
      ].map(([label, href]) => (
        <Link
          key={href}
          href={href}
          aria-current={active === label ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
      <button onClick={logout} disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <span role="alert">{error}</span>}
    </nav>
  );
}
export function ProfileForm({ customer }: { customer: Customer }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      await clientRequest("/api/account", {
        action: "profile",
        ...Object.fromEntries(new FormData(e.currentTarget)),
      });
      setMessage("Your details have been saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className={s.panel}>
      <h2>Your details</h2>
      <Message error={error} message={message} />
      <form className={s.form} onSubmit={submit}>
        <div className={s.row}>
          <label>
            First name
            <input
              name="first_name"
              defaultValue={customer.first_name}
              autoComplete="given-name"
              maxLength={100}
              required
            />
          </label>
          <label>
            Last name
            <input
              name="last_name"
              defaultValue={customer.last_name}
              autoComplete="family-name"
              maxLength={100}
              required
            />
          </label>
        </div>
        <label>
          Email address
          <input value={customer.email} disabled />
          <span className={s.subtle}>
            Your sign-in email is linked to this account.
          </span>
        </label>
        <label>
          Phone number (optional)
          <input
            name="phone"
            type="tel"
            defaultValue={customer.phone || ""}
            autoComplete="tel"
            maxLength={20}
          />
        </label>
        <div className={s.actions}>
          <button className={s.button} disabled={pending}>
            {pending ? "Saving…" : "Save details"}
          </button>
          <Link className={s.textLink} href="/account/forgot-password">
            Reset password
          </Link>
        </div>
      </form>
    </section>
  );
}
export function Addresses({ initial }: { initial: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Address | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await clientRequest("/api/account", {
        action: "address-save",
        ...(editing?.id ? { id: editing.id } : {}),
        address: Object.fromEntries(new FormData(e.currentTarget)),
      });
      setEditing(null);
      setMessage("Address saved.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Remove this saved address?")) return;
    setPending(true);
    setError("");
    try {
      await clientRequest("/api/account", { action: "address-delete", id });
      setMessage("Address removed.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className={s.panel}>
      <h2>Your address book</h2>
      <Message error={error} message={message} />
      {editing ? (
        <form key={editing.id || "new"} className={s.form} onSubmit={save}>
          <AddressFields address={editing} />
          <div className={s.actions}>
            <button className={s.button} disabled={pending}>
              {pending ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              className={s.secondary}
              onClick={() => setEditing(null)}
              disabled={pending}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className={s.cards}>
            {initial.map((address) => (
              <div className={s.card} key={address.id}>
                <AddressText address={address} />
                <div className={s.actions}>
                  <button
                    className={s.textLink}
                    disabled={pending}
                    onClick={() => {
                      setEditing(address);
                      setMessage("");
                    }}
                  >
                    Edit address
                  </button>
                  <button
                    className={s.textLink}
                    disabled={pending}
                    onClick={() => remove(address.id!)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!initial.length && (
            <div className={s.empty}>
              <h3>A place for your good things.</h3>
              <p>Save an address to make your next checkout easier.</p>
            </div>
          )}
          <button
            className={s.button}
            style={{ marginTop: 20 }}
            disabled={pending}
            onClick={() => {
              setEditing({ ...blankAddress });
              setMessage("");
            }}
          >
            Add an address
          </button>
        </>
      )}
    </section>
  );
}
export function Totals({
  order,
}: {
  order: Pick<
    Order,
    | "item_subtotal"
    | "shipping_subtotal"
    | "tax_total"
    | "discount_subtotal"
    | "credit_line_total"
    | "total"
    | "currency_code"
  >;
}) {
  return (
    <dl className={s.totals}>
      {[
        ["Items", order.item_subtotal],
        ...(order.discount_subtotal > 0
          ? [["Discounts", -order.discount_subtotal]]
          : []),
        ["Delivery", order.shipping_subtotal],
        ["Tax", order.tax_total],
        ...(order.credit_line_total > 0
          ? [["Credits", -order.credit_line_total]]
          : []),
        ["Total", order.total],
      ].map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{money(Number(value), order.currency_code)}</dd>
        </div>
      ))}
    </dl>
  );
}
export function OrderDetail({ order }: { order: Order }) {
  return (
    <>
      <section className={s.panel}>
        <div className={s.actions}>
          <h2>Order #{order.display_id}</h2>
          <span className={s.badge}>{order.status.replaceAll("_", " ")}</span>
        </div>
        <p className={s.subtle}>
          Placed{" "}
          {new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className={s.subtle}>
          Payment: {order.payment_status.replaceAll("_", " ")} · Delivery:{" "}
          {order.fulfillment_status.replaceAll("_", " ")}
        </p>
        {order.items.map((item) => (
          <div className={s.order} key={item.id}>
            <div>
              <strong>{item.product_title}</strong>
              <small>
                {item.variant_title} · Qty {item.quantity}
              </small>
            </div>
            <strong>{money(item.total, order.currency_code)}</strong>
          </div>
        ))}
        <Totals order={order} />
      </section>
      {order.shipping_address && (
        <section className={s.panel}>
          <h2>Delivery address</h2>
          <AddressText address={order.shipping_address} />
        </section>
      )}
      <section className={s.panel}>
        <h2>Track your order</h2>
        {order.fulfillments?.filter((f) => !f.canceled_at).length ? (
          order.fulfillments
            .filter((f) => !f.canceled_at)
            .map((f) => (
              <div className={s.tracking} key={f.id}>
                <strong>
                  {f.delivered_at
                    ? "Delivered"
                    : f.shipped_at
                      ? "On its way"
                      : "Being prepared"}
                </strong>
                {f.labels?.map((label, i) => {
                  let safe = false;
                  try {
                    safe = new URL(label.tracking_url).protocol === "https:";
                  } catch {}
                  return (
                    <p key={i}>
                      {safe ? (
                        <a
                          href={label.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Track parcel · {label.tracking_number} ↗
                        </a>
                      ) : (
                        <>Tracking reference: {label.tracking_number}</>
                      )}
                    </p>
                  );
                })}
              </div>
            ))
        ) : (
          <p className={s.subtle}>
            {order.status === "canceled"
              ? "This order was cancelled."
              : "Tracking details will appear here once your order is dispatched."}
          </p>
        )}
      </section>
    </>
  );
}
export type SavedProduct = {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string;
};
export function Wishlist({ initial }: { initial: SavedProduct[] }) {
  const [products, setProducts] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  async function remove(id: string) {
    setPending(id);
    setError("");
    try {
      await clientRequest("/api/account", {
        action: "wishlist",
        product_id: id,
        saved: false,
      });
      setProducts((p) => p.filter((i) => i.id !== id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending("");
    }
  }
  return (
    <section className={s.panel}>
      <h2>Saved for another day</h2>
      <Message error={error} />
      {products.length ? (
        <div className={s.cards}>
          {products.map((p) => (
            <article className={s.card} key={p.id}>
              <h3>
                <Link href={`/product/${p.handle}`}>{p.title}</Link>
              </h3>
              <p>Choose your pack and see current availability.</p>
              <div className={s.actions}>
                <Link className={s.textLink} href={`/product/${p.handle}`}>
                  View product →
                </Link>
                <button
                  className={s.textLink}
                  disabled={Boolean(pending)}
                  onClick={() => remove(p.id)}
                >
                  {pending === p.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={s.empty}>
          <h2>A little list of good things.</h2>
          <p>
            Save products from their product page and find them here next time.
          </p>
          <Link className={s.button} href="/shop">
            Explore the shop
          </Link>
        </div>
      )}
    </section>
  );
}
export function WishlistButton({ productId }: { productId: string }) {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    clientRequest<{ products: SavedProduct[] }>("/api/account?view=wishlist")
      .then((d) => {
        if (live) setSaved(d.products.some((p) => p.id === productId));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [productId]);
  async function save() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "wishlist",
          product_id: productId,
          saved: !saved,
        }),
      });
      if (response.status === 401) {
        window.location.assign(
          new URL("/account/login", window.location.origin),
        );
        return;
      }
      const d = await response.json();
      if (!response.ok) throw new Error(d.error);
      setSaved(!saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <button
        className={s.wishlistButton}
        aria-pressed={saved}
        disabled={pending}
        onClick={save}
      >
        {pending
          ? "Saving…"
          : saved
            ? "♥ Saved to your wishlist"
            : "♡ Save to wishlist"}
      </button>
      <Message error={error} />
    </>
  );
}
