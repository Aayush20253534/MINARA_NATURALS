import Link from "next/link";
import { notFound } from "next/navigation";
import { accountCustomer } from "@/lib/account-page";
import { storeRequest, StoreError } from "@/lib/customer-server";
import { orderFields, type Order } from "@/lib/customer";
import { OrderDetail } from "@/components/commerce/account-client";
import s from "@/components/commerce/account.module.css";
export const metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await accountCustomer();
  const { id } = await params;
  if (!/^order_[a-zA-Z0-9_-]+$/.test(id)) notFound();
  let order: Order;
  try {
    order = (
      await storeRequest<{ order: Order }>(
        `/store/orders/${id}?fields=${encodeURIComponent(orderFields)}`,
      )
    ).order;
  } catch (e) {
    if (e instanceof StoreError && e.status === 404) notFound();
    throw e;
  }
  return (
    <div className={s.page}>
      <header className={s.success}>
        <span aria-hidden="true">✓</span>
        <h1>Good things are on their way.</h1>
        <p>
          Thank you. Your order #{order.display_id} has been received. Find
          every update in your account.
        </p>
      </header>
      <div style={{ maxWidth: 760, margin: "auto" }}>
        <OrderDetail order={order} />
        <div className={s.actions}>
          <Link className={s.button} href="/account/orders">
            Your orders
          </Link>
          <Link className={s.textLink} href="/shop">
            Keep exploring →
          </Link>
        </div>
      </div>
    </div>
  );
}
