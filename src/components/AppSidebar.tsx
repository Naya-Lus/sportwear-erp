import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingCart, FileText, CreditCard, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const items = [
  { to: "/dashboard", label: "Track Control", icon: LayoutDashboard },
  { to: "/orders", label: "Order Logistics", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/payments", label: "Payments", icon: CreditCard },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <aside className="w-64 border-r border-boundary bg-sidebar flex flex-col shrink-0 h-screen sticky top-0">
      <div className="p-8 flex items-center gap-3">
        <div className="size-8 bg-volt flex items-center justify-center rotate-12">
          <div className="size-4 border-2 border-background" />
        </div>
        <span className="font-display text-xl text-sidebar-foreground">SportWear</span>
      </div>

      <div className="px-4 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ERP Modules</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={
                "flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-bold uppercase tracking-tight transition-colors " +
                (active
                  ? "bg-volt text-primary-foreground italic"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary")
              }
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-boundary">
        <div className="px-3 py-2 mb-2">
          <p className="text-[10px] font-mono text-volt uppercase tracking-widest">● Supabase Connected</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-secondary rounded-sm mb-3">
          <div className="size-9 rounded-full bg-volt text-primary-foreground flex items-center justify-center font-bold uppercase">
            {user?.name?.[0] ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate uppercase tracking-tight">{user?.name ?? "Admin"}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">{user?.role ?? "operator"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2.5 border border-boundary text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-volt hover:border-volt transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="size-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
