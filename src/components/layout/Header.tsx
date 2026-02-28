import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu, User, Plane, Building2, FileText, Palmtree,
  ChevronDown, Phone, Globe, Headphones
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const mainNav = [
  { label: "Flight", href: "/flights", icon: Plane },
  { label: "Hotel", href: "/hotels", icon: Building2 },
  { label: "Holiday", href: "/holidays", icon: Palmtree },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const transparent = isHome && !scrolled;

  return (
    <>
      {/* Top info bar — only on desktop (lg+) */}
      <div className={`hidden lg:block fixed top-0 left-0 right-0 z-[51] transition-all duration-300 ${
        transparent ? "bg-white/5 backdrop-blur-sm border-b border-white/10" : "bg-muted border-b border-border"
      }`}>
        <div className="container mx-auto px-4 flex items-center justify-between h-8">
          <div className={`flex items-center gap-4 text-[11px] font-medium ${transparent ? "text-white/60" : "text-muted-foreground"}`}>
            <a href="tel:+8801234567890" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="w-3 h-3" />
              <span>+880 1234-567890</span>
            </a>
            <span className="w-px h-3 bg-current opacity-30" />
            <a href="mailto:support@seventrip.com" className="hover:text-primary transition-colors">
              support@seventrip.com
            </a>
          </div>
          <div className={`flex items-center gap-3 text-[11px] font-medium ${transparent ? "text-white/60" : "text-muted-foreground"}`}>
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              <Globe className="w-3 h-3" />
              English
            </button>
            <span className="w-px h-3 bg-current opacity-30" />
            <span>BDT ৳</span>
            <span className="w-px h-3 bg-current opacity-30" />
            <a href="#" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Headphones className="w-3 h-3" /> Help Center
            </a>
          </div>
        </div>
      </div>

      {/* Main header — top-0 on mobile, top-8 (32px) on lg+ to sit below info bar */}
      <header className={`fixed left-0 right-0 z-50 transition-all duration-300 top-0 lg:top-8 ${
        transparent
          ? "bg-transparent"
          : "bg-card/98 backdrop-blur-2xl shadow-[0_1px_3px_hsl(var(--foreground)/0.06)] border-b border-border/50"
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 lg:h-[60px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 lg:gap-2.5 group">
              <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-8 lg:h-10 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                    transparent
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  } ${location.pathname === item.href ? (transparent ? "text-white bg-white/10" : "text-primary bg-primary/8") : ""}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger className={`flex items-center gap-1 px-4 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                  transparent ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                  <FileText className="w-4 h-4" />
                  Visa <ChevronDown className="w-3 h-3 ml-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild><Link to="/visa">Visa Application</Link></DropdownMenuItem>
                  <DropdownMenuItem>Visa Requirements</DropdownMenuItem>
                  <DropdownMenuItem>Track Application</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className={`flex items-center gap-1 px-4 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                  transparent ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                  More <ChevronDown className="w-3 h-3 ml-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem>eSIM</DropdownMenuItem>
                  <DropdownMenuItem>Recharge</DropdownMenuItem>
                  <DropdownMenuItem>Pay Bill</DropdownMenuItem>
                  <DropdownMenuItem>Medical Tourism</DropdownMenuItem>
                  <DropdownMenuItem>Car Rental</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right Side — desktop */}
            <div className="hidden lg:flex items-center gap-2.5">
              <ThemeToggle className={transparent ? "text-white/80 hover:bg-white/10 hover:text-white" : ""} />
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={`font-semibold text-[13px] ${transparent ? "text-white/80 hover:bg-white/10 hover:text-white" : ""}`}
              >
                <Link to="/auth/login">
                  <User className="w-4 h-4 mr-1.5" />
                  Login
                </Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="font-bold text-[13px] shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              >
                <Link to="/auth/register">
                  Sign Up
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className={`h-10 w-10 ${transparent ? "text-white" : ""}`}>
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-5 border-b border-border">
                    <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                      <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-8 w-auto" />
                    </Link>
                  </div>
                  <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {[...mainNav, { label: "Visa", href: "/visa", icon: FileText }].map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-foreground hover:bg-muted transition-colors font-medium"
                      >
                        <item.icon className="w-5 h-5 text-primary" />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="p-4 border-t border-border space-y-2.5">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-sm text-muted-foreground font-medium">Dark Mode</span>
                      <ThemeToggle />
                    </div>
                    <Button className="w-full h-11 font-bold" asChild>
                      <Link to="/auth/login" onClick={() => setMobileOpen(false)}>Login</Link>
                    </Button>
                    <Button variant="outline" className="w-full h-11" asChild>
                      <Link to="/auth/register" onClick={() => setMobileOpen(false)}>Create Account</Link>
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
                      <Phone className="w-3 h-3" />
                      <span>+880 1234-567890</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
