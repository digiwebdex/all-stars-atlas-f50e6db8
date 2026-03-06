import { motion } from "framer-motion";
import React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ArrowRight, Star, MapPin, Shield, Headphones, BadgePercent,
  Smartphone, Plane, Award, TrendingUp,
  CheckCircle2, Quote, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SearchWidget from "@/components/search/SearchWidget";

// --- Animated counter hook ---
function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
}

// --- Data ---
const offers = [
  { title: "Exclusive Fares on Int'l Flights", discount: "Up to 16% OFF", desc: "International flights with partner bank cards", gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]", emoji: "✈️" },
  { title: "Domestic Flight Deals", discount: "৳1,000 OFF", desc: "Save on domestic routes with credit cards", gradient: "from-[hsl(152,69%,41%)] to-[hsl(167,72%,30%)]", emoji: "🏷️" },
  { title: "Student Fare Special", discount: "Extra Baggage", desc: "Affordable flights with extra luggage allowance", gradient: "from-[hsl(24,100%,50%)] to-[hsl(12,80%,45%)]", emoji: "🎓" },
  { title: "Hotel Weekday Deals", discount: "30% OFF", desc: "Luxury hotels at budget prices on weekdays", gradient: "from-[hsl(270,60%,50%)] to-[hsl(280,70%,35%)]", emoji: "🏨" },
];

