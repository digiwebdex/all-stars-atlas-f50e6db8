import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Ticket, CreditCard, Receipt, Users, Settings, LogOut, Plane, Menu, X,
  Heart, FileText, Search, Clock, Smartphone, Sparkles, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Suspense, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import DashboardBreadcrumb from "@/components/dashboard/DashboardBreadcrumb";

// Using inline gradient styles since Tailwind can't generate dynamic classes
const sidebarGroups = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard, gradient: "linear-gradient(135deg, #3b82f6, #4f46e5)" },
      { label: "My Bookings", href: "/dashboard/bookings", icon: Ticket, gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
      { label: "E-Tickets", href: "/dashboard/tickets", icon: FileText, gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Transactions", href: "/dashboard/transactions", icon: Receipt, gradient: "linear-gradient(135deg, #10b981, #059669)" },
      { label: "E-Transactions", href: "/dashboard/e-transactions", icon: Smartphone, gradient: "linear-gradient(135deg, #14b8a6, #10b981)" },
      { label: "Payments", href: "/dashboard/payments", icon: CreditCard, gradient: "linear-gradient(135deg, #f59e0b, #ea580c)" },
      { label: "Invoices", href: "/dashboard/invoices", icon: FileText, gradient: "linear-gradient(135deg, #ec4899, #f43f5e)" },
      { label: "Pay Later", href: "/dashboard/pay-later", icon: Clock, gradient: "linear-gradient(135deg, #d946ef, #ec4899)" },
    ],
  },
  {
    label: "Personal",
    items: [
      { label: "Travellers", href: "/dashboard/travellers", icon: Users, gradient: "linear-gradient(135deg, #0ea5e9, #2563eb)" },
      { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart, gradient: "linear-gradient(135deg, #f43f5e, #dc2626)" },
      { label: "Search History", href: "/dashboard/search-history", icon: Search, gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
      { label: "Settings", href: "/dashboard/settings", icon: Settings, gradient: "linear-gradient(135deg, #64748b, #475569)" },
    ],
  },
];

const SidebarNav = ({ location, onNav }: { location: ReturnType<typeof useLocation>; onNav?: () => void }) => {
  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="flex flex-col gap-1 px-2">
      {sidebarGroups.map((group) => (
        <div key={group.label}>
          <p className="sidebar-group-label">{group.label}</p>
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNav}
                className={cn(
                  "sidebar-nav-item group/nav",
                  active ? "sidebar-nav-active" : "sidebar-nav-inactive"
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-lg"
                  style={{
                    background: active ? "rgba(255,255,255,0.2)" : item.gradient,
                    boxShadow: active ? "inset 0 2px 4px rgba(0,0,0,0.1)" : `0 4px 12px ${item.gradient.includes('#3b82f6') ? 'rgba(59,130,246,0.3)' : 'rgba(0,0,0,0.15)'}`,
                  }}
                >
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-[13px]">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="user-sidebar-indicator"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                {!active && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover/nav:opacity-50 group-hover/nav:translate-x-0 transition-all duration-300" />
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
    <div className="min-h-screen dashboard-mesh-bg">
      {/* Floating orbs for depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="floating-orb absolute -top-20 -left-20 w-80 h-80 bg-[hsl(217,91%,50%)] opacity-[0.03]" />
        <div className="floating-orb absolute top-1/2 -right-32 w-96 h-96 bg-[hsl(280,70%,55%)] opacity-[0.025]" style={{ animationDelay: '2s' }} />
        <div className="floating-orb absolute -bottom-20 left-1/3 w-72 h-72 bg-[hsl(167,72%,41%)] opacity-[0.02]" style={{ animationDelay: '4s' }} />
      </div>

      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 dashboard-topbar flex items-center px-4 md:px-6">
        <button
          className="md:hidden mr-3 p-2 rounded-xl hover:bg-primary/10 transition-all duration-200 active:scale-95"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link to="/" className="flex items-center gap-2 mr-8">
          <img
            src="/images/seven-trip-logo.png"
            alt="Seven Trip"
            className="h-36 w-auto drop-shadow-[0_0_16px_rgba(29,106,229,0.4)]"
          />
        </Link>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_hsl(152,69%,41%)]" />
            <span className="text-xs text-muted-foreground font-medium">{(() => { try { const u = JSON.parse(localStorage.getItem('seven_trip_user') || '{}'); return u?.email || 'My Account'; } catch { return 'My Account'; } })()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            onClick={() => navigate("/")}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex pt-16 relative z-10">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 dashboard-sidebar fixed top-16 bottom-0 flex-col py-4 overflow-y-auto">
          <div className="px-4 mb-4">
            <div className="gradient-border-card p-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Premium</p>
                  <p className="text-[10px] text-muted-foreground">Travel Member</p>
                </div>
              </div>
            </div>
          </div>
          <SidebarNav location={location} />
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
                className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-md md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="fixed top-16 left-0 bottom-0 z-50 w-64 dashboard-sidebar py-4 md:hidden overflow-y-auto"
              >
                <SidebarNav location={location} onNav={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Content */}
        <main className="flex-1 md:ml-64 p-4 md:p-6 lg:p-8">
          <DashboardBreadcrumb />
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <Plane className="absolute inset-0 m-auto w-4 h-4 text-primary animate-pulse" />
              </div>
            </div>
          }>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
