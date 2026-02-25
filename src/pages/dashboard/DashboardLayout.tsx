import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Ticket, CreditCard, Receipt, Users, Settings, LogOut, Plane, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const sidebarItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", href: "/dashboard/bookings", icon: Ticket },
  { label: "Transactions", href: "/dashboard/transactions", icon: Receipt },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Travellers", href: "/dashboard/travellers", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center px-4 md:px-6">
        <button className="md:hidden mr-3 p-2 rounded-lg hover:bg-muted" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link to="/" className="flex items-center gap-2 mr-8">
          <div className="w-8 h-8 rounded-lg hero-gradient flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold hidden sm:block">TravelHub</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden md:block">john@example.com</span>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/")}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-60 border-r border-border bg-card fixed top-16 bottom-0 flex-col p-4">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Sidebar - Mobile overlay */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed top-16 left-0 bottom-0 z-50 w-60 bg-card border-r border-border p-4 md:hidden overflow-y-auto">
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
          </>
        )}

        {/* Content */}
        <main className="flex-1 md:ml-60 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
