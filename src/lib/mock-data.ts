// Mock data layer — swap with Supabase queries later.
// Each exported function returns a Promise to keep the API shape ready.

export type OrderStatus = "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type Order = {
  id: string;
  customer: string;
  email: string;
  product: string;
  quantity: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
};

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

let orders: Order[] = [
  { id: "SW-92841", customer: "Summit Athletics", email: "ops@summit.co", product: "Aero-Lite Runner 2.0", quantity: 12, total: 1428, status: "processing", createdAt: daysAgo(0) },
  { id: "SW-92840", customer: "Velocity Marathon", email: "buy@velocity.org", product: "Compression Tee", quantity: 30, total: 1170, status: "confirmed", createdAt: daysAgo(1) },
  { id: "SW-92839", customer: "Urban Sprint", email: "kit@urbansprint.io", product: "Knit Trainer", quantity: 8, total: 1040, status: "shipped", createdAt: daysAgo(2) },
  { id: "SW-92838", customer: "Elite Training", email: "hello@elite.gym", product: "Hydro Vest", quantity: 24, total: 2160, status: "delivered", createdAt: daysAgo(3) },
  { id: "SW-92837", customer: "Northwind Track", email: "orders@northwind.run", product: "Aero-Lite Runner 2.0", quantity: 6, total: 714, status: "processing", createdAt: daysAgo(4) },
  { id: "SW-92836", customer: "Apex Retail", email: "po@apex.shop", product: "Carbon Aero Shell", quantity: 16, total: 3840, status: "confirmed", createdAt: daysAgo(5) },
  { id: "SW-92835", customer: "Coastal Run Club", email: "club@coastal.run", product: "Thermal Compression", quantity: 20, total: 1600, status: "cancelled", createdAt: daysAgo(6) },
  { id: "SW-92834", customer: "Pulse Fitness", email: "buy@pulse.fit", product: "Velocity Knit V2", quantity: 14, total: 2380, status: "shipped", createdAt: daysAgo(7) },
];

const products: Product[] = [
  { id: "p1", sku: "SW-720-BLK", name: "Carbon Aero Shell", category: "Outerwear", price: 240, stock: 142, lowStockThreshold: 25 },
  { id: "p2", sku: "SW-104-RED", name: "Thermal Compression", category: "Baselayer", price: 80, stock: 18, lowStockThreshold: 25 },
  { id: "p3", sku: "SW-992-WHT", name: "Velocity Knit V2", category: "Footwear", price: 170, stock: 8, lowStockThreshold: 20 },
  { id: "p4", sku: "SW-541-GRN", name: "Aero-Lite Runner 2.0", category: "Footwear", price: 119, stock: 230, lowStockThreshold: 30 },
  { id: "p5", sku: "SW-318-NVY", name: "Compression Tee", category: "Tops", price: 39, stock: 412, lowStockThreshold: 50 },
  { id: "p6", sku: "SW-660-ORG", name: "Hydro Vest", category: "Accessories", price: 90, stock: 12, lowStockThreshold: 20 },
  { id: "p7", sku: "SW-201-BLK", name: "Knit Trainer", category: "Footwear", price: 130, stock: 64, lowStockThreshold: 25 },
  { id: "p8", sku: "SW-877-GRY", name: "Wind Breaker Lite", category: "Outerwear", price: 145, stock: 0, lowStockThreshold: 15 },
];

const wait = <T,>(v: T, ms = 200) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export async function listOrders() { return wait([...orders]); }
export async function createOrder(input: Omit<Order, "id" | "createdAt" | "status"> & { status?: OrderStatus }) {
  const next: Order = {
    id: `SW-${Math.floor(90000 + Math.random() * 9999)}`,
    createdAt: new Date().toISOString(),
    status: input.status ?? "processing",
    ...input,
  };
  orders = [next, ...orders];
  return wait(next);
}
export async function updateOrderStatus(id: string, status: OrderStatus) {
  orders = orders.map((o) => (o.id === id ? { ...o, status } : o));
  return wait(orders.find((o) => o.id === id)!);
}
export async function deleteOrder(id: string) {
  orders = orders.filter((o) => o.id !== id);
  return wait({ id });
}

export async function listProducts() { return wait([...products]); }

export async function getKpis() {
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold).length;
  return wait({ totalOrders, totalRevenue, totalUnits, lowStock });
}

export async function getOrdersOverTime() {
  // group last 7 days
  const buckets: Record<string, { date: string; orders: number; revenue: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), orders: 0, revenue: 0 };
  }
  for (const o of orders) {
    const key = o.createdAt.slice(0, 10);
    if (buckets[key]) {
      buckets[key].orders += 1;
      if (o.status !== "cancelled") buckets[key].revenue += o.total;
    }
  }
  return wait(Object.values(buckets));
}
