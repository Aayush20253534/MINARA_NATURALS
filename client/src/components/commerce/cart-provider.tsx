"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Cart, CartAction, CartResponse } from "@/lib/commerce";

type CartContextValue = {
  cart: Cart | null;
  loaded: boolean;
  pending: boolean;
  error: string | null;
  notice: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  mutate: (action: CartAction) => Promise<boolean>;
};
const CartContext = createContext<CartContextValue | null>(null);
async function requestCart(action?: CartAction) {
  const response = await fetch("/api/cart", {
    method: action ? "POST" : "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: action ? { "Content-Type": "application/json" } : undefined,
    body: action ? JSON.stringify(action) : undefined,
    signal: AbortSignal.timeout(45000),
  });
  const data: CartResponse = await response.json();
  return { ok: response.ok, data };
}
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const busy = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  // Serialize requests locally and, where supported, across tabs before reading/creating a cart cookie.
  const serial = useCallback(<T,>(work: () => Promise<T>): Promise<T> => {
    const next = queue.current
      .catch(() => undefined)
      .then(async () =>
        navigator.locks
          ? await navigator.locks.request("minara-cart", work)
          : await work(),
      );
    queue.current = next;
    return next;
  }, []);
  const accept = useCallback((data: CartResponse) => {
    if ("cart" in data) setCart(data.cart ?? null);
    setNotice(data.notice ?? null);
  }, []);
  const refresh = useCallback(async () => {
    await serial(async () => {
      try {
        const { ok, data } = await requestCart();
        if (ok) {
          accept(data);
          setError(null);
        } else setError(data.error ?? "Your bag couldn’t be loaded.");
      } catch {
        setError(
          "Your bag couldn’t be loaded. Check your connection and try again.",
        );
      } finally {
        setLoaded(true);
      }
    });
  }, [accept, serial]);
  useEffect(() => {
    void refresh();
    const onFocus = () => {
      if (!busy.current) void refresh();
    };
    window.addEventListener("focus", onFocus);
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel("minara-cart");
      channel.current.onmessage = onFocus;
    }
    return () => {
      window.removeEventListener("focus", onFocus);
      channel.current?.close();
    };
  }, [refresh]);
  const mutate = useCallback(
    async (action: CartAction) => {
      if (busy.current) return false;
      busy.current = true;
      setPending(true);
      setError(null);
      try {
        return await serial(async () => {
          try {
            const { ok, data } = await requestCart(action);
            accept(data);
            if (!ok)
              throw new Error(data.error ?? "Your bag couldn’t be updated.");
            return true;
          } catch (err) {
            // A timeout may happen after the write committed. Read back; never replay a mutation.
            try {
              const result = await requestCart();
              if (result.ok) accept(result.data);
            } catch {
              /* Keep the last confirmed cart. */
            }
            setError(
              err instanceof Error && err.name === "Error"
                ? err.message
                : "We couldn’t confirm the change. Refresh your bag before trying again.",
            );
            return false;
          } finally {
            setLoaded(true);
            channel.current?.postMessage("changed");
          }
        });
      } finally {
        busy.current = false;
        setPending(false);
      }
    },
    [accept, serial],
  );
  return (
    <CartContext.Provider
      value={{
        cart,
        loaded,
        pending,
        error,
        notice,
        open,
        setOpen,
        refresh,
        mutate,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("CartProvider is missing");
  return context;
}
