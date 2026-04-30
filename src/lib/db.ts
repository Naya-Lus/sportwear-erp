/**
 * Supabase data layer — replaces mock-data.ts
 * All functions hit the real DB; shapes match the existing UI contracts.
 */
import { supabase } from "./supabase";
import type {
  DbCustomer,
  DbProduct,
  DbInventory,
  DbOrder,
  OrderWithCustomer,
  OrderItemWithProduct,
  InvoiceWithOrder,
  PaymentWithInvoice,
} from "./supabase";

// Re-export types the pages already import from mock-data
export type OrderStatus =
  | "processing"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type { DbCustomer as Customer };
export type { DbProduct as Product };
export type { DbInventory as Inventory };
export type { OrderWithCustomer as Order };
export type { OrderItemWithProduct as OrderItem };
export type { InvoiceWithOrder as Invoice };
export type { PaymentWithInvoice as Payment };

// ─── Customers ────────────────────────────────────────────────────────────────

export async function listCustomers(): Promise<DbCustomer[]> {
  const { data, error } = await supabase
    .from("Customers")
    .select("*")
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function createCustomer(
  input: Omit<DbCustomer, "customer_id">
): Promise<DbCustomer> {
  const { data, error } = await supabase
    .from("Customers")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function listProducts(): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from("Products")
    .select("*")
    .order("product_name");
  if (error) throw error;
  return data ?? [];
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function listInventory(): Promise<
  (DbInventory & { product: DbProduct | null })[]
> {
  const { data, error } = await supabase
    .from("Inventory")
    .select("*, product:Products(*)")
    .order("quantity_available");
  if (error) throw error;
  return (data ?? []) as (DbInventory & { product: DbProduct | null })[];
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function listOrders(): Promise<OrderWithCustomer[]> {
  const { data, error } = await supabase
    .from("Orders")
    .select(
      `*,
       customer:Customers(*),
       order_items:OrderItems(*, product:Products(*))`
    )
    .order("order_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderWithCustomer[];
}

export async function getOrder(orderId: string): Promise<OrderWithCustomer> {
  const { data, error } = await supabase
    .from("Orders")
    .select(
      `*,
       customer:Customers(*),
       order_items:OrderItems(*, product:Products(*))`
    )
    .eq("order_id", orderId)
    .single();
  if (error) throw error;
  return data as OrderWithCustomer;
}

export interface CreateOrderInput {
  customer_id: string;
  created_by: string; // user_id from Users table
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<OrderWithCustomer> {
  const total = input.items.reduce(
    (sum, i) => sum + i.quantity * i.unit_price,
    0
  );

  // 1. Insert order
  const { data: order, error: orderErr } = await supabase
    .from("Orders")
    .insert({
      customer_id: input.customer_id,
      created_by: input.created_by,
      order_date: new Date().toISOString(),
      status: "processing",
      total_amount: total,
    })
    .select()
    .single();
  if (orderErr) throw orderErr;

  // 2. Insert order items
  const orderId = (order as DbOrder).order_id;
  const itemRows = input.items.map((i) => ({
    order_id: orderId,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    subtotal: i.quantity * i.unit_price,
  }));

  const { error: itemsErr } = await supabase
    .from("OrderItems")
    .insert(itemRows);
  if (itemsErr) throw itemsErr;

  return getOrder(orderId);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const { error } = await supabase
    .from("Orders")
    .update({ status })
    .eq("order_id", orderId);
  if (error) throw error;
}

// ─── Order Items ──────────────────────────────────────────────────────────────

export async function listOrderItems(
  orderId: string
): Promise<OrderItemWithProduct[]> {
  const { data, error } = await supabase
    .from("OrderItems")
    .select("*, product:Products(*)")
    .eq("order_id", orderId);
  if (error) throw error;
  return (data ?? []) as OrderItemWithProduct[];
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export async function listInvoices(): Promise<InvoiceWithOrder[]> {
  const { data, error } = await supabase
    .from("Invoices")
    .select(
      `*,
       order:Orders(*, customer:Customers(*))`
    )
    .order("invoice_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InvoiceWithOrder[];
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function listPayments(): Promise<PaymentWithInvoice[]> {
  const { data, error } = await supabase
    .from("Payments")
    .select("*, invoice:Invoices(*)")
    .order("payment_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentWithInvoice[];
}

export async function createPayment(input: {
  invoice_id: string;
  payment_method: string;
  amount: number;
}): Promise<void> {
  const { error } = await supabase.from("Payments").insert({
    invoice_id: input.invoice_id,
    payment_date: new Date().toISOString(),
    payment_method: input.payment_method,
    amount: input.amount,
    status: "paid",
  });
  if (error) throw error;

  // Mark invoice as paid
  await supabase
    .from("Invoices")
    .update({ payment_status: "paid" })
    .eq("invoice_id", input.invoice_id);
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export async function getKpis() {
  const [ordersRes, inventoryRes, invoicesRes] = await Promise.all([
    supabase.from("Orders").select("order_id, status, total_amount"),
    supabase.from("Inventory").select("quantity_available, reorder_level"),
    supabase
      .from("Invoices")
      .select("payment_status")
      .eq("payment_status", "pending"),
  ]);

  if (ordersRes.error) throw ordersRes.error;
  if (inventoryRes.error) throw inventoryRes.error;

  const orders = ordersRes.data ?? [];
  const inventory = inventoryRes.data ?? [];
  const pendingInvoices = invoicesRes.data?.length ?? 0;

  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total_amount), 0);
  const totalUnits = inventory.reduce(
    (s, i) => s + Number(i.quantity_available),
    0
  );
  const lowStock = inventory.filter(
    (i) =>
      i.reorder_level !== null &&
      Number(i.quantity_available) <= Number(i.reorder_level)
  ).length;

  return { totalOrders, totalRevenue, totalUnits, lowStock, pendingInvoices };
}

export async function getOrdersOverTime() {
  const since = new Date();
  since.setDate(since.getDate() - 6);

  const { data, error } = await supabase
    .from("Orders")
    .select("order_date, status, total_amount")
    .gte("order_date", since.toISOString());

  if (error) throw error;

  // Build buckets for last 7 days
  const buckets: Record<string, { date: string; orders: number; revenue: number }> =
    {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      orders: 0,
      revenue: 0,
    };
  }

  for (const o of data ?? []) {
    const key = o.order_date.slice(0, 10);
    if (buckets[key]) {
      buckets[key].orders += 1;
      if (o.status !== "cancelled") buckets[key].revenue += Number(o.total_amount);
    }
  }

  return Object.values(buckets);
}

// ─── Users (for created_by field) ────────────────────────────────────────────

export async function listUsers() {
  const { data, error } = await supabase
    .from("Users")
    .select("user_id, full_name, email, role");
  if (error) throw error;
  return data ?? [];
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("email", email)
    .single();
  if (error) return null;
  return data;
}
