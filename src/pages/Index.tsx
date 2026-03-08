import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import React from "react";
import { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  ArrowRight, Star, MapPin, Shield, Headphones, BadgePercent,
  Smartphone, Plane, Award, TrendingUp,
  CheckCircle2, Quote, Heart, ArrowUpRight, Zap, Globe, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SearchWidget from "@/components/search/SearchWidget";
import { useHomepageContent } from "@/lib/homepage-store";

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

const gradientMap: Record<string, string> = {
  blue: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]",
  green: "from-[hsl(152,69%,41%)] to-[hsl(167,72%,30%)]",
  orange: "from-[hsl(24,100%,50%)] to-[hsl(12,80%,45%)]",
  purple: "from-[hsl(270,60%,50%)] to-[hsl(280,70%,35%)]",
};

const iconMap: Record<string, typeof Shield> = {
  Shield, BadgePercent, Headphones, Award,
};

const featureIconClasses = ['feature-icon-blue', 'feature-icon-green', 'feature-icon-orange', 'feature-icon-purple'];
const statCardClasses = ['homepage-stat-blue', 'homepage-stat-green', 'homepage-stat-orange', 'homepage-stat-purple'];
const statTextColors = ['text-[hsl(217,91%,50%)]', 'text-[hsl(152,69%,41%)]', 'text-[hsl(24,100%,50%)]', 'text-[hsl(280,70%,55%)]'];

const useFadeIn = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: '50px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, className: visible ? 'animate-fade-in' : 'opacity-0' };
};

const StatCard = memo(({ value, suffix, label, index }: { value: number; suffix: string; label: string; index: number }) => {
  const { count, ref } = useCounter(value);
  const display = value >= 1000 ? `${Math.floor(count / 1000)}K` : count;
  const colorClass = statCardClasses[index % statCardClasses.length];
  const textColor = statTextColors[index % statTextColors.length];
  return (
    <div ref={ref} className={`homepage-stat-card ${colorClass}`}>
      <div className={`stat-number ${textColor}`}>
        {display}<span className="text-secondary">{suffix}</span>
      </div>
      <div className="text-muted-foreground text-xs sm:text-sm font-medium mt-1">{label}</div>
    </div>
  );
});
StatCard.displayName = "StatCard";

const DestinationCard = memo(({ dest, type }: { dest: { name: string; hotels: string | number; img: string }; type?: string }) => (
  <div className="destination-card group spotlight">
    <div className="aspect-[3/4] relative">
      <img src={dest.img} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3.5">
        <h4 className="font-bold text-white text-[13px] sm:text-[15px]">{dest.name}</h4>
        <p className="text-[10px] sm:text-[11px] text-white/60 mt-0.5">{dest.hotels} Hotels</p>
      </div>
      {type !== 'intl' && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
          <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
      )}
    </div>
  </div>
));
DestinationCard.displayName = "DestinationCard";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };

