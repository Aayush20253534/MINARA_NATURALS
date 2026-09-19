import Link from "next/link";
import { accountCustomer } from "@/lib/account-page";
import { storeRequest } from "@/lib/customer-server";
import { orderFields, type Order } from "@/lib/customer";
import { money } from "@/lib/commerce";
import { AccountShell } from "@/components/commerce/account-shell";
import s from "@/components/commerce/account.module.css";
export const metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await accountCustomer();
  const page = Math.min(
    10000,
    Math.max(1, Number((await searchParams).page) || 1),
  );
  const offset = (Math.floor(page) - 1) * 10;
  const { orders, count } = await storeRequest<{
    orders: Order[];
    count: number;
  }>(
    `/store/orders?limit=10&offset=${offset}&fields=${encodeURIComponent(orderFields)}&order=-created_at`,
  );
  return (
    <AccountShell active="Orders">
      <section className={s.panel}>
        <h2>Your orders</h2>
        {orders.length ? (
          orders.map((o) => (
            <article key={o.id} className={s.order}>
              <div>
                <strong>Order #{o.display_id}</strong>
                <small>
                  {new Date(o.created_at).toLocaleDateString("en-IN")} ·{" "}
                  {o.items.length} items
                </small>
                <p>
                  <span className={s.badge}>
                    {o.fulfillment_status.replaceAll("_", " ")}
                  </span>
                </p>
              </div>
              <div>
                <strong>{money(o.total, o.currency_code)}</strong>
                <Link className={s.textLink} href={`/account/orders/${o.id}`}>
                  View order →
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className={s.empty}>
            <h2>Your first good thing awaits.</h2>
            <p>When you place an order, you’ll find its details here.</p>
            <Link className={s.button} href="/shop">
              Explore the shop
            </Link>
          </div>
        )}
        <div className={s.actions}>
          {page > 1 && (
            <Link className={s.textLink} href={`?page=${page - 1}`}>
              ← Previous
            </Link>
          )}
          {offset + 10 < count && (
            <Link className={s.textLink} href={`?page=${page + 1}`}>
              Next orders →
            </Link>
          )}
        </div>
      </section>
    </AccountShell>
  );
}
