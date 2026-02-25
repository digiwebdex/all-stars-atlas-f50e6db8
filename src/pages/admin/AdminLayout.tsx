import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Ticket, CreditCard, FileText, Settings,
  BarChart3, Image, Globe, Plane, LogOut, ChevronDown, Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const sidebarGroups = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Bookings", href: "/admin/bookings", icon: Ticket },
      { label: "Users", href: "/admin/users", icon: Users },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "CMS",
    items: [
      { label: "Pages", href: "/admin/cms/pages", icon: FileText },
      { label: "Promotions", href: "/admin/cms/promotions", icon: Megaphone },
      { label: "Media", href: "/admin/cms/media", icon: Image },
    ],
  },
  {
    label: "Services",
    items: [
      { label: "Visa", href: "/admin/visa", icon: Globe },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const AdminLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-foreground text-background flex items-center px-4 md:px-6">
        <Link to="/admin" className="flex items-center gap-2 mr-8">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold">TravelHub Admin</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-background/60">Super Admin</span>
          <Button variant="ghost" size="sm" className="text-background/60 hover:text-background">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex pt-14">
        <aside className="hidden md:flex w-56 border-r border-border bg-card fixed top-14 bottom-0 flex-col p-3 overflow-y-auto">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-1">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    location.pathname === item.href
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </aside>

        <main className="flex-1 md:ml-56 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
