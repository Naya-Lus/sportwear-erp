import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, DollarSign, Package, ShoppingCart, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getKpis, getOrdersOverTime, listOrders, type Order } from "@/lib/db";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SportWear ERP" },
      { name: "description", content: "Live KPIs, revenue, and order throughput for SportWear." },
    ],
  }),
  component: DashboardPage,
});

const fmt$ = (n: number) => "$" + n.toLocaleString("en-US");

export type OrderStatus = "processing" | "confirmed" | "shipped" | "delivered" | "cancelled";

function DashboardPage() {
  const [kpis, setKpis] = useState<{ totalOrders: number; totalRevenue: number; totalUnits: number; lowStock: number; pendingInvoices: number } | null>(null);
  const [chart, setChart] = useState<{ date: string; orders: number; revenue: number }[]>([]);
  const [recent, setRecent] = useState<Order[]>([]);

  useEffect(() => {
    void Promise.all([getKpis(), getOrdersOverTime(), listOrders()]).then(([k, c, o]) => {
      setKpis(k);
      setChart(c);
      setRecent(o.slice(0, 5));
    });
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Live status"
        title="Command Dashboard"
        actions={
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">Systems</p>
              <div className="flex items-center gap-2 justify-end">
                <span className="size-2 rounded-full bg-volt animate-pulse" />
                <span className="text-xs font-mono text-volt">NOMINAL</span>
              </div>
            </div>
          </div>
        }
      />

      <div className="p-10 space-y-8 max-w-[1400px]">
        {/* KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard label="Total Revenue" value={kpis ? fmt$(kpis.totalRevenue) : "—"} delta="From confirmed orders" icon={DollarSign} highlight />
          <KpiCard label="Total Orders" value={kpis ? kpis.totalOrders.toLocaleString() : "—"} delta="All statuses" icon={ShoppingCart} />
          <KpiCard label="Inventory Units" value={kpis ? kpis.totalUnits.toLocaleString() : "—"} delta="Available stock" icon={Package} />
          <KpiCard label="Low Stock Alerts" value={kpis ? String(kpis.lowStock) : "—"} delta="Needs reorder" icon={AlertTriangle} warn />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Revenue Curve" subtitle="Last 7 days" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--volt)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--volt)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--boundary)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--boundary)", borderRadius: 4, fontSize: 12 }} labelStyle={{ color: "var(--foreground)", fontWeight: 700 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--volt)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Orders / Day" subtitle="Throughput">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--boundary)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip cursor={{ fill: "var(--secondary)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--boundary)", borderRadius: 4, fontSize: 12 }} />
                <Bar dataKey="orders" fill="var(--volt)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        {/* Recent Orders */}
        <section className="bg-card border border-boundary">
          <div className="p-6 border-b border-boundary flex items-center justify-between">
            <h3 className="font-display text-lg">Recent Orders</h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Supabase live data · latest 5</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-boundary bg-secondary/40">
                <Th>Order ID</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th className="text-right">Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-boundary">
              {recent.map((o) => (
                <tr key={o.order_id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{o.order_id.slice(0, 8)}…</td>
                  <td className="px-6 py-4 text-sm font-bold uppercase tracking-tight">{o.customer?.full_name ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{o.order_items?.length ?? 0} item(s)</td>
                  <td className="px-6 py-4 text-sm text-right tabular font-bold text-volt">{fmt$(o.total_amount)}</td>
                  <td className="px-6 py-4"><StatusPill status={o.status as OrderStatus} /></td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">No orders yet. Create your first order →</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em] ${className}`}>{children}</th>;
}

function KpiCard({ label, value, delta, icon: Icon, highlight, warn }: {
  label: string; value: string; delta: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean; warn?: boolean;
}) {
  return (
    <div className={`bg-card p-6 h-40 flex flex-col justify-between border-l-4 ${highlight ? "border-volt" : warn ? "border-warning" : "border-boundary"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-4xl font-display tabular">{value}</h2>
        <p className={`text-xs font-bold mt-1 tracking-tight uppercase flex items-center gap-1 ${highlight ? "text-volt" : warn ? "text-warning" : "text-muted-foreground"}`}>
          <ArrowUpRight className="size-3" /> {delta}
        </p>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, className = "", children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-card border border-boundary p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-lg">{title}</h3>
          {subtitle && <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    processing: "bg-warning/10 text-warning border-warning/30",
    confirmed: "bg-volt/10 text-volt border-volt/30",
    shipped: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    delivered: "bg-success/10 text-success border-success/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${map[status]}`}>
      {status}
    </span>
  );
}
