import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, Calendar, Plane, Building2, UtensilsCrossed, Camera, ArrowRight, Heart, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useHolidaySearch } from "@/hooks/useApiData";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";

const WISHLIST_KEY = "st_wishlist_holidays";
const getWishlist = (): string[] => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; } };
const toggleWishlistItem = (id: string): boolean => {
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx >= 0) { list.splice(idx, 1); localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); return false; }
  list.push(id); localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); return true;
};

const includeIcons: Record<string, typeof Plane> = { Plane, Building2, UtensilsCrossed, Camera, Users, flight: Plane, hotel: Building2, meals: UtensilsCrossed, sightseeing: Camera };

const HolidayPackages = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [wishlistedIds, setWishlistedIds] = useState<string[]>(getWishlist);
  const [sortBy, setSortBy] = useState("recommended");
  const [filter, setFilter] = useState("all");
  const { data: page } = useCmsPageContent("/holidays");
  const listing = page?.listingConfig;

  const destination = searchParams.get("destination") || "";
  const travelDate = searchParams.get("date") || "";
  const hasRequiredParams = !!destination && !!travelDate;

  const params = hasRequiredParams ? { destination, date: travelDate, sort: sortBy, filter } : undefined;

  const { data: rawData, isLoading, error, refetch } = useHolidaySearch(params);
  const apiData = (rawData as any) || {};
  const packages = apiData.data || apiData.packages || [];

  const includes = listing?.holidayIncludes || [];
  const filters = listing?.holidayFilters || [
    { value: "all", label: "All" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="bg-card border-b border-border pt-36 lg:pt-48 pb-8">
        <div className="container mx-auto px-4 relative text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">{page?.hero.title || "Holiday Packages"}{destination ? ` — ${destination}` : ""}</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            {travelDate ? `Travel date: ${travelDate}` : page?.hero.subtitle}
          </p>
        </div>
      </section>

      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {includes.map((item, i) => {
              const Icon = includeIcons[item.icon] || Plane;
              return <div key={i} className="flex items-center gap-2 text-sm"><Icon className="w-4 h-4 text-primary" /><span className="font-medium text-muted-foreground">{item.label}</span></div>;
            })}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          {!hasRequiredParams ? (
            <Card><CardContent className="py-16 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-lg font-bold mb-2">No Search Criteria</h2>
              <p className="text-muted-foreground mb-4">Please use the search widget to search for holiday packages with a destination and travel date.</p>
              <Button asChild><Link to="/">Search Holidays</Link></Button>
            </CardContent></Card>
          ) : (
          <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {filters.map(f => (
                <button key={f.value} onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${filter === f.value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>{f.label}</button>
              ))}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="recommended">Recommended</SelectItem><SelectItem value="price-low">Price: Low to High</SelectItem><SelectItem value="price-high">Price: High to Low</SelectItem><SelectItem value="rating">Best Rated</SelectItem></SelectContent>
            </Select>
          </div>

          <DataLoader isLoading={isLoading} error={error} skeleton="cards" retry={refetch}>
            {packages.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground"><p className="font-semibold">No packages found</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {packages.map((pkg: any) => (
                  <Card key={pkg.id} className="overflow-hidden hover:shadow-xl transition-all group">
                    <Link to={`/holidays/${pkg.id}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img src={pkg.img} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {pkg.tag && <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-[10px] font-bold shadow-lg">{pkg.tag}</Badge>}
                        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white" onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const added = toggleWishlistItem(String(pkg.id));
                          setWishlistedIds(getWishlist());
                          toast({ title: added ? "Added to Wishlist" : "Removed", description: pkg.name });
                        }}>
                          <Heart className={`w-4 h-4 transition-colors ${wishlistedIds.includes(String(pkg.id)) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                        </button>
                        <div className="absolute bottom-3 left-3"><Badge variant="outline" className="bg-white/20 text-white border-white/30 text-[10px] font-bold backdrop-blur-sm"><Calendar className="w-3 h-3 mr-1" /> {pkg.duration}</Badge></div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-sm mb-1">{pkg.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" /> {pkg.destination}</p>
                        {pkg.highlights && <div className="flex flex-wrap gap-1 mb-3">{pkg.highlights.map((h: string) => <span key={h} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{h}</span>)}</div>}
                        {pkg.includes && <div className="flex gap-2 mb-3">{pkg.includes.map((inc: string) => { const Icon = includeIcons[inc]; return Icon ? <div key={inc} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center" title={inc}><Icon className="w-3.5 h-3.5 text-primary" /></div> : null; })}</div>}
                        <div className="flex items-end justify-between pt-3 border-t border-border">
                          <div><div className="flex items-center gap-1 mb-0.5"><Star className="w-3.5 h-3.5 fill-warning text-warning" /><span className="text-xs font-bold">{pkg.rating}</span><span className="text-[10px] text-muted-foreground">({pkg.reviews})</span></div><p className="text-[10px] text-muted-foreground">per person</p></div>
                          <div className="text-right">
                            {pkg.originalPrice && <p className="text-xs text-muted-foreground line-through">৳{pkg.originalPrice.toLocaleString()}</p>}
                            <p className="text-lg font-black text-primary">৳{pkg.price?.toLocaleString()}</p>
                          </div>
                        </div>
                        <Button className="w-full mt-3 font-semibold" size="sm">View Details <ArrowRight className="w-4 h-4 ml-1" /></Button>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </DataLoader>
          </>
          )}
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">{listing?.holidayCtaTitle || "Can't Find the Perfect Package?"}</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">{listing?.holidayCtaSubtitle || "Tell us your dream destination and we'll create a custom package just for you"}</p>
          <Button size="lg" className="font-bold shadow-lg shadow-primary/20" asChild>
            <Link to="/contact">{listing?.holidayCtaButton || "Request Custom Package"} <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HolidayPackages;
