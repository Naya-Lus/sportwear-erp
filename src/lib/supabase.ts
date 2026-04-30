import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[SportWear ERP] Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder"
);

// ─── Typed DB rows ────────────────────────────────────────────────────────────

export type DbUser = {
  user_id: string;
  full_name: string;
  email: string;
  password: string;
  role: string;
};

export type DbCustomer = {
  customer_id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
};

export type DbProduct = {
  product_id: string;
  product_name: string;
  category: string;
  size: string;
  color: string;
  price: number;
};

export type DbInventory = {
  inventory_id: string;
  product_id: string;
  quantity_available: number;
  reorder_level: number | null;
};

export type DbOrder = {
  order_id: string;
  customer_id: string;
  created_by: string;
  order_date: string;
  status: string;
  total_amount: number;
};

export type DbOrderItem = {
  order_item_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type DbInvoice = {
  invoice_id: string;
  order_id: string;
  invoice_date: string | null;
  total_amount: number | null;
  payment_status: string | null;
};

export type DbPayment = {
  payment_id: string;
  invoice_id: string;
  payment_date: string;
  payment_method: string;
  amount: number;
  status: string;
};

// ─── Join types used in the UI ────────────────────────────────────────────────

export type OrderWithCustomer = DbOrder & {
  customer: DbCustomer | null;
  order_items?: OrderItemWithProduct[];
};

export type OrderItemWithProduct = DbOrderItem & {
  product: DbProduct | null;
};

export type InvoiceWithOrder = DbInvoice & {
  order: OrderWithCustomer | null;
};

export type PaymentWithInvoice = DbPayment & {
  invoice: DbInvoice | null;
};
