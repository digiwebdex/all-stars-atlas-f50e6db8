import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MapPin, Star, Wifi, Car, UtensilsCrossed, Waves, Filter, X,
  SlidersHorizontal, Grid3X3, List, Heart, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const mockHotels = [
  {
    id: 1, name: "Sea Pearl Beach Resort & Spa", location: "Cox's Bazar", stars: 5,
    rating: 4.8, reviews: 431, price: 8500, originalPrice: 11000,
    amenities: ["wifi", "pool", "restaurant", "parking"],
    img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/agoda-2564409-60592569-839740.jpg",
    tag: "Best Seller"
  },
  {
    id: 2, name: "Sayeman Beach Resort", location: "Cox's Bazar", stars: 5,
    rating: 4.7, reviews: 453, price: 7800, originalPrice: 9500,
    amenities: ["wifi", "pool", "restaurant"],
    img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/sayeman_-1.PNG",
    tag: "Top Rated"
  },
  {
    id: 3, name: "Royal Tulip Sea Pearl Beach Resort", location: "Cox's Bazar", stars: 5,
    rating: 4.6, reviews: 287, price: 12000, originalPrice: 15000,
    amenities: ["wifi", "pool", "restaurant", "parking"],
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    tag: "Luxury"
  },
  {
    id: 4, name: "Long Beach Hotel", location: "Cox's Bazar", stars: 4,
    rating: 4.3, reviews: 198, price: 5500, originalPrice: 7000,
    amenities: ["wifi", "restaurant"],
    img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
    tag: null
  },
  {
    id: 5, name: "Ocean Paradise Hotel & Resort", location: "Cox's Bazar", stars: 5,
    rating: 4.5, reviews: 342, price: 9200, originalPrice: 11500,
    amenities: ["wifi", "pool", "restaurant", "parking"],
    img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80",
    tag: "Great Value"
  },
  {
    id: 6, name: "Mermaid Beach Resort", location: "Cox's Bazar", stars: 4,
    rating: 4.2, reviews: 176, price: 4800, originalPrice: 6200,
    amenities: ["wifi", "pool", "restaurant"],
    img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
    tag: null
  },
];

const amenityIcons: Record<string, typeof Wifi> = { wifi: Wifi, pool: Waves, restaurant: UtensilsCrossed, parking: Car };

const HotelResults = () => {
  const [sortBy, setSortBy] = useState("recommended");
  const [priceRange, setPriceRange] = useState([3000, 15000]);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = mockHotels
    .filter(h => h.price >= priceRange[0] && h.price <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold mb-3">Price per Night</h4>
        <Slider value={priceRange} onValueChange={setPriceRange} min={1000} max={20000} step={500} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>৳{priceRange[0].toLocaleString()}</span>
          <span>৳{priceRange[1].toLocaleString()}</span>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold mb-3">Star Rating</h4>
        <div className="space-y-2">
          {[5, 4, 3].map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <Checkbox defaultChecked={s >= 4} />
              <div className="flex gap-0.5">{Array.from({ length: s }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />)}</div>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold mb-3">Amenities</h4>
        <div className="space-y-2">
          {["Free WiFi", "Swimming Pool", "Restaurant", "Free Parking", "Spa", "Gym"].map(a => (
            <label key={a} className="flex items-center gap-2 cursor-pointer">
              <Checkbox />
              <span className="text-sm">{a}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold mb-3">Guest Rating</h4>
        <div className="space-y-2">
          {["Excellent (4.5+)", "Very Good (4.0+)", "Good (3.5+)"].map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <Checkbox />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border pt-20 lg:pt-28 pb-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Hotels in Cox's Bazar</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Feb 27 - Mar 1, 2026 • 2 Guests • 1 Room • {filtered.length} properties
              </p>
            </div>
            <Button variant="outline" size="sm">Modify Search</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 shrink-0">
            <Card className="sticky top-28">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-7">Reset</Button>
                </div>
                <FilterPanel />
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Guest Rating</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex gap-1 border border-border rounded-lg p-0.5">
                  <button onClick={() => setView("grid")} className={`p-1.5 rounded-md ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setView("list")} className={`p-1.5 rounded-md ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(true)}>
                  <Filter className="w-4 h-4 mr-1" /> Filters
                </Button>
              </div>
            </div>

            <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
              {filtered.map((hotel) => (
                <Card key={hotel.id} className={`overflow-hidden hover:shadow-lg transition-shadow group ${view === "list" ? "" : ""}`}>
                  <Link to={`/hotels/${hotel.id}`} className={`block ${view === "list" ? "flex flex-col sm:flex-row" : ""}`}>
                    <div className={`relative overflow-hidden ${view === "list" ? "sm:w-72 h-48 sm:h-auto" : "aspect-[16/10]"}`}>
                      <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      {hotel.tag && (
                        <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-[10px] font-bold shadow-lg">{hotel.tag}</Badge>
                      )}
                      <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors" onClick={(e) => e.preventDefault()}>
                        <Heart className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <CardContent className={`p-4 flex-1 ${view === "list" ? "flex flex-col justify-between" : ""}`}>
                      <div>
                        <div className="flex gap-0.5 mb-1">
                          {Array.from({ length: hotel.stars }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                          ))}
                        </div>
                        <h3 className="font-bold text-sm mb-1 line-clamp-1">{hotel.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                          <MapPin className="w-3 h-3" /> {hotel.location}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {hotel.amenities.map(a => {
                            const Icon = amenityIcons[a];
                            return Icon ? (
                              <span key={a} className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                <Icon className="w-3 h-3" /> {a}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div className="flex items-end justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg">{hotel.rating}</span>
                          <span className="text-xs text-muted-foreground">{hotel.reviews} reviews</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground line-through">৳{hotel.originalPrice.toLocaleString()}</p>
                          <p className="text-lg font-black text-primary">৳{hotel.price.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">per night</p>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-card overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            <FilterPanel />
            <Button className="w-full mt-6" onClick={() => setShowFilters(false)}>Apply Filters</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelResults;
