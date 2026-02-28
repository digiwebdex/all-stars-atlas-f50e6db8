import React from "react";
import { Link } from "react-router-dom";
import { Plane, Mail, Phone, MapPin, Facebook, Instagram, Youtube, Twitter, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = React.forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="bg-[hsl(224,30%,8%)] text-white">
      {/* Newsletter */}
      <div className="border-b border-white/8">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-lg sm:text-xl font-bold mb-1">Get Travel Deals & Tips</h3>
              <p className="text-[13px] sm:text-sm text-white/50">Subscribe for exclusive offers. No spam, unsubscribe anytime.</p>
            </div>
            <div className="flex flex-col xs:flex-row gap-2 w-full md:w-auto">
              <Input
                placeholder="Enter your email"
                className="bg-white/8 border-white/10 text-white placeholder:text-white/30 h-11 w-full md:w-72 rounded-xl focus-visible:ring-primary"
              />
              <Button onClick={() => {
                const input = document.querySelector('footer input') as HTMLInputElement;
                if (input?.value && input.value.includes('@')) {
                  input.value = '';
                  alert('Thank you for subscribing! You will receive our latest deals.');
                } else {
                  alert('Please enter a valid email address.');
                }
              }} className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 w-full xs:w-auto">
                <Send className="w-4 h-4 mr-1.5" /> Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-8">
          {/* Brand — full width on mobile */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2 space-y-4 sm:space-y-5">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-44 w-auto brightness-0 invert drop-shadow-[0_0_12px_rgba(29,106,229,0.5)]" />
            </Link>
            <p className="text-[13px] sm:text-sm text-white/45 leading-relaxed max-w-sm">
              Bangladesh's most trusted travel platform. Book flights, hotels, visa & holidays with best prices, instant confirmation, and 24/7 customer support.
            </p>
            <div className="flex gap-2">
              {[
                { Icon: Facebook, label: "Facebook", url: "https://facebook.com/seventrip" },
                { Icon: Instagram, label: "Instagram", url: "https://instagram.com/seventrip" },
                { Icon: Twitter, label: "Twitter", url: "https://twitter.com/seventrip" },
                { Icon: Youtube, label: "YouTube", url: "https://youtube.com/seventrip" },
              ].map(({ Icon, label, url }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/6 hover:bg-primary flex items-center justify-center transition-all hover:scale-105">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-[12px] sm:text-[13px] mb-4 sm:mb-5 uppercase tracking-wider text-white/70">Services</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-[13px] sm:text-sm text-white/45">
              {[
                { label: "Flight Booking", href: "/flights" },
                { label: "Hotel Reservation", href: "/hotels" },
                { label: "Visa Processing", href: "/visa" },
                { label: "Holiday Packages", href: "/holidays" },
                { label: "Travel Insurance", href: "#" },
                { label: "eSIM", href: "/esim" },
                { label: "Car Rental", href: "/cars" },
                { label: "Medical Tourism", href: "/medical" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-[12px] sm:text-[13px] mb-4 sm:mb-5 uppercase tracking-wider text-white/70">Company</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-[13px] sm:text-sm text-white/45">
              {[
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Blog", href: "#" },
                { label: "Careers", href: "/careers" },
                { label: "FAQ", href: "/faq" },
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Refund Policy", href: "/refund-policy" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="hover:text-white transition-colors flex items-center gap-1 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — full width on small mobile */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-bold text-[12px] sm:text-[13px] mb-4 sm:mb-5 uppercase tracking-wider text-white/70">Contact Us</h4>
            <ul className="space-y-3 sm:space-y-3.5 text-[13px] sm:text-sm text-white/45">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                <span>123 Travel Street, Dhaka 1205, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-primary/60" />
                <a href="tel:+8801234567890" className="hover:text-white transition-colors">+880 1234-567890</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-primary/60" />
                <a href="mailto:support@seventrip.com" className="hover:text-white transition-colors">support@seventrip.com</a>
              </li>
            </ul>

            <div className="mt-5 sm:mt-6">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2.5 sm:mb-3">We Accept</h5>
              <div className="flex flex-wrap gap-1.5">
                {["bKash", "Nagad", "VISA", "Master", "AMEX", "PayPal"].map((m) => (
                  <span key={m} className="px-2 sm:px-2.5 py-1 bg-white/6 rounded-md text-[10px] font-semibold text-white/50">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/6">
        <div className="container mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-white/25">
          <p>© {new Date().getFullYear()} Seven Trip. All rights reserved.</p>
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center">
            <span className="flex items-center gap-1.5">✈️ IATA Accredited</span>
            <span className="flex items-center gap-1.5">🏆 ATAB Member</span>
            <span className="flex items-center gap-1.5">⭐ Superbrands Award</span>
          </div>
        </div>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";

export default Footer;
