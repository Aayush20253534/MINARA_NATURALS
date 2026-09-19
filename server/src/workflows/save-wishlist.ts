import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import type { ILockingModule } from "@medusajs/framework/types";
import WishlistService from "../modules/wishlist/service";
type Input = {
  customer_id: string;
  product_id: string;
  saved: boolean;
  sales_channel_ids: string[];
};
const saveWishlistStep = createStep(
  "save-wishlist",
  async (input: Input, { container }) => {
    const service = container.resolve<WishlistService>("wishlist");
    const locking = container.resolve<ILockingModule>(Modules.LOCKING);
    await locking.execute(`wishlist:${input.customer_id}`, async () => {
      const existing = await service.listWishlistItems({
        customer_id: input.customer_id,
        product_id: input.product_id,
      });
      if (!input.saved) {
        if (existing.length)
          await service.deleteWishlistItems(existing.map((i) => i.id));
        return;
      }
      if (existing.length) return;
      const query = container.resolve(ContainerRegistrationKeys.QUERY);
      const { data } = await query.graph({
        entity: "product",
        fields: ["id", "sales_channels.id"],
        filters: { id: input.product_id, status: "published" },
      });
      if (
        !data[0]?.sales_channels?.some((c) =>
          Boolean(c && input.sales_channel_ids.includes(c.id)),
        )
      )
        throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found");
      const [, count] = await service.listAndCountWishlistItems(
        { customer_id: input.customer_id },
        { take: 1 },
      );
      if (count >= 100)
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Your wishlist can hold 100 products",
        );
      await service.createWishlistItems({
        customer_id: input.customer_id,
        product_id: input.product_id,
      });
    });
    return new StepResponse({ saved: input.saved });
  },
);
export const saveWishlistWorkflow = createWorkflow(
  "save-wishlist",
  (input: Input) => new WorkflowResponse(saveWishlistStep(input)),
);
