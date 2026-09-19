import type { Address, Customer } from "./customer";
export type CheckoutCart = {
  id: string;
  customer_id?: string;
  region_id: string;
  completed_at?: string;
  email?: string;
  currency_code: string;
  subtotal: number;
  item_subtotal: number;
  shipping_subtotal: number;
  discount_subtotal: number;
  credit_line_total: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  total: number;
  items: {
    id: string;
    product_title: string;
    variant_title: string;
    quantity: number;
    total: number;
  }[];
  shipping_address?: Address;
  shipping_methods: {
    id: string;
    shipping_option_id: string;
    name: string;
    amount: number;
  }[];
  payment_collection?: {
    id: string;
    payment_sessions?: {
      id: string;
      provider_id: string;
      status: string;
      data?: Record<string, unknown>;
    }[];
  };
};
export type ShippingOption = {
  id: string;
  name: string;
  amount: number;
  price_type?: string;
  calculated_price?: { calculated_amount: number };
  type?: { description?: string };
};
export type CheckoutState = {
  cart: CheckoutCart | null;
  customer: Customer;
  addresses: Address[];
  shipping_options: ShippingOption[];
  enabled: boolean;
  payment_available: boolean;
  locked: boolean;
};
