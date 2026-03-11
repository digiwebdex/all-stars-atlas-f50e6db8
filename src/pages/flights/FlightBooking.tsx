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
  UtensilsCrossed, Plus, Briefcase, Users, FileText,
  AlertCircle, CheckCircle2, Timer, AlertTriangle, Package,
  ScanLine, Search, Share2, Save,
} from "lucide-react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { useAuth } from "@/hooks/useAuth";
import AuthGateModal from "@/components/AuthGateModal";
import { api } from "@/lib/api";
import type { BookingFormField } from "@/lib/cms-defaults";
import PassportScanner from "@/components/PassportScanner";
import SearchPassengerModal from "@/components/SearchPassengerModal";
import ShareItineraryModal from "@/components/ShareItineraryModal";

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

/* ─── No hardcoded defaults — extras only from real API data ─── */

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
const FlightSegmentCard = ({ flight, label, searchedCabinClass }: { flight: any; label: string; searchedCabinClass?: string }) => {
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
          <span>· {searchedCabinClass || flight.cabinClass || "Economy"}</span>
          <span className="flex items-center gap-1"><Luggage className="w-3 h-3" /> {flight.baggage || "As per airline policy"}</span>
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

  const [selectedMeal, setSelectedMeal] = useState("");
  const [selectedBaggage, setSelectedBaggage] = useState<string[]>([]);

  // Ancillary data from real API ONLY — no fake fallbacks
  const [mealOptions, setMealOptions] = useState<{ id: string; name: string; price: number; desc: string; icon?: string }[]>([]);
  const [baggageOptions, setBaggageOptions] = useState<{ id: string; name: string; price: number; desc: string; icon?: string }[]>([]);
  const [ancillarySource, setAncillarySource] = useState("none");
  const [ancillaryLoading, setAncillaryLoading] = useState(false);
  const hasRealExtras = ancillarySource !== "none" && ancillarySource !== "standard";

  // Read passenger counts from URL
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locationState = location.state as any;

  const adultCount = parseInt(searchParams.get("adults") || "1");
  const childCount = parseInt(searchParams.get("children") || "0");
  const infantCount = parseInt(searchParams.get("infants") || "0");
  const searchCabin = searchParams.get("cabin") || "economy";
  const totalPaxCount = adultCount + childCount + infantCount;

  // Build passenger type labels
  const paxTypes: { type: "adult" | "child" | "infant"; label: string }[] = [];
  for (let i = 0; i < adultCount; i++) paxTypes.push({ type: "adult", label: `Adult ${adultCount > 1 ? i + 1 : ""}`.trim() });
  for (let i = 0; i < childCount; i++) paxTypes.push({ type: "child", label: `Child ${childCount > 1 ? i + 1 : ""}`.trim() });
  for (let i = 0; i < infantCount; i++) paxTypes.push({ type: "infant", label: `Infant ${infantCount > 1 ? i + 1 : ""}`.trim() });

  const emptyPax = () => ({ title: "", firstName: "", lastName: "", dob: "", nationality: "", passport: "", passportExpiry: "", email: "", phone: "", gender: "", documentCountry: "BD" });

  const [passengers, setPassengers] = useState(() => paxTypes.map(() => emptyPax()));
  const [passportScanOpen, setPassportScanOpen] = useState(false);
  const [searchPaxOpen, setSearchPaxOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [activePaxIndex, setActivePaxIndex] = useState(0);

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
        if (outboundFlight.baggage) params.checkedBaggage = outboundFlight.baggage;
        if (outboundFlight.handBaggage) params.handBaggage = outboundFlight.handBaggage;

        const data = await api.get<any>("/flights/ancillaries", params);
        if (data?.source && data.source !== "standard") {
          // Only use data from real airline APIs (TTI, BDFare etc.), NOT standard fallbacks
          setAncillarySource(data.source);
          if (data.meals?.length > 0) {
            setMealOptions(data.meals.map((m: any) => ({
              id: m.id, name: m.name, price: m.price || 0, desc: m.description || "", icon: m.category === "dietary" ? "🥗" : m.category === "premium" ? "🦐" : "🍽️",
            })));
          }
          if (data.baggage?.length > 0) {
            setBaggageOptions(data.baggage.map((b: any) => ({
              id: b.id, name: b.name, price: b.price || 0, desc: b.description || "", icon: b.type === "special" ? "📦" : "🧳",
            })));
          }
        }
        // If source is "standard", we don't set anything — no fake data
      } catch {
        // No API available — no extras shown
      }
    };
    fetchAncillaries();
  }, [outboundFlight]);

  const mealCost = mealOptions.find(m => m.id === selectedMeal)?.price || 0;
  const baggageCost = selectedBaggage.reduce((sum, id) => sum + (baggageOptions.find(b => b.id === id)?.price || 0), 0);
  const addOnTotal = (mealCost + baggageCost) * totalPaxCount;
  // Multi-city flights support
  const multiCityFlights: any[] = locationState?.multiCityFlights || [];
  const isMultiCity = multiCityFlights.length >= 2;

  const outboundPrice = outboundFlight?.price || 0;
  const returnPrice = returnFlight?.price || 0;

  // Multi-city: sum all segment prices
  const multiCityTotalPrice = isMultiCity ? multiCityFlights.reduce((sum: number, f: any) => sum + (f?.price || 0), 0) : 0;
  const multiCityTotalBaseFare = isMultiCity ? multiCityFlights.reduce((sum: number, f: any) => sum + (f?.baseFare ?? f?.price ?? 0), 0) : 0;
  const multiCityTotalTaxes = isMultiCity ? multiCityFlights.reduce((sum: number, f: any) => sum + (f?.taxes ?? 0), 0) : 0;

  const outboundBaseFare = outboundFlight?.baseFare ?? outboundPrice;
  const returnBaseFare = returnFlight?.baseFare ?? returnPrice;
  const perPaxBaseFare = isMultiCity ? multiCityTotalBaseFare : (outboundBaseFare + returnBaseFare);
  const baseFare = perPaxBaseFare * totalPaxCount;
  // Zero-mock: use ONLY real tax data from GDS. If unavailable, show 0 (included in fare)
  const outboundTaxes = outboundFlight?.taxes ?? 0;
  const returnTaxes = returnFlight?.taxes ?? 0;
  const perPaxTaxes = isMultiCity ? multiCityTotalTaxes : (outboundTaxes + returnTaxes);
  const taxes = perPaxTaxes * totalPaxCount;
  const serviceCharge = outboundFlight?.serviceCharge ?? 0;
  const grandTotal = baseFare + taxes + serviceCharge + addOnTotal;

  const deadlineInfo = resolveDeadlineInfo(outboundFlight, domestic);

  // Dynamic steps: only show Extras if real API data is available
  const STEPS = hasRealExtras
    ? [
        { label: "Flight Details", icon: Plane },
        { label: "Passenger Info", icon: Users },
        { label: "Extras", icon: Plus },
        { label: "Review & Pay", icon: CreditCard },
      ]
    : [
        { label: "Flight Details", icon: Plane },
        { label: "Passenger Info", icon: Users },
        { label: "Review & Pay", icon: CreditCard },
      ];
  const totalSteps = STEPS.length;
  const reviewStep = totalSteps;
  const extrasStep = hasRealExtras ? 3 : -1; // -1 means no extras step

  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};
    if (currentStep === 1 && !outboundFlight) { toast({ title: "No Flight Selected", description: "Please go back and select a flight.", variant: "destructive" }); return false; }
    if (currentStep === 2) {
      for (let pi = 0; pi < passengers.length; pi++) {
        const p = passengers[pi];
        const paxLabel = paxTypes[pi]?.label || `Passenger ${pi + 1}`;
        if (!p.title) { errors[`title_${pi}`] = `${paxLabel}: Title is required`; }
        if (!p.firstName?.trim()) { errors[`firstName_${pi}`] = `${paxLabel}: First name is required`; }
        else if (p.firstName.trim().length < 2) { errors[`firstName_${pi}`] = `${paxLabel}: First name too short`; }
        if (!p.lastName?.trim()) { errors[`lastName_${pi}`] = `${paxLabel}: Last name is required`; }
        else if (p.lastName.trim().length < 2) { errors[`lastName_${pi}`] = `${paxLabel}: Last name too short`; }
        if (!p.dob) { errors[`dob_${pi}`] = `${paxLabel}: Date of birth is required`; }
        else { const dobDate = new Date(p.dob); if (dobDate >= new Date()) errors[`dob_${pi}`] = `${paxLabel}: Date of birth must be in the past`; }
        if (!p.nationality?.trim()) { errors[`nationality_${pi}`] = `${paxLabel}: Nationality is required`; }
        // Contact info — first passenger only
        if (pi === 0) {
          if (!p.email?.trim()) { errors[`email_${pi}`] = "Email is required"; }
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) { errors[`email_${pi}`] = "Invalid email format"; }
          if (!p.phone?.trim()) { errors[`phone_${pi}`] = "Phone number is required"; }
          else if (!/^01[3-9]\d{8}$/.test(p.phone.replace(/[\s\-+]/g, "").replace(/^880/, "").replace(/^\+880/, ""))) { errors[`phone_${pi}`] = "Invalid Bangladesh phone number (01X-XXXXXXXX)"; }
        }
        // Passport for international flights
        if (!domestic) {
          if (!p.passport?.trim()) { errors[`passport_${pi}`] = `${paxLabel}: Passport required for international flights`; }
          else if (p.passport.trim().length < 5) { errors[`passport_${pi}`] = `${paxLabel}: Invalid passport number`; }
          // Passport expiry: must be at least 6 months from departure
          if (p.passportExpiry) {
            const expiry = new Date(p.passportExpiry);
            const departureDate = outboundFlight?.departureTime ? new Date(outboundFlight.departureTime) : new Date();
            const sixMonths = new Date(departureDate);
            sixMonths.setMonth(sixMonths.getMonth() + 6);
            if (expiry < sixMonths) { errors[`passportExpiry_${pi}`] = `${paxLabel}: Passport must be valid for at least 6 months from departure`; }
          } else {
            errors[`passportExpiry_${pi}`] = `${paxLabel}: Passport expiry date required for international flights`;
          }
        }
      }
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); toast({ title: "Missing Passenger Info", description: Object.values(errors)[0], variant: "destructive" }); return false; }
    }
    setFieldErrors({}); return true;
  };

  const handleContinue = () => { if (validateStep(step)) setStep(step + 1); };

  const handlePassportScan = (data: any) => {
    const updated = [...passengers];
    const pi = activePaxIndex;
    if (data.title) {
      const titleMap: Record<string, string> = { MR: "Mr", MRS: "Mrs", MS: "Ms", MISS: "Miss", MASTER: "Master" };
      updated[pi].title = titleMap[data.title.toUpperCase()] || data.title;
    }
    if (data.firstName) updated[pi].firstName = data.firstName;
    if (data.lastName) updated[pi].lastName = data.lastName;
    if (data.gender) updated[pi].gender = data.gender;
    if (data.birthDate) updated[pi].dob = data.birthDate;
    if (data.passportNumber) updated[pi].passport = data.passportNumber;
    if (data.expiryDate) updated[pi].passportExpiry = data.expiryDate;
    if (data.country) {
      updated[pi].documentCountry = data.country;
      if (!updated[pi].nationality) updated[pi].nationality = data.country;
    }
    setPassengers(updated);
    setFieldErrors({});
  };

  const handleSelectExistingPax = (t: any) => {
    const updated = [...passengers];
    const pi = activePaxIndex;
    updated[pi] = {
      title: t.title || updated[pi].title,
      firstName: t.firstName || "",
      lastName: t.lastName || "",
      dob: t.dob || "",
      nationality: t.nationality || "",
      passport: t.passport || "",
      passportExpiry: t.passportExpiry || "",
      email: t.email || updated[pi].email,
      phone: t.phone || updated[pi].phone,
      gender: t.gender || "",
      documentCountry: t.documentCountry || "BD",
    };
    setPassengers(updated);
    setFieldErrors({});
  };

  const createBooking = async (payLater: boolean) => {
    setBookingLoading(true);
    try {
      const bookingData = {
        flightData: outboundFlight, returnFlightData: returnFlight,
        multiCityFlights: isMultiCity ? multiCityFlights : undefined,
        passengers, isRoundTrip, isMultiCity, isDomestic: domestic, payLater,
        paymentMethod: payLater ? "pay_later" : (selectedPaymentMethod || "card"), totalAmount: grandTotal, baseFare, taxes, serviceCharge,
        addOns: {
          meal: mealOptions.find(m => m.id === selectedMeal)?.name || undefined,
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
    const allFilled = passengers.every(p => p.firstName && p.lastName);
    if (!allFilled) { toast({ title: "Missing Info", description: "Please fill in all passenger details.", variant: "destructive" }); setStep(2); return; }
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

  if (isLoading) return <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10"><div className="container mx-auto px-4"><Skeleton className="h-96 w-full rounded-xl" /></div></div>;

  // STEPS already defined above dynamically based on hasRealExtras

  // ─── POST-BOOKING SUCCESS ───
  if (bookingComplete && bookingResult) {
    return (
      <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10">
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
    <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10">
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
        {isBiman && step === reviewStep && (
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
                {isMultiCity ? (
                  multiCityFlights.map((mcFlight: any, idx: number) => (
                    <FlightSegmentCard key={idx} flight={mcFlight} label={`Flight ${idx + 1}: ${mcFlight?.origin || "—"} → ${mcFlight?.destination || "—"}`} searchedCabinClass={searchCabin ? searchCabin.charAt(0).toUpperCase() + searchCabin.slice(1) : undefined} />
                  ))
                ) : (
                  <>
                    <FlightSegmentCard flight={outboundFlight} label="Outbound" searchedCabinClass={searchCabin ? searchCabin.charAt(0).toUpperCase() + searchCabin.slice(1) : undefined} />
                    {isRoundTrip && <FlightSegmentCard flight={returnFlight} label="Return" searchedCabinClass={searchCabin ? searchCabin.charAt(0).toUpperCase() + searchCabin.slice(1) : undefined} />}
                  </>
                )}
                {!isMultiCity && !isRoundTrip && !outboundFlight && (
                  <Card className="border-dashed"><CardContent className="py-8 text-center"><p className="text-sm text-muted-foreground">Loading flight details...</p></CardContent></Card>
                )}
              </>
            )}

            {/* STEP 2: Passenger Info */}
            {step === 2 && (
              <Card>
                <CardHeader className="bg-accent/5 border-b border-border">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent" /> Enter Traveler Details
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => { setActivePaxIndex(0); setPassportScanOpen(true); }}>
                        <ScanLine className="w-3.5 h-3.5 mr-1" /> Passport Scan
                      </Button>
                      {isAuthenticated && (
                        <Button variant="outline" size="sm" className="text-xs h-8 border-accent/30 text-accent hover:bg-accent/10" onClick={() => { setActivePaxIndex(0); setSearchPaxOpen(true); }}>
                          <Search className="w-3.5 h-3.5 mr-1" /> Saved Passenger
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Enter details exactly as they appear on your passport/ID</p>
                </CardHeader>
                <CardContent className="p-3 sm:p-5 space-y-0">
                  {passengers.map((pax, pi) => {
                    const paxTypeColors: Record<string, { border: string; bg: string; badge: string; badgeText: string }> = {
                      adult: { border: "border-accent/30", bg: "bg-accent/[0.03]", badge: "bg-accent/10 text-accent border-accent/20", badgeText: "text-accent" },
                      child: { border: "border-blue-400/30", bg: "bg-blue-50/50 dark:bg-blue-950/20", badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800", badgeText: "text-blue-700 dark:text-blue-300" },
                      infant: { border: "border-purple-400/30", bg: "bg-purple-50/50 dark:bg-purple-950/20", badge: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800", badgeText: "text-purple-700 dark:text-purple-300" },
                    };
                    const paxType = paxTypes[pi]?.type || "adult";
                    const colors = paxTypeColors[paxType] || paxTypeColors.adult;

                    return (
                    <div key={pi} className={`space-y-3 sm:space-y-4 rounded-xl border-2 ${colors.border} ${colors.bg} p-3 sm:p-5 ${pi > 0 ? "mt-4" : ""}`}>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs font-semibold ${colors.badge}`}>
                          {paxTypes[pi]?.label || `Passenger ${pi + 1}`} Traveler
                        </Badge>
                        {pi > 0 ? (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setActivePaxIndex(pi); setPassportScanOpen(true); }}>
                              <ScanLine className="w-3 h-3 mr-1" /> Scan
                            </Button>
                            {isAuthenticated && (
                              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setActivePaxIndex(pi); setSearchPaxOpen(true); }}>
                                <Search className="w-3 h-3 mr-1" /> Saved
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Row 1: Title + Gender + DOB + Nationality */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors[`title_${pi}`] ? "text-destructive" : ""}`}>Title *</Label>
                          <Select value={pax.title} onValueChange={(v) => {
                            const updated = [...passengers]; updated[pi].title = v;
                            if (v === "Mr" || v === "Master") updated[pi].gender = "Male";
                            else updated[pi].gender = "Female";
                            setPassengers(updated); setFieldErrors(prev => { const n = {...prev}; delete n[`title_${pi}`]; return n; });
                          }}>
                            <SelectTrigger className={`h-10 sm:h-11 ${fieldErrors[`title_${pi}`] ? "border-destructive ring-destructive/20 ring-2" : ""}`}><SelectValue placeholder="Title" /></SelectTrigger>
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
                          <Label className={`text-xs sm:text-sm ${fieldErrors[`dob_${pi}`] ? "text-destructive" : ""}`}>Date of Birth *</Label>
                          <Input type="date" value={pax.dob} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].dob = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n[`dob_${pi}`]; return n; });
                          }} className={`h-10 sm:h-11 ${fieldErrors[`dob_${pi}`] ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors[`nationality_${pi}`] ? "text-destructive" : ""}`}>Nationality *</Label>
                          <Input value={pax.nationality} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].nationality = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n[`nationality_${pi}`]; return n; });
                          }} placeholder="e.g. Bangladeshi" className={`h-10 sm:h-11 ${fieldErrors[`nationality_${pi}`] ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                      </div>

                      {/* Row 2: Names */}
                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors[`firstName_${pi}`] ? "text-destructive" : ""}`}>First/Given Name *</Label>
                          <Input value={pax.firstName} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].firstName = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n[`firstName_${pi}`]; return n; });
                          }} placeholder="As on passport" className={`h-10 sm:h-11 ${fieldErrors[`firstName_${pi}`] ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors[`lastName_${pi}`] ? "text-destructive" : ""}`}>Surname/Family/Last Name *</Label>
                          <Input value={pax.lastName} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].lastName = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n[`lastName_${pi}`]; return n; });
                          }} placeholder="As on passport" className={`h-10 sm:h-11 ${fieldErrors[`lastName_${pi}`] ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
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
                          <Label className={`text-xs sm:text-sm ${fieldErrors[`passport_${pi}`] ? "text-destructive" : ""}`}>{domestic ? "Document Number" : "Document Number *"}</Label>
                          <Input value={pax.passport} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].passport = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n[`passport_${pi}`]; return n; });
                          }} placeholder="e.g. A0123456789" className={`h-10 sm:h-11 ${fieldErrors[`passport_${pi}`] ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={`text-xs sm:text-sm ${fieldErrors[`passportExpiry_${pi}`] ? "text-destructive" : ""}`}>{domestic ? "Expiration Date" : "Expiration Date *"}</Label>
                          <Input type="date" value={pax.passportExpiry} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].passportExpiry = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n[`passportExpiry_${pi}`]; return n; });
                          }} className={`h-10 sm:h-11 ${fieldErrors[`passportExpiry_${pi}`] ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                        </div>
                      </div>

                      {/* Row 4: Contact */}
                      {pi === 0 && (
                        <>
                          <Separator />
                          <p className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4 text-accent" /> Enter Contact Details</p>
                          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5">
                              <Label className={`text-xs sm:text-sm ${fieldErrors[`phone_${pi}`] ? "text-destructive" : ""}`}>Mobile Number *</Label>
                              <Input type="tel" value={pax.phone} onChange={(e) => {
                                const updated = [...passengers]; updated[pi].phone = e.target.value; setPassengers(updated);
                                setFieldErrors(prev => { const n = {...prev}; delete n[`phone_${pi}`]; return n; });
                              }} placeholder="01XXX-XXXXXXXX" className={`h-10 sm:h-11 ${fieldErrors[`phone_${pi}`] ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                              {fieldErrors[`phone_${pi}`] && <p className="text-[11px] text-destructive">{fieldErrors[`phone_${pi}`]}</p>}
                            </div>
                            <div className="space-y-1.5">
                              <Label className={`text-xs sm:text-sm ${fieldErrors[`email_${pi}`] ? "text-destructive" : ""}`}>E-mail *</Label>
                              <Input type="email" value={pax.email} onChange={(e) => {
                                const updated = [...passengers]; updated[pi].email = e.target.value; setPassengers(updated);
                                setFieldErrors(prev => { const n = {...prev}; delete n[`email_${pi}`]; return n; });
                              }} placeholder="email@example.com" className={`h-10 sm:h-11 ${fieldErrors[`email_${pi}`] ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* STEP 3: Extras — ONLY when real airline API data is available */}
            {step === extrasStep && hasRealExtras && (
              <Card>
                <CardHeader className="bg-accent/5 border-b border-border">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Plus className="w-5 h-5 text-accent" /> Customize Your Flight
                    <Badge className="bg-accent/10 text-accent border-0 text-[9px] ml-2">Live Airline Data</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-5">
                  <Tabs defaultValue="baggage" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-4 h-auto">
                      <TabsTrigger value="baggage" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm py-2"><Luggage className="w-3.5 h-3.5" /> Baggage</TabsTrigger>
                      <TabsTrigger value="meal" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm py-2"><UtensilsCrossed className="w-3.5 h-3.5" /> Meal</TabsTrigger>
                    </TabsList>

                    {/* ── EXTRA BAGGAGE ── */}
                    <TabsContent value="baggage" className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-accent/5 rounded-lg border border-accent/10">
                        <Briefcase className="w-4 h-4 text-accent shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Included: 20kg Checked + 7kg Cabin</p>
                          <p className="text-xs text-muted-foreground">Your fare includes standard baggage allowance</p>
                        </div>
                      </div>
                      {baggageOptions.length > 0 ? (
                        <div className="space-y-2">
                          {baggageOptions.map(bag => (
                            <AddOnCard key={bag.id} item={bag} multi
                              selected={selectedBaggage.includes(bag.id)}
                              onSelect={() => setSelectedBaggage(prev => prev.includes(bag.id) ? prev.filter(x => x !== bag.id) : [...prev, bag.id])} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-3">No extra baggage options available from this airline.</p>
                      )}
                    </TabsContent>

                    {/* ── MEAL SELECTION ── */}
                    <TabsContent value="meal" className="space-y-3">
                      <p className="text-sm text-muted-foreground">Select your preferred meal for this flight.</p>
                      {mealOptions.length > 0 ? (
                        <div className="space-y-2">
                          {mealOptions.map(meal => (
                            <AddOnCard key={meal.id} item={meal}
                              selected={selectedMeal === meal.id}
                              onSelect={() => setSelectedMeal(meal.id)} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-3">No meal options available from this airline.</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* REVIEW STEP: Review & Booking */}
            {step === reviewStep && (
              <>
                <Card>
                  <CardHeader className="bg-accent/5 border-b border-border">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2"><FileText className="w-5 h-5 text-accent" /> Booking Review</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-5 space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Flight Itinerary</h4>
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        {isMultiCity ? (
                          multiCityFlights.map((mcf: any, idx: number) => (
                            <div key={idx} className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[10px]">Flight {idx + 1}</Badge>
                              <span className="text-sm font-semibold">{mcf?.origin} → {mcf?.destination}</span>
                              <span className="text-xs text-muted-foreground">{fmtDate(mcf?.departureTime)}</span>
                              <span className="text-xs">{fmtTime(mcf?.departureTime)} – {fmtTime(mcf?.arrivalTime)}</span>
                              <span className="text-xs text-muted-foreground sm:ml-auto">{mcf?.airline} {mcf?.flightNumber}</span>
                            </div>
                          ))
                        ) : (
                          <>
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
                          </>
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
                        </div>
                      ))}
                    </div>
                    {addOnTotal > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Selected Extras</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMeal && <Badge variant="outline" className="text-xs"><UtensilsCrossed className="w-3 h-3 mr-1" />{mealOptions.find(m => m.id === selectedMeal)?.name}</Badge>}
                          {selectedBaggage.map(id => <Badge key={id} variant="outline" className="text-xs"><Luggage className="w-3 h-3 mr-1" />{baggageOptions.find(b => b.id === id)?.name}</Badge>)}
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
              {step < totalSteps ? (
                <Button onClick={handleContinue} className="font-bold bg-accent text-accent-foreground hover:bg-accent/90">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : isBiman ? (
                <Button className="font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" onClick={handleConfirmBooking} disabled={bookingLoading}>
                  {bookingLoading ? "Processing..." : <><Shield className="w-4 h-4 mr-1" /> Confirm & Pay ৳{grandTotal.toLocaleString()}</>}
                </Button>
              ) : (
                <Button className="font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" onClick={handleConfirmBooking} disabled={bookingLoading}>
                  {bookingLoading ? "Processing..." : <><CheckCircle2 className="w-4 h-4 mr-1" /> Book Now ৳{grandTotal.toLocaleString()}</>}
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
                  {totalPaxCount > 1 && (
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Passengers</span><span className="font-semibold">{adultCount > 0 ? `${adultCount} Adult` : ""}{childCount > 0 ? `, ${childCount} Child` : ""}{infantCount > 0 ? `, ${infantCount} Infant` : ""}</span></div>
                  )}
                  {isMultiCity ? (
                    <>
                      {multiCityFlights.map((mcf: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs"><span className="text-muted-foreground">Flight {idx + 1}{totalPaxCount > 1 ? ` × ${totalPaxCount}` : ""}</span><span className="font-semibold">৳{((mcf?.price || 0) * totalPaxCount).toLocaleString()}</span></div>
                      ))}
                      <Separator />
                    </>
                  ) : isRoundTrip ? (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Outbound{totalPaxCount > 1 ? ` × ${totalPaxCount}` : ""}</span><span className="font-semibold">৳{(outboundPrice * totalPaxCount).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Return{totalPaxCount > 1 ? ` × ${totalPaxCount}` : ""}</span><span className="font-semibold">৳{(returnPrice * totalPaxCount).toLocaleString()}</span></div>
                      <Separator />
                    </>
                  ) : null}
                  <div className="flex justify-between"><span className="text-muted-foreground">Base Fare{totalPaxCount > 1 ? ` × ${totalPaxCount}` : ""}</span><span className="font-semibold">৳{baseFare.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax{totalPaxCount > 1 ? ` × ${totalPaxCount}` : ""}</span><span className="font-semibold">{taxes > 0 ? `৳${taxes.toLocaleString()}` : "Included"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service Charge</span><span className="font-semibold">{serviceCharge > 0 ? `৳${serviceCharge}` : "Free"}</span></div>
                </div>

                {addOnTotal > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add-ons{totalPaxCount > 1 ? ` × ${totalPaxCount}` : ""}</p>
                    {mealCost > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">{mealOptions.find(m => m.id === selectedMeal)?.name}</span><span>৳{(mealCost * totalPaxCount).toLocaleString()}</span></div>}
                    {baggageCost > 0 && selectedBaggage.map(id => { const bag = baggageOptions.find(b => b.id === id); return bag ? <div key={id} className="flex justify-between text-xs"><span className="text-muted-foreground">{bag.name}</span><span>৳{(bag.price * totalPaxCount).toLocaleString()}</span></div> : null; })}
                  </>
                )}

                <Separator />
                <div className="flex justify-between text-base"><span className="font-bold">Total Payable</span><span className="font-black text-accent">৳{grandTotal.toLocaleString()}</span></div>
                <p className="text-[10px] text-muted-foreground text-center">{isMultiCity ? "Multi-city" : isRoundTrip ? "Round-trip" : "One-way"} fare for {totalPaxCount} passenger{totalPaxCount > 1 ? "s" : ""} · {searchCabin ? searchCabin.charAt(0).toUpperCase() + searchCabin.slice(1) : "Economy"}</p>

                {!isBiman && deadlineInfo && step === reviewStep && (
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
      <PassportScanner open={passportScanOpen} onOpenChange={setPassportScanOpen} onConfirm={handlePassportScan} />
      <SearchPassengerModal open={searchPaxOpen} onOpenChange={setSearchPaxOpen} onSelect={handleSelectExistingPax} />
      <ShareItineraryModal open={shareOpen} onOpenChange={setShareOpen} bookingRef={bookingResult?.bookingRef} itinerarySummary={outboundFlight ? `${outboundFlight.origin} → ${outboundFlight.destination}, ${outboundFlight.airline}` : ""} />
    </div>
  );
};

export default FlightBooking;
