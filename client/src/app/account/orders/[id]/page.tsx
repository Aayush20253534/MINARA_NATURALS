import { notFound } from "next/navigation";
import { accountCustomer } from "@/lib/account-page";
import { storeRequest, StoreError } from "@/lib/customer-server";
import { orderFields, type Order } from "@/lib/customer";
import { AccountShell } from "@/components/commerce/account-shell";
import { OrderDetail } from "@/components/commerce/account-client";
export const metadata = {
  title: "Order details",
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
    <AccountShell active="Orders">
      <OrderDetail order={order} />
    </AccountShell>
  );
}
