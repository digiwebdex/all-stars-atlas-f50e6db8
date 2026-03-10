import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Ticket, CreditCard, FileText, Settings,
  BarChart3, Image, Globe, LogOut, Megaphone, Menu, X,
  PenLine, Mail, MapPin, Home, Search as SearchIcon, PanelBottom,
  Shield, ChevronRight, Zap, DollarSign, Coins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Suspense, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

// Using inline gradient styles since Tailwind can't generate dynamic classes
const sidebarGroups = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, gradient: "linear-gradient(135deg, #3b82f6, #4f46e5)" },
      { label: "Bookings", href: "/admin/bookings", icon: Ticket, gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
      { label: "Users", href: "/admin/users", icon: Users, gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", href: "/admin/payments", icon: CreditCard, gradient: "linear-gradient(135deg, #10b981, #059669)" },
      { label: "Payment Approvals", href: "/admin/payment-approvals", icon: FileText, gradient: "linear-gradient(135deg, #2dd4bf, #10b981)" },
      { label: "Discounts & Pricing", href: "/admin/discounts", icon: Megaphone, gradient: "linear-gradient(135deg, #f59e0b, #ea580c)" },
      { label: "Invoices", href: "/admin/invoices", icon: FileText, gradient: "linear-gradient(135deg, #ec4899, #f43f5e)" },
      { label: "Reports", href: "/admin/reports", icon: BarChart3, gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
    ],
  },
  {
    label: "CMS",
    items: [
      { label: "All Pages", href: "/admin/cms/pages", icon: FileText, gradient: "linear-gradient(135deg, #38bdf8, #3b82f6)" },
      { label: "Booking Forms", href: "/admin/cms/booking-forms", icon: PenLine, gradient: "linear-gradient(135deg, #d946ef, #ec4899)" },
      { label: "Homepage", href: "/admin/cms/homepage", icon: Home, gradient: "linear-gradient(135deg, #fb923c, #ef4444)" },
      { label: "Popups & Banners", href: "/admin/cms/popups", icon: Megaphone, gradient: "linear-gradient(135deg, #f43f5e, #ec4899)" },
      { label: "Footer", href: "/admin/cms/footer", icon: PanelBottom, gradient: "linear-gradient(135deg, #64748b, #475569)" },
      { label: "SEO", href: "/admin/cms/seo", icon: SearchIcon, gradient: "linear-gradient(135deg, #84cc16, #22c55e)" },
      { label: "Blog", href: "/admin/cms/blog", icon: PenLine, gradient: "linear-gradient(135deg, #fb7185, #ec4899)" },
      { label: "Destinations", href: "/admin/cms/destinations", icon: MapPin, gradient: "linear-gradient(135deg, #34d399, #14b8a6)" },
      { label: "Media", href: "/admin/cms/media", icon: Image, gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)" },
      { label: "Email Templates", href: "/admin/cms/email-templates", icon: Mail, gradient: "linear-gradient(135deg, #60a5fa, #6366f1)" },
    ],
  },
  {
    label: "Services",
    items: [
      { label: "Visa", href: "/admin/visa", icon: Globe, gradient: "linear-gradient(135deg, #14b8a6, #06b6d4)" },
      { label: "Markup & Revenue", href: "/admin/markup", icon: DollarSign, gradient: "linear-gradient(135deg, #f59e0b, #f97316)" },
      { label: "Currency", href: "/admin/currency", icon: Coins, gradient: "linear-gradient(135deg, #8b5cf6, #6366f1)" },
      { label: "Settings", href: "/admin/settings", icon: Settings, gradient: "linear-gradient(135deg, #6b7280, #4b5563)" },
    ],
  },
];

const SidebarNav = ({ location, onNav }: { location: ReturnType<typeof useLocation>; onNav?: () => void }) => {
  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
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
                    boxShadow: active ? "inset 0 2px 4px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-[13px]">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="admin-sidebar-indicator"
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

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen dashboard-mesh-bg">
      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="floating-orb absolute -top-32 right-1/4 w-96 h-96 bg-[hsl(280,70%,55%)] opacity-[0.03]" />
        <div className="floating-orb absolute top-1/3 -left-20 w-72 h-72 bg-[hsl(217,91%,50%)] opacity-[0.03]" style={{ animationDelay: '3s' }} />
        <div className="floating-orb absolute bottom-0 right-0 w-80 h-80 bg-[hsl(167,72%,41%)] opacity-[0.02]" style={{ animationDelay: '5s' }} />
      </div>

      {/* Admin Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 admin-topbar flex items-center px-4 md:px-6">
        <button
          className="md:hidden mr-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-white active:scale-95"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link to="/admin" className="flex items-center gap-3 mr-8">
          <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-7 w-auto brightness-0 invert" />
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-white/90 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-500/20 to-blue-500/20 border border-white/10 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
            <Shield className="w-3 h-3" />
            Super Admin
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="text-white/50 hover:text-white hover:bg-white/10" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_hsl(152,69%,41%)]" />
            <span className="text-xs text-white/60 font-medium">Online</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/50 hover:text-white hover:bg-white/10"
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
              window.dispatchEvent(new Event('auth:logout'));
              navigate("/admin/login", { replace: true });
            }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex pt-16 relative z-10">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 dashboard-sidebar fixed top-16 bottom-0 flex-col py-4 overflow-y-auto">
          <div className="px-4 mb-4">
            <div className="gradient-border-card p-3 bg-gradient-to-br from-violet-500/5 to-blue-500/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", boxShadow: "0 4px 16px rgba(139,92,246,0.3)" }}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Admin Panel</p>
                  <p className="text-[10px] text-muted-foreground">Full Access</p>
                </div>
              </div>
            </div>
          </div>
          <SidebarNav location={location} />
        </aside>

        {/* Mobile sidebar */}
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
                className="fixed top-16 left-0 bottom-0 z-50 w-64 dashboard-sidebar py-4 overflow-y-auto md:hidden"
              >
                <SidebarNav location={location} onNav={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 md:ml-64 p-4 md:p-6 lg:p-8">
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
