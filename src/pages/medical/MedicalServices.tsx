import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, MapPin, Star, ArrowRight, Heart, Shield, Calendar } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useMedicalHospitals } from "@/hooks/useApiData";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";

const WISHLIST_KEY = "st_wishlist_medical";
const getWishlist = (): string[] => { try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch { return []; } };
const toggleWishlistItem = (id: string): boolean => {
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx >= 0) { list.splice(idx, 1); localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); return false; }
  list.push(id); localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); return true;
};

const MedicalServices = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [wishlistedIds, setWishlistedIds] = useState<string[]>(getWishlist);
  const { data: page } = useCmsPageContent("/medical");
  const listing = page?.listingConfig;

  const urlCountry = searchParams.get("country") || "";
  const urlTreatment = searchParams.get("treatment") || "";
  const medicalDate = searchParams.get("date") || "";
  const hasRequiredParams = !!medicalDate;

  const [country, setCountry] = useState(urlCountry || "all");
  const [treatment, setTreatment] = useState(urlTreatment || "all");

  const params = hasRequiredParams ? {
    country: country !== "all" ? country : undefined,
    treatment: treatment !== "all" ? treatment : undefined,
    date: medicalDate,
  } : undefined;

  const { data: rawData, isLoading, error, refetch } = useMedicalHospitals(params);
  const hospitals = (rawData as any)?.data || (rawData as any)?.hospitals || [];

  const countries = listing?.medicalCountries || [];
  const treatments = listing?.medicalTreatments || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3"><Stethoscope className="w-8 h-8 text-accent" /> {page?.hero.title || "Medical Tourism"}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">{page?.hero.subtitle}{medicalDate ? ` • Appointment: ${medicalDate}` : ""}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={treatment} onValueChange={setTreatment}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Treatment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Treatments</SelectItem>
                {treatments.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!hasRequiredParams ? (
          <Card><CardContent className="py-16 text-center">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-bold mb-2">No Search Criteria</h2>
            <p className="text-muted-foreground mb-4">Please use the search widget to search for medical services with a travel date.</p>
            <Button asChild><Link to="/">Search Medical</Link></Button>
          </CardContent></Card>
        ) : (
        <DataLoader isLoading={isLoading} error={error} skeleton="cards" retry={refetch}>
          {hospitals.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><p className="font-semibold">No hospitals found</p></CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitals.map((hospital: any) => (
                <Card key={hospital.id} className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden">
                    <img src={hospital.image} alt={hospital.name} className="w-full h-full object-cover" />
                    {hospital.accredited && <Badge className="absolute top-3 left-3 bg-success text-success-foreground"><Shield className="w-3 h-3 mr-1" /> JCI Accredited</Badge>}
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center" onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      const added = toggleWishlistItem(String(hospital.id));
                      setWishlistedIds(getWishlist());
                      toast({ title: added ? "Added to Wishlist" : "Removed", description: hospital.name });
                    }}>
                      <Heart className={`w-4 h-4 transition-colors ${wishlistedIds.includes(String(hospital.id)) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div><h3 className="font-bold text-lg">{hospital.name}</h3><p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {hospital.country} {hospital.city}</p></div>
                      <div className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-warning text-warning" /><span className="font-bold">{hospital.rating}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">{(hospital.specialties || []).map((s: string) => <Badge key={s} variant="secondary" className="text-[10px] font-semibold">{s}</Badge>)}</div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div><p className="text-xs text-muted-foreground">Packages</p><p className="font-bold text-primary">{hospital.price}</p></div>
                      <Button size="sm" className="font-bold" asChild><Link to={`/medical/book?hospital=${hospital.id}&date=${medicalDate}`}>Enquire <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DataLoader>
        )}
      </div>
    </div>
  );
};

export default MedicalServices;
