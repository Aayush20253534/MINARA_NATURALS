import { redirect } from "next/navigation";
import { requireCustomer, StoreError } from "@/lib/customer-server";
import { Checkout } from "@/components/commerce/checkout-client";
export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
  referrer: "same-origin" as const,
};
export default async function Page() {
  try {
    await requireCustomer();
  } catch (e) {
    if (e instanceof StoreError && e.status === 401)
      redirect("/account/login?next=%2Fcheckout");
    throw e;
  }
  return <Checkout />;
}
