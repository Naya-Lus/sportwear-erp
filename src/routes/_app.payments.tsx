import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { listPayments } from "@/lib/db";
import type { PaymentWithInvoice } from "@/lib/supabase";

export const Route = createFileRoute("/_app/payments")({
  head: () => ({
    meta: [
      { title: "Payments — SportWear ERP" },
      { name: "description", content: "Payment history for SportWear invoices." },
    ],
  }),
  component: PaymentsPage,
});

const fmt$ = (n: number) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });

function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPayments()
      .then(setPayments)
      .catch(() => toast.error("Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const total = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <PageHeader eyebrow="Finance" title="Payment History" />
      <div className="p-10 space-y-6 max-w-[1400px]">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border-l-4 border-volt p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Collected</p>
            <p className="font-display text-3xl text-volt mt-2">{fmt$(total)}</p>
          </div>
          <div className="bg-card border-l-4 border-boundary p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transactions</p>
            <p className="font-display text-3xl mt-2">{payments.length}</p>
          </div>
          <div className="bg-card border-l-4 border-boundary p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg. Payment</p>
            <p className="font-display text-3xl mt-2">
              {payments.length > 0 ? fmt$(total / payments.length) : "—"}
            </p>
          </div>
        </div>

        <section className="bg-card border border-boundary">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading payments from Supabase…</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-boundary bg-secondary/40">
                  <Th>Payment ID</Th>
                  <Th>Invoice</Th>
                  <Th>Date</Th>
                  <Th>Method</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boundary">
                {payments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{p.payment_id.slice(0, 8)}…</td>
                    <td className="px-6 py-4 font-mono text-xs">{p.invoice_id.slice(0, 8)}…</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(p.payment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{p.payment_method.replace("_", " ")}</td>
                    <td className="px-6 py-4 text-right tabular font-bold text-volt">{fmt$(p.amount)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border bg-success/10 text-success border-success/30">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm text-muted-foreground">
                      No payments yet. Pay an invoice to record transactions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em] ${className}`}>
      {children}
    </th>
  );
}
