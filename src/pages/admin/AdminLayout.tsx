import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Ticket, CreditCard, FileText, Settings,
  BarChart3, Image, Globe, LogOut, Megaphone, Menu, X,
  PenLine, Mail, MapPin, Home, Search as SearchIcon, PanelBottom
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

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
      { label: "Payment Approvals", href: "/admin/payment-approvals", icon: FileText },
      { label: "Discounts & Pricing", href: "/admin/discounts", icon: Megaphone },
      { label: "Invoices", href: "/admin/invoices", icon: FileText },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "CMS",
    items: [
      { label: "All Pages", href: "/admin/cms/pages", icon: FileText },
      { label: "Booking Forms", href: "/admin/cms/booking-forms", icon: PenLine },
      { label: "Homepage", href: "/admin/cms/homepage", icon: Home },
      { label: "Footer", href: "/admin/cms/footer", icon: PanelBottom },
      { label: "SEO", href: "/admin/cms/seo", icon: SearchIcon },
      { label: "Blog", href: "/admin/cms/blog", icon: PenLine },
      { label: "Promotions", href: "/admin/cms/promotions", icon: Megaphone },
      { label: "Destinations", href: "/admin/cms/destinations", icon: MapPin },
      { label: "Media", href: "/admin/cms/media", icon: Image },
      { label: "Email Templates", href: "/admin/cms/email-templates", icon: Mail },
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

const SidebarContent = ({ location, onNav }: { location: ReturnType<typeof useLocation>; onNav?: () => void }) => {
  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
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
                    layoutId="admin-sidebar-indicator"
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

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen dashboard-content">
      {/* Admin Top Bar with dark glass */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 admin-topbar flex items-center px-4 md:px-6">
        <button
          className="md:hidden mr-3 p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link to="/admin" className="flex items-center gap-2.5 mr-8">
          <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-7 w-auto brightness-0 invert" />
          <span className="text-sm font-bold text-white/90 px-2 py-0.5 rounded-md bg-white/10 border border-white/10">
            Admin
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle className="text-white/50 hover:text-white hover:bg-white/10" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-white/60 font-medium">Super Admin</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/50 hover:text-white hover:bg-white/10"
            onClick={() => navigate("/")}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 dashboard-sidebar fixed top-14 bottom-0 flex-col p-3 overflow-y-auto">
          <SidebarContent location={location} />
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
                className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -240 }}
                animate={{ x: 0 }}
                exit={{ x: -240 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-14 left-0 bottom-0 z-50 w-56 dashboard-sidebar p-3 overflow-y-auto md:hidden"
              >
                <SidebarContent location={location} onNav={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 md:ml-56 p-4 md:p-6 lg:p-8">
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

export default AdminLayout;
