import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MapPin, Star, Calendar, Users, Plane, Building2, UtensilsCrossed,
  Camera, ArrowRight, Heart, Clock, CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

const packages = [
  {
    id: 1, name: "Bangkok Explorer", destination: "Bangkok, Thailand", duration: "4N/5D",
    price: 42000, originalPrice: 52000, rating: 4.8, reviews: 57,
    includes: ["flight", "hotel", "meals", "sightseeing"],
    img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg",
    tag: "Best Seller", highlights: ["Grand Palace", "Floating Market", "Wat Arun"]
  },
  {
    id: 2, name: "Maldives Paradise", destination: "Maldives", duration: "3N/4D",
    price: 68000, originalPrice: 85000, rating: 4.9, reviews: 29,
    includes: ["flight", "hotel", "meals"],
    img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Maafushi.jpg",
    tag: "Luxury", highlights: ["Overwater Villa", "Snorkeling", "Sunset Cruise"]
  },
  {
    id: 3, name: "Kolkata Heritage", destination: "Kolkata, India", duration: "3N/4D",
    price: 22000, originalPrice: 28000, rating: 4.5, reviews: 97,
    includes: ["flight", "hotel", "sightseeing"],
    img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kolkata.jpg",
    tag: "Budget Friendly", highlights: ["Victoria Memorial", "Howrah Bridge", "Park Street"]
  },
  {
    id: 4, name: "KL City Tour", destination: "Kuala Lumpur, Malaysia", duration: "4N/5D",
    price: 48000, originalPrice: 58000, rating: 4.7, reviews: 68,
    includes: ["flight", "hotel", "meals", "sightseeing"],
    img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kuala_Lumpur.jpg",
    tag: null, highlights: ["Petronas Towers", "Batu Caves", "Genting Highlands"]
  },
  {
    id: 5, name: "Singapore Delight", destination: "Singapore", duration: "3N/4D",
    price: 55000, originalPrice: 68000, rating: 4.8, reviews: 33,
    includes: ["flight", "hotel", "meals", "sightseeing"],
    img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Singapore.jpg",
    tag: "Popular", highlights: ["Marina Bay Sands", "Sentosa Island", "Gardens by the Bay"]
  },
  {
    id: 6, name: "Dubai Extravaganza", destination: "Dubai, UAE", duration: "5N/6D",
    price: 75000, originalPrice: 95000, rating: 4.9, reviews: 36,
    includes: ["flight", "hotel", "meals", "sightseeing"],
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
    tag: "Premium", highlights: ["Burj Khalifa", "Desert Safari", "Dubai Mall"]
  },
  {
    id: 7, name: "Nepal Adventure", destination: "Kathmandu, Nepal", duration: "4N/5D",
    price: 35000, originalPrice: 42000, rating: 4.6, reviews: 44,
    includes: ["flight", "hotel", "sightseeing"],
    img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kathamandu.jpg",
    tag: null, highlights: ["Swayambhunath", "Pokhara", "Nagarkot Sunrise"]
  },
  {
    id: 8, name: "Cox's Bazar Beach Escape", destination: "Cox's Bazar, Bangladesh", duration: "2N/3D",
    price: 15000, originalPrice: 20000, rating: 4.4, reviews: 112,
    includes: ["hotel", "meals", "sightseeing"],
    img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Cox%27s_Bazar.jpg",
    tag: "Domestic", highlights: ["Inani Beach", "Himchari", "Marine Drive"]
  },
];

const includeIcons: Record<string, typeof Plane> = {
  flight: Plane, hotel: Building2, meals: UtensilsCrossed, sightseeing: Camera
};

const HolidayPackages = () => {
  const [sortBy, setSortBy] = useState("recommended");
  const [filter, setFilter] = useState("all");

  const filtered = packages
    .filter(p => {
      if (filter === "budget" && p.price > 40000) return false;
      if (filter === "luxury" && p.price < 60000) return false;
      if (filter === "domestic" && !p.destination.includes("Bangladesh")) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[hsl(167,72%,41%)] to-[hsl(217,91%,50%)] pt-24 lg:pt-32 pb-16 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0VjBoLTJWMTRIMjBWMGgtMnYxNEgwdjJoMTR2MTRIMHYyaDE0djE0aDJ2LTE0aDE0djE0aDJ2LTE0aDE0di0ySDM2VjE2aDEydi0ySDM2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="container mx-auto px-4 relative text-center">
          <Badge className="bg-white/15 text-white border-white/20 mb-4 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 mr-1 fill-warning text-warning" /> 4.8/5 Average Rating
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Holiday Packages
          </h1>
          <p className="text-white/65 text-sm sm:text-base max-w-lg mx-auto">
            All-inclusive holiday packages with flights, hotels, meals & sightseeing at unbeatable prices
          </p>
        </div>
      </section>

      {/* What's included */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {[
              { icon: Plane, label: "Flights Included" },
              { icon: Building2, label: "Hotel Stay" },
              { icon: UtensilsCrossed, label: "Meals" },
              { icon: Camera, label: "Sightseeing" },
              { icon: Users, label: "Tour Guide" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="font-medium text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {[
                { value: "all", label: "All" },
                { value: "budget", label: "Budget" },
                { value: "luxury", label: "Luxury" },
                { value: "domestic", label: "Domestic" },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    filter === f.value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Best Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden hover:shadow-xl transition-all group">
                <Link to={`/holidays/${pkg.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={pkg.img} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {pkg.tag && <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-[10px] font-bold shadow-lg">{pkg.tag}</Badge>}
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white">
                    <Heart className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-[10px] font-bold backdrop-blur-sm">
                        <Calendar className="w-3 h-3 mr-1" /> {pkg.duration}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm mb-1">{pkg.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" /> {pkg.destination}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {pkg.highlights.map(h => (
                      <span key={h} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{h}</span>
                    ))}
                  </div>

                  {/* Includes */}
                  <div className="flex gap-2 mb-3">
                    {pkg.includes.map(inc => {
                      const Icon = includeIcons[inc];
                      return Icon ? (
                        <div key={inc} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center" title={inc}>
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                      ) : null;
                    })}
                  </div>

                  <div className="flex items-end justify-between pt-3 border-t border-border">
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                        <span className="text-xs font-bold">{pkg.rating}</span>
                        <span className="text-[10px] text-muted-foreground">({pkg.reviews})</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">per person</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground line-through">৳{pkg.originalPrice.toLocaleString()}</p>
                      <p className="text-lg font-black text-primary">৳{pkg.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <Button className="w-full mt-3 font-semibold" size="sm">
                    View Details <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-14 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Can't Find the Perfect Package?</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
            Tell us your dream destination and we'll create a custom package just for you
          </p>
          <Button size="lg" className="font-bold shadow-lg shadow-primary/20">
            Request Custom Package <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HolidayPackages;
