import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Calendar, CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useHolidayDetails } from "@/hooks/useApiData";
import { useAuth } from "@/hooks/useAuth";
import AuthGateModal from "@/components/AuthGateModal";
import DataLoader from "@/components/DataLoader";

const HolidayDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useHolidayDetails(id);
  const pkg = (data as any)?.package || {};
  const itinerary = (data as any)?.itinerary || [];

  const handleBook = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    navigateToConfirmation();
  };

  const navigateToConfirmation = async () => {
    setBookingLoading(true);
    try {
      const result: any = await api.post('/holidays/book', {
        packageId: id,
        packageName: pkg.name,
        destination: pkg.destination,
        duration: pkg.duration,
        price: pkg.price || 0,
        taxes: Math.round((pkg.price || 0) * 0.05),
        total: Math.round((pkg.price || 0) * 1.05),
      });
      navigate("/booking/confirmation", {
        state: {
          booking: {
            type: "Holiday",
            bookingRef: result.bookingRef || result.id,
            route: pkg.destination || pkg.name,
            date: pkg.nextAvailable || "—",
            baseFare: pkg.price || 0,
            taxes: Math.round((pkg.price || 0) * 0.05),
            total: Math.round((pkg.price || 0) * 1.05),
            paymentMethod: "Pending",
          },
        },
      });
    } catch (err: any) {
      toast({ title: "Booking Failed", description: err?.message || "Could not complete booking", variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <DataLoader isLoading={isLoading} error={error} skeleton="detail" retry={refetch}>
        <div className="relative h-[300px] sm:h-[400px]">
          <img src={pkg.img} alt={pkg.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 container mx-auto">
            {pkg.tag && <Badge className="bg-secondary text-secondary-foreground text-xs font-bold mb-2">{pkg.tag}</Badge>}
            <h1 className="text-2xl sm:text-4xl font-black text-white">{pkg.name}</h1>
            <p className="text-white/60 text-sm flex items-center gap-2 mt-1"><MapPin className="w-4 h-4" /> {pkg.destination} · <Calendar className="w-4 h-4" /> {pkg.duration}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">
              {pkg.description && <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>}
              {pkg.includes && <div><h2 className="text-lg font-bold mb-3">What's Included</h2><div className="grid sm:grid-cols-2 gap-2">{pkg.includes.map((item: string, i: number) => <div key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-success shrink-0" /> {item}</div>)}</div></div>}
              {pkg.excludes && <div><h2 className="text-lg font-bold mb-3">Not Included</h2><div className="grid sm:grid-cols-2 gap-2">{pkg.excludes.map((item: string, i: number) => <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><span className="w-4 h-4 text-center">✕</span> {item}</div>)}</div></div>}
              {itinerary.length > 0 && <div><h2 className="text-lg font-bold mb-4">Day-by-Day Itinerary</h2><div className="space-y-4">{itinerary.map((day: any) => (
                <Card key={day.day}><CardContent className="p-5"><div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><span className="text-sm font-black text-primary">D{day.day}</span></div>
                  <div><h3 className="font-bold text-sm mb-2">{day.title}</h3><ul className="space-y-1">{day.activities?.map((a: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> {a}</li>)}</ul></div>
                </div></CardContent></Card>
              ))}</div></div>}
            </div>
            <div>
              <Card className="sticky top-28"><CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2"><Star className="w-4 h-4 fill-warning text-warning" /><span className="text-sm font-bold">{pkg.rating}</span><span className="text-xs text-muted-foreground">({pkg.reviews} reviews)</span></div>
                <div className="text-center">
                  {pkg.originalPrice && <p className="text-xs text-muted-foreground line-through">৳{pkg.originalPrice?.toLocaleString()}</p>}
                  <p className="text-3xl font-black text-primary">৳{pkg.price?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">per person · all inclusive</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-semibold">{pkg.duration}</span></div>
                  {pkg.nextAvailable && <div className="flex justify-between"><span className="text-muted-foreground">Next Available</span><span className="font-semibold">{pkg.nextAvailable}</span></div>}
                </div>
                <Button className="w-full h-11 font-bold shadow-lg shadow-primary/20" onClick={handleBook}>
                  Book This Package <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" className="w-full" asChild><Link to="/contact">Enquire Now</Link></Button>
              </CardContent></Card>
            </div>
          </div>
        </div>
      </DataLoader>

      <AuthGateModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthenticated={() => { setAuthOpen(false); navigateToConfirmation(); }}
        title="Sign in to book your holiday"
        description="Create an account or sign in to complete your booking."
      />
    </div>
  );
};

export default HolidayDetail;
