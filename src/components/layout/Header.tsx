import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu, Phone, User, Plane, Building2, FileText, Palmtree,
  ChevronDown, Globe
} from "lucide-react";

const navItems = [
  { label: "Flights", href: "/flights", icon: Plane },
  { label: "Hotels", href: "/hotels", icon: Building2 },
  { label: "Visa", href: "/visa", icon: FileText },
  { label: "Holidays", href: "/holidays", icon: Palmtree },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHome ? "bg-transparent" : "bg-card/95 backdrop-blur-md shadow-sm border-b border-border"
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg hero-gradient flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className={`text-xl font-bold ${isHome ? "text-primary-foreground" : "text-foreground"}`}>
              TravelHub
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isHome
                    ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="hidden lg:flex items-center gap-3">
            <button className={`flex items-center gap-1 text-sm ${
              isHome ? "text-primary-foreground/80 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
              <Globe className="w-4 h-4" />
              EN
              <ChevronDown className="w-3 h-3" />
            </button>
            <Button variant={isHome ? "outline" : "ghost"} size="sm" asChild
              className={isHome ? "border-white/30 text-primary-foreground hover:bg-white/10" : ""}>
              <Link to="/auth/login">
                <User className="w-4 h-4 mr-1" />
                Sign In
              </Link>
            </Button>
            <Button size="sm" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/auth/register">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className={isHome ? "text-primary-foreground" : ""}>
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-lg hero-gradient flex items-center justify-center">
                    <Plane className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold">TravelHub</span>
                </div>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                <div className="border-t border-border pt-4 mt-2 space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/auth/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  </Button>
                  <Button className="w-full bg-secondary text-secondary-foreground" asChild>
                    <Link to="/auth/register" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>+880 1234-567890</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
