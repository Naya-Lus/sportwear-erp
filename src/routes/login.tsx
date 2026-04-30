import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SportWear ERP" },
      { name: "description", content: "Sign in to the SportWear admin dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@sportwear.io");
  const [password, setPassword] = useState("podium");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-secondary overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "linear-gradient(var(--boundary) 1px, transparent 1px), linear-gradient(90deg, var(--boundary) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative flex items-center gap-3">
          <div className="size-10 bg-volt flex items-center justify-center rotate-12">
            <div className="size-5 border-2 border-background" />
          </div>
          <span className="font-display text-2xl">SportWear</span>
        </div>

        <div className="relative space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-volt">Podium ERP // v1.0</p>
          <h2 className="font-display text-5xl leading-[0.95] max-w-md">
            Run the warehouse like a championship event.
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Real-time orders, inventory velocity, and revenue throughput — all in one operational command center.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-px bg-boundary border border-boundary">
          {[
            { v: "1,842", l: "Active orders" },
            { v: "94.1%", l: "Stock velocity" },
            { v: "$84K", l: "Daily revenue" },
          ].map((s) => (
            <div key={s.l} className="bg-secondary p-4">
              <p className="font-display text-2xl text-volt">{s.v}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3">
            <div className="size-8 bg-volt flex items-center justify-center rotate-12">
              <div className="size-4 border-2 border-background" />
            </div>
            <span className="font-display text-xl">SportWear</span>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Operator sign-in
            </p>
            <h1 className="font-display text-4xl">Take the lane.</h1>
            <p className="text-sm text-muted-foreground mt-3">
              Use any email and password (4+ chars) to enter the demo.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full bg-secondary border border-boundary px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-volt transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full bg-secondary border border-boundary px-4 py-3 rounded-sm text-sm focus:outline-none focus:border-volt transition-colors"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-volt text-primary-foreground font-bold uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50 transition italic"
            >
              {loading ? "Signing in…" : "Enter Dashboard →"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground">
            Backend will connect to Lovable Cloud later.{" "}
            <Link to="/dashboard" className="text-volt hover:underline">Skip to demo</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
