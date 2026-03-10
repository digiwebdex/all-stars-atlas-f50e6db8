import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plane, ArrowRight, User, Clock, Luggage, Shield, CreditCard,
  UtensilsCrossed, Armchair, Plus, Briefcase, Users, FileText,
  AlertCircle, CheckCircle2, Timer, AlertTriangle, Package, Weight,
} from "lucide-react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { useAuth } from "@/hooks/useAuth";
import AuthGateModal from "@/components/AuthGateModal";
import { api } from "@/lib/api";
import SeatMap from "@/components/flights/SeatMap";
import type { BookingFormField } from "@/lib/cms-defaults";

// ─── Bangladesh domestic airports ───
const BD_AIRPORTS = ["DAC", "CXB", "CGP", "ZYL", "JSR", "RJH", "SPD", "BZL", "IRD", "TKR"];

function isDomesticRoute(origin?: string, destination?: string): boolean {
  if (!origin || !destination) return true;
  return BD_AIRPORTS.includes(origin.toUpperCase()) && BD_AIRPORTS.includes(destination.toUpperCase());
}

function isBimanAirline(airlineCode?: string): boolean {
  return airlineCode?.toUpperCase() === "BG";
}

function resolveDeadlineInfo(flight: any, isDomestic: boolean): { deadline: Date; label: string } | null {
  if (!flight) return null;
  let deadline: Date | null = null;
  if (flight.timeLimit) {
    const tl = new Date(flight.timeLimit);
    if (!isNaN(tl.getTime()) && tl > new Date()) deadline = tl;
  }
  if (!deadline && flight.departureTime) {
    const now = new Date();
    const departure = new Date(flight.departureTime);
    const hoursUntilFlight = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (isDomestic) {
      if (hoursUntilFlight <= 48) { deadline = new Date(departure.getTime() - 3 * 60 * 60 * 1000); }
      else { const d48 = new Date(now.getTime() + 48 * 60 * 60 * 1000); const d24b = new Date(departure.getTime() - 24 * 60 * 60 * 1000); deadline = d48 < d24b ? d48 : d24b; }
    } else {
      if (hoursUntilFlight <= 7 * 24) { deadline = new Date(departure.getTime() - 24 * 60 * 60 * 1000); }
      else { deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); }
    }
  }
  if (!deadline) return null;
  const now = new Date();
  const hoursLeft = Math.max(1, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const label = hoursLeft > 24
    ? `Pay within ${Math.ceil(hoursLeft / 24)} days (by ${deadline.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })})`
    : `Pay within ${hoursLeft} hours (by ${deadline.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })})`;
  return { deadline, label };
}

function getAirlineLogo(code?: string): string | null {
  if (!code) return null;
  return `https://images.kiwi.com/airlines/64/${code}.png`;
}
function fmtTime(dt?: string) { if (!dt) return "—"; try { const d = new Date(dt); return isNaN(d.getTime()) ? dt : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return dt; } }
function fmtDate(dt?: string) { if (!dt) return "—"; try { const d = new Date(dt); return isNaN(d.getTime()) ? dt : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); } catch { return dt; } }

/* ─── Default Extras data (used as fallback) ─── */
const DEFAULT_MEALS = [
  { id: "standard", name: "Standard Meal", price: 0, desc: "Included with your fare", icon: "🍽️" },
  { id: "vegetarian", name: "Vegetarian", price: 0, desc: "Lacto-ovo vegetarian meal", icon: "🥗" },
  { id: "vegan", name: "Vegan", price: 200, desc: "Plant-based meal", icon: "🌱" },
  { id: "halal", name: "Halal Meal", price: 0, desc: "Halal certified preparation", icon: "☪️" },
  { id: "kosher", name: "Kosher Meal", price: 300, desc: "Kosher certified meal", icon: "✡️" },
  { id: "child", name: "Child Meal", price: 0, desc: "Kid-friendly options", icon: "🧒" },
  { id: "diabetic", name: "Diabetic Meal", price: 0, desc: "Low sugar, balanced nutrition", icon: "💊" },
  { id: "seafood", name: "Seafood Meal", price: 350, desc: "Fresh seafood selection", icon: "🦐" },
  { id: "fruit", name: "Fruit Platter", price: 150, desc: "Fresh fruit selection", icon: "🍎" },
];
const DEFAULT_BAGGAGE = [
  { id: "extra5", name: "+5 kg Extra Baggage", price: 500, desc: "Total: 25kg checked", icon: "🧳" },
  { id: "extra10", name: "+10 kg Extra Baggage", price: 900, desc: "Total: 30kg checked", icon: "🧳" },
  { id: "extra15", name: "+15 kg Extra Baggage", price: 1200, desc: "Total: 35kg checked", icon: "🧳" },
  { id: "extra20", name: "+20 kg Extra Baggage", price: 1500, desc: "Total: 40kg checked", icon: "🧳" },
  { id: "extra30", name: "+30 kg Extra Baggage", price: 2200, desc: "Total: 50kg checked", icon: "🧳" },
  { id: "sport", name: "Sports Equipment", price: 2000, desc: "Golf, ski, surfboard etc.", icon: "⚽" },
  { id: "fragile", name: "Fragile Handling", price: 800, desc: "Priority fragile handling", icon: "📦" },
  { id: "musical", name: "Musical Instrument", price: 1500, desc: "Guitar, violin etc.", icon: "🎸" },
];

