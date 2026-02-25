import { Link } from "react-router-dom";
import { Plane, Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">TravelHub</span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed">
              Your trusted travel partner for flights, hotels, visa and holiday packages. 
              Best prices guaranteed with 24/7 customer support.
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-background/10 hover:bg-primary flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm text-background/60">
              {["Flight Booking", "Hotel Reservation", "Visa Processing", "Holiday Packages", "Travel Insurance"].map((item) => (
                <li key={item}>
                  <Link to="#" className="hover:text-background transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-background/60">
              {["About Us", "Contact", "Blog", "Careers", "Terms & Conditions", "Privacy Policy", "Refund Policy"].map((item) => (
                <li key={item}>
                  <Link to="#" className="hover:text-background transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-background/60">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>123 Travel Street, Dhaka 1205, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>+880 1234-567890</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>support@travelhub.com</span>
              </li>
            </ul>

            {/* Payment Methods */}
            <div className="mt-6">
              <h5 className="text-xs font-semibold uppercase tracking-wider mb-3">Payment Methods</h5>
              <div className="flex flex-wrap gap-2">
                {["bKash", "Nagad", "VISA", "Master"].map((method) => (
                  <span key={method} className="px-2.5 py-1 bg-background/10 rounded text-xs font-medium">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-background/40">
          <p>© {new Date().getFullYear()} TravelHub. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>IATA Accredited</span>
            <span>•</span>
            <span>ATAB Member</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
