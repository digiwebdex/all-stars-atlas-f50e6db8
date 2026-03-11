import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Star, Users, Fuel, Settings2, ArrowRight, Calendar } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { CAR_TYPES } from "@/lib/constants";
import { useCarSearch } from "@/hooks/useApiData";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import DataLoader from "@/components/DataLoader";

const CarRental = () => {
  const [searchParams] = useSearchParams();
  const [carType, setCarType] = useState("all");
  const [sortBy, setSortBy] = useState("price");
  const { data: page } = useCmsPageContent("/cars");
  const listing = page?.listingConfig;

  const pickup = searchParams.get("pickup") || "";
  const dropoff = searchParams.get("dropoff") || "";
  const pickupDate = searchParams.get("pickupDate") || "";
  const dropoffDate = searchParams.get("dropoffDate") || "";
  const hasRequiredParams = !!pickup && !!pickupDate && !!dropoffDate;

  const params = hasRequiredParams ? {
    pickup,
    dropoff,
    pickupDate,
    dropoffDate,
    type: carType !== "all" ? carType : undefined,
    sort: sortBy,
  } : undefined;

  const { data: rawData, isLoading, error, refetch } = useCarSearch(params);
  const cars = (rawData as any)?.data || (rawData as any)?.cars || [];

  const sortOptions = listing?.carSortOptions || [
    { value: "price", label: "Lowest Price" },
    { value: "rating", label: "Highest Rated" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-4">
        <div className="container mx-auto px-4">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Car className="w-6 h-6 text-primary" /> {page?.hero.title || "Car Rental"}{pickup ? ` — ${pickup}` : ""}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pickupDate && dropoffDate ? `${pickupDate} → ${dropoffDate}` : ""}{pickup && dropoff ? ` • ${pickup} to ${dropoff}` : ""} • {cars.length} vehicles available
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {!hasRequiredParams ? (
          <Card><CardContent className="py-16 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-bold mb-2">No Search Criteria</h2>
            <p className="text-muted-foreground mb-4">Please use the search widget to search for cars with pickup/drop-off dates.</p>
            <Button asChild><Link to="/">Search Cars</Link></Button>
          </CardContent></Card>
        ) : (
        <>
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={carType} onValueChange={setCarType}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Car Type" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Types</SelectItem>{CAR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{sortOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <DataLoader isLoading={isLoading} error={error} skeleton="cards" retry={refetch}>
          {cars.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><p className="font-semibold">No cars available</p></CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car: any) => (
                <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="h-48 overflow-hidden"><img src={car.image} alt={car.name} className="w-full h-full object-cover" /></div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div><h3 className="font-bold text-lg">{car.name}</h3><Badge variant="secondary" className="text-[10px] mt-1">{car.type}</Badge></div>
                      <div className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-warning text-warning" /><span className="font-bold">{car.rating}</span></div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {car.seats} seats</span>
                      <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> {car.fuel}</span>
                      <span className="flex items-center gap-1"><Settings2 className="w-3.5 h-3.5" /> {car.transmission}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div><p className="text-xs text-muted-foreground">Per day</p><p className="text-xl font-black text-primary">৳{car.price?.toLocaleString()}</p></div>
                      <Button size="sm" className="font-bold" asChild><Link to={`/cars/book?id=${car.id}&pickup=${pickup}&dropoff=${dropoff}&pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`}>Book <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DataLoader>
        </>
        )}
      </div>
    </div>
  );
};

export default CarRental;
