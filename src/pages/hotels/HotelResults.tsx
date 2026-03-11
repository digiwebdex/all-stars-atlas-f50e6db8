import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, Wifi, Car, UtensilsCrossed, Waves, Filter, X, SlidersHorizontal, Grid3X3, List, Heart, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useHotelSearch } from "@/hooks/useApiData";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";

const WISHLIST_KEY = "st_wishlist_hotels";
const getWishlist = (): string[] => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; } };
const toggleWishlistItem = (id: string): boolean => {
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx >= 0) { list.splice(idx, 1); localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); return false; }
  list.push(id); localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); return true;
};

const amenityIcons: Record<string, typeof Wifi> = { wifi: Wifi, pool: Waves, restaurant: UtensilsCrossed, parking: Car };

const HotelResults = () => {
  const { toast } = useToast();
  const [wishlistedIds, setWishlistedIds] = useState<string[]>(getWishlist);
  const { data: page } = useCmsPageContent("/hotels");
  const listing = page?.listingConfig;
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("recommended");
  const [priceRange, setPriceRange] = useState([1000, 20000]);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const destination = searchParams.get("destination") || searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const hasRequiredParams = !!destination && !!checkIn && !!checkOut;

  const params = hasRequiredParams ? {
    location: destination,
    destination: destination,
    checkIn,
    checkOut,
    guests: searchParams.get("adults") || searchParams.get("guests") || undefined,
    rooms: searchParams.get("rooms") || undefined,
    sort: sortBy,
    priceMin: priceRange[0],
    priceMax: priceRange[1],
  } : undefined;

  const { data: rawData, isLoading, error, refetch } = useHotelSearch(params);
  const apiData = (rawData as any) || {};
  const hotels = apiData.data || apiData.hotels || [];
  const searchMeta = apiData.searchMeta || { total: apiData.total || hotels.length, location: destination };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold mb-3">Price per Night</h4>
        <Slider value={priceRange} onValueChange={setPriceRange} min={1000} max={50000} step={500} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground"><span>৳{priceRange[0].toLocaleString()}</span><span>৳{priceRange[1].toLocaleString()}</span></div>
      </div>
      <div>
        <h4 className="text-sm font-bold mb-3">Star Rating</h4>
        <div className="space-y-2">
          {[5, 4, 3].map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer"><Checkbox defaultChecked={s >= 4} />
              <div className="flex gap-0.5">{Array.from({ length: s }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />)}</div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{page?.pageTitle || "Hotel Reservation"} – {destination || "your destination"}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {checkIn && checkOut ? `${checkIn} → ${checkOut}` : ""} • {hotels.length} properties
              </p>
            </div>
            <Button variant="outline" size="sm" asChild><Link to="/">Modify Search</Link></Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!hasRequiredParams ? (
          <Card><CardContent className="py-16 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-bold mb-2">No Search Criteria</h2>
            <p className="text-muted-foreground mb-4">Please use the search widget to search for hotels with check-in and check-out dates.</p>
            <Button asChild><Link to="/">Search Hotels</Link></Button>
          </CardContent></Card>
        ) : (
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 shrink-0">
            <Card className="sticky top-28"><CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7">Reset</Button>
              </div>
              <FilterPanel />
            </CardContent></Card>
          </aside>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(listing?.hotelSortOptions || [
                    { value: "recommended", label: "Recommended" },
                    { value: "price-low", label: "Price: Low to High" },
                    { value: "price-high", label: "Price: High to Low" },
                    { value: "rating", label: "Guest Rating" },
                  ]).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex gap-1 border border-border rounded-lg p-0.5">
                  <button onClick={() => setView("grid")} className={`p-1.5 rounded-md ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Grid3X3 className="w-4 h-4" /></button>
                  <button onClick={() => setView("list")} className={`p-1.5 rounded-md ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><List className="w-4 h-4" /></button>
                </div>
                <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(true)}><Filter className="w-4 h-4 mr-1" /> Filters</Button>
              </div>
            </div>

            <DataLoader isLoading={isLoading} error={error} skeleton="cards" retry={refetch}>
              {hotels.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground"><p className="font-semibold">No hotels found</p></CardContent></Card>
              ) : (
                <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
                  {hotels.map((hotel: any) => (
                    <Card key={hotel.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                      <Link to={`/hotels/${hotel.id}`} className={`block ${view === "list" ? "flex flex-col sm:flex-row" : ""}`}>
                        <div className={`relative overflow-hidden ${view === "list" ? "sm:w-72 h-48 sm:h-auto" : "aspect-[16/10]"}`}>
                          <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          {hotel.tag && <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-[10px] font-bold shadow-lg">{hotel.tag}</Badge>}
                          <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors" onClick={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            const added = toggleWishlistItem(String(hotel.id));
                            setWishlistedIds(getWishlist());
                            toast({ title: added ? "Added to Wishlist" : "Removed from Wishlist", description: added ? `${hotel.name} saved` : `${hotel.name} removed` });
                          }}>
                            <Heart className={`w-4 h-4 transition-colors ${wishlistedIds.includes(String(hotel.id)) ? "fill-destructive text-destructive" : "text-muted-foreground hover:text-destructive"}`} />
                          </button>
                        </div>
                        <CardContent className={`p-4 flex-1 ${view === "list" ? "flex flex-col justify-between" : ""}`}>
                          <div>
                            <div className="flex gap-0.5 mb-1">{Array.from({ length: hotel.stars || 0 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-warning text-warning" />)}</div>
                            <h3 className="font-bold text-sm mb-1 line-clamp-1">{hotel.name}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" /> {hotel.location}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {(hotel.amenities || []).map((a: string) => { const Icon = amenityIcons[a]; return Icon ? <span key={a} className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full"><Icon className="w-3 h-3" /> {a}</span> : null; })}
                            </div>
                          </div>
                          <div className="flex items-end justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-2">
                              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-lg">{hotel.rating}</span>
                              <span className="text-xs text-muted-foreground">{hotel.reviews} reviews</span>
                            </div>
                            <div className="text-right">
                              {hotel.originalPrice && <p className="text-xs text-muted-foreground line-through">৳{hotel.originalPrice.toLocaleString()}</p>}
                              <p className="text-lg font-black text-primary">৳{hotel.price?.toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">per night</p>
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </DataLoader>
          </div>
        </div>
        )}
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-card overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5"><h3 className="font-bold">Filters</h3><button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button></div>
            <FilterPanel />
            <Button className="w-full mt-6" onClick={() => setShowFilters(false)}>Apply Filters</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelResults;
