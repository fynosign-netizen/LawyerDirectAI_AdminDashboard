import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Scale, MessageSquare, DollarSign, AlertTriangle, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/users", label: "Users", icon: Users },
  { to: "/dashboard/lawyers", label: "Lawyers", icon: Scale },
  { to: "/dashboard/consultations", label: "Consultations", icon: MessageSquare },
  { to: "/dashboard/payments", label: "Payments", icon: DollarSign },
  { to: "/dashboard/reports", label: "Reports", icon: AlertTriangle },
  { to: "/dashboard/disputes", label: "Disputes", icon: Shield },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <img src="/logo.png" alt="Lawyer Direct Logo" className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-semibold tracking-tight">Lawyer Direct</span>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-sidebar-foreground/50">Admin Panel v2.0</p>
      </div>
    </aside>
  );
}
