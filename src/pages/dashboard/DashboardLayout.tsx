import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Ticket, CreditCard, Receipt, Users, Settings, LogOut, Plane, Menu, X,
  Heart, FileText, Search, Clock, Banknote, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

const sidebarGroups = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Bookings", href: "/dashboard/bookings", icon: Ticket },
      { label: "E-Tickets", href: "/dashboard/tickets", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Transactions", href: "/dashboard/transactions", icon: Receipt },
      { label: "E-Transactions", href: "/dashboard/e-transactions", icon: Smartphone },
      { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
      { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
      { label: "Pay Later", href: "/dashboard/pay-later", icon: Clock },
    ],
  },
  {
    label: "Personal",
    items: [
      { label: "Travellers", href: "/dashboard/travellers", icon: Users },
      { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
      { label: "Search History", href: "/dashboard/search-history", icon: Search },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const SidebarContent = ({ location, onNav }: { location: ReturnType<typeof useLocation>; onNav?: () => void }) => {
  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="flex flex-col gap-0.5">
      {sidebarGroups.map((group, gi) => (
        <div key={group.label}>
          <p className={cn("sidebar-group-label", gi === 0 && "mt-0")}>{group.label}</p>
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNav}
                className={cn(
                  "sidebar-nav-item",
                  active ? "sidebar-nav-active" : "sidebar-nav-inactive"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="user-sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary-foreground"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen dashboard-content">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 dashboard-topbar flex items-center px-4 md:px-6">
        <button
          className="md:hidden mr-3 p-2 rounded-xl hover:bg-muted/80 transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link to="/" className="flex items-center gap-2 mr-8">
          <img
            src="/images/seven-trip-logo.png"
            alt="Seven Trip"
            className="h-36 w-auto drop-shadow-[0_0_12px_rgba(29,106,229,0.5)]"
          />
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">john@example.com</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => navigate("/")}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-60 dashboard-sidebar fixed top-16 bottom-0 flex-col p-3 overflow-y-auto">
          <SidebarContent location={location} />
        </aside>

        {/* Sidebar - Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-16 left-0 bottom-0 z-50 w-60 dashboard-sidebar p-3 md:hidden overflow-y-auto"
              >
                <SidebarContent location={location} onNav={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Content */}
        <main className="flex-1 md:ml-60 p-4 md:p-6 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
