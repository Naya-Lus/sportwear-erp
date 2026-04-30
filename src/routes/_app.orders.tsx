import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import {
  listOrders,
  listCustomers,
  listProducts,
  createOrder,
  updateOrderStatus,
  createCustomer,
  type OrderStatus,
  type Order,
} from "@/lib/db";
import type { DbCustomer, DbProduct } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { StatusPill } from "./_app.dashboard";

export const Route = createFileRoute("/_app/orders")({
  head: () => ({
    meta: [
      { title: "Orders — SportWear ERP" },
      { name: "description", content: "Manage SportWear orders: create, confirm, and review fulfillment." },
    ],
  }),
  component: OrdersPage,
});

const STATUSES: OrderStatus[] = ["processing", "confirmed", "shipped", "delivered", "cancelled"];
const fmt$ = (n: number) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOrders();
      setOrders(data);
    } catch (err) {
      toast.error("Failed to load orders: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const handleConfirm = async (o: Order) => {
    if (o.status !== "processing") return;
    try {
      await updateOrderStatus(o.order_id, "confirmed");
      toast.success("Order confirmed — invoice & inventory updated by Supabase triggers");
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not confirm order");
    }
  };

  const handleSetStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      toast.success(`Status updated to ${status}`);
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status");
    }
  };

  const handleAdvance = async (o: Order) => {
    const idx = STATUSES.indexOf(o.status as OrderStatus);
    const next = STATUSES[Math.min(idx + 1, STATUSES.length - 2)];
    if (next === o.status) return;
    await handleSetStatus(o.order_id, next);
  };

  return (
    <>
      <PageHeader
        eyebrow="Logistics"
        title="Order Management"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-volt text-primary-foreground text-xs font-bold uppercase tracking-widest italic hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus className="size-4" /> New Order
          </button>
        }
      />

      <div className="p-10 space-y-6 max-w-[1400px]">
        {/* ERP flow hint */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-volt/5 border border-volt/20 text-[10px] font-bold uppercase tracking-widest">
          <span className="text-volt">ERP Flow:</span>
          <span className="text-muted-foreground">1. Create Order</span>
          <span className="text-volt/40">→</span>
          <span className="text-muted-foreground">2. Click Confirm</span>
          <span className="text-volt/40">→</span>
          <span className="text-volt">Invoice Auto-Generated</span>
          <span className="text-volt/40">+</span>
          <span className="text-volt">Inventory Auto-Updated</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition ${
                filter === s
                  ? "bg-volt text-primary-foreground border-volt"
                  : "border-boundary text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              {s} {s !== "all" && <span className="ml-1 opacity-60">{orders.filter((o) => o.status === s).length}</span>}
            </button>
          ))}
        </div>

        {/* Table */}
        <section className="bg-card border border-boundary">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading orders from Supabase…</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-boundary bg-secondary/40">
                  <Th></Th>
                  <Th>Order ID</Th>
                  <Th>Customer</Th>
                  <Th>Items</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boundary">
                {visible.map((o) => (
                  <>
                    <tr key={o.order_id} className="hover:bg-secondary/40 transition-colors">
                      <td className="pl-4 py-4">
                        <button
                          onClick={() => setExpandedOrder(expandedOrder === o.order_id ? null : o.order_id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {expandedOrder === o.order_id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{o.order_id.slice(0, 8)}…</td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold uppercase tracking-tight">{o.customer?.full_name ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{o.customer?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {o.order_items?.length ?? 0} item{(o.order_items?.length ?? 0) !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-4 text-sm text-right tabular font-bold text-volt">{fmt$(o.total_amount)}</td>
                      <td className="px-4 py-4">
                        <div className="relative inline-block">
                          <StatusPill status={o.status as OrderStatus} />
                          <select
                            value={o.status}
                            onChange={(e) => handleSetStatus(o.order_id, e.target.value as OrderStatus)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {new Date(o.order_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {o.status === "processing" && (
                            <button
                              onClick={() => handleConfirm(o)}
                              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-volt text-volt hover:bg-volt hover:text-primary-foreground transition"
                            >
                              Confirm ✓
                            </button>
                          )}
                          {o.status !== "processing" && o.status !== "delivered" && o.status !== "cancelled" && (
                            <button
                              onClick={() => handleAdvance(o)}
                              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-boundary hover:border-volt hover:text-volt transition"
                            >
                              Advance →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedOrder === o.order_id && (
                      <tr key={`${o.order_id}-exp`}>
                        <td colSpan={8} className="bg-secondary/30 px-8 py-4 border-b border-boundary">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Order Items</p>
                          {(o.order_items ?? []).length === 0 ? (
                            <p className="text-xs text-muted-foreground">No items.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  <th className="text-left pb-2">Product</th>
                                  <th className="text-left pb-2">Details</th>
                                  <th className="text-right pb-2">Unit Price</th>
                                  <th className="text-right pb-2">Qty</th>
                                  <th className="text-right pb-2">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-boundary/50">
                                {(o.order_items ?? []).map((item) => (
                                  <tr key={item.order_item_id}>
                                    <td className="py-2 font-medium">{item.product?.product_name ?? "Unknown"}</td>
                                    <td className="py-2 text-muted-foreground text-xs">
                                      {item.product?.category} · {item.product?.size} · {item.product?.color}
                                    </td>
                                    <td className="py-2 text-right tabular">{fmt$(item.unit_price)}</td>
                                    <td className="py-2 text-right tabular">{item.quantity}</td>
                                    <td className="py-2 text-right tabular font-bold text-volt">{fmt$(item.subtotal)}</td>
                                  </tr>
                                ))}
                                <tr>
                                  <td colSpan={4} className="pt-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Total</td>
                                  <td className="pt-3 text-right font-bold text-volt text-base">{fmt$(o.total_amount)}</td>
                                </tr>
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      No orders match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {showForm && <NewOrderModal onClose={() => setShowForm(false)} onCreated={refresh} />}
    </>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-4 text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em] ${className}`}>
      {children}
    </th>
  );
}

interface OrderItemDraft { product_id: string; quantity: number; unit_price: number; }

function NewOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<DbCustomer[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<OrderItemDraft[]>([{ product_id: "", quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ full_name: "", email: "", phone: "", address: "" });

  useEffect(() => {
    Promise.all([listCustomers(), listProducts()])
      .then(([c, p]) => {
        setCustomers(c);
        setProducts(p);
        if (p.length > 0) setItems([{ product_id: p[0].product_id, quantity: 1, unit_price: p[0].price }]);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoadingData(false));
  }, []);

  const setItem = (idx: number, patch: Partial<OrderItemDraft>) => {
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, ...patch };
      if (patch.product_id) {
        const p = products.find((p) => p.product_id === patch.product_id);
        if (p) updated.unit_price = p.price;
      }
      return updated;
    }));
  };

  const addItem = () => {
    const p = products[0];
    setItems((prev) => [...prev, { product_id: p?.product_id ?? "", quantity: 1, unit_price: p?.price ?? 0 }]);
  };

  const orderTotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);

  const handleSaveCustomer = async () => {
    if (!newCust.full_name || !newCust.email) { toast.error("Name and email required"); return; }
    try {
      const c = await createCustomer(newCust);
      setCustomers((prev) => [...prev, c]);
      setCustomerId(c.customer_id);
      setShowNewCustomer(false);
      toast.success("Customer saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save customer");
    }
  };

  const submit = async () => {
    if (!customerId) { toast.error("Select a customer"); return; }
    if (items.some((it) => !it.product_id || it.quantity < 1)) { toast.error("Fill all item fields"); return; }
    setSaving(true);
    try {
      await createOrder({
        customer_id: customerId,
        created_by: user?.user_id ?? "00000000-0000-0000-0000-000000000000",
        items,
      });
      toast.success("Order created — now click Confirm to trigger invoice & inventory");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-boundary max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-boundary">
          <div>
            <h2 className="font-display text-xl">New Order</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
              Status starts as "processing" — Confirm to trigger ERP automation
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {loadingData ? (
            <p className="text-center text-sm text-muted-foreground py-8">Loading from Supabase…</p>
          ) : (
            <>
              {/* Customer */}
              <div>
                <Field label="Customer">
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputCls}>
                    <option value="">— Select customer —</option>
                    {customers.map((c) => (
                      <option key={c.customer_id} value={c.customer_id}>{c.full_name} ({c.email})</option>
                    ))}
                  </select>
                </Field>
                <button type="button" onClick={() => setShowNewCustomer((v) => !v)}
                  className="mt-2 text-[10px] font-bold uppercase tracking-widest text-volt hover:underline">
                  {showNewCustomer ? "▲ Cancel" : "+ New Customer"}
                </button>
                {showNewCustomer && (
                  <div className="mt-3 p-4 border border-boundary bg-secondary/30 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick-Add Customer</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(["full_name", "email", "phone", "address"] as const).map((f) => (
                        <Field key={f} label={f.replace("_", " ")}>
                          <input className={inputCls} value={newCust[f]} onChange={(e) => setNewCust({ ...newCust, [f]: e.target.value })} />
                        </Field>
                      ))}
                    </div>
                    <button type="button" onClick={handleSaveCustomer}
                      className="px-4 py-2 border border-boundary text-xs font-bold uppercase tracking-widest hover:border-volt hover:text-volt transition">
                      Save Customer →
                    </button>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Items</span>
                  <button type="button" onClick={addItem}
                    className="text-[10px] font-bold uppercase tracking-widest text-volt hover:underline flex items-center gap-1">
                    <Plus className="size-3" /> Add Product
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_70px_90px_28px] gap-2 items-end">
                      <Field label={idx === 0 ? "Product" : ""}>
                        <select value={item.product_id} onChange={(e) => setItem(idx, { product_id: e.target.value })} className={inputCls}>
                          <option value="">— Select —</option>
                          {products.map((p) => (
                            <option key={p.product_id} value={p.product_id}>
                              {p.product_name} ({p.size}/{p.color})
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={idx === 0 ? "Qty" : ""}>
                        <input type="number" min={1} value={item.quantity} onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })} className={inputCls} />
                      </Field>
                      <Field label={idx === 0 ? "Unit $" : ""}>
                        <input type="number" step="0.01" min={0} value={item.unit_price} onChange={(e) => setItem(idx, { unit_price: Number(e.target.value) })} className={inputCls} />
                      </Field>
                      <div className={idx === 0 ? "pt-5" : ""}>
                        {items.length > 1 && (
                          <button type="button" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                            className="p-1.5 text-muted-foreground hover:text-destructive">
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-boundary flex justify-end items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Total</span>
                  <span className="font-display text-2xl text-volt">${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-boundary flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={saving || loadingData}
            className="px-5 py-2.5 bg-volt text-primary-foreground text-xs font-bold uppercase tracking-widest italic hover:opacity-90 disabled:opacity-50">
            {saving ? "Creating…" : "Create Order →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "mt-1 w-full bg-secondary border border-boundary px-3 py-2.5 rounded-sm text-sm focus:outline-none focus:border-volt";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      {label && <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>}
      {children}
    </label>
  );
}
