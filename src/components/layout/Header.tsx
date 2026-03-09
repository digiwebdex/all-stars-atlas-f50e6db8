import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Menu, User, Plane, Building2, FileText, Palmtree,
  ChevronDown, Phone, Globe, Headphones, LogOut, LayoutDashboard, Settings, Ticket, Car, Receipt, Stethoscope
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { getPrefetchHandlers } from "@/lib/prefetch";

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
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const transparent = isHome && !scrolled;

  return (
    <>
      <div className={`hidden lg:block fixed top-0 left-0 right-0 z-[51] transition-all duration-300 ${
        transparent ? "bg-white/5 backdrop-blur-sm border-b border-white/10" : "bg-muted border-b border-border"
      }`}>
        <div className="container mx-auto px-4 flex items-center justify-between h-8">
          <div className={`flex items-center gap-4 text-[11px] font-medium ${transparent ? "text-white/60" : "text-muted-foreground"}`}>
            <a href="tel:+8801234567890" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="w-3 h-3" /><span>+880 1234-567890</span>
            </a>
            <span className="w-px h-3 bg-current opacity-30" />
            <a href="mailto:support@seventrip.com" className="hover:text-primary transition-colors">support@seventrip.com</a>
          </div>
          <div className={`flex items-center gap-3 text-[11px] font-medium ${transparent ? "text-white/60" : "text-muted-foreground"}`}>
            <button className="flex items-center gap-1 hover:text-primary transition-colors"><Globe className="w-3 h-3" /> English</button>
            <span className="w-px h-3 bg-current opacity-30" />
            <span>BDT ৳</span>
            <span className="w-px h-3 bg-current opacity-30" />
            <Link to="/faq" className="flex items-center gap-1 hover:text-primary transition-colors"><Headphones className="w-3 h-3" /> Help Center</Link>
          </div>
        </div>
      </div>

      <header className={`fixed left-0 right-0 z-50 transition-all duration-300 top-0 lg:top-8 ${
        transparent ? "bg-transparent" : "bg-card/98 backdrop-blur-2xl shadow-[0_1px_3px_hsl(var(--foreground)/0.06)] border-b border-border/50"
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24 lg:h-[120px]">
            <Link to="/" className="flex items-center gap-2 lg:gap-2.5 group -ml-2 lg:-ml-4 mt-4">
              <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-[120px] lg:h-[144px] w-auto drop-shadow-[0_0_12px_rgba(29,106,229,0.5)]" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {mainNav.map((item) => (
                <Link key={item.href} to={item.href} {...getPrefetchHandlers(item.href)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                    transparent ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  } ${location.pathname === item.href ? (transparent ? "text-white bg-white/10" : "text-primary bg-primary/10") : ""}`}
                >
                  <item.icon className="w-4 h-4" />{item.label}
                </Link>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger className={`flex items-center gap-1 px-4 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                  transparent ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                  <FileText className="w-4 h-4" /> Visa <ChevronDown className="w-3 h-3 ml-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild><Link to="/visa">Visa Application</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/visa?filter=popular">Visa Requirements</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/dashboard/bookings">Track Application</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className={`flex items-center gap-1 px-4 py-2 rounded-lg text-[14px] font-semibold transition-all ${
                  transparent ? "text-white/80 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                  More <ChevronDown className="w-3 h-3 ml-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem asChild><Link to="/esim">eSIM</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/recharge">Recharge</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/paybill">Pay Bill</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/medical">Medical Tourism</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/cars">Car Rental</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <div className="hidden lg:flex items-center gap-2.5">
              <ThemeToggle className={transparent ? "text-white/80 hover:bg-white/10 hover:text-white" : ""} />
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={`font-semibold text-[13px] gap-2 ${transparent ? "text-white/80 hover:bg-white/10 hover:text-white" : ""}`}>
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {user.name?.split(" ")[0] || "Account"}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="text-sm font-bold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link to="/dashboard" className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/dashboard/bookings" className="flex items-center gap-2"><Ticket className="w-4 h-4" /> My Bookings</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/dashboard/settings" className="flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className={`font-semibold text-[13px] ${transparent ? "text-white/80 hover:bg-white/10 hover:text-white" : ""}`}>
                    <Link to="/auth/login"><User className="w-4 h-4 mr-1.5" /> Login</Link>
                  </Button>
                  <Button size="sm" asChild className="font-bold text-[13px] shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                    <Link to="/auth/register">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>

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
                      <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-10 w-auto drop-shadow-[0_0_12px_rgba(29,106,229,0.5)]" />
                    </Link>
                  </div>

                  {isAuthenticated && user && (
                    <div className="px-5 py-3 border-b border-border bg-muted/50">
                      <p className="text-sm font-bold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  )}

                  <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {[...mainNav,
                      { label: "Visa", href: "/visa", icon: FileText },
                      { label: "eSIM", href: "/esim", icon: Globe },
                      { label: "Recharge", href: "/recharge", icon: Phone },
                      { label: "Pay Bill", href: "/paybill", icon: Receipt },
                      { label: "Medical", href: "/medical", icon: Stethoscope },
                      { label: "Cars", href: "/cars", icon: Car },
                    ].map((item) => (
                      <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-foreground hover:bg-muted transition-colors font-medium">
                        <item.icon className="w-5 h-5 text-primary" />{item.label}
                      </Link>
                    ))}
                    {isAuthenticated && (
                      <>
                        <div className="h-px bg-border my-2" />
                        <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-foreground hover:bg-muted transition-colors font-medium">
                          <LayoutDashboard className="w-5 h-5 text-primary" /> Dashboard
                        </Link>
                        <Link to="/dashboard/bookings" onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-foreground hover:bg-muted transition-colors font-medium">
                          <Ticket className="w-5 h-5 text-primary" /> My Bookings
                        </Link>
                      </>
                    )}
                  </nav>

                  <div className="p-4 border-t border-border space-y-2.5">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-sm text-muted-foreground font-medium">Dark Mode</span>
                      <ThemeToggle />
                    </div>
                    {isAuthenticated ? (
                      <Button variant="destructive" className="w-full h-11" onClick={() => { logout(); setMobileOpen(false); }}>
                        <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
                      </Button>
                    ) : (
                      <>
                        <Button className="w-full h-11 font-bold" asChild>
                          <Link to="/auth/login" onClick={() => setMobileOpen(false)}>Login</Link>
                        </Button>
                        <Button variant="outline" className="w-full h-11" asChild>
                          <Link to="/auth/register" onClick={() => setMobileOpen(false)}>Create Account</Link>
                        </Button>
                      </>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-2">
                      <Phone className="w-3 h-3" /><span>+880 1234-567890</span>
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