const Index = () => {
  const cms = useHomepageContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Parallax for hero
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const smoothY = useSpring(heroY, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(heroOpacity, { stiffness: 100, damping: 30 });

  const exploreFade = useFadeIn();
  const airlinesFade = useFadeIn();
  const intlFade = useFadeIn();
  const hotelsFade = useFadeIn();
  const toursFade = useFadeIn();
  const routesFade = useFadeIn();
  const testimonialsFade = useFadeIn();

  useEffect(() => {
    const timer = setTimeout(() => setVideoReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const isSectionVisible = (key: string) => {
    const section = cms.sections.find(s => s.key === key);
    return section ? section.visible : true;
  };

  const visibleOffers = cms.offers.filter(o => o.visible);
  const visibleDestinations = cms.destinations.filter(d => d.visible);
  const visibleIntl = cms.intlDestinations.filter(d => d.visible);
  const visibleAirlines = cms.airlines.filter(a => a.visible);
  const visibleHotels = cms.hotels.filter(h => h.visible);
  const visiblePackages = cms.packages.filter(p => p.visible);
  const visibleRoutes = cms.routes.filter(r => r.visible);
  const visibleTestimonials = cms.testimonials.filter(t => t.visible);
  const visibleStats = cms.stats.filter(s => s.visible);
  const visibleFeatures = cms.features.filter(f => f.visible);

  const sortedSections = [...cms.sections].sort((a, b) => a.order - b.order);

  const renderSection = (key: string) => {
    if (!isSectionVisible(key)) return null;

    switch (key) {
      case 'hero':
        return (
          <section key="hero" ref={heroRef} className="relative min-h-[540px] sm:min-h-[580px] md:min-h-[660px] z-20 overflow-hidden">
            <motion.div className="absolute inset-0" style={{ y: smoothY, scale: heroScale }}>
              <img
                src={cms.hero.posterUrl}
                alt="Tropical beach paradise"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoReady ? 'opacity-0' : 'opacity-100'}`}
                fetchPriority="high"
              />
              {videoReady && (
                <video ref={videoRef} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" poster={cms.hero.posterUrl}>
                  <source src={cms.hero.videoUrl} type="video/mp4" />
                </video>
              )}
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(200,80%,20%)/0.3] via-[hsl(200,80%,20%)/0.15] to-[hsl(200,80%,20%)/0.45]" />
            <div className="hidden sm:block absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
            <div className="hidden sm:block absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" />
            <div className="hidden sm:block absolute top-40 right-1/3 w-48 h-48 bg-accent/10 rounded-full blur-[80px]" />
            <motion.div style={{ opacity: smoothOpacity }} className="relative container mx-auto px-4 pt-24 sm:pt-28 md:pt-36 lg:pt-40 pb-8 sm:pb-10">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-6 sm:mb-8 md:mb-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/15 text-white text-[11px] sm:text-xs font-semibold mb-4 sm:mb-5 badge-shine" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  {cms.hero.badge}
                </motion.div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-[68px] font-black text-white mb-3 sm:mb-4 leading-[1.08] tracking-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.2)' }}>
                  {cms.hero.heading}{" "}
                  <span className="text-secondary" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)', WebkitTextStroke: '0.5px rgba(0,0,0,0.1)' }}>{cms.hero.headingHighlight}</span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed px-2" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4), 0 2px 12px rgba(0,0,0,0.2)' }}>
                  {cms.hero.subtitle.split('\n').map((line, i) => <span key={i}>{line}<br className="hidden md:block" /></span>)}
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="max-w-[1100px] mx-auto">
                <SearchWidget />
              </motion.div>
            </motion.div>
          </section>
        );

      case 'trustStrip':
        return (
          <section key="trustStrip" className="trust-strip">
            <motion.div
              className="container mx-auto px-4 flex items-center justify-center gap-6 sm:gap-10 flex-wrap"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {[
                { icon: Shield, label: "Secure Payments" },
                { icon: Zap, label: "Instant Confirmation" },
                { icon: Headphones, label: "24/7 Support" },
                { icon: Globe, label: "120+ Airlines" },
                { icon: Users, label: "500K+ Travellers" },
                { icon: Award, label: "Award Winning" },
              ].map((item, i) => (
                <div key={i} className="trust-strip-item">
                  <item.icon className="trust-icon" />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </section>
        );

      case 'stats':
        return (
          <section key="stats" className="relative overflow-hidden bg-gradient-to-br from-[hsl(217,91%,50%)] via-[hsl(260,70%,45%)] to-[hsl(280,70%,35%)]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0VjBoLTJWMTRIMjBWMGgtMnYxNEgwdjJoMTR2MTRIMHYyaDE0djE0aDJ2LTE0aDE0djE0aDJ2LTE0aDE0di0ySDM2VjE2aDEydi0ySDM2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-[60px]" />
            <div className="container mx-auto px-4 py-8 sm:py-10 relative">
              <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-10">
                {visibleStats.map((stat, i) => (
                  <motion.div key={i} variants={item}>
                    <div className="text-center">
                      <div className="stat-number text-white">
                        <StatCardInline value={Number(stat.value)} suffix={stat.suffix} />
                      </div>
                      <div className="text-white/60 text-xs sm:text-sm font-medium mt-1">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section key="features" className="bg-card border-b border-border relative overflow-hidden">
            <div className="absolute inset-0 homepage-mesh-bg opacity-50" />
            <div className="container mx-auto px-4 py-6 sm:py-8 relative">
              <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {visibleFeatures.map((f, i) => {
                  const Icon = iconMap[f.icon] || Shield;
                  const iconClass = featureIconClasses[i % featureIconClasses.length];
                  return (
                    <motion.div key={i} variants={item} className="flex items-start sm:items-center gap-2.5 sm:gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all duration-300 group">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${iconClass} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[12px] sm:text-[13px] font-bold leading-tight">{f.title}</h4>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>
        );

      case 'offers':
        return (
          <section key="offers" className="py-10 sm:py-14 md:py-20 homepage-mesh-bg">
            <div className="container mx-auto px-4">
              <div className="flex items-end justify-between mb-6 sm:mb-8">
                <div>
                  <h2 className="section-title">Exclusive <span className="text-gradient">Offers</span></h2>
                  <p className="section-subtitle mt-1.5 sm:mt-2 text-sm sm:text-[15px]">Grab limited-time deals before they're gone</p>
                </div>
                <Link to="/flights">
                  <Button variant="ghost" className="text-primary font-semibold hidden md:flex hover:bg-primary/5">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {visibleOffers.map((offer, i) => (
                  <motion.div key={i} variants={item}>
                    <Link to="/flights" className="block">
                      <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientMap[offer.gradient] || gradientMap.blue} p-5 sm:p-6 text-white min-h-[180px] sm:min-h-[200px] flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300`}>
                        <div className="absolute top-0 right-0 w-36 sm:w-44 h-36 sm:h-44 bg-white/5 rounded-full -translate-y-14 translate-x-14 group-hover:scale-125 transition-transform duration-500" />
                        <div className="absolute bottom-0 left-0 w-24 sm:w-28 h-24 sm:h-28 bg-white/5 rounded-full translate-y-10 -translate-x-10" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                            <span className="text-xl sm:text-2xl">{offer.emoji}</span>
                            <span className="px-2 sm:px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[11px] sm:text-xs font-bold">{offer.discount}</span>
                          </div>
                          <h3 className="text-[15px] sm:text-[17px] font-bold mb-1 leading-snug">{offer.title}</h3>
                          <p className="text-[13px] sm:text-sm text-white/65">{offer.desc}</p>
                        </div>
                        <Button size="sm" variant="secondary" className="relative z-10 w-fit mt-3 sm:mt-4 font-bold shadow-lg text-xs sm:text-sm pointer-events-none">
                          Book Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        );

      case 'exploreBD':
        return (
          <section key="exploreBD" className="py-10 sm:py-14 md:py-20 section-alt-bg">
            <div className="container mx-auto px-4">
              <div className="text-center mb-7 sm:mb-10">
                <h2 className="section-title">Explore <span className="text-gradient">Bangladesh</span></h2>
                <p className="section-subtitle text-sm sm:text-[15px]">Discover the beauty of our homeland — from the world's longest beach to lush tea gardens</p>
              </div>
              <div ref={exploreFade.ref} className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 ${exploreFade.className}`} style={{ transition: 'opacity 0.5s, transform 0.5s' }}>
                {visibleDestinations.map((dest, i) => (
                  <Link key={i} to={`/hotels?location=${encodeURIComponent(dest.name)}`}>
                    <DestinationCard dest={dest} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'airlines':
        return (
          <section key="airlines" className="py-10 sm:py-14 md:py-20 homepage-mesh-bg">
            <div className="container mx-auto px-4">
              <div className="text-center mb-7 sm:mb-10">
                <h2 className="section-title">Search Top <span className="text-gradient">Airlines</span></h2>
                <p className="section-subtitle text-sm sm:text-[15px]">Access 120+ airlines worldwide. Compare fares and book instantly.</p>
              </div>
              <div ref={airlinesFade.ref} className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4 ${airlinesFade.className}`} style={{ transition: 'opacity 0.5s, transform 0.5s' }}>
                {visibleAirlines.map((airline, i) => (
                  <Link key={i} to={`/flights?airline=${airline.code}`}>
                    <div className="airline-card p-3 sm:p-5">
                      <img src={`https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/airlines-logo/${airline.code}.png`} alt={airline.name} className="w-10 h-10 sm:w-14 sm:h-14 object-contain" loading="lazy" decoding="async" />
                      <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight">{airline.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'intlDestinations':
        return (
          <section key="intlDestinations" className="py-10 sm:py-14 md:py-20 section-alt-bg">
            <div className="container mx-auto px-4">
              <div className="text-center mb-7 sm:mb-10">
                <h2 className="section-title">Most Popular <span className="text-gradient-warm">Destinations</span></h2>
                <p className="section-subtitle text-sm sm:text-[15px]">Where Bangladeshi travellers love to go — Asia's best cities & beaches</p>
              </div>
              <div ref={intlFade.ref} className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 ${intlFade.className}`} style={{ transition: 'opacity 0.5s, transform 0.5s' }}>
                {visibleIntl.map((dest, i) => (
                  <Link key={i} to={`/hotels?location=${encodeURIComponent(dest.name)}`}>
                    <DestinationCard dest={dest} type="intl" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'hotels':
        return (
          <section key="hotels" className="py-10 sm:py-14 md:py-20 homepage-mesh-bg">
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 mb-6 sm:mb-8">
                <div>
                  <h2 className="section-title">Best <span className="text-gradient">Hotels</span> in Bangladesh</h2>
                  <p className="section-subtitle mt-1.5 sm:mt-2 text-sm sm:text-[15px]">Handpicked properties with verified reviews & instant booking</p>
                </div>
                <Link to="/hotels">
                  <Button variant="ghost" className="text-primary font-semibold hidden md:flex hover:bg-primary/5">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </Link>
              </div>
              <div ref={hotelsFade.ref} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 ${hotelsFade.className}`} style={{ transition: 'opacity 0.5s, transform 0.5s' }}>
                {visibleHotels.map((hotel, i) => (
                  <Link key={i} to={`/hotels/${i + 1}`} className="block">
                    <div className="premium-card group">
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
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
                              <Star key={j} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${j < Number(hotel.rating) ? "fill-warning text-warning" : "text-muted"}`} />
                            ))}
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground ml-1">({hotel.reviews})</span>
                          </div>
                          <Button size="sm" variant="ghost" className="text-primary text-[11px] sm:text-xs h-7 px-2 font-semibold pointer-events-none">
                            Book <ArrowRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'packages':
        return (
          <section key="packages" className="py-10 sm:py-14 md:py-20 section-alt-bg">
            <div className="container mx-auto px-4">
              <div className="text-center mb-7 sm:mb-10">
                <h2 className="section-title">Holiday <span className="text-gradient-warm">Tour Packages</span></h2>
                <p className="section-subtitle text-sm sm:text-[15px]">All-inclusive packages with flights, hotels, sightseeing & meals</p>
              </div>
              <div ref={toursFade.ref} className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 ${toursFade.className}`} style={{ transition: 'opacity 0.5s, transform 0.5s' }}>
                {visiblePackages.map((pkg, i) => (
                  <Link key={i} to={`/holidays/${i + 1}`}>
                    <div className="destination-card group">
                      <div className="aspect-[3/4] relative">
                        <img src={pkg.img} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-1.5 sm:px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold">{pkg.days}</div>
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
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'routes':
        return (
          <section key="routes" className="py-10 sm:py-14 md:py-20 homepage-mesh-bg">
            <div className="container mx-auto px-4">
              <div className="text-center mb-7 sm:mb-10">
                <h2 className="section-title">Top Domestic <span className="text-gradient">Routes</span></h2>
                <p className="section-subtitle text-sm sm:text-[15px]">Most popular flight routes from Dhaka — starting prices shown</p>
              </div>
              <div ref={routesFade.ref} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ${routesFade.className}`} style={{ transition: 'opacity 0.5s, transform 0.5s' }}>
                {visibleRoutes.map((route, i) => (
                  <Link key={i} to={`/flights?from=${route.fromCode}&to=${route.toCode}`}>
                    <div className="route-card group">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] sm:text-[15px] font-bold">{route.from}</div>
                        <div className="text-[11px] sm:text-xs text-muted-foreground font-medium">{route.fromCode}</div>
                      </div>
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="w-10 sm:w-16 h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-[13px] sm:text-[15px] font-bold">{route.to}</div>
                        <div className="text-[11px] sm:text-xs text-muted-foreground font-medium">{route.toCode}</div>
                      </div>
                      <div className="shrink-0 pl-2.5 sm:pl-3 border-l border-border">
                        <div className="text-[10px] sm:text-xs text-muted-foreground">From</div>
                        <div className="text-[13px] sm:text-sm font-bold text-primary">{route.price}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section key="testimonials" className="py-10 sm:py-14 md:py-20 section-alt-bg">
            <div className="container mx-auto px-4">
              <div className="text-center mb-7 sm:mb-10">
                <h2 className="section-title">What Our Travellers <span className="text-gradient">Say</span></h2>
                <p className="section-subtitle text-sm sm:text-[15px]">Join 500,000+ happy travellers across Bangladesh</p>
              </div>
              <motion.div ref={testimonialsFade.ref} variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 ${testimonialsFade.className}`} style={{ transition: 'opacity 0.5s, transform 0.5s' }}>
                {visibleTestimonials.map((t, i) => (
                  <motion.div key={i} variants={item}>
                    <div className="testimonial-card">
                      <Quote className="w-7 h-7 sm:w-8 sm:h-8 text-primary/20 mb-2.5 sm:mb-3" />
                      <p className="text-[13px] sm:text-sm text-foreground leading-relaxed mb-4 sm:mb-5">"{t.text}"</p>
                      <div className="flex items-center gap-2.5 sm:gap-3 pt-3.5 sm:pt-4 border-t border-border">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${featureIconClasses[i % featureIconClasses.length]} flex items-center justify-center font-bold text-xs sm:text-sm`}>{t.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] sm:text-sm font-bold truncate">{t.name}</div>
                          <div className="text-[10px] sm:text-[11px] text-muted-foreground">{t.role}</div>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {[...Array(5)].map((_, j) => <Star key={j} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-warning text-warning" />)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        );

      case 'appDownload':
        return (
          <section key="appDownload" className="py-10 sm:py-14 md:py-20 relative overflow-hidden bg-gradient-to-br from-[hsl(217,91%,50%)] via-[hsl(260,70%,45%)] to-[hsl(280,70%,35%)]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0VjBoLTJWMTRIMjBWMGgtMnYxNEgwdjJoMTR2MTRIMHYyaDE0djE0aDJ2LTE0aDE0djE0aDJ2LTE0aDE0di0ySDM2VjE2aDEydi0ySDM2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent/15 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-secondary/15 rounded-full blur-[80px]" />
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
                        <Smartphone className="w-5 h-5 mr-2" /> App Store
                      </Button>
                    </a>
                    <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="w-full xs:w-auto">
                      <Button size="lg" className="font-bold bg-white/15 hover:bg-white/25 text-white border-0 w-full">
                        <Smartphone className="w-5 h-5 mr-2" /> Google Play
                      </Button>
                    </a>
                  </div>
                </div>
                <div className="w-44 h-44 sm:w-56 sm:h-56 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <div className="text-center text-white/50">
                    <Smartphone className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3" />
                    <span className="text-[11px] sm:text-xs font-semibold">Scan QR to Download</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {sortedSections.map((section, i) => (
        <React.Fragment key={section.key}>
          {renderSection(section.key)}
          {section.key === 'hero' && renderSection('trustStrip')}
        </React.Fragment>
      ))}
    </div>
  );
};

// Inline stat counter for the gradient banner
const StatCardInline = memo(({ value, suffix }: { value: number; suffix: string }) => {
  const { count, ref } = useCounter(value);
  const display = value >= 1000 ? `${Math.floor(count / 1000)}K` : count;
  return <span ref={ref as any}>{display}<span className="text-white/70">{suffix}</span></span>;
});
StatCardInline.displayName = "StatCardInline";

export default Index;
