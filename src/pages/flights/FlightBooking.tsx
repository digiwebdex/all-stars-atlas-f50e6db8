import { useState } from "react";
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
  ArrowLeftRight, AlertCircle, CheckCircle2, Timer, AlertTriangle,
} from "lucide-react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { useAuth } from "@/hooks/useAuth";
import AuthGateModal from "@/components/AuthGateModal";
import { api } from "@/lib/api";
import type { BookingFormField } from "@/lib/cms-defaults";

// ─── Bangladesh domestic airports ───
const BD_AIRPORTS = ["DAC", "CXB", "CGP", "ZYL", "JSR", "RJH", "SPD", "BZL", "IRD", "TKR"];

function isDomesticRoute(origin?: string, destination?: string): boolean {
  if (!origin || !destination) return true; // default domestic
  return BD_AIRPORTS.includes(origin.toUpperCase()) && BD_AIRPORTS.includes(destination.toUpperCase());
}

function isBimanAirline(airlineCode?: string): boolean {
  return airlineCode?.toUpperCase() === "BG";
}

/** 
 * Resolve payment deadline.
 * Priority: 1) Airline-provided timeLimit (from GDS response)
 *           2) Fallback calculation based on route type
 * The airline's GDS (TTI, Sabre, BDFare) returns a LastTicketingDate / TimeLimit
 * that specifies exactly when the booking expires. We show that to the user.
 */
