import { accountCustomer } from "@/lib/account-page";
import { storeRequest } from "@/lib/customer-server";
import { AccountShell } from "@/components/commerce/account-shell";
import {
  Wishlist,
  type SavedProduct,
} from "@/components/commerce/account-client";
export const metadata = {
  title: "Your wishlist",
  robots: { index: false, follow: false },
};
export default async function Page() {
  await accountCustomer();
  const { products } = await storeRequest<{ products: SavedProduct[] }>(
    "/store/minara/wishlist",
  );
  return (
    <AccountShell active="Wishlist">
      <Wishlist initial={products} />
    </AccountShell>
  );
}
