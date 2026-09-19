import { accountCustomer } from "@/lib/account-page";
import { storeRequest } from "@/lib/customer-server";
import type { Address } from "@/lib/customer";
import { AccountShell } from "@/components/commerce/account-shell";
import { Addresses } from "@/components/commerce/account-client";
export const metadata = {
  title: "Your addresses",
  robots: { index: false, follow: false },
};
export default async function Page() {
  await accountCustomer();
  const data = await storeRequest<{ addresses: Address[] }>(
    "/store/customers/me/addresses?limit=100",
  );
  return (
    <AccountShell active="Addresses">
      <Addresses initial={data.addresses} />
    </AccountShell>
  );
}
