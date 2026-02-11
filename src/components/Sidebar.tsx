import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Scale, MessageSquare, DollarSign,
  AlertTriangle, Shield, Bell, Calendar, CheckSquare, Map,
  ChevronsLeft, ChevronsRight, X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/context/SidebarContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { to: "/dashboard/todos", label: "Todos", icon: CheckSquare },
  { to: "/dashboard/map", label: "Map", icon: Map },
  { to: "/dashboard/users", label: "Users", icon: Users },
  { to: "/dashboard/lawyers", label: "Lawyers", icon: Scale },
  { to: "/dashboard/consultations", label: "Consultations", icon: MessageSquare },
  { to: "/dashboard/payments", label: "Payments", icon: DollarSign },
  { to: "/dashboard/reports", label: "Reports", icon: AlertTriangle },
  { to: "/dashboard/disputes", label: "Disputes", icon: Shield },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

export default function Sidebar() {
  const { collapsed, mobileOpen, toggle, setMobileOpen } = useSidebar();
  const location = useLocation();

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  const renderNavItem = (item: typeof navItems[0], showLabel: boolean) => {
    const isActive = item.to === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(item.to);

    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/dashboard"}
        onClick={handleNavClick}
        title={!showLabel ? item.label : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          !showLabel ? "justify-center" : ""
        } ${
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        }`}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {showLabel && item.label}
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:flex ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className={`flex h-16 items-center shrink-0 ${collapsed ? "justify-center px-2" : "gap-2.5 px-6"}`}>
          <img src="/logo.png" alt="Lawyer Direct Logo" className="h-6 w-6 shrink-0" />
          {!collapsed && <span className="text-lg font-semibold tracking-tight whitespace-nowrap">Lawyer Direct</span>}
        </div>

        <Separator className="bg-sidebar-border" />

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => renderNavItem(item, !collapsed))}
        </nav>

        <div className="border-t border-sidebar-border shrink-0">
          <button
            onClick={toggle}
            className="flex w-full items-center justify-center py-3 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="border-t border-sidebar-border px-4 py-3 shrink-0">
            <p className="text-xs text-sidebar-foreground/50">Admin Panel v2.0</p>
          </div>
        )}
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Lawyer Direct Logo" className="h-6 w-6 shrink-0" />
            <span className="text-lg font-semibold tracking-tight">Lawyer Direct</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Separator className="bg-sidebar-border" />

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => renderNavItem(item, true))}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3 shrink-0">
          <p className="text-xs text-sidebar-foreground/50">Admin Panel v2.0</p>
        </div>
      </aside>
    </>
  );
}
