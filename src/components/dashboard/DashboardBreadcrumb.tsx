import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  bookings: "My Bookings",
  tickets: "E-Tickets",
  transactions: "Transactions",
  "e-transactions": "E-Transactions",
  payments: "Payments",
  invoices: "Invoices",
  "pay-later": "Pay Later",
  travellers: "Travellers",
  wishlist: "Wishlist",
  "search-history": "Search History",
  settings: "Settings",
};

const DashboardBreadcrumb = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => ({
    label: routeLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <motion.nav
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-1.5 text-xs mb-4 flex-wrap"
      aria-label="Breadcrumb"
    >
      <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
          {crumb.isLast ? (
            <span className="font-semibold text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.href} className="text-muted-foreground hover:text-primary transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </motion.nav>
  );
};

export default DashboardBreadcrumb;