const exploreBD = [
  { name: "Cox's Bazar", hotels: 97, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Cox%27s_Bazar.jpg" },
  { name: "Sylhet", hotels: 44, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/AzOSQlJV2UD8QhKVOKLteYWlrI9brl.png" },
  { name: "Chittagong", hotels: 36, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/8gohsAnVmFQmPRtUKSrdpIMi1SlE16.gif" },
  { name: "Dhaka", hotels: 43, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/XjOR77hq4zWYqqMRK8yI2uRfemtbgg.png" },
  { name: "Sreemangal", hotels: 6, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/wcmMawEQourNqilRyE2GOHHv0tYzVP.png" },
  { name: "Gazipur", hotels: 12, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/TdXdFC08piA8Csi3X8qqreie9UUzif.png" },
];

const airlines = [
  { name: "Biman Bangladesh", code: "BG" }, { name: "US-Bangla", code: "BS" },
  { name: "NOVOAIR", code: "VQ" }, { name: "Air Astra", code: "2A" },
  { name: "Emirates", code: "EK" }, { name: "Singapore Airlines", code: "SQ" },
  { name: "Malaysia Airlines", code: "MH" }, { name: "Qatar Airways", code: "QR" },
  { name: "Saudia", code: "SV" }, { name: "Turkish Airlines", code: "TK" },
  { name: "Thai Airways", code: "TG" }, { name: "IndiGo", code: "6E" },
];

const intlDestinations = [
  { name: "Kathmandu", hotels: "1,152", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kathamandu.jpg" },
  { name: "Bangkok", hotels: "4,351", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg" },
  { name: "Singapore", hotels: "813", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Singapore.jpg" },
  { name: "Kuala Lumpur", hotels: "2,464", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kuala_Lumpur.jpg" },
  { name: "Maldives", hotels: "36", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Maafushi.jpg" },
  { name: "Kolkata", hotels: "1,319", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kolkata.jpg" },
];

const bestHotels = [
  { name: "Sea Pearl Beach Resort & Spa", location: "Cox's Bazar", rating: 5, reviews: 431, price: "৳8,500", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/agoda-2564409-60592569-839740.jpg" },
  { name: "Bhawal Resort & Spa", location: "Gazipur", rating: 5, reviews: 264, price: "৳6,200", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/bhawal-resort-spa-20210907174024.jpg" },
  { name: "Grand Sylhet Hotel & Resort", location: "Sylhet", rating: 5, reviews: 159, price: "৳5,900", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/267736179_149939317369872_2872125975221274736_n.jpg" },
  { name: "Sayeman Beach Resort", location: "Cox's Bazar", rating: 5, reviews: 453, price: "৳7,800", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/sayeman_-1.PNG" },
];

const tourPackages = [
  { name: "Bangkok", days: "4N/5D", price: "৳42,000", rating: 5, reviews: 57, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg" },
  { name: "Maldives", days: "3N/4D", price: "৳68,000", rating: 5, reviews: 29, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Maafushi.jpg" },
  { name: "Kolkata", days: "3N/4D", price: "৳22,000", rating: 4.5, reviews: 97, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kolkata.jpg" },
  { name: "Kuala Lumpur", days: "4N/5D", price: "৳48,000", rating: 5, reviews: 68, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kuala_Lumpur.jpg" },
  { name: "Singapore", days: "3N/4D", price: "৳55,000", rating: 5, reviews: 33, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Singapore.jpg" },
  { name: "Dubai", days: "5N/6D", price: "৳75,000", rating: 5, reviews: 36, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Dubai.jpg" },
];

const domesticRoutes = [
  { from: "Dhaka", fromCode: "DAC", to: "Cox's Bazar", toCode: "CXB", price: "৳4,200" },
  { from: "Dhaka", fromCode: "DAC", to: "Jashore", toCode: "JSR", price: "৳3,800" },
  { from: "Dhaka", fromCode: "DAC", to: "Chattogram", toCode: "CGP", price: "৳3,500" },
  { from: "Dhaka", fromCode: "DAC", to: "Sylhet", toCode: "ZYL", price: "৳3,900" },
  { from: "Dhaka", fromCode: "DAC", to: "Barisal", toCode: "BZL", price: "৳3,200" },
  { from: "Dhaka", fromCode: "DAC", to: "Saidpur", toCode: "SPD", price: "৳4,100" },
];

const testimonials = [
  { name: "Rafiq Ahmed", role: "Frequent Traveller", text: "Best travel platform in Bangladesh! The flight booking is incredibly smooth and prices are always competitive.", avatar: "RA" },
  { name: "Fatema Khatun", role: "Business Traveller", text: "I use Seven Trip for all my corporate travel. The visa processing is fast and hassle-free.", avatar: "FK" },
  { name: "Kamal Hossain", role: "Family Traveller", text: "Booked our family holiday to Maldives through Seven Trip. Amazing packages at unbeatable prices!", avatar: "KH" },
];

const features = [
  { icon: Shield, title: "Secure Booking", desc: "SSL encrypted, PCI-DSS compliant" },
  { icon: BadgePercent, title: "Best Price Guarantee", desc: "We match any lower price you find" },
  { icon: Headphones, title: "24/7 Support", desc: "Call, chat, or email anytime" },
  { icon: Award, title: "IATA Accredited", desc: "Trusted by global airlines" },
];

const stats = [
  { value: 500000, suffix: "+", label: "Happy Travellers" },
  { value: 120, suffix: "+", label: "Airlines" },
  { value: 50000, suffix: "+", label: "Hotels" },
  { value: 45, suffix: "+", label: "Visa Countries" },
];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const staggerChild = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const StatCard = React.forwardRef<HTMLDivElement, { value: number; suffix: string; label: string }>(
  ({ value, suffix, label }, _ref) => {
    const { count, ref } = useCounter(value);
    const display = value >= 1000 ? `${Math.floor(count / 1000)}K` : count;
    return (
      <div ref={ref} className="stat-card">
        <div className="stat-number text-white">
          {display}<span className="text-secondary">{suffix}</span>
        </div>
        <div className="text-white/60 text-xs sm:text-sm font-medium mt-1">{label}</div>
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    // Show static image immediately, load video in background
    const timer = setTimeout(() => setVideoReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[540px] sm:min-h-[580px] md:min-h-[660px] z-20">
        {/* Video Background with image fallback for instant LCP */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Static image shown instantly while video loads */}
          <img
            src="/images/hero-beach.jpg"
            alt="Tropical beach paradise"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? 'opacity-0' : 'opacity-100'}`}
            fetchPriority="high"
          />
          {/* Real video fades in once ready */}
          {videoReady && (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              poster="/images/hero-beach.jpg"
            >
              <source src="/videos/hero-beach.mp4" type="video/mp4" />
            </video>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(200,80%,20%)/0.3] via-[hsl(200,80%,20%)/0.15] to-[hsl(200,80%,20%)/0.45]" />

        {/* Floating shapes — hidden on small screens for perf */}
        <div className="hidden sm:block absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px] animate-float" />
        <div className="hidden sm:block absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" style={{ animationDelay: '2s' }} />

        <div className="relative container mx-auto px-4 pt-24 sm:pt-28 md:pt-36 lg:pt-40 pb-8 sm:pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 sm:mb-8 md:mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/15 text-white text-[11px] sm:text-xs font-semibold mb-4 sm:mb-5" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Bangladesh's Most Trusted Travel Platform
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-[68px] font-black text-white mb-3 sm:mb-4 leading-[1.08] tracking-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.2)' }}>
              Your Journey,{" "}
              <span className="text-secondary" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)', WebkitTextStroke: '0.5px rgba(0,0,0,0.1)' }}>Simplified.</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed px-2" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4), 0 2px 12px rgba(0,0,0,0.2)' }}>
              Book flights, hotels, holidays & visa — all in one place.
              <br className="hidden md:block" />
              Best prices, 24/7 support, instant confirmation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-[1100px] mx-auto"
          >
            <SearchWidget />
          </motion.div>
        </div>
      </section>

      {/* ===== STATS STRIP ===== */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0VjBoLTJWMTRIMjBWMGgtMnYxNEgwdjJoMTR2MTRIMHYyaDE0djE0aDJ2LTE0aDE0djE0aDJ2LTE0aDE0di0ySDM2VjE2aDEydi0ySDM2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
            {stats.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-5 sm:py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-start sm:items-center gap-2.5 sm:gap-3 p-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[12px] sm:text-[13px] font-bold leading-tight">{f.title}</h4>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EXCLUSIVE OFFERS ===== */}
      <section className="py-10 sm:py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="section-title">Exclusive Offers</h2>
              <p className="section-subtitle mt-1.5 sm:mt-2 text-sm sm:text-[15px]">Grab limited-time deals before they're gone</p>
            </div>
            <Link to="/flights">
              <Button variant="ghost" className="text-primary font-semibold hidden md:flex hover:bg-primary/5">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {offers.map((offer, i) => (
              <Link key={i} to="/flights" className="block">
                <motion.div
                  variants={staggerChild}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${offer.gradient} p-5 sm:p-6 text-white min-h-[180px] sm:min-h-[200px] flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500`}
                >
                  <div className="absolute top-0 right-0 w-36 sm:w-44 h-36 sm:h-44 bg-white/5 rounded-full -translate-y-14 translate-x-14 group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 sm:w-28 h-24 sm:h-28 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                      <span className="text-xl sm:text-2xl">{offer.emoji}</span>
                      <span className="px-2 sm:px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[11px] sm:text-xs font-bold">
                        {offer.discount}
                      </span>
                    </div>
                    <h3 className="text-[15px] sm:text-[17px] font-bold mb-1 leading-snug">{offer.title}</h3>
                    <p className="text-[13px] sm:text-sm text-white/65">{offer.desc}</p>
                  </div>
                  <Button size="sm" variant="secondary" className="relative z-10 w-fit mt-3 sm:mt-4 font-bold shadow-lg text-xs sm:text-sm pointer-events-none">
                    Book Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== EXPLORE BANGLADESH ===== */}
      <section className="py-10 sm:py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-7 sm:mb-10">
            <h2 className="section-title">Explore Bangladesh</h2>
            <p className="section-subtitle text-sm sm:text-[15px]">
              Discover the beauty of our homeland — from the world's longest beach to lush tea gardens
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {exploreBD.map((dest, i) => (
              <Link key={i} to={`/hotels?location=${encodeURIComponent(dest.name)}`}>
                <motion.div variants={staggerChild} className="destination-card group">
                  <div className="aspect-[3/4] relative">
                    <img src={dest.img} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3.5">
                      <h4 className="font-bold text-white text-[13px] sm:text-[15px]">{dest.name}</h4>
                      <p className="text-[10px] sm:text-[11px] text-white/60 mt-0.5">{dest.hotels} Hotels</p>
                    </div>
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TOP AIRLINES ===== */}
      <section className="py-10 sm:py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-7 sm:mb-10">
            <h2 className="section-title">Search Top Airlines</h2>
            <p className="section-subtitle text-sm sm:text-[15px]">
              Access 120+ airlines worldwide. Compare fares and book instantly.
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
            {airlines.map((airline, i) => (
              <Link key={i} to={`/flights?airline=${airline.code}`}>
                <motion.div variants={staggerChild} className="airline-card p-3 sm:p-5">
                  <img
                    src={`https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/airlines-logo/${airline.code}.png`}
                    alt={airline.name}
                    className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
                    loading="lazy"
                  />
                  <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">{airline.name}</span>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== POPULAR DESTINATIONS ===== */}
      <section className="py-10 sm:py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-7 sm:mb-10">
            <h2 className="section-title">Most Popular Destinations</h2>
            <p className="section-subtitle text-sm sm:text-[15px]">
              Where Bangladeshi travellers love to go — Asia's best cities & beaches
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {intlDestinations.map((dest, i) => (
              <Link key={i} to={`/hotels?location=${encodeURIComponent(dest.name)}`}>
                <motion.div variants={staggerChild} className="destination-card group">
                  <div className="aspect-[3/4] relative">
                    <img src={dest.img} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3.5">
                      <h4 className="font-bold text-white text-[13px] sm:text-[15px]">{dest.name}</h4>
                      <p className="text-[10px] sm:text-[11px] text-white/60 mt-0.5">{dest.hotels} Hotels</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== BEST HOTELS ===== */}
      <section className="py-10 sm:py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 mb-6 sm:mb-8">
            <div>
              <h2 className="section-title">Best Hotels in Bangladesh</h2>
              <p className="section-subtitle mt-1.5 sm:mt-2 text-sm sm:text-[15px]">Handpicked properties with verified reviews & instant booking</p>
            </div>
            <Link to="/hotels">
              <Button variant="ghost" className="text-primary font-semibold hidden md:flex hover:bg-primary/5">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {bestHotels.map((hotel, i) => (
              <Link key={i} to={`/hotels/${i + 1}`} className="block">
              <motion.div variants={staggerChild} className="premium-card group">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-secondary text-secondary-foreground text-[11px] sm:text-xs font-bold shadow-lg">
                    {hotel.price}<span className="text-[9px] sm:text-[10px] font-medium opacity-75">/night</span>
                  </div>
                </div>
                <div className="p-3.5 sm:p-4">
                  <h4 className="font-bold text-[13px] sm:text-sm mb-1 sm:mb-1.5 truncate">{hotel.name}</h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1 mb-2 sm:mb-2.5">
                    <MapPin className="w-3 h-3" /> {hotel.location}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${j < hotel.rating ? "fill-warning text-warning" : "text-muted"}`} />
                      ))}
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground ml-1">({hotel.reviews})</span>
                    </div>
                      <Button size="sm" variant="ghost" className="text-primary text-[11px] sm:text-xs h-7 px-2 font-semibold pointer-events-none">
                        Book <ArrowRight className="w-3 h-3 ml-0.5" />
                      </Button>
                  </div>
                </div>
              </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TOUR PACKAGES ===== */}
      <section className="py-10 sm:py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-7 sm:mb-10">
            <h2 className="section-title">Holiday Tour Packages</h2>
            <p className="section-subtitle text-sm sm:text-[15px]">
              All-inclusive packages with flights, hotels, sightseeing & meals
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {tourPackages.map((pkg, i) => (
              <Link key={i} to={`/holidays/${i + 1}`}>
                <motion.div variants={staggerChild} className="destination-card group">
                  <div className="aspect-[3/4] relative">
                    <img src={pkg.img} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-1.5 sm:px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold">
                      {pkg.days}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3.5">
                      <h4 className="font-bold text-white text-[13px] sm:text-[15px]">{pkg.name}</h4>
                      <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-warning text-warning" />
                          <span className="text-[10px] sm:text-[11px] text-white/70">{pkg.rating}</span>
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-secondary">{pkg.price}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TOP ROUTES ===== */}
      <section className="py-10 sm:py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-7 sm:mb-10">
            <h2 className="section-title">Top Domestic Routes</h2>
            <p className="section-subtitle text-sm sm:text-[15px]">
              Most popular flight routes from Dhaka — starting prices shown
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {domesticRoutes.map((route, i) => (
              <Link key={i} to={`/flights?from=${route.fromCode}&to=${route.toCode}`}>
                <motion.div
                  variants={staggerChild}
                  className="flex items-center gap-2 sm:gap-3 p-3.5 sm:p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] sm:text-[15px] font-bold">{route.from}</div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground font-medium">{route.fromCode}</div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary group-hover:translate-x-1 transition-transform" />
                    <div className="w-10 sm:w-16 h-px bg-border" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-[13px] sm:text-[15px] font-bold">{route.to}</div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground font-medium">{route.toCode}</div>
                  </div>
                  <div className="shrink-0 pl-2.5 sm:pl-3 border-l border-border">
                    <div className="text-[10px] sm:text-xs text-muted-foreground">From</div>
                    <div className="text-[13px] sm:text-sm font-bold text-primary">{route.price}</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-10 sm:py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-7 sm:mb-10">
            <h2 className="section-title">What Our Travellers Say</h2>
            <p className="section-subtitle text-sm sm:text-[15px]">
              Join 500,000+ happy travellers across Bangladesh
            </p>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={staggerChild} className="bg-card rounded-2xl p-5 sm:p-6 border border-border hover:shadow-lg transition-all">
                <Quote className="w-7 h-7 sm:w-8 sm:h-8 text-primary/20 mb-2.5 sm:mb-3" />
                <p className="text-[13px] sm:text-sm text-foreground leading-relaxed mb-4 sm:mb-5">"{t.text}"</p>
                <div className="flex items-center gap-2.5 sm:gap-3 pt-3.5 sm:pt-4 border-t border-border">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-sm">
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] sm:text-sm font-bold truncate">{t.name}</div>
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground">{t.role}</div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-warning text-warning" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== APP DOWNLOAD ===== */}
      <section className="py-10 sm:py-14 md:py-20 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0VjBoLTJWMTRIMjBWMGgtMnYxNEgwdjJoMTR2MTRIMHYyaDE0djE0aDJ2LTE0aDE0djE0aDJ2LTE0aDE0di0ySDM2VjE2aDEydi0ySDM2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-10">
            <div className="text-center md:text-left max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[11px] sm:text-xs font-semibold mb-3 sm:mb-4">
                <TrendingUp className="w-3.5 h-3.5" /> 4.8★ on App Store
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-[44px] font-black text-white mb-3 sm:mb-4 leading-tight tracking-tight">
                Download the<br />Seven Trip App
              </h2>
              <p className="text-white/60 mb-5 sm:mb-6 text-[13px] sm:text-sm md:text-[15px] leading-relaxed">
                Get exclusive app-only deals, instant notifications, and manage your bookings on the go. Available on iOS and Android.
              </p>
              <div className="flex flex-col xs:flex-row items-center gap-2.5 sm:gap-3 justify-center md:justify-start">
                <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="w-full xs:w-auto">
                  <Button variant="secondary" size="lg" className="font-bold shadow-xl shadow-secondary/25 w-full">
                    <Smartphone className="w-5 h-5 mr-2" />
                    App Store
                  </Button>
                </a>
                <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="w-full xs:w-auto">
                  <Button size="lg" className="font-bold bg-white/15 hover:bg-white/25 text-white border-0 w-full">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Google Play
                  </Button>
                </a>
              </div>
            </div>
            <div className="w-44 h-44 sm:w-56 sm:h-56 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/10">
              <div className="text-center text-white/50">
                <Smartphone className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 animate-float" />
                <span className="text-[11px] sm:text-xs font-semibold">Scan QR to Download</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
