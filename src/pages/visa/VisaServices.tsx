import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe, FileText, Clock, CheckCircle2, ArrowRight, Search,
  Shield, Headphones, Star, Users, Upload, Calendar
} from "lucide-react";
import { useState } from "react";
import { useCmsPageContent } from "@/hooks/useCmsContent";

const iconMap: Record<string, any> = { Globe, FileText, Clock, CheckCircle2, Shield, Headphones, Star, Users, Upload };

const VisaServices = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { data: page, isLoading } = useCmsPageContent("/visa");
  const listing = page?.listingConfig;

  const urlCountry = searchParams.get("country") || "";
  const urlType = searchParams.get("type") || "";
  const travelDate = searchParams.get("date") || "";
  const returnDate = searchParams.get("return") || "";
  const travellers = searchParams.get("travellers") || "1";
  const hasRequiredParams = !!travelDate;

  const countries = listing?.visaCountries || [];
  const steps = listing?.visaSteps || [];
  const features = listing?.visaFeatures || [];

  const filtered = countries.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (urlCountry && !c.name.toLowerCase().includes(urlCountry.toLowerCase())) return false;
    if (filter === "popular" && !c.popular) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10">
        <div className="container mx-auto px-4 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <section className="bg-card border-b border-border pt-36 lg:pt-48 pb-8">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
              {page?.hero.title}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-2 max-w-lg mx-auto">
              {page?.hero.subtitle}
            </p>
            {travelDate && <p className="text-muted-foreground/70 text-xs mb-6">Travel: {travelDate}{returnDate ? ` → ${returnDate}` : ""} • {travellers} traveller(s)</p>}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={listing?.heroSearchPlaceholder || "Search country..."}
                className="h-12 pl-12 pr-4 rounded-xl text-base bg-muted/30 border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {!hasRequiredParams ? (
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <Card><CardContent className="py-16 text-center">
              <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-lg font-bold mb-2">No Search Criteria</h2>
              <p className="text-muted-foreground mb-4">Please use the search widget to search for visa services with travel and return dates.</p>
              <Button asChild><Link to="/">Search Visa Services</Link></Button>
            </CardContent></Card>
          </div>
        </section>
      ) : (
      <>
      {/* How it works */}
      {steps.length > 0 && (
        <section className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Icon = iconMap[step.icon] || Globe;
                return (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary mb-0.5">Step {i + 1}</p>
                      <h4 className="text-sm font-bold">{step.title}</h4>
                      <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Countries */}
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Available Countries</h2>
            <div className="flex gap-1">
              {["all", "popular"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
                  {f === "all" ? "All Countries" : "Popular"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((country, i) => (
              <Card key={i} className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{country.flag}</span>
                      <div>
                        <h3 className="font-bold text-sm">{country.name}</h3>
                        <p className="text-xs text-muted-foreground">{country.type}</p>
                      </div>
                    </div>
                    {country.popular && <Badge variant="outline" className="text-[10px] bg-secondary/10 text-secondary">Popular</Badge>}
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Processing</span>
                      <span className="font-semibold">{country.processing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span className="font-bold text-primary">{country.fee}</span>
                    </div>
                  </div>
                  <Button className="w-full font-semibold group-hover:shadow-lg transition-shadow" size="sm" asChild>
                    <Link to={`/visa/apply?country=${encodeURIComponent(country.name)}&type=${encodeURIComponent(country.type)}&date=${travelDate}&return=${returnDate}&travellers=${travellers}`}>
                      Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      </>
      )}

      {/* Trust Features */}
      {features.length > 0 && (
        <section className="py-10 sm:py-14 bg-card border-t border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((f, i) => {
                const Icon = iconMap[f.icon] || Shield;
                return (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm mb-1">{f.title}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default VisaServices;
