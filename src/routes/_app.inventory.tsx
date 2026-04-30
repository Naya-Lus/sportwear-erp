import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { listInventory } from "@/lib/db";
import type { DbInventory, DbProduct } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — SportWear ERP" },
      { name: "description", content: "Stock levels, low-stock alerts, and SKU management." },
    ],
  }),
  component: InventoryPage,
});

type InventoryRow = DbInventory & { product: DbProduct | null };

const fmt$ = (n: number) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });

function stockStatus(row: InventoryRow): { label: string; cls: string; pct: number } {
  const qty = row.quantity_available;
  const threshold = row.reorder_level ?? 20;
  if (qty === 0) return { label: "Out of stock", cls: "text-destructive border-destructive/30 bg-destructive/10", pct: 0 };
  if (qty <= threshold) return { label: "Low stock", cls: "text-warning border-warning/30 bg-warning/10", pct: 25 };
  if (qty <= threshold * 3) return { label: "Healthy", cls: "text-volt border-volt/30 bg-volt/10", pct: 65 };
  return { label: "Optimal", cls: "text-success border-success/30 bg-success/10", pct: 95 };
}

function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [query, setQuery] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listInventory()
      .then(setInventory)
      .catch(() => toast.error("Failed to load inventory from Supabase"))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    return inventory.filter((row) => {
      const threshold = row.reorder_level ?? 20;
      if (onlyLow && row.quantity_available > threshold) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        row.product?.product_name.toLowerCase().includes(q) ||
        row.product?.category.toLowerCase().includes(q) ||
        row.product?.color.toLowerCase().includes(q) ||
        row.product?.size.toLowerCase().includes(q)
      );
    });
  }, [inventory, query, onlyLow]);

  const lowCount = inventory.filter(
    (r) => r.quantity_available <= (r.reorder_level ?? 20)
  ).length;

  return (
    <>
      <PageHeader eyebrow="Vault" title="Inventory Matrix" />

      <div className="p-10 space-y-6 max-w-[1400px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="flex items-center gap-2 bg-card border border-boundary px-3 py-2.5 rounded-sm flex-1">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, category, color…"
                className="bg-transparent text-sm w-full focus:outline-none"
              />
            </div>
            <button
              onClick={() => setOnlyLow((v) => !v)}
              className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border transition flex items-center gap-2 ${
                onlyLow ? "bg-warning/10 text-warning border-warning/30" : "border-boundary text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertTriangle className="size-3.5" /> Low stock {lowCount > 0 && `(${lowCount})`}
            </button>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            {loading ? "Loading…" : `${visible.length} / ${inventory.length} SKUs · Supabase live`}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading inventory from Supabase…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visible.map((row) => {
              const s = stockStatus(row);
              const p = row.product;
              return (
                <div key={row.inventory_id} className="bg-card border border-boundary p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-muted-foreground tracking-widest">
                        {p?.category ?? "—"} · {p?.size} · {p?.color}
                      </p>
                      <h3 className="font-display text-lg mt-1 truncate">{p?.product_name ?? "Unknown Product"}</h3>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${s.cls} shrink-0`}>
                      {s.label}
                    </span>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-3xl tabular">{row.quantity_available}</span>
                      <span className="text-xs text-muted-foreground">units · reorder @ {row.reorder_level ?? 20}</span>
                    </div>
                    <div className="h-1 bg-secondary overflow-hidden">
                      <div
                        className={row.quantity_available === 0 ? "bg-destructive" : row.quantity_available <= (row.reorder_level ?? 20) ? "bg-warning" : "bg-volt"}
                        style={{ height: "100%", width: `${Math.min(100, s.pct)}%`, transition: "width 0.4s" }}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-boundary">
                      <span className="text-xs text-muted-foreground">Unit price</span>
                      <span className="font-bold text-volt">{p ? fmt$(p.price) : "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {visible.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-16 border border-dashed border-boundary">
                No inventory records match your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
