import { accountCustomer } from "@/lib/account-page";
import { AccountShell } from "@/components/commerce/account-shell";
import { ProfileForm } from "@/components/commerce/account-client";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const customer = await accountCustomer();
  return (
    <AccountShell active="Profile">
      <ProfileForm customer={customer} />
    </AccountShell>
  );
}
