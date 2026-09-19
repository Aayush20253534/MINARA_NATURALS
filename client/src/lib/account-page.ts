import "server-only";
import { redirect } from "next/navigation";
import { requireCustomer, StoreError } from "./customer-server";
export async function accountCustomer() {
  try {
    return await requireCustomer();
  } catch (e) {
    if (e instanceof StoreError && e.status === 401) redirect("/account/login");
    throw e;
  }
}
