import { createHash } from "node:crypto";
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type {
  ILockingModule,
  INotificationModuleService,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
export default async function customerEmail({
  event,
  container,
}: SubscriberArgs<{
  id?: string;
  entity_id?: string;
  actor_type?: string;
  token?: string;
}>) {
  const base = process.env.STOREFRONT_URL;
  if (!base)
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "STOREFRONT_URL is required for customer emails",
    );
  const origin = new URL(base);
  if (process.env.NODE_ENV === "production" && origin.protocol !== "https:")
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Customer email links require HTTPS",
    );
  const notifications = container.resolve<INotificationModuleService>(
    Modules.NOTIFICATION,
  );
  const locking = container.resolve<ILockingModule>(Modules.LOCKING);
  if (event.name === "auth.password_reset") {
    if (
      event.data.actor_type !== "customer" ||
      !event.data.entity_id ||
      !event.data.token
    )
      return;
    const url = new URL("/account/reset-password", origin);
    // Fragments never reach access logs, server requests or Referer headers.
    url.hash = new URLSearchParams({ token: event.data.token }).toString();
    const key = `password-reset:${createHash("sha256").update(event.data.token).digest("hex")}`;
    await locking.execute(key, () =>
      notifications.createNotifications({
        to: event.data.entity_id!,
        channel: "email",
        template: "password-reset",
        idempotency_key: key,
        provider_data: { idempotency_key: key },
        data: { action_url: url.toString() },
      }),
    );
  } else if (event.name === "order.placed" && event.data.id) {
    const { data: orders } = await container
      .resolve(ContainerRegistrationKeys.QUERY)
      .graph({
        entity: "order",
        fields: ["id", "display_id", "email", "customer.first_name"],
        filters: { id: event.data.id },
      });
    const order = orders[0];
    if (!order?.email) return;
    const key = `order-placed:${order.id}`;
    await locking.execute(key, () =>
      notifications.createNotifications({
        to: order.email!,
        channel: "email",
        template: "order-placed",
        resource_id: order.id,
        resource_type: "order",
        idempotency_key: key,
        provider_data: { idempotency_key: key },
        data: {
          name: order.customer?.first_name,
          reference: order.display_id,
          action_url: new URL(`/account/orders/${order.id}`, origin).toString(),
        },
      }),
    );
  }
}
export const config: SubscriberConfig = {
  event: ["auth.password_reset", "order.placed"],
  context: { subscriberId: "minara-customer-email" },
};