/* ─── Add-on Card ─── */
const AddOnCard = ({ item, selected, onSelect, multi }: { item: { id: string; name: string; price: number; desc: string; icon?: string }; selected: boolean; onSelect: () => void; multi?: boolean }) => (
  <label className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
    selected ? "border-accent bg-accent/5 shadow-sm" : "border-border hover:border-accent/40"
  }`}>
    <Checkbox checked={selected} onCheckedChange={onSelect} />
    {item.icon && <span className="text-lg shrink-0">{item.icon}</span>}
    <div className="flex-1 min-w-0"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
    <span className={`text-sm font-bold shrink-0 ${item.price === 0 ? "text-accent" : "text-foreground"}`}>
      {item.price === 0 ? "Free" : `৳${item.price.toLocaleString()}`}
    </span>
  </label>
);

/* ─── Session countdown timer ─── */
const SessionTimer = ({ minutes = 20 }: { minutes?: number }) => {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  useEffect(() => {
    const interval = setInterval(() => setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const isUrgent = secondsLeft < 300;
  return (
    <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold ${isUrgent ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
      <Timer className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline">Session Timeout in</span>
      <span className="sm:hidden">Timeout</span>
      <span className="font-mono text-sm sm:text-base">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
    </div>
  );
};

/* ─── Compact flight segment card ─── */
const FlightSegmentCard = ({ flight, label }: { flight: any; label: string }) => {
  const logo = getAirlineLogo(flight?.airlineCode);
  if (!flight) return (
    <Card className="border-dashed"><CardContent className="py-8 text-center">
      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No {label.toLowerCase()} flight selected</p>
    </CardContent></Card>
  );

  return (
    <Card className="overflow-hidden border-accent/20">
      <div className="bg-accent px-4 py-2 flex items-center gap-2">
        <Plane className={`w-4 h-4 text-accent-foreground ${label === "Return" ? "rotate-180" : ""}`} />
        <span className="text-xs sm:text-sm font-bold text-accent-foreground">{label}: {flight.origin} → {flight.destination}</span>
        <span className="text-[10px] sm:text-xs text-accent-foreground/70 ml-auto">{fmtDate(flight.departureTime)}</span>
      </div>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {logo && <img src={logo} alt={flight.airline} className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          <div className="flex-1 flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="text-center shrink-0">
              <p className="text-lg sm:text-xl font-black">{fmtTime(flight.departureTime)}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">{flight.origin}</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
              <p className="text-[10px] text-muted-foreground">{flight.duration}</p>
              <div className="w-full flex items-center"><div className="w-2 h-2 rounded-full bg-accent shrink-0" /><div className="flex-1 h-px bg-accent/30" /><div className="w-2 h-2 rounded-full bg-accent shrink-0" /></div>
              <p className="text-[10px] text-accent font-semibold">{flight.stops === 0 ? "Non-stop" : `${flight.stops} Stop`}</p>
            </div>
            <div className="text-center shrink-0">
              <p className="text-lg sm:text-xl font-black">{fmtTime(flight.arrivalTime)}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">{flight.destination}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 text-[10px] sm:text-[11px] text-muted-foreground">
          <span>{flight.airline} · {flight.flightNumber}</span>
          <span>· {flight.cabinClass || "Economy"}</span>
          <span className="flex items-center gap-1"><Luggage className="w-3 h-3" /> {flight.baggage || "20kg"}</span>
          {flight.aircraft && <span className="hidden sm:inline">· Aircraft: {flight.aircraft}</span>}
        </div>
      </CardContent>
    </Card>
  );
};

const FlightBooking = () => {
  const [step, setStep] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: page, isLoading } = useCmsPageContent("/flights/book");
  const { toast } = useToast();

  const [selectedMeal, setSelectedMeal] = useState("standard");
  const [selectedBaggage, setSelectedBaggage] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Record<number, string>>({});
  const [seatPrices, setSeatPrices] = useState<Record<number, number>>({});

  // Ancillary data from API
  const [mealOptions, setMealOptions] = useState(DEFAULT_MEALS);
  const [baggageOptions, setBaggageOptions] = useState(DEFAULT_BAGGAGE);
  const [ancillarySource, setAncillarySource] = useState("standard");

  const [passengers, setPassengers] = useState([{
    title: "", firstName: "", lastName: "", dob: "", nationality: "", passport: "", passportExpiry: "", email: "", phone: "", gender: "", documentCountry: "BD",
  }]);

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locationState = location.state as any;
  const isRoundTrip = searchParams.get("roundTrip") === "true" || !!locationState?.returnFlight;

  const outboundFlight = locationState?.outboundFlight || null;
  const returnFlight = locationState?.returnFlight || null;

  const isBiman = isBimanAirline(outboundFlight?.airlineCode) || isBimanAirline(returnFlight?.airlineCode);
  const domestic = isDomesticRoute(outboundFlight?.origin, outboundFlight?.destination);

  // Fetch ancillaries from API
  useEffect(() => {
    if (!outboundFlight) return;
    const fetchAncillaries = async () => {
      try {
        const params: Record<string, string> = {
          airlineCode: outboundFlight.airlineCode || "",
          origin: outboundFlight.origin || "",
          destination: outboundFlight.destination || "",
        };
        if (outboundFlight._ttiItineraryRef) params.itineraryRef = outboundFlight._ttiItineraryRef;
        if (outboundFlight.cabinClass) params.cabinClass = outboundFlight.cabinClass;

        const data = await api.get<any>("/flights/ancillaries", params);
        if (data?.meals?.length > 0) {
          setMealOptions(data.meals.map((m: any) => ({
            id: m.id, name: m.name, price: m.price || 0, desc: m.description || "", icon: m.category === "dietary" ? "🥗" : m.category === "premium" ? "🦐" : "🍽️",
          })));
        }
        if (data?.baggage?.length > 0) {
          setBaggageOptions(data.baggage.map((b: any) => ({
            id: b.id, name: b.name, price: b.price || 0, desc: b.description || "", icon: b.type === "special" ? "📦" : "🧳",
          })));
        }
        if (data?.source) setAncillarySource(data.source);
      } catch {
        // Silently fall back to defaults
      }
    };
    fetchAncillaries();
  }, [outboundFlight]);

  const mealCost = mealOptions.find(m => m.id === selectedMeal)?.price || 0;
  const baggageCost = selectedBaggage.reduce((sum, id) => sum + (baggageOptions.find(b => b.id === id)?.price || 0), 0);
  const seatCost = Object.values(seatPrices).reduce((a, b) => a + b, 0);
  const addOnTotal = mealCost + baggageCost + seatCost;
  const outboundPrice = outboundFlight?.price || 0;
  const returnPrice = returnFlight?.price || 0;
  const baseFare = outboundPrice + returnPrice;
  const taxes = Math.round(baseFare * 0.12);
  const serviceCharge = 250;
  const grandTotal = baseFare + taxes + serviceCharge + addOnTotal;

  const deadlineInfo = resolveDeadlineInfo(outboundFlight, domestic);

  const handleSeatSelect = (paxIdx: number, seatId: string, price: number) => {
    setSelectedSeats(prev => ({ ...prev, [paxIdx]: seatId }));
    setSeatPrices(prev => ({ ...prev, [paxIdx]: price }));
  };
  const handleSeatDeselect = (paxIdx: number) => {
    setSelectedSeats(prev => { const n = { ...prev }; delete n[paxIdx]; return n; });
    setSeatPrices(prev => { const n = { ...prev }; delete n[paxIdx]; return n; });
  };

  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};
    if (currentStep === 1 && !outboundFlight) { toast({ title: "No Flight Selected", description: "Please go back and select a flight.", variant: "destructive" }); return false; }
    if (currentStep === 2) {
      const p = passengers[0];
      if (!p.title) errors.title = "Title is required";
      if (!p.firstName?.trim()) errors.firstName = "First name is required";
      if (!p.lastName?.trim()) errors.lastName = "Last name is required";
      if (!p.dob) errors.dob = "Date of birth is required";
      if (!p.nationality?.trim()) errors.nationality = "Nationality is required";
      if (!p.email?.trim()) errors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errors.email = "Invalid email format";
      if (!p.phone?.trim()) errors.phone = "Phone number is required";
      if (p.firstName && p.firstName.trim().length < 2) errors.firstName = "First name too short";
      if (p.lastName && p.lastName.trim().length < 2) errors.lastName = "Last name too short";
      if (p.dob) { const dobDate = new Date(p.dob); if (dobDate >= new Date()) errors.dob = "Date of birth must be in the past"; }
      if (!domestic && !p.passport?.trim()) errors.passport = "Passport required for international flights";
      if (p.passport && p.passport.trim().length > 0 && p.passport.trim().length < 5) errors.passport = "Invalid passport number";
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); toast({ title: "Missing Passenger Info", description: Object.values(errors)[0], variant: "destructive" }); return false; }
    }
    setFieldErrors({}); return true;
  };

  const handleContinue = () => { if (validateStep(step)) setStep(step + 1); };

  const createBooking = async (payLater: boolean) => {
    setBookingLoading(true);
    try {
      const seatSelections = Object.entries(selectedSeats).map(([paxIdx, seatId]) => ({
        passenger: Number(paxIdx), seat: seatId, price: seatPrices[Number(paxIdx)] || 0,
      }));
      const bookingData = {
        flightData: outboundFlight, returnFlightData: returnFlight, passengers, isRoundTrip, isDomestic: domestic, payLater,
        paymentMethod: payLater ? "pay_later" : (selectedPaymentMethod || "card"), totalAmount: grandTotal, baseFare, taxes, serviceCharge,
        addOns: {
          meal: mealOptions.find(m => m.id === selectedMeal)?.name,
          seats: seatSelections,
          baggage: selectedBaggage.map(id => baggageOptions.find(b => b.id === id)?.name).filter(Boolean),
          total: addOnTotal,
        },
        contactInfo: { email: passengers[0]?.email, phone: passengers[0]?.phone },
      };
      const result = await api.post<any>("/flights/book", bookingData);
      setBookingResult(result);
      setBookingComplete(true);
      toast({ title: payLater ? "Booking Confirmed — Pay Later" : "Booking & Payment Confirmed", description: `Booking Ref: ${result.bookingRef}` });
    } catch (err: any) {
      toast({ title: "Booking Failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally { setBookingLoading(false); }
  };

  const handleConfirmBooking = () => {
    const p = passengers[0];
    if (!p.firstName || !p.lastName) { toast({ title: "Missing Info", description: "Please fill in all passenger details.", variant: "destructive" }); setStep(2); return; }
    if (!agreedTerms) { toast({ title: "Terms Required", description: "Please agree to the Terms & Conditions.", variant: "destructive" }); return; }
    if (!isAuthenticated) { setAuthOpen(true); return; }
    if (isBiman) {
      if (!selectedPaymentMethod) { toast({ title: "Payment Required", description: "Biman Bangladesh Airlines requires immediate payment.", variant: "destructive" }); return; }
      createBooking(false);
    } else { createBooking(true); }
  };

  const handlePayNow = () => {
    if (!selectedPaymentMethod) { toast({ title: "Select Payment", description: "Please select a payment method.", variant: "destructive" }); return; }
    navigate("/dashboard/payments", { state: { bookingRef: bookingResult?.bookingRef, amount: grandTotal } });
  };

  if (isLoading) return <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10"><div className="container mx-auto px-4"><Skeleton className="h-96 w-full rounded-xl" /></div></div>;

  const STEPS = [
    { label: "Flight Details", icon: Plane },
    { label: "Passenger Info", icon: Users },
    { label: "Extras", icon: Plus },
    { label: "Review & Pay", icon: CreditCard },
  ];

  // ─── POST-BOOKING SUCCESS ───
  if (bookingComplete && bookingResult) {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-accent/30 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black">Booking {bookingResult.payLater ? "On Hold" : "Confirmed"} ✓</h2>
              <p className="text-sm text-muted-foreground">
                {bookingResult.payLater ? "Your booking has been placed on hold. Complete payment before the deadline." : "Your booking and payment have been confirmed."}
              </p>
              <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Booking Ref</span><span className="font-bold font-mono">{bookingResult.bookingRef}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span>
                  <Badge className={bookingResult.payLater ? "bg-warning/10 text-warning border-warning/20" : "bg-accent/10 text-accent border-accent/20"}>
                    {bookingResult.payLater ? "On Hold" : "Confirmed"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Amount</span><span className="font-bold text-accent">৳{grandTotal.toLocaleString()}</span></div>
                {bookingResult.payLater && bookingResult.paymentDeadline && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment Deadline</span>
                    <span className="font-bold text-destructive flex items-center gap-1"><Timer className="w-3.5 h-3.5" />
                      {new Date(bookingResult.paymentDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>
              {bookingResult.payLater && bookingResult.paymentDeadline && (
                <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-left">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-destructive">Payment Required</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your booking will be cancelled if payment is not received by{" "}
                      <strong className="text-destructive">{new Date(bookingResult.paymentDeadline).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</strong>.
                      {outboundFlight?.timeLimit ? " Deadline set by the airline." : ""}
                    </p>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3">
                {bookingResult.payLater ? (
                  <>
                    <Button className="flex-1 font-bold bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePayNow}>
                      <CreditCard className="w-4 h-4 mr-1.5" /> Pay Now ৳{grandTotal.toLocaleString()}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard/bookings")}>
                      <Timer className="w-4 h-4 mr-1.5" /> Pay Later — Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="flex-1 font-bold bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/dashboard/bookings")}>
                      <Plane className="w-4 h-4 mr-1.5" /> View My Bookings
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>Book Another Flight</Button>
                  </>
                )}
              </div>
              {bookingResult.payLater && (
                <div className="mt-4 space-y-3 text-left">
                  <p className="text-sm font-semibold">Select Payment Method</p>
                  <div className="grid grid-cols-2 gap-3">
                    {["bKash", "Nagad", "Visa/Master Card", "Bank Transfer"].map(m => (
                      <label key={m} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedPaymentMethod === m ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                      }`}>
                        <input type="radio" name="payMethod" className="accent-[hsl(var(--accent))]" checked={selectedPaymentMethod === m} onChange={() => setSelectedPaymentMethod(m)} />
                        <span className="text-sm font-medium">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
      <div className="container mx-auto px-4">
        {/* Session timer + Progress */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button onClick={() => i + 1 < step && setStep(i + 1)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                      step > i + 1 ? "bg-accent/10 text-accent cursor-pointer" :
                      step === i + 1 ? "bg-accent text-accent-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>
                  {i < STEPS.length - 1 && <div className="w-3 sm:w-8 h-px bg-border" />}
                </div>
              );
            })}
          </div>
          <SessionTimer minutes={20} />
        </div>

        {/* Biman notice */}
        {isBiman && step === 4 && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-warning/10 border border-warning/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Biman Bangladesh Airlines — Immediate Payment Required</p>
              <p className="text-xs text-muted-foreground mt-1">Biman does not support hold. Payment must be made immediately.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* STEP 1: Flight Details */}
            {step === 1 && (
              <>
                <FlightSegmentCard flight={outboundFlight} label="Outbound" />
                {isRoundTrip && <FlightSegmentCard flight={returnFlight} label="Return" />}
                {!isRoundTrip && !outboundFlight && (
                  <Card className="border-dashed"><CardContent className="py-8 text-center"><p className="text-sm text-muted-foreground">Loading flight details...</p></CardContent></Card>
                )}
              </>
            )}

            {/* STEP 2: Passenger Info */}
            {step === 2 && (
              <Card>
                <CardHeader className="bg-accent/5 border-b border-border">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" /> Enter Traveler Details
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Enter details exactly as they appear on your passport/ID</p>
                </CardHeader>
                <CardContent className="p-3 sm:p-5">
                  {passengers.map((pax, pi) => (
                    <div key={pi} className="space-y-3 sm:space-y-4">
                      {pi > 0 && <Separator className="my-4" />}
                      <Badge variant="outline" className="text-xs mb-3">Adult Traveler {pi + 1}</Badge>

                      {/* Row 1: Title + Gender + DOB + Nationality */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors.title ? "text-destructive" : ""}`}>Title *</Label>
                          <Select value={pax.title} onValueChange={(v) => {
                            const updated = [...passengers]; updated[pi].title = v;
                            if (v === "Mr" || v === "Master") updated[pi].gender = "Male";
                            else updated[pi].gender = "Female";
                            setPassengers(updated); setFieldErrors(prev => { const n = {...prev}; delete n.title; return n; });
                          }}>
                            <SelectTrigger className={`h-10 sm:h-11 ${fieldErrors.title ? "border-destructive ring-destructive/20 ring-2" : ""}`}><SelectValue placeholder="Title" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr">Mr</SelectItem><SelectItem value="Mrs">Mrs</SelectItem>
                              <SelectItem value="Ms">Ms</SelectItem><SelectItem value="Master">Master</SelectItem><SelectItem value="Miss">Miss</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs sm:text-sm">Gender *</Label>
                          <div className="flex gap-2 h-10 sm:h-11">
                            {["Male", "Female"].map(g => (
                              <button key={g} onClick={() => { const updated = [...passengers]; updated[pi].gender = g; setPassengers(updated); }}
                                className={`flex-1 rounded-md border text-xs sm:text-sm font-medium transition-colors ${
                                  pax.gender === g ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border hover:border-accent/40"
                                }`}>{g}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors.dob ? "text-destructive" : ""}`}>Date of Birth *</Label>
                          <Input type="date" value={pax.dob} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].dob = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.dob; return n; });
                          }} className={`h-10 sm:h-11 ${fieldErrors.dob ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors.nationality ? "text-destructive" : ""}`}>Nationality *</Label>
                          <Input value={pax.nationality} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].nationality = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.nationality; return n; });
                          }} placeholder="e.g. Bangladeshi" className={`h-10 sm:h-11 ${fieldErrors.nationality ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                      </div>

                      {/* Row 2: Names */}
                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors.firstName ? "text-destructive" : ""}`}>First/Given Name *</Label>
                          <Input value={pax.firstName} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].firstName = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.firstName; return n; });
                          }} placeholder="As on passport" className={`h-10 sm:h-11 ${fieldErrors.firstName ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors.lastName ? "text-destructive" : ""}`}>Surname/Family/Last Name *</Label>
                          <Input value={pax.lastName} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].lastName = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.lastName; return n; });
                          }} placeholder="As on passport" className={`h-10 sm:h-11 ${fieldErrors.lastName ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                      </div>

                      {/* Row 3: Document info */}
                      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs sm:text-sm">Document Issue Country</Label>
                          <Select value={pax.documentCountry || "BD"} onValueChange={(v) => { const updated = [...passengers]; updated[pi].documentCountry = v; setPassengers(updated); }}>
                            <SelectTrigger className="h-10 sm:h-11"><SelectValue placeholder="Select Country" /></SelectTrigger>
                            <SelectContent className="max-h-60">
                              {[
                                { code: "BD", name: "Bangladesh" }, { code: "IN", name: "India" }, { code: "PK", name: "Pakistan" }, { code: "LK", name: "Sri Lanka" }, { code: "NP", name: "Nepal" },
                                { code: "MM", name: "Myanmar" }, { code: "BT", name: "Bhutan" }, { code: "AF", name: "Afghanistan" }, { code: "MV", name: "Maldives" },
                                { code: "AE", name: "UAE" }, { code: "SA", name: "Saudi Arabia" }, { code: "QA", name: "Qatar" }, { code: "KW", name: "Kuwait" }, { code: "BH", name: "Bahrain" }, { code: "OM", name: "Oman" },
                                { code: "MY", name: "Malaysia" }, { code: "SG", name: "Singapore" }, { code: "TH", name: "Thailand" }, { code: "ID", name: "Indonesia" }, { code: "VN", name: "Vietnam" }, { code: "PH", name: "Philippines" },
                                { code: "CN", name: "China" }, { code: "JP", name: "Japan" }, { code: "KR", name: "South Korea" }, { code: "HK", name: "Hong Kong" }, { code: "TW", name: "Taiwan" },
                                { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" }, { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" }, { code: "NZ", name: "New Zealand" },
                                { code: "DE", name: "Germany" }, { code: "FR", name: "France" }, { code: "IT", name: "Italy" }, { code: "ES", name: "Spain" }, { code: "NL", name: "Netherlands" },
                                { code: "SE", name: "Sweden" }, { code: "CH", name: "Switzerland" }, { code: "NO", name: "Norway" }, { code: "DK", name: "Denmark" }, { code: "FI", name: "Finland" },
                                { code: "TR", name: "Turkey" }, { code: "EG", name: "Egypt" }, { code: "ZA", name: "South Africa" }, { code: "KE", name: "Kenya" }, { code: "NG", name: "Nigeria" }, { code: "ET", name: "Ethiopia" },
                                { code: "BR", name: "Brazil" }, { code: "MX", name: "Mexico" }, { code: "AR", name: "Argentina" }, { code: "RU", name: "Russia" }, { code: "IR", name: "Iran" }, { code: "IQ", name: "Iraq" },
                              ].map(c => <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors.passport ? "text-destructive" : ""}`}>{domestic ? "Document Number" : "Document Number *"}</Label>
                          <Input value={pax.passport} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].passport = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.passport; return n; });
                          }} placeholder="e.g. A0123456789" className={`h-10 sm:h-11 ${fieldErrors.passport ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs sm:text-sm">Expiration Date</Label>
                          <Input type="date" value={pax.passportExpiry} onChange={(e) => { const updated = [...passengers]; updated[pi].passportExpiry = e.target.value; setPassengers(updated); }} className="h-10 sm:h-11" />
                        </div>
                      </div>

                      {/* Row 4: Contact */}
                      {pi === 0 && (
                        <>
                          <Separator />
                          <p className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4 text-accent" /> Enter Contact Details</p>
                          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5">
                              <Label className={`text-xs sm:text-sm ${fieldErrors.phone ? "text-destructive" : ""}`}>Mobile Number *</Label>
                              <Input type="tel" value={pax.phone} onChange={(e) => {
                                const updated = [...passengers]; updated[pi].phone = e.target.value; setPassengers(updated);
                                setFieldErrors(prev => { const n = {...prev}; delete n.phone; return n; });
                              }} placeholder="+880 1XXX-XXXXXX" className={`h-10 sm:h-11 ${fieldErrors.phone ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className={`text-xs sm:text-sm ${fieldErrors.email ? "text-destructive" : ""}`}>E-mail *</Label>
                              <Input type="email" value={pax.email} onChange={(e) => {
                                const updated = [...passengers]; updated[pi].email = e.target.value; setPassengers(updated);
                                setFieldErrors(prev => { const n = {...prev}; delete n.email; return n; });
                              }} placeholder="email@example.com" className={`h-10 sm:h-11 ${fieldErrors.email ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* STEP 3: Extras — Meal, Baggage, Seat Selection */}
            {step === 3 && (
              <Card>
                <CardHeader className="bg-accent/5 border-b border-border">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Plus className="w-5 h-5 text-accent" /> Customize Your Flight
                    {ancillarySource !== "standard" && (
                      <Badge className="bg-accent/10 text-accent border-0 text-[9px] ml-2">Live Airline Data</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-5">
                  <Tabs defaultValue="seat" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 mb-4 h-auto">
                      <TabsTrigger value="seat" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm py-2"><Armchair className="w-3.5 h-3.5" /><span className="hidden xs:inline">Seat</span><span className="xs:hidden">🪑</span></TabsTrigger>
                      <TabsTrigger value="baggage" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm py-2"><Luggage className="w-3.5 h-3.5" /><span className="hidden xs:inline">Baggage</span><span className="xs:hidden">🧳</span></TabsTrigger>
                      <TabsTrigger value="meal" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm py-2"><UtensilsCrossed className="w-3.5 h-3.5" /><span className="hidden xs:inline">Meal</span><span className="xs:hidden">🍽️</span></TabsTrigger>
                    </TabsList>

                    {/* ── SEAT SELECTION (Interactive Seat Map) ── */}
                    <TabsContent value="seat" className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-accent/5 rounded-lg border border-accent/10">
                        <Armchair className="w-4 h-4 text-accent shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Select Your Preferred Seat</p>
                          <p className="text-xs text-muted-foreground">Tap on a seat to assign it to the active passenger</p>
                        </div>
                      </div>
                      <SeatMap
                        flightNumber={outboundFlight?.flightNumber || ""}
                        aircraft={outboundFlight?.aircraft || outboundFlight?.legs?.[0]?.aircraft || ""}
                        cabinClass={outboundFlight?.cabinClass || "Economy"}
                        passengers={passengers}
                        selectedSeats={selectedSeats}
                        onSeatSelect={handleSeatSelect}
                        onSeatDeselect={handleSeatDeselect}
                        isDomestic={domestic}
                      />
                    </TabsContent>

                    {/* ── EXTRA BAGGAGE ── */}
                    <TabsContent value="baggage" className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-accent/5 rounded-lg border border-accent/10">
                        <Briefcase className="w-4 h-4 text-accent shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Included: 20kg Checked + 7kg Cabin</p>
                          <p className="text-xs text-muted-foreground">Your fare includes standard baggage allowance</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {baggageOptions.map(bag => (
                          <AddOnCard key={bag.id} item={bag} multi
                            selected={selectedBaggage.includes(bag.id)}
                            onSelect={() => setSelectedBaggage(prev => prev.includes(bag.id) ? prev.filter(x => x !== bag.id) : [...prev, bag.id])} />
                        ))}
                      </div>
                    </TabsContent>

                    {/* ── MEAL SELECTION ── */}
                    <TabsContent value="meal" className="space-y-3">
                      <p className="text-sm text-muted-foreground">Select your preferred meal for this flight.</p>
                      <div className="space-y-2">
                        {mealOptions.map(meal => (
                          <AddOnCard key={meal.id} item={meal}
                            selected={selectedMeal === meal.id}
                            onSelect={() => setSelectedMeal(meal.id)} />
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* STEP 4: Review & Booking */}
            {step === 4 && (
              <>
                <Card>
                  <CardHeader className="bg-accent/5 border-b border-border">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2"><FileText className="w-5 h-5 text-accent" /> Booking Review</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-5 space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Flight Itinerary</h4>
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Badge className="bg-accent/10 text-accent border-0 text-[10px]">Outbound</Badge>
                          <span className="text-sm font-semibold">{outboundFlight?.origin} → {outboundFlight?.destination}</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(outboundFlight?.departureTime)}</span>
                          <span className="text-xs">{fmtTime(outboundFlight?.departureTime)} – {fmtTime(outboundFlight?.arrivalTime)}</span>
                          <span className="text-xs text-muted-foreground sm:ml-auto">{outboundFlight?.airline} {outboundFlight?.flightNumber}</span>
                        </div>
                        {isRoundTrip && returnFlight && (
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Badge className="bg-warning/10 text-warning border-0 text-[10px]">Return</Badge>
                            <span className="text-sm font-semibold">{returnFlight.origin} → {returnFlight.destination}</span>
                            <span className="text-xs text-muted-foreground">{fmtDate(returnFlight.departureTime)}</span>
                            <span className="text-xs">{fmtTime(returnFlight.departureTime)} – {fmtTime(returnFlight.arrivalTime)}</span>
                            <span className="text-xs text-muted-foreground sm:ml-auto">{returnFlight.airline} {returnFlight.flightNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Passengers</h4>
                      {passengers.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded-lg">
                          <User className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{p.title} {p.firstName} {p.lastName}</span>
                          {p.passport && <span className="text-xs text-muted-foreground hidden sm:inline">Passport: {p.passport}</span>}
                          {selectedSeats[i] && <Badge className="bg-accent/10 text-accent border-0 text-[9px]">Seat {selectedSeats[i]}</Badge>}
                        </div>
                      ))}
                    </div>
                    {addOnTotal > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Selected Extras</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMeal !== "standard" && <Badge variant="outline" className="text-xs"><UtensilsCrossed className="w-3 h-3 mr-1" />{mealOptions.find(m => m.id === selectedMeal)?.name}</Badge>}
                          {selectedBaggage.map(id => <Badge key={id} variant="outline" className="text-xs"><Luggage className="w-3 h-3 mr-1" />{baggageOptions.find(b => b.id === id)?.name}</Badge>)}
                          {Object.entries(selectedSeats).map(([idx, seatId]) => (
                            <Badge key={idx} variant="outline" className="text-xs"><Armchair className="w-3 h-3 mr-1" />Seat {seatId} (Pax {Number(idx) + 1})</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {isBiman ? (
                  <Card>
                    <CardHeader><CardTitle className="text-sm sm:text-base flex items-center gap-2"><CreditCard className="w-5 h-5 text-accent" /> Payment (Required)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {["bKash", "Nagad", "Visa/Master Card", "Bank Transfer"].map((m) => (
                          <label key={m} className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition-colors ${
                            selectedPaymentMethod === m ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                          }`}>
                            <input type="radio" name="payMethod" className="accent-[hsl(var(--accent))]" checked={selectedPaymentMethod === m} onChange={() => setSelectedPaymentMethod(m)} />
                            <span className="text-xs sm:text-sm font-medium">{m}</span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-accent/20 bg-accent/[0.02]">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0"><Timer className="w-5 h-5 text-accent" /></div>
                        <div>
                          <p className="font-bold text-sm">Book Now, Pay Later</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your booking will be placed on hold. Pay from your dashboard before the deadline.
                            {deadlineInfo && <span className="text-destructive font-semibold"> {deadlineInfo.label}.</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {outboundFlight?.timeLimit ? "⏱ Deadline set by the airline's reservation system." : domestic ? "Domestic: valid for 48h. Must pay 24h before departure." : "International: valid for 7 days."}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-start gap-2">
                  <Checkbox id="agree" className="mt-0.5" checked={agreedTerms} onCheckedChange={(v) => setAgreedTerms(!!v)} />
                  <label htmlFor="agree" className="text-xs text-muted-foreground">
                    I have read and accept all <Link to="/terms" className="text-accent hover:underline">Terms & Conditions</Link> and <Link to="/refund-policy" className="text-accent hover:underline">Cancellation Policies</Link>
                  </label>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
              {step < 4 ? (
                <Button onClick={handleContinue} className="font-bold bg-accent text-accent-foreground hover:bg-accent/90">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : isBiman ? (
                <Button className="font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" onClick={handleConfirmBooking} disabled={bookingLoading}>
                  {bookingLoading ? "Processing..." : <><Shield className="w-4 h-4 mr-1" /> Confirm & Pay ৳{grandTotal.toLocaleString()}</>}
                </Button>
              ) : (
                <Button className="font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" onClick={handleConfirmBooking} disabled={bookingLoading}>
                  {bookingLoading ? "Processing..." : <><CheckCircle2 className="w-4 h-4 mr-1" /> INSTANT PURCHASE ৳{grandTotal.toLocaleString()}</>}
                </Button>
              )}
            </div>
          </div>

          {/* ─── FARE SUMMARY SIDEBAR ─── */}
          <div className="order-first lg:order-last">
            <Card className="sticky top-28 border-accent/20">
              <CardHeader className="bg-accent/5 border-b border-border pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" /> Fare Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 space-y-3 text-sm">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fare/Pax Type</p>
                  {isRoundTrip ? (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Outbound</span><span className="font-semibold">৳{outboundPrice.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Return</span><span className="font-semibold">৳{returnPrice.toLocaleString()}</span></div>
                      <Separator />
                    </>
                  ) : null}
                  <div className="flex justify-between"><span className="text-muted-foreground">Base Fare</span><span className="font-semibold">৳{baseFare.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-semibold">৳{taxes.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service Charge</span><span className="font-semibold">৳{serviceCharge}</span></div>
                </div>

                {addOnTotal > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add-ons</p>
                    {mealCost > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">{mealOptions.find(m => m.id === selectedMeal)?.name}</span><span>৳{mealCost.toLocaleString()}</span></div>}
                    {baggageCost > 0 && selectedBaggage.map(id => { const bag = baggageOptions.find(b => b.id === id); return bag ? <div key={id} className="flex justify-between text-xs"><span className="text-muted-foreground">{bag.name}</span><span>৳{bag.price.toLocaleString()}</span></div> : null; })}
                    {seatCost > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Seat Selection</span><span>৳{seatCost.toLocaleString()}</span></div>}
                  </>
                )}

                <Separator />
                <div className="flex justify-between text-base"><span className="font-bold">Total Payable</span><span className="font-black text-accent">৳{grandTotal.toLocaleString()}</span></div>
                {isRoundTrip && <p className="text-[10px] text-muted-foreground text-center">Round-trip fare for 1 passenger</p>}

                {!isBiman && deadlineInfo && step === 4 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-xs text-destructive font-semibold"><Timer className="w-3.5 h-3.5" />{deadlineInfo.label}</div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={() => { setAuthOpen(false); handleConfirmBooking(); }} title="Sign in to complete your booking" />
    </div>
  );
};

export default FlightBooking;