function resolveDeadlineInfo(flight: any, isDomestic: boolean): { deadline: Date; label: string } | null {
  if (!flight) return null;

  let deadline: Date | null = null;

  // 1) Check airline-provided time limit
  if (flight.timeLimit) {
    const tl = new Date(flight.timeLimit);
    if (!isNaN(tl.getTime()) && tl > new Date()) {
      deadline = tl;
    }
  }

  // 2) Fallback: calculate from departure time
  if (!deadline && flight.departureTime) {
    const now = new Date();
    const departure = new Date(flight.departureTime);
    const hoursUntilFlight = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isDomestic) {
      if (hoursUntilFlight <= 48) {
        deadline = new Date(departure.getTime() - 3 * 60 * 60 * 1000);
      } else {
        const d48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        const d24b = new Date(departure.getTime() - 24 * 60 * 60 * 1000);
        deadline = d48 < d24b ? d48 : d24b;
      }
    } else {
      if (hoursUntilFlight <= 7 * 24) {
        deadline = new Date(departure.getTime() - 24 * 60 * 60 * 1000);
      } else {
        deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
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

const RenderField = ({ field }: { field: BookingFormField }) => {
  if (!field.visible) return null;
  const cls = field.thirdWidth ? "space-y-1.5" : field.halfWidth ? "space-y-1.5" : "space-y-1.5 sm:col-span-2";
  if (field.type === "select") {
    return (
      <div className={cls}>
        <Label>{field.label}</Label>
        <Select><SelectTrigger className="h-11"><SelectValue placeholder={field.placeholder || "Select"} /></SelectTrigger>
          <SelectContent>{(field.options || []).map(o => <SelectItem key={o} value={o.toLowerCase()}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5 sm:col-span-2">
        <Label>{field.label}</Label>
        <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder={field.placeholder} />
      </div>
    );
  }
  return (
    <div className={cls}>
      <Label>{field.label}</Label>
      <Input type={field.type} placeholder={field.placeholder} className="h-11" />
    </div>
  );
};

/* ─── Airline logo helper ─── */
function getAirlineLogo(code?: string): string | null {
  if (!code) return null;
  return `https://images.kiwi.com/airlines/64/${code}.png`;
}

function fmtTime(dt?: string) {
  if (!dt) return "—";
  try { const d = new Date(dt); return isNaN(d.getTime()) ? dt : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return dt; }
}
function fmtDate(dt?: string) {
  if (!dt) return "—";
  try { const d = new Date(dt); return isNaN(d.getTime()) ? dt : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); } catch { return dt; }
}

/* ─── Meal options ─── */
const MEAL_OPTIONS = [
  { id: "standard", name: "Standard Meal", price: 0, desc: "Included with your fare" },
  { id: "vegetarian", name: "Vegetarian", price: 0, desc: "Lacto-ovo vegetarian meal" },
  { id: "vegan", name: "Vegan", price: 200, desc: "Plant-based meal" },
  { id: "halal", name: "Halal Meal", price: 0, desc: "Halal certified preparation" },
  { id: "kosher", name: "Kosher Meal", price: 300, desc: "Kosher certified meal" },
  { id: "child", name: "Child Meal", price: 0, desc: "Kid-friendly options" },
  { id: "diabetic", name: "Diabetic Meal", price: 0, desc: "Low sugar, balanced nutrition" },
];

const BAGGAGE_OPTIONS = [
  { id: "extra5", name: "+5 kg Extra Baggage", price: 500, desc: "Total: 25kg checked" },
  { id: "extra10", name: "+10 kg Extra Baggage", price: 900, desc: "Total: 30kg checked" },
  { id: "extra15", name: "+15 kg Extra Baggage", price: 1200, desc: "Total: 35kg checked" },
  { id: "extra20", name: "+20 kg Extra Baggage", price: 1500, desc: "Total: 40kg checked" },
  { id: "sport", name: "Sports Equipment", price: 2000, desc: "Golf, ski, surfboard etc." },
  { id: "fragile", name: "Fragile Handling", price: 800, desc: "Priority fragile handling" },
];

const SEAT_CLASSES = [
  { id: "standard", name: "Standard Seat", price: 0, desc: "Pre-assigned at check-in", icon: "🪑" },
  { id: "window", name: "Window Seat", price: 300, desc: "Enjoy the view", icon: "🪟" },
  { id: "aisle", name: "Aisle Seat", price: 300, desc: "Easy access", icon: "🚶" },
  { id: "extra-leg", name: "Extra Legroom", price: 800, desc: "More space for comfort", icon: "🦵" },
  { id: "front", name: "Front Row", price: 600, desc: "Quick exit after landing", icon: "⬆️" },
  { id: "emergency", name: "Emergency Exit Row", price: 500, desc: "Maximum legroom", icon: "🚪" },
];

const AddOnCard = ({ item, selected, onSelect }: { item: { id: string; name: string; price: number; desc: string; icon?: string }; selected: boolean; onSelect: () => void }) => (
  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
    selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
  }`}>
    <Checkbox checked={selected} onCheckedChange={onSelect} />
    {item.icon && <span className="text-lg">{item.icon}</span>}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{item.name}</p>
      <p className="text-xs text-muted-foreground">{item.desc}</p>
    </div>
    <span className={`text-sm font-bold shrink-0 ${item.price === 0 ? "text-success" : "text-primary"}`}>
      {item.price === 0 ? "Free" : `৳${item.price}`}
    </span>
  </label>
);

/* ─── Compact flight segment card ─── */
const FlightSegmentCard = ({ flight, label, labelColor }: { flight: any; label: string; labelColor: string }) => {
  const logo = getAirlineLogo(flight?.airlineCode);
  const legs = flight?.legs || [];

  if (!flight) return (
    <Card className="border-dashed">
      <CardContent className="py-8 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No {label.toLowerCase()} flight selected</p>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge className={`${labelColor} border-0 text-[10px] px-2`}>{label}</Badge>
            <span className="font-bold">{flight.origin} → {flight.destination}</span>
          </CardTitle>
          <Badge className="bg-success/10 text-success text-[10px]">Confirmed</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
          {logo && <img src={logo} alt={flight.airline} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          <div className="text-center">
            <p className="text-xl font-black">{fmtTime(flight.departureTime)}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{flight.origin}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <p className="text-[10px] text-muted-foreground">{flight.duration}</p>
            <div className="w-full flex items-center gap-0">
              <div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-primary" />
              <div className="flex-1 h-px bg-border" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
            <p className="text-[10px] text-success font-semibold">{flight.stops === 0 ? "Non-stop" : `${flight.stops} Stop`}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">{fmtTime(flight.arrivalTime)}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{flight.destination}</p>
          </div>
        </div>

        {/* Leg details */}
        {legs.length > 0 && (
          <div className="mt-3 space-y-2">
            {legs.map((leg: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{leg.flightNumber}</span>
                {leg.aircraft && <span>· {leg.aircraft}</span>}
                <span>· {leg.duration || `${leg.durationMinutes}m`}</span>
                {leg.originTerminal && <span>· T{leg.originTerminal}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Luggage className="w-3 h-3" /> {flight.baggage || "20kg"}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtDate(flight.departureTime)}</span>
          <span>{flight.airline} · {flight.flightNumber} · {flight.cabinClass || "Economy"}</span>
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
  const config = page?.bookingConfig;

  const [selectedMeal, setSelectedMeal] = useState("standard");
  const [selectedBaggage, setSelectedBaggage] = useState<string[]>([]);
  const [selectedSeat, setSelectedSeat] = useState("standard");

  // Passenger form state
  const [passengers, setPassengers] = useState([{
    title: "", firstName: "", lastName: "", dob: "", nationality: "", passport: "", passportExpiry: "", email: "", phone: "",
  }]);

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locationState = location.state as any;
  const isRoundTrip = searchParams.get("roundTrip") === "true" || !!locationState?.returnFlight;

  const outboundFlight = locationState?.outboundFlight || null;
  const returnFlight = locationState?.returnFlight || null;

  // Detect Biman Bangladesh Airlines
  const isBiman = isBimanAirline(outboundFlight?.airlineCode) || isBimanAirline(returnFlight?.airlineCode);
  const domestic = isDomesticRoute(outboundFlight?.origin, outboundFlight?.destination);

  // Costs
  const mealCost = MEAL_OPTIONS.find(m => m.id === selectedMeal)?.price || 0;
  const baggageCost = selectedBaggage.reduce((sum, id) => sum + (BAGGAGE_OPTIONS.find(b => b.id === id)?.price || 0), 0);
  const seatCost = SEAT_CLASSES.find(s => s.id === selectedSeat)?.price || 0;
  const addOnTotal = mealCost + baggageCost + seatCost;
  const outboundPrice = outboundFlight?.price || 0;
  const returnPrice = returnFlight?.price || 0;
  const baseFare = outboundPrice + returnPrice;
  const taxes = Math.round(baseFare * 0.12);
  const serviceCharge = 250;
  const grandTotal = baseFare + taxes + serviceCharge + addOnTotal;

  // Payment deadline — uses airline-provided timeLimit first, then fallback
  const deadlineInfo = resolveDeadlineInfo(outboundFlight, domestic);

  /** Validate current step before proceeding */
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!outboundFlight) {
        toast({ title: "No Flight Selected", description: "Please go back and select a flight.", variant: "destructive" });
        return false;
      }
    }

    if (currentStep === 2) {
      const p = passengers[0];
      if (!p.title) errors["title"] = "Title is required";
      if (!p.firstName?.trim()) errors["firstName"] = "First name is required";
      if (!p.lastName?.trim()) errors["lastName"] = "Last name is required";
      if (!p.dob) errors["dob"] = "Date of birth is required";
      if (!p.nationality?.trim()) errors["nationality"] = "Nationality is required";
      if (!p.email?.trim()) errors["email"] = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errors["email"] = "Invalid email format";
      if (!p.phone?.trim()) errors["phone"] = "Phone number is required";

      // Validate name lengths
      if (p.firstName && p.firstName.trim().length < 2) errors["firstName"] = "First name too short";
      if (p.lastName && p.lastName.trim().length < 2) errors["lastName"] = "Last name too short";

      // Validate DOB is in the past
      if (p.dob) {
        const dobDate = new Date(p.dob);
        if (dobDate >= new Date()) errors["dob"] = "Date of birth must be in the past";
      }

      // For international flights, passport is required
      if (!domestic && !p.passport?.trim()) errors["passport"] = "Passport required for international flights";
      if (p.passport && p.passport.trim().length > 0 && p.passport.trim().length < 5) errors["passport"] = "Invalid passport number";

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        const firstError = Object.values(errors)[0];
        toast({ title: "Missing Passenger Info", description: firstError, variant: "destructive" });
        return false;
      }
    }

    setFieldErrors({});
    return true;
  };

  const handleContinue = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const createBooking = async (payLater: boolean) => {
    setBookingLoading(true);
    try {
      const bookingData = {
        flightData: outboundFlight,
        returnFlightData: returnFlight,
        passengers,
        isRoundTrip,
        isDomestic: domestic,
        payLater,
        paymentMethod: payLater ? "pay_later" : (selectedPaymentMethod || "card"),
        totalAmount: grandTotal,
        baseFare,
        taxes,
        serviceCharge,
        addOns: {
          meal: MEAL_OPTIONS.find(m => m.id === selectedMeal)?.name,
          seat: SEAT_CLASSES.find(s => s.id === selectedSeat)?.name,
          baggage: selectedBaggage.map(id => BAGGAGE_OPTIONS.find(b => b.id === id)?.name).filter(Boolean),
          total: addOnTotal,
        },
        contactInfo: { email: passengers[0]?.email, phone: passengers[0]?.phone },
      };

      const result = await api.post<any>("/flights/book", bookingData);
      setBookingResult(result);
      setBookingComplete(true);
      toast({
        title: payLater ? "Booking Confirmed — Pay Later" : "Booking & Payment Confirmed",
        description: `Booking Ref: ${result.bookingRef}`,
      });
    } catch (err: any) {
      toast({ title: "Booking Failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleConfirmBooking = () => {
    // Validate passenger
    const p = passengers[0];
    if (!p.firstName || !p.lastName) {
      toast({ title: "Missing Info", description: "Please fill in all passenger details.", variant: "destructive" });
      setStep(2);
      return;
    }
    if (!agreedTerms) {
      toast({ title: "Terms Required", description: "Please agree to the Terms & Conditions.", variant: "destructive" });
      return;
    }

    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    // For Biman: must pay immediately (no pay later option)
    if (isBiman) {
      if (!selectedPaymentMethod) {
        toast({ title: "Payment Required", description: "Biman Bangladesh Airlines requires immediate payment. Please select a payment method.", variant: "destructive" });
        return;
      }
      createBooking(false);
    } else {
      // Non-Biman: create booking as pay-later by default
      createBooking(true);
    }
  };

  const handlePayNow = () => {
    if (!selectedPaymentMethod) {
      toast({ title: "Select Payment", description: "Please select a payment method.", variant: "destructive" });
      return;
    }
    // In a real implementation this would open payment gateway
    // For now, navigate to payments page with booking ref
    navigate("/dashboard/payments", {
      state: { bookingRef: bookingResult?.bookingRef, amount: grandTotal },
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10"><div className="container mx-auto px-4"><Skeleton className="h-96 w-full rounded-xl" /></div></div>;
  }

  const STEPS = [
    { label: "Flight Details", icon: Plane },
    { label: "Passenger Info", icon: Users },
    { label: "Extras", icon: Plus },
    { label: "Review & Pay", icon: CreditCard },
  ];

  // ─── POST-BOOKING SUCCESS STATE ───
  if (bookingComplete && bookingResult) {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="border-success/30 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-black">Booking {bookingResult.payLater ? "On Hold" : "Confirmed"} ✓</h2>
              <p className="text-muted-foreground">
                {bookingResult.payLater
                  ? "Your booking has been placed on hold. Complete payment before the deadline to confirm your ticket."
                  : "Your booking and payment have been confirmed. Your e-ticket will be issued shortly."
                }
              </p>

              <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Booking Ref</span>
                  <span className="font-bold font-mono">{bookingResult.bookingRef}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={bookingResult.payLater ? "bg-warning/10 text-warning border-warning/20" : "bg-success/10 text-success border-success/20"}>
                    {bookingResult.payLater ? "On Hold" : "Confirmed"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-primary">৳{grandTotal.toLocaleString()}</span>
                </div>
                {bookingResult.payLater && deadlineInfo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Deadline</span>
                    <span className="font-bold text-destructive flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5" />
                      {deadlineInfo.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment deadline warning */}
              {bookingResult.payLater && deadlineInfo && (
                <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-left">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-destructive">Payment Required</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {domestic
                        ? "Domestic booking: Your booking will be automatically cancelled if payment is not received before the deadline."
                        : "International booking: Your booking will be automatically cancelled if payment is not received within the deadline period."
                      }
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {bookingResult.payLater ? (
                  <>
                    <Button className="flex-1 font-bold shadow-lg shadow-primary/20" onClick={handlePayNow}>
                      <CreditCard className="w-4 h-4 mr-1.5" /> Pay Now ৳{grandTotal.toLocaleString()}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard/bookings")}>
                      <Timer className="w-4 h-4 mr-1.5" /> Pay Later — Go to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="flex-1 font-bold" onClick={() => navigate("/dashboard/bookings")}>
                      <Plane className="w-4 h-4 mr-1.5" /> View My Bookings
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                      Book Another Flight
                    </Button>
                  </>
                )}
              </div>

              {/* Payment method selection for Pay Now */}
              {bookingResult.payLater && (
                <div className="mt-4 space-y-3 text-left">
                  <p className="text-sm font-semibold">Select Payment Method</p>
                  <div className="grid grid-cols-2 gap-3">
                    {["bKash", "Nagad", "Visa/Master Card", "Bank Transfer"].map(m => (
                      <label key={m} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedPaymentMethod === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}>
                        <input type="radio" name="payMethod" className="accent-primary" checked={selectedPaymentMethod === m} onChange={() => setSelectedPaymentMethod(m)} />
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
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => i + 1 < step && setStep(i + 1)}
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    step > i + 1 ? "bg-success/10 text-success cursor-pointer" :
                    step === i + 1 ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
                {i < STEPS.length - 1 && <div className="w-4 sm:w-8 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        {/* Biman Airlines notice */}
        {isBiman && step === 4 && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Biman Bangladesh Airlines — Immediate Payment Required</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                Biman Bangladesh Airlines does not support hold/booking. Payment must be made immediately to issue the ticket. No "Pay Later" option is available.
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* ─── STEP 1: Flight Details ─── */}
            {step === 1 && (
              <>
                <FlightSegmentCard flight={outboundFlight} label="Outbound" labelColor="bg-primary/10 text-primary" />
                {isRoundTrip && (
                  <FlightSegmentCard flight={returnFlight} label="Return" labelColor="bg-amber-500/10 text-amber-600" />
                )}
                {!isRoundTrip && !outboundFlight && (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">Loading flight details...</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* ─── STEP 2: Passenger Information ─── */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Passenger Details
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Enter details exactly as they appear on your passport/ID</p>
                </CardHeader>
                <CardContent>
                  {passengers.map((pax, pi) => (
                    <div key={pi} className="space-y-4">
                      {pi > 0 && <Separator className="my-4" />}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">Passenger {pi + 1}</Badge>
                        {pi === 0 && <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Primary Contact</Badge>}
                      </div>
                      <div className="grid sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <Label className={fieldErrors.title ? "text-destructive" : ""}>Title *</Label>
                          <Select value={pax.title} onValueChange={(v) => {
                            const updated = [...passengers]; updated[pi].title = v; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.title; return n; });
                          }}>
                            <SelectTrigger className={`h-11 ${fieldErrors.title ? "border-destructive ring-destructive/20 ring-2" : ""}`}><SelectValue placeholder="Title" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr">Mr</SelectItem>
                              <SelectItem value="Mrs">Mrs</SelectItem>
                              <SelectItem value="Ms">Ms</SelectItem>
                              <SelectItem value="Master">Master</SelectItem>
                              <SelectItem value="Miss">Miss</SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldErrors.title && <p className="text-[11px] text-destructive font-medium">{fieldErrors.title}</p>}
                        </div>
                        <div className="space-y-1.5 sm:col-span-1">
                          <Label className={fieldErrors.firstName ? "text-destructive" : ""}>First Name *</Label>
                          <Input value={pax.firstName} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].firstName = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.firstName; return n; });
                          }} placeholder="As on passport" className={`h-11 ${fieldErrors.firstName ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                          {fieldErrors.firstName && <p className="text-[11px] text-destructive font-medium">{fieldErrors.firstName}</p>}
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className={fieldErrors.lastName ? "text-destructive" : ""}>Last Name *</Label>
                          <Input value={pax.lastName} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].lastName = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.lastName; return n; });
                          }} placeholder="As on passport" className={`h-11 ${fieldErrors.lastName ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                          {fieldErrors.lastName && <p className="text-[11px] text-destructive font-medium">{fieldErrors.lastName}</p>}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className={fieldErrors.dob ? "text-destructive" : ""}>Date of Birth *</Label>
                          <Input type="date" value={pax.dob} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].dob = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.dob; return n; });
                          }} className={`h-11 ${fieldErrors.dob ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                          {fieldErrors.dob && <p className="text-[11px] text-destructive font-medium">{fieldErrors.dob}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className={fieldErrors.nationality ? "text-destructive" : ""}>Nationality *</Label>
                          <Input value={pax.nationality} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].nationality = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.nationality; return n; });
                          }} placeholder="e.g. Bangladeshi" className={`h-11 ${fieldErrors.nationality ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                          {fieldErrors.nationality && <p className="text-[11px] text-destructive font-medium">{fieldErrors.nationality}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className={fieldErrors.passport ? "text-destructive" : ""}>{domestic ? "Passport Number" : "Passport Number *"}</Label>
                          <Input value={pax.passport} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].passport = e.target.value; setPassengers(updated);
                            setFieldErrors(prev => { const n = {...prev}; delete n.passport; return n; });
                          }} placeholder="e.g. AB1234567" className={`h-11 ${fieldErrors.passport ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                          {fieldErrors.passport && <p className="text-[11px] text-destructive font-medium">{fieldErrors.passport}</p>}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label>Passport Expiry</Label>
                          <Input type="date" value={pax.passportExpiry} onChange={(e) => {
                            const updated = [...passengers]; updated[pi].passportExpiry = e.target.value; setPassengers(updated);
                          }} className="h-11" />
                        </div>
                        {pi === 0 && (
                          <>
                            <div className="space-y-1.5">
                              <Label className={fieldErrors.email ? "text-destructive" : ""}>Email *</Label>
                              <Input type="email" value={pax.email} onChange={(e) => {
                                const updated = [...passengers]; updated[pi].email = e.target.value; setPassengers(updated);
                                setFieldErrors(prev => { const n = {...prev}; delete n.email; return n; });
                              }} placeholder="email@example.com" className={`h-11 ${fieldErrors.email ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                              {fieldErrors.email && <p className="text-[11px] text-destructive font-medium">{fieldErrors.email}</p>}
                            </div>
                            <div className="space-y-1.5">
                              <Label className={fieldErrors.phone ? "text-destructive" : ""}>Phone *</Label>
                              <Input type="tel" value={pax.phone} onChange={(e) => {
                                const updated = [...passengers]; updated[pi].phone = e.target.value; setPassengers(updated);
                                setFieldErrors(prev => { const n = {...prev}; delete n.phone; return n; });
                              }} placeholder="+880 1XXX-XXXXXX" className={`h-11 ${fieldErrors.phone ? "border-destructive ring-destructive/20 ring-2" : ""}`} />
                              {fieldErrors.phone && <p className="text-[11px] text-destructive font-medium">{fieldErrors.phone}</p>}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ─── STEP 3: Extras (Meal, Baggage, Seat) ─── */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Customize Your Flight</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="meal" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 mb-4">
                      <TabsTrigger value="meal" className="gap-1.5 text-xs sm:text-sm"><UtensilsCrossed className="w-3.5 h-3.5" /> Meal</TabsTrigger>
                      <TabsTrigger value="baggage" className="gap-1.5 text-xs sm:text-sm"><Luggage className="w-3.5 h-3.5" /> Baggage</TabsTrigger>
                      <TabsTrigger value="seat" className="gap-1.5 text-xs sm:text-sm"><Armchair className="w-3.5 h-3.5" /> Seat</TabsTrigger>
                    </TabsList>
                    <TabsContent value="meal" className="space-y-3">
                      <p className="text-sm text-muted-foreground mb-2">Select your preferred meal for this flight.</p>
                      {MEAL_OPTIONS.map(meal => (
                        <AddOnCard key={meal.id} item={meal} selected={selectedMeal === meal.id} onSelect={() => setSelectedMeal(meal.id)} />
                      ))}
                    </TabsContent>
                    <TabsContent value="baggage" className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Included: 20kg Checked + 7kg Cabin</p>
                          <p className="text-xs text-muted-foreground">Your fare includes standard baggage allowance</p>
                        </div>
                      </div>
                      {BAGGAGE_OPTIONS.map(bag => (
                        <AddOnCard key={bag.id} item={bag} selected={selectedBaggage.includes(bag.id)}
                          onSelect={() => setSelectedBaggage(prev => prev.includes(bag.id) ? prev.filter(x => x !== bag.id) : [...prev, bag.id])}
                        />
                      ))}
                    </TabsContent>
                    <TabsContent value="seat" className="space-y-3">
                      <p className="text-sm text-muted-foreground mb-2">Choose your preferred seating.</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {SEAT_CLASSES.map(seat => (
                          <AddOnCard key={seat.id} item={seat} selected={selectedSeat === seat.id} onSelect={() => setSelectedSeat(seat.id)} />
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* ─── STEP 4: Review & Booking ─── */}
            {step === 4 && (
              <>
                {/* Review summary */}
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Booking Review</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {/* Flights summary */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Flight Itinerary</h4>
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Outbound</Badge>
                          <span className="text-sm font-semibold">{outboundFlight?.origin} → {outboundFlight?.destination}</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(outboundFlight?.departureTime)}</span>
                          <span className="text-xs">{fmtTime(outboundFlight?.departureTime)} – {fmtTime(outboundFlight?.arrivalTime)}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{outboundFlight?.airline} {outboundFlight?.flightNumber}</span>
                        </div>
                        {isRoundTrip && returnFlight && (
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">Return</Badge>
                            <span className="text-sm font-semibold">{returnFlight.origin} → {returnFlight.destination}</span>
                            <span className="text-xs text-muted-foreground">{fmtDate(returnFlight.departureTime)}</span>
                            <span className="text-xs">{fmtTime(returnFlight.departureTime)} – {fmtTime(returnFlight.arrivalTime)}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{returnFlight.airline} {returnFlight.flightNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Passenger summary */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Passengers</h4>
                      {passengers.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm p-2 bg-muted/30 rounded-lg">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{p.title} {p.firstName} {p.lastName}</span>
                          {p.passport && <span className="text-xs text-muted-foreground">Passport: {p.passport}</span>}
                        </div>
                      ))}
                    </div>

                    {/* Extras summary */}
                    {addOnTotal > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Selected Extras</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMeal !== "standard" && <Badge variant="outline" className="text-xs"><UtensilsCrossed className="w-3 h-3 mr-1" />{MEAL_OPTIONS.find(m => m.id === selectedMeal)?.name}</Badge>}
                          {selectedBaggage.map(id => <Badge key={id} variant="outline" className="text-xs"><Luggage className="w-3 h-3 mr-1" />{BAGGAGE_OPTIONS.find(b => b.id === id)?.name}</Badge>)}
                          {selectedSeat !== "standard" && <Badge variant="outline" className="text-xs"><Armchair className="w-3 h-3 mr-1" />{SEAT_CLASSES.find(s => s.id === selectedSeat)?.name}</Badge>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment section — only for Biman (instant pay required) */}
                {isBiman ? (
                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Payment (Required)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-3">
                        {["bKash", "Nagad", "Visa/Master Card", "Bank Transfer"].map((m) => (
                          <label key={m} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                            selectedPaymentMethod === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}>
                            <input type="radio" name="payMethod" className="accent-primary" checked={selectedPaymentMethod === m} onChange={() => setSelectedPaymentMethod(m)} />
                            <span className="text-sm font-medium">{m}</span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* Non-Biman: Pay Later info */
                  <Card className="border-primary/20 bg-primary/[0.02]">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Timer className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Book Now, Pay Later</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your booking will be placed on hold. You can pay anytime from your dashboard.
                            {deadlineInfo && (
                              <span className="text-destructive font-semibold"> {deadlineInfo.label}.</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {domestic
                              ? "Domestic flights: Booking valid for 48 hours. Must pay 24h before departure."
                              : "International flights: Booking valid for 7 days. Must pay before deadline."
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <Checkbox id="agree" className="mt-0.5" checked={agreedTerms} onCheckedChange={(v) => setAgreedTerms(!!v)} />
                  <label htmlFor="agree" className="text-xs text-muted-foreground">
                    I agree to the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
                  </label>
                </div>
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
              {step < 4 ? (
                <Button onClick={handleContinue} className="font-bold">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : isBiman ? (
                <Button className="font-bold shadow-lg shadow-primary/20" onClick={handleConfirmBooking} disabled={bookingLoading}>
                  {bookingLoading ? "Processing..." : <>
                    <Shield className="w-4 h-4 mr-1" /> Confirm & Pay ৳{grandTotal.toLocaleString()}
                  </>}
                </Button>
              ) : (
                <Button className="font-bold shadow-lg shadow-primary/20" onClick={handleConfirmBooking} disabled={bookingLoading}>
                  {bookingLoading ? "Processing..." : <>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Confirm Booking ৳{grandTotal.toLocaleString()}
                  </>}
                </Button>
              )}
            </div>
          </div>

          {/* ─── FARE SUMMARY SIDEBAR ─── */}
          <div>
            <Card className="sticky top-28">
              <CardHeader><CardTitle className="text-base">Fare Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {isRoundTrip ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outbound</span>
                      <span className="font-semibold">৳{outboundPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Return</span>
                      <span className="font-semibold">৳{returnPrice.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Fare</span>
                      <span className="font-semibold">৳{baseFare.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Fare</span>
                    <span className="font-semibold">৳{baseFare.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes & Fees</span>
                  <span className="font-semibold">৳{taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Charge</span>
                  <span className="font-semibold">৳{serviceCharge}</span>
                </div>

                {addOnTotal > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add-ons</p>
                    {mealCost > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> {MEAL_OPTIONS.find(m => m.id === selectedMeal)?.name}</span>
                        <span className="font-medium">৳{mealCost}</span>
                      </div>
                    )}
                    {baggageCost > 0 && selectedBaggage.map(id => {
                      const bag = BAGGAGE_OPTIONS.find(b => b.id === id);
                      return bag ? (
                        <div key={id} className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1"><Luggage className="w-3 h-3" /> {bag.name}</span>
                          <span className="font-medium">৳{bag.price}</span>
                        </div>
                      ) : null;
                    })}
                    {seatCost > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1"><Armchair className="w-3 h-3" /> {SEAT_CLASSES.find(s => s.id === selectedSeat)?.name}</span>
                        <span className="font-medium">৳{seatCost}</span>
                      </div>
                    )}
                  </>
                )}

                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-bold">Total</span>
                  <span className="font-black text-primary">৳{grandTotal.toLocaleString()}</span>
                </div>
                {isRoundTrip && (
                  <p className="text-[10px] text-muted-foreground text-center">Round-trip fare for 1 passenger</p>
                )}

                {/* Pay Later deadline in sidebar */}
                {!isBiman && deadlineInfo && step === 4 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-xs text-destructive font-semibold">
                      <Timer className="w-3.5 h-3.5" />
                      {deadlineInfo.label}
                    </div>
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
