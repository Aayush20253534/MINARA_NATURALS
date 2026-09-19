import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import CashfreeProvider from "./service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [CashfreeProvider],
});
