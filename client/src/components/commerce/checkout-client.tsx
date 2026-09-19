"use client";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { money } from "@/lib/commerce";
import type { CheckoutState } from "@/lib/checkout";
import type { Address } from "@/lib/customer";
import {
  AddressFields,
  AddressText,
  blankAddress,
  clientRequest,
  Message,
  Totals,
} from "./account-client";
import s from "./account.module.css";
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: () => void;
  modal: { ondismiss: () => void };
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (name: string, handler: () => void) => void;
    };
  }
}
let gatewayScript: Promise<void> | undefined;
function loadGateway() {
  if (window.Razorpay) return Promise.resolve();
  if (!gatewayScript)
    gatewayScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      const timeout = window.setTimeout(() => { gatewayScript = undefined; script.remove(); reject(new Error("The payment window took too long to load. Please try again.")); }, 30000);
      script.onload = () => {
        window.clearTimeout(timeout);
        if (window.Razorpay) resolve();
        else {
          gatewayScript = undefined;
          reject(new Error("Payment window is unavailable."));
        }
      };
      script.onerror = () => {
        window.clearTimeout(timeout);
        gatewayScript = undefined;
        script.remove();
        reject(
          new Error(
            "Couldn’t load the payment window. Check your connection and try again.",
          ),
        );
      };
      document.body.appendChild(script);
    });
  return gatewayScript;
}
export function Checkout() {
  const [state, setState] = useState<CheckoutState | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState("");
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState("new");
  const active = useRef(false);
  const refresh = useCallback(async () => {
    const data = await clientRequest<CheckoutState>("/api/checkout");
    setState(data);
    return data;
  }, []);
  useEffect(() => {
    let live = true;
    clientRequest<CheckoutState>("/api/checkout")
      .then((d) => {
        if (live) setState(d);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  async function action(body: unknown) {
    setError("");
    setMessage("");
    setPending("saving");
    try {
      await clientRequest("/api/checkout", body);
      await refresh();
      setEditing(false);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setPending("");
    }
  }
  async function saveAddress(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await action({
      action: "address",
      address: Object.fromEntries(new FormData(e.currentTarget)),
    });
  }
  async function complete() {
    if (active.current) return;
    active.current = true;
    setError("");
    setPending("confirming");
    try {
      const result = await clientRequest<{ order_id: string }>(
        "/api/checkout",
        { action: "complete" },
      );
      window.location.assign(
        new URL(
          `/checkout/confirmation/${encodeURIComponent(result.order_id)}`,
          window.location.origin,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
      await refresh().catch(() => {});
      setPending("");
    } finally {
      active.current = false;
    }
  }
  async function pay() {
    if (active.current) return;
    active.current = true;
    setPending("opening");
    setError("");
    setMessage("");
    try {
      // After an earlier attempt, reconcile with Medusa before allowing another gateway window.
      if (state?.locked) {
        try {
          const result = await clientRequest<{ order_id: string }>(
            "/api/checkout",
            { action: "complete" },
          );
          window.location.assign(
            new URL(
              `/checkout/confirmation/${result.order_id}`,
              window.location.origin,
            ),
          );
          return;
        } catch {
          /* Native authorization remains pending; reopening the same Razorpay order cannot double-pay it. */
        }
      }
      await loadGateway();
      const payment = await clientRequest<{
        order_id: string;
        amount: number;
        currency: string;
        key_id: string;
      }>("/api/checkout", { action: "payment" });
      await refresh();
      let submitted = false;
      const checkout = new window.Razorpay!({
        key: payment.key_id,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.order_id,
        name: "MINARA NATURALS",
        description: "Your everyday essentials",
        prefill: {
          name: `${state!.customer.first_name} ${state!.customer.last_name}`,
          email: state!.customer.email,
          contact: state!.cart?.shipping_address?.phone || "",
        },
        theme: { color: "#123d2a" },
        handler: () => {
          if (submitted) return;
          submitted = true;
          active.current = false;
          void complete();
        },
        modal: {
          ondismiss: () => {
            if (submitted) return;
            active.current = false;
            setPending("");
            setMessage(
              "Payment window closed. If you were charged, check payment status below. Otherwise, resume the same payment when you’re ready.",
            );
            void refresh().catch(() => {});
          },
        },
      });
      checkout.on("payment.failed", () => {
        setError(
          "Payment was not completed. You can retry in the payment window, or close it and check payment status below.",
        );
      });
      checkout.open();
      setPending("payment");
    } catch (e) {
      active.current = false;
      setPending("");
      setError((e as Error).message);
      await refresh().catch(() => {});
    }
  }
  if (!state)
    return (
      <div className={s.page}>
        <header className={s.intro}>
          <p className="eyebrow">One last little step</p>
          <h1>Make it yours.</h1>
        </header>
        <Message error={error} />
        {error ? (
          <button
            className={s.secondary}
            onClick={() => {
              setError("");
              refresh().catch((e) => setError(e.message));
            }}
          >
            Try again
          </button>
        ) : (
          <p role="status">Loading your checkout…</p>
        )}
      </div>
    );
  const { cart, customer, addresses } = state;
  const saved = addresses.find((a) => a.id === selected);
  const initial: Address = saved ||
    cart?.shipping_address || {
      ...blankAddress,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone || "",
    };
  if (!cart?.items.length)
    return (
      <div className={s.page}>
        <div className={s.empty}>
          <h1>Your bag is waiting for something good.</h1>
          <p>Explore the shop and add your everyday essentials.</p>
          <Link href="/shop" className={s.button}>
            Explore the shop
          </Link>
        </div>
      </div>
    );
  const ready = Boolean(
    cart.shipping_address &&
    cart.shipping_methods.length &&
    state.enabled &&
    state.payment_available,
  );
  return (
    <div className={s.page}>
      <header className={s.intro}>
        <p className="eyebrow">One last little step</p>
        <h1>Make it yours.</h1>
        <p>A few details, then your good things can be on their way.</p>
      </header>
      <Message error={error} message={message} />
      {!state.enabled && (
        <p className={s.notice} role="status">
          Online ordering is not open yet. You can save your delivery details;
          your bag will be waiting.
        </p>
      )}
      <div className={s.checkout}>
        <div>
          <section className={s.panel}>
            <h2 className={s.step}>
              <span>1</span> Contact
            </h2>
            <strong>
              {customer.first_name} {customer.last_name}
            </strong>
            <p className={s.subtle}>{customer.email}</p>
            <Link className={s.textLink} href="/account">
              Manage your account
            </Link>
          </section>
          <section className={s.panel}>
            <h2 className={s.step}>
              <span>2</span> Delivery address
            </h2>
            {cart.shipping_address && !editing ? (
              <>
                <AddressText address={cart.shipping_address} />
                <p className={s.subtle}>
                  Billing address is the same as delivery.
                </p>
                {!state.locked && (
                  <button
                    className={s.textLink}
                    onClick={() => setEditing(true)}
                  >
                    Change address
                  </button>
                )}
              </>
            ) : (
              <form key={selected} className={s.form} onSubmit={saveAddress}>
                {addresses.length > 0 && (
                  <label>
                    Use a saved address
                    <select
                      value={selected}
                      onChange={(e) => setSelected(e.target.value)}
                    >
                      <option value="new">Enter an address</option>
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.address_1}, {a.city}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <AddressFields address={selected === "new" ? initial : saved} />
                <p className={s.subtle}>This is also your billing address.</p>
                <button
                  className={s.button}
                  disabled={Boolean(pending) || state.locked}
                >
                  {pending === "saving" ? "Saving…" : "Save delivery address"}
                </button>
              </form>
            )}
          </section>
          <section className={s.panel}>
            <h2 className={s.step}>
              <span>3</span> Delivery
            </h2>
            {!cart.shipping_address ? (
              <p className={s.subtle}>
                Save your address to see available delivery options.
              </p>
            ) : state.shipping_options.length ? (
              <fieldset
                className={s.choices}
                disabled={Boolean(pending) || state.locked}
              >
                <legend className="sr-only">Choose delivery</legend>
                {state.shipping_options.map((option) => (
                  <label key={option.id} className={s.choice}>
                    <input
                      type="radio"
                      name="shipping"
                      value={option.id}
                      checked={cart.shipping_methods.some(
                        (m) => m.shipping_option_id === option.id,
                      )}
                      onChange={() =>
                        void action({
                          action: "shipping",
                          option_id: option.id,
                        })
                      }
                    />
                    <span>
                      {option.name}
                      {option.type?.description && (
                        <small>{option.type.description}</small>
                      )}
                    </span>
                    <strong>
                      {money(
                        option.amount ??
                          option.calculated_price?.calculated_amount ??
                          0,
                        cart.currency_code,
                      )}
                    </strong>
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className={s.notice}>
                No delivery options are available for this address yet. Check
                the address or try again later.
              </p>
            )}
          </section>
          <section className={s.panel}>
            <h2 className={s.step}>
              <span>4</span> Payment
            </h2>
            <h3>Pay securely with Razorpay</h3>
            <p className={s.subtle}>
              Choose from the payment methods available in the secure payment
              window. Payment details stay with Razorpay.
            </p>
            <p className={s.subtle}>
              Review your items, address and total before continuing. Once
              payment starts, this bag is locked so the amount cannot change.
            </p>
            {!state.payment_available && state.enabled && (
              <p className={s.notice}>
                Payments are temporarily unavailable for this region. Your bag
                is saved.
              </p>
            )}
            {state.locked && (
              <p className={s.notice}>
                This bag is awaiting payment confirmation. Resume the same
                payment or check its status.
              </p>
            )}
          </section>
        </div>
        <aside className={`${s.panel} ${s.summary}`} aria-label="Order review">
          <p className="eyebrow">Your good things</p>
          <h2>Order review</h2>
          {cart.items.map((item) => (
            <div key={item.id} className={s.order}>
              <div>
                <strong>{item.product_title}</strong>
                <small>
                  {item.variant_title} · Qty {item.quantity}
                </small>
              </div>
              <span>{money(item.total, cart.currency_code)}</span>
            </div>
          ))}
          <Totals order={cart} />
          {!state.locked && (
            <Link className={s.textLink} href="/cart">
              Edit your bag
            </Link>
          )}
          <p className={s.subtle}>
            {cart.shipping_methods.length
              ? "Delivery and applicable taxes are included in the total above."
              : "Final delivery charges and taxes are calculated after you choose delivery."}
          </p>
          {cart.completed_at ? (
            <button
              className={s.button}
              disabled={Boolean(pending)}
              onClick={complete}
            >
              {pending ? "Checking…" : "View order confirmation"}
            </button>
          ) : (
            <button
              className={s.button}
              style={{ width: "100%" }}
              disabled={!ready || Boolean(pending)}
              onClick={pay}
            >
              {pending === "confirming"
                ? "Confirming your order…"
                : pending
                  ? "Payment in progress…"
                  : state.locked
                    ? "Resume payment"
                    : `Pay ${money(cart.total, cart.currency_code)}`}
            </button>
          )}
          {state.locked && !cart.completed_at && (
            <button
              className={s.textLink}
              disabled={Boolean(pending)}
              onClick={complete}
            >
              Check payment status
            </button>
          )}
          <p className={s.subtle}>
            You’ll receive confirmation only after your payment and order are
            verified.
          </p>
        </aside>
      </div>
    </div>
  );
}
