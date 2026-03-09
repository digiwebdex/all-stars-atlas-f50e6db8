import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { AIRPORTS, type Airport } from "@/lib/airports";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  Plane, Building2, FileText, Palmtree, Stethoscope, Car,
  Smartphone, PhoneCall, Receipt, ArrowLeftRight, Search, Users,
  MapPin, ChevronDown, Wifi, Globe, Zap, CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TREATMENT_TYPES, RECHARGE_OPERATORS, BILL_CATEGORIES } from "@/lib/constants";



const COUNTRY_NAMES: Record<string, string> = {
  BD: "Bangladesh", IN: "India", PK: "Pakistan", LK: "Sri Lanka", NP: "Nepal", MV: "Maldives", BT: "Bhutan", MM: "Myanmar",
  TH: "Thailand", MY: "Malaysia", SG: "Singapore", ID: "Indonesia", VN: "Vietnam", PH: "Philippines", KH: "Cambodia", LA: "Laos",
  CN: "China", JP: "Japan", KR: "South Korea", TW: "Taiwan", HK: "Hong Kong", MO: "Macau",
  AE: "UAE", SA: "Saudi Arabia", QA: "Qatar", OM: "Oman", BH: "Bahrain", KW: "Kuwait", JO: "Jordan", LB: "Lebanon", IL: "Israel", IQ: "Iraq", IR: "Iran",
  TR: "Turkey", GE: "Georgia", AZ: "Azerbaijan", UZ: "Uzbekistan", KZ: "Kazakhstan",
  GB: "United Kingdom", FR: "France", DE: "Germany", IT: "Italy", ES: "Spain", PT: "Portugal", NL: "Netherlands", BE: "Belgium", CH: "Switzerland", AT: "Austria",
  SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", IE: "Ireland", PL: "Poland", CZ: "Czech Republic", GR: "Greece", RO: "Romania", HU: "Hungary",
  RU: "Russia", UA: "Ukraine",
  US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil", AR: "Argentina", CL: "Chile", CO: "Colombia", PE: "Peru",
  AU: "Australia", NZ: "New Zealand", FJ: "Fiji",
  EG: "Egypt", KE: "Kenya", ZA: "South Africa", NG: "Nigeria", ET: "Ethiopia", MA: "Morocco", TN: "Tunisia", GH: "Ghana", TZ: "Tanzania",
};

const HOTEL_CITIES = [
  "Cox's Bazar", "Dhaka", "Chittagong", "Sylhet", "Sreemangal", "Gazipur", "Rajshahi", "Rangpur",
  "Bangkok", "Singapore", "Kuala Lumpur", "Dubai", "Maldives", "Kolkata", "Kathmandu", "Istanbul",
  "London", "New York", "Phuket", "Bali", "Tokyo", "Seoul", "Mumbai", "Delhi", "Goa",
];

const VISA_COUNTRIES = [
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "FR", name: "France", flag: "🇫🇷" },
];

const HOLIDAY_DESTINATIONS = [
  { name: "Cox's Bazar", country: "Bangladesh", flag: "🇧🇩" },
  { name: "Bangkok", country: "Thailand", flag: "🇹🇭" },
  { name: "Maldives", country: "Maldives", flag: "🇲🇻" },
  { name: "Kolkata", country: "India", flag: "🇮🇳" },
  { name: "Kuala Lumpur", country: "Malaysia", flag: "🇲🇾" },
  { name: "Singapore", country: "Singapore", flag: "🇸🇬" },
  { name: "Dubai", country: "UAE", flag: "🇦🇪" },
  { name: "Istanbul", country: "Turkey", flag: "🇹🇷" },
  { name: "Kathmandu", country: "Nepal", flag: "🇳🇵" },
  { name: "Bali", country: "Indonesia", flag: "🇮🇩" },
  { name: "Phuket", country: "Thailand", flag: "🇹🇭" },
];

// === Autocomplete Input Component ===
interface AirportInputProps {
  label: string;
  value: typeof AIRPORTS[0] | null;
  onChange: (airport: typeof AIRPORTS[0]) => void;
  placeholder?: string;
  airports?: typeof AIRPORTS;
}

const AirportInput = ({ label, value, onChange, placeholder, airports: airportList }: AirportInputProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const list = airportList || AIRPORTS;

  const filtered = query.length > 0
    ? list.filter(a => {
        const q = query.toLowerCase();
        const countryName = COUNTRY_NAMES[a.country] || a.country;
        return a.city.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          countryName.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q);
      }).slice(0, 12)
    : list.slice(0, 8);

  const handleSelect = (airport: typeof AIRPORTS[0]) => {
    onChange(airport);
    setQuery("");
    setOpen(false);
    setFocused(false);
  };

  return (
    <div className="relative w-full">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</div>
      {!focused && value ? (
        <button
          className="flex items-center gap-2 w-full text-left"
          onClick={() => { setFocused(true); setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        >
          <span className="text-lg sm:text-xl font-black text-primary tracking-tight">{value.code}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{value.city}</div>
            <div className="text-[11px] text-muted-foreground truncate">{value.name}</div>
          </div>
        </button>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            onBlur={() => setTimeout(() => { setOpen(false); setFocused(false); }, 200)}
            placeholder={placeholder || "Type city, airport, or country..."}
            className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted-foreground/50 placeholder:font-normal"
            autoComplete="off"
          />
        </div>
      )}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">No airports found</div>
          ) : filtered.map(a => (
            <button
              key={a.code}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(a); }}
            >
              <span className="text-sm font-black text-primary w-10 shrink-0">{a.code}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{a.city}, {COUNTRY_NAMES[a.country] || a.country}</div>
                <div className="text-[11px] text-muted-foreground truncate">{a.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// === City Autocomplete Component ===
interface CityInputProps {
  label: string;
  value: string;
  onChange: (city: string) => void;
  cities: string[];
  icon?: React.ReactNode;
  placeholder?: string;
}

const CityInput = ({ label, value, onChange, cities, icon, placeholder }: CityInputProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = query.length > 0
    ? cities.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : cities.slice(0, 8);

  return (
    <div className="relative w-full">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</div>
      <div className="flex items-center gap-2 w-full">
        {icon}
        <div className="flex-1 min-w-0 relative">
          <input
            type="text"
            value={query || value}
            onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder={placeholder || "Type a city..."}
            className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted-foreground/50 placeholder:font-normal"
            autoComplete="off"
          />
          {open && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto -ml-8 min-w-[220px]">
              {filtered.map(c => (
                <button
                  key={c}
                  className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors text-sm font-semibold"
                  onMouseDown={(e) => { e.preventDefault(); onChange(c); setQuery(""); setOpen(false); }}
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-2 text-muted-foreground" />{c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const tabs = [
  { id: "flight", label: "Flight", icon: Plane },
  { id: "hotel", label: "Hotel", icon: Building2 },
  { id: "holiday", label: "Holiday", icon: Palmtree },
  { id: "visa", label: "Visa", icon: FileText },
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "cars", label: "Cars", icon: Car },
  { id: "esim", label: "eSIM", icon: Smartphone },
  { id: "recharge", label: "Recharge", icon: PhoneCall },
  { id: "paybill", label: "Pay Bill", icon: Receipt },
];

const SearchWidget = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("flight");

  // Flight state
  const [tripType, setTripType] = useState("roundtrip");
  const [fromAirport, setFromAirport] = useState<typeof AIRPORTS[0] | null>(AIRPORTS[0]); // DAC
  const [toAirport, setToAirport] = useState<typeof AIRPORTS[0] | null>(AIRPORTS[1]); // CXB
  const [departDate, setDepartDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState("economy");
  const [fareType, setFareType] = useState("regular");
  const [flightScope, setFlightScope] = useState<"domestic" | "international">("domestic");

  // Multi-city segments
  interface FlightSegment {
    from: typeof AIRPORTS[0] | null;
    to: typeof AIRPORTS[0] | null;
    date?: Date;
  }
  const [multiCitySegments, setMultiCitySegments] = useState<FlightSegment[]>([
    { from: AIRPORTS[0], to: AIRPORTS[1], date: undefined },
    { from: AIRPORTS[1], to: null, date: undefined },
  ]);

  const updateSegment = useCallback((index: number, field: keyof FlightSegment, value: any) => {
    setMultiCitySegments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Auto-set next segment's "from" to this segment's "to"
      if (field === "to" && index < updated.length - 1) {
        updated[index + 1] = { ...updated[index + 1], from: value };
      }
      return updated;
    });
  }, []);

  const addSegment = useCallback(() => {
    if (multiCitySegments.length >= 5) return;
    const lastSeg = multiCitySegments[multiCitySegments.length - 1];
    setMultiCitySegments(prev => [...prev, { from: lastSeg.to, to: null, date: undefined }]);
  }, [multiCitySegments]);

  const removeSegment = useCallback((index: number) => {
    if (multiCitySegments.length <= 2) return;
    setMultiCitySegments(prev => prev.filter((_, i) => i !== index));
  }, [multiCitySegments.length]);

  const domesticAirports = useMemo(() => AIRPORTS.filter(a => a.country === "BD"), []);
  const internationalAirports = useMemo(() => AIRPORTS.filter(a => a.country !== "BD"), []);

  // Domestic: both FROM and TO must be BD airports
  // International: FROM is BD, TO is international (or vice versa)
  const scopedFromAirports = flightScope === "domestic" ? domesticAirports : AIRPORTS;
  const scopedToAirports = flightScope === "domestic" ? domesticAirports : AIRPORTS;

  // Filter multi-city airports based on scope
  const scopedMultiCityAirports = flightScope === "domestic" ? domesticAirports : AIRPORTS;

  // When switching scope, reset airports that don't match
  useEffect(() => {
    if (flightScope === "domestic") {
      if (fromAirport && fromAirport.country !== "BD") setFromAirport(domesticAirports[0]);
      if (toAirport && toAirport.country !== "BD") setToAirport(domesticAirports[1] || null);
      // Reset multi-city segments to BD airports
      setMultiCitySegments(prev => prev.map((seg, i) => ({
        from: seg.from && seg.from.country !== "BD" ? (i === 0 ? domesticAirports[0] : null) : seg.from,
        to: seg.to && seg.to.country !== "BD" ? null : seg.to,
        date: seg.date,
      })));
    } else {
      // International: if both are BD, set destination to first international
      if (fromAirport?.country === "BD" && toAirport?.country === "BD") {
        setToAirport(null);
      }
    }
  }, [flightScope]);

  // Hotel state
  const [hotelCity, setHotelCity] = useState("Cox's Bazar");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [hotelGuests, setHotelGuests] = useState({ adults: 2, children: 0 });
  const [hotelRooms, setHotelRooms] = useState(1);

  // Holiday
  const [holidayDest, setHolidayDest] = useState("Cox's Bazar");
  const [travelDate, setTravelDate] = useState<Date>();

  // Visa
  const [visaCountry, setVisaCountry] = useState("TH");
  const [visaType, setVisaType] = useState("tourist");
  const [visaDate, setVisaDate] = useState<Date>();
  const [visaReturnDate, setVisaReturnDate] = useState<Date>();
  const [visaTravellers, setVisaTravellers] = useState(1);

  // Medical
  const [medicalCountry, setMedicalCountry] = useState("india");
  const [treatmentType, setTreatmentType] = useState("");
  const [medicalDate, setMedicalDate] = useState<Date>();
  const [medicalPatients, setMedicalPatients] = useState(1);

  // Cars
  const [pickupCity, setPickupCity] = useState("Dhaka");
  const [dropoffCity, setDropoffCity] = useState("Cox's Bazar");
  const [pickupDate, setPickupDate] = useState<Date>();
  const [dropoffDate, setDropoffDate] = useState<Date>();

  // eSIM
  const [esimCountry, setEsimCountry] = useState("thailand");
  const [esimPlan, setEsimPlan] = useState("3gb-15d");
  const [esimDate, setEsimDate] = useState<Date>();

  // Recharge
  const [rechargeOperator, setRechargeOperator] = useState("");
  const [rechargeNumber, setRechargeNumber] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeType, setRechargeType] = useState("prepaid");

  // Pay Bill
  const [billCategory, setBillCategory] = useState("");
  const [billerName, setBillerName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [billAmount, setBillAmount] = useState("");

  const totalPax = passengers.adults + passengers.children + passengers.infants;
  const totalHotelGuests = hotelGuests.adults + hotelGuests.children;

  const swapAirports = useCallback(() => {
    const oldFrom = fromAirport;
    setFromAirport(toAirport);
    setToAirport(oldFrom);
  }, [toAirport, fromAirport]);

  // ====== SEARCH HANDLERS ======
  const handleFlightSearch = () => {
    if (tripType === "multicity") {
      const validSegments = multiCitySegments.filter(s => s.from && s.to);
      if (validSegments.length < 2) { toast.error("Please add at least 2 flight segments"); return; }
      const missingDates = validSegments.some(s => !s.date);
      if (missingDates) { toast.error("Please select departure date for all segments"); return; }
      const params = new URLSearchParams({
        tripType: "multicity",
        adults: String(passengers.adults), children: String(passengers.children), infants: String(passengers.infants),
        cabin: cabinClass, fare: fareType,
        segments: JSON.stringify(validSegments.map(s => ({
          from: s.from!.code, to: s.to!.code,
          date: s.date ? format(s.date, 'yyyy-MM-dd') : undefined,
        }))),
      });
      navigate(`/flights?${params.toString()}`);
      return;
    }
    if (!fromAirport || !toAirport) { toast.error("Please select departure and arrival airports"); return; }
    if (fromAirport.code === toAirport.code) { toast.error("Departure and arrival airports cannot be the same"); return; }
    if (flightScope === "domestic" && (fromAirport.country !== "BD" || toAirport.country !== "BD")) { toast.error("Domestic flights must be within Bangladesh"); return; }
    if (flightScope === "international" && fromAirport.country === "BD" && toAirport.country === "BD") { toast.error("International flights need at least one airport outside Bangladesh"); return; }
    if (!departDate) { toast.error("Please select a departure date"); return; }
    if (tripType === 'roundtrip' && !returnDate) { toast.error("Please select a return date for round trip"); return; }
    const params = new URLSearchParams({
      from: fromAirport.code, to: toAirport.code, tripType,
      adults: String(passengers.adults), children: String(passengers.children), infants: String(passengers.infants),
      cabin: cabinClass, fare: fareType,
    });
    params.set('depart', format(departDate, 'yyyy-MM-dd'));
    if (returnDate && tripType === 'roundtrip') params.set('return', format(returnDate, 'yyyy-MM-dd'));
    navigate(`/flights?${params.toString()}`);
  };

  const handleHotelSearch = () => {
    if (!checkIn) { toast.error("Please select a check-in date"); return; }
    if (!checkOut) { toast.error("Please select a check-out date"); return; }
    const params = new URLSearchParams({ destination: hotelCity });
    params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
    params.set('adults', String(hotelGuests.adults));
    params.set('children', String(hotelGuests.children));
    params.set('rooms', String(hotelRooms));
    navigate(`/hotels?${params.toString()}`);
  };

  const handleVisaSearch = () => {
    if (!visaDate) { toast.error("Please select a travel date"); return; }
    if (!visaReturnDate) { toast.error("Please select a return date"); return; }
    const country = VISA_COUNTRIES.find(c => c.code === visaCountry);
    const params = new URLSearchParams({
      country: country?.name || visaCountry,
      type: visaType,
      travellers: String(visaTravellers),
    });
    params.set('date', format(visaDate, 'yyyy-MM-dd'));
    params.set('return', format(visaReturnDate, 'yyyy-MM-dd'));
    navigate(`/visa?${params.toString()}`);
  };

  const handleHolidaySearch = () => {
    if (!travelDate) { toast.error("Please select a travel date"); return; }
    const params = new URLSearchParams({ destination: holidayDest });
    params.set('date', format(travelDate, 'yyyy-MM-dd'));
    navigate(`/holidays?${params.toString()}`);
  };

  const handleMedicalSearch = () => {
    if (!medicalDate) { toast.error("Please select a travel date for medical appointment"); return; }
    const params = new URLSearchParams();
    if (medicalCountry) params.set('country', medicalCountry);
    if (treatmentType) params.set('treatment', treatmentType);
    params.set('date', format(medicalDate, 'yyyy-MM-dd'));
    params.set('patients', String(medicalPatients));
    navigate(`/medical?${params.toString()}`);
  };

  const handleCarSearch = () => {
    if (!pickupDate) { toast.error("Please select a pickup date"); return; }
    if (!dropoffDate) { toast.error("Please select a drop-off date"); return; }
    const params = new URLSearchParams({ pickup: pickupCity, dropoff: dropoffCity });
    params.set('pickupDate', format(pickupDate, 'yyyy-MM-dd'));
    params.set('dropoffDate', format(dropoffDate, 'yyyy-MM-dd'));
    navigate(`/cars?${params.toString()}`);
  };

  const handleEsimSearch = () => {
    if (!esimDate) { toast.error("Please select an activation date"); return; }
    const params = new URLSearchParams({ country: esimCountry, plan: esimPlan });
    params.set('activation', format(esimDate, 'yyyy-MM-dd'));
    navigate(`/esim?${params.toString()}`);
  };

  const handleRecharge = () => {
    if (!rechargeOperator) { toast.error("Please select an operator"); return; }
    if (!rechargeNumber) { toast.error("Please enter a phone number"); return; }
    if (!rechargeAmount) { toast.error("Please enter recharge amount"); return; }
    const params = new URLSearchParams();
    params.set('operator', rechargeOperator);
    params.set('number', rechargeNumber);
    params.set('amount', rechargeAmount);
    params.set('type', rechargeType);
    navigate(`/recharge?${params.toString()}`);
  };

  const handlePayBill = () => {
    if (!billCategory) { toast.error("Please select a bill category"); return; }
    if (!billerName) { toast.error("Please enter a biller name"); return; }
    if (!accountNumber) { toast.error("Please enter your account number"); return; }
    if (!billAmount) { toast.error("Please enter the bill amount"); return; }
    const params = new URLSearchParams();
    params.set('category', billCategory);
    params.set('biller', billerName);
    params.set('account', accountNumber);
    params.set('amount', billAmount);
    navigate(`/paybill?${params.toString()}`);
  };

  // ====== DATE DISPLAY HELPER ======
  const DateDisplay = ({ date, fallbackDay, fallbackMonth, fallbackWeekday }: { date?: Date; fallbackDay: string; fallbackMonth: string; fallbackWeekday: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-xl sm:text-2xl font-black">{date ? format(date, "dd") : fallbackDay}</span>
      <div>
        <div className="text-sm font-bold">{date ? format(date, "MMM''yy") : fallbackMonth}</div>
        <div className="text-[11px] text-muted-foreground">{date ? format(date, "EEEE") : fallbackWeekday}</div>
      </div>
    </div>
  );

  const tabContent: Record<string, React.ReactNode> = {
    // ====== FLIGHT ======
    flight: (
      <div className="space-y-4">
        {/* Domestic / International Toggle */}
        <div className="flex gap-2">
          {(["domestic", "international"] as const).map((scope) => (
            <button
              key={scope}
              onClick={() => setFlightScope(scope)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all border ${
                flightScope === scope
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {scope === "domestic" ? "Domestic" : "International"}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3">
          <RadioGroup value={tripType} onValueChange={setTripType} className="flex gap-1.5 flex-wrap">
            {[
              { value: "oneway", label: "One Way" },
              { value: "roundtrip", label: "Round Trip" },
              { value: "multicity", label: "Multi City" },
            ].map((t) => (
              <label
                key={t.value}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-semibold cursor-pointer transition-all border ${
                  tripType === t.value
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <RadioGroupItem value={t.value} className="sr-only" />
                {t.label}
              </label>
            ))}
          </RadioGroup>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 rounded-lg font-semibold flex-1 sm:flex-none">
                  <Users className="w-3.5 h-3.5" />
                  {totalPax} Traveller{totalPax > 1 ? "s" : ""}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-3">
                  {[
                    { key: "adults" as const, label: "Adults", desc: "12+ years" },
                    { key: "children" as const, label: "Children", desc: "2-11 years" },
                    { key: "infants" as const, label: "Infants", desc: "Under 2" },
                  ].map((p) => (
                    <div key={p.key} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{p.label}</div>
                        <div className="text-xs text-muted-foreground">{p.desc}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                          onClick={() => setPassengers(prev => ({ ...prev, [p.key]: Math.max(p.key === "adults" ? 1 : 0, prev[p.key] - 1) }))}>−</Button>
                        <span className="w-5 text-center text-sm font-bold">{passengers[p.key]}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                          onClick={() => setPassengers(prev => ({ ...prev, [p.key]: prev[p.key] + 1 }))}>+</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Select value={cabinClass} onValueChange={setCabinClass}>
              <SelectTrigger className="h-8 w-auto text-xs border gap-1 rounded-lg font-semibold flex-1 sm:flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Economy", "Premium Economy", "Business", "First"].map(c => (
                  <SelectItem key={c} value={c.toLowerCase().replace(" ", "-")}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Fields */}
        {tripType === "multicity" ? (
          <div className="space-y-3">
            {multiCitySegments.map((segment, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm relative">
                <div className="md:col-span-4 search-field border-b md:border-b-0 flex-col items-start">
                  <AirportInput label={`From (Flight ${index + 1})`} value={segment.from} onChange={(a) => updateSegment(index, 'from', a)} placeholder="Type city or airport..." airports={scopedMultiCityAirports} />
                </div>

                <div className="md:col-span-4 search-field border-b md:border-b-0 flex-col items-start">
                  <AirportInput label={`To (Flight ${index + 1})`} value={segment.to} onChange={(a) => updateSegment(index, 'to', a)} placeholder="Where to?" airports={scopedMultiCityAirports} />
                </div>

                <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Departure</div>
                  <Popover>
                    <PopoverTrigger className="w-full text-left">
                      <DateDisplay date={segment.date} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={segment.date} onSelect={(d) => updateSegment(index, 'date', d)} initialFocus disabled={(date) => date < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>

                {multiCitySegments.length > 2 && (
                  <div className="md:col-span-1 flex items-center justify-center p-2">
                    <button
                      onClick={() => removeSegment(index)}
                      className="w-8 h-8 rounded-full border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {multiCitySegments.length < 5 && (
                <Button variant="outline" size="sm" onClick={addSegment} className="rounded-xl text-xs font-semibold gap-1.5">
                  + Add Another City
                </Button>
              )}
              <Button onClick={handleFlightSearch} className="flex-1 sm:flex-none h-12 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 hover:shadow-secondary/40 transition-all active:scale-[0.98]">
                <Search className="w-5 h-5 mr-2" /> Search
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
            <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
              <AirportInput label="From" value={fromAirport} onChange={setFromAirport} placeholder="Type city or airport..." airports={scopedFromAirports} />
            </div>

            <div className="flex md:hidden items-center justify-center py-1">
              <button onClick={swapAirports} className="w-9 h-9 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
                <ArrowLeftRight className="w-4 h-4 rotate-90" />
              </button>
            </div>
            <div className="hidden md:flex items-center justify-center -mx-4 z-10">
              <button onClick={swapAirports} className="w-10 h-10 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-md hover:shadow-lg hover:scale-110">
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
              <AirportInput label="To" value={toAirport} onChange={setToAirport} placeholder="Where to?" airports={scopedToAirports} />
            </div>

            <div className={`${tripType === "roundtrip" ? "col-span-1 sm:col-span-1" : ""} md:col-span-2 search-field border-b md:border-b-0 flex-col items-start`}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Departure</div>
              <Popover>
                <PopoverTrigger className="w-full text-left">
                  <DateDisplay date={departDate} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={departDate} onSelect={setDepartDate} initialFocus disabled={(date) => date < new Date()} />
                </PopoverContent>
              </Popover>
            </div>

            {tripType === "roundtrip" && (
              <div className="md:col-span-2 search-field border-b md:border-b-0 flex-col items-start">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Return</div>
                <Popover>
                  <PopoverTrigger className="w-full text-left">
                    <DateDisplay date={returnDate} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus disabled={(date) => date < (departDate || new Date())} />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className={`${tripType === "roundtrip" ? "md:col-span-2" : "md:col-span-4"} flex items-center justify-center p-3`}>
              <Button onClick={handleFlightSearch} className="w-full h-12 md:h-full md:min-h-[56px] rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 hover:shadow-secondary/40 transition-all active:scale-[0.98]">
                <Search className="w-5 h-5 mr-2" /> Search
              </Button>
            </div>
          </div>
        )}

        {/* Fare Type */}
        <div className="flex flex-wrap gap-4 sm:gap-5">
          {["Regular", "Student", "Umrah"].map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer text-sm group" onClick={() => setFareType(f.toLowerCase())}>
              <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                fareType === f.toLowerCase() ? "border-primary bg-primary/5" : "border-muted-foreground/30 group-hover:border-primary/40"
              }`}>
                {fareType === f.toLowerCase() && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className={`font-medium ${fareType === f.toLowerCase() ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                {f} Fare
              </span>
            </label>
          ))}
        </div>
      </div>
    ),

    // ====== HOTEL ======
    hotel: (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
        <div className="md:col-span-4 search-field border-b md:border-b-0 flex-col items-start">
          <CityInput
            label="Destination"
            value={hotelCity}
            onChange={setHotelCity}
            cities={HOTEL_CITIES}
            icon={<MapPin className="w-5 h-5 text-primary shrink-0" />}
            placeholder="Where are you going?"
          />
        </div>
        <div className="grid grid-cols-2 md:contents">
          <div className="md:col-span-2 search-field border-b md:border-b-0 border-r md:border-r flex-col items-start">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Check-in</div>
            <Popover>
              <PopoverTrigger className="w-full text-left">
                <DateDisplay date={checkIn} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus disabled={(date) => date < new Date()} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="md:col-span-2 search-field border-b md:border-b-0 flex-col items-start">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Check-out</div>
            <Popover>
              <PopoverTrigger className="w-full text-left">
                <DateDisplay date={checkOut} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus disabled={(date) => date < (checkIn || new Date())} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="md:col-span-2 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Guests & Rooms</div>
          <Popover>
            <PopoverTrigger className="w-full text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black">{String(totalHotelGuests).padStart(2, '0')}</span>
                <div>
                  <div className="text-sm font-bold">Guest{totalHotelGuests > 1 ? 's' : ''}</div>
                  <div className="text-[11px] text-muted-foreground">{hotelRooms} Room{hotelRooms > 1 ? 's' : ''}</div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-3">
                {[
                  { key: "adults" as const, label: "Adults", desc: "12+ years", min: 1 },
                  { key: "children" as const, label: "Children", desc: "2-11 years", min: 0 },
                ].map((p) => (
                  <div key={p.key} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                        onClick={() => setHotelGuests(prev => ({ ...prev, [p.key]: Math.max(p.min, prev[p.key] - 1) }))}>−</Button>
                      <span className="w-5 text-center text-sm font-bold">{hotelGuests[p.key]}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                        onClick={() => setHotelGuests(prev => ({ ...prev, [p.key]: prev[p.key] + 1 }))}>+</Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <div className="text-sm font-semibold">Rooms</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                      onClick={() => setHotelRooms(prev => Math.max(1, prev - 1))}>−</Button>
                    <span className="w-5 text-center text-sm font-bold">{hotelRooms}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                      onClick={() => setHotelRooms(prev => prev + 1)}>+</Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="md:col-span-2 flex items-center justify-center p-3">
          <Button onClick={handleHotelSearch} className="w-full h-12 md:h-full md:min-h-[56px] rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 hover:shadow-secondary/40 transition-all active:scale-[0.98]">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>
    ),

    // ====== VISA ======
    visa: (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
        <div className="sm:col-span-2 md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Country</div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-xl font-black text-primary">{VISA_COUNTRIES.find(c => c.code === visaCountry)?.flag || "🌍"}</span>
            <div className="flex-1">
              <Select value={visaCountry} onValueChange={setVisaCountry}>
                <SelectTrigger className="border-0 p-0 h-auto text-sm font-bold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISA_COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visaType} onValueChange={setVisaType}>
                <SelectTrigger className="border-0 p-0 h-auto text-[11px] text-muted-foreground shadow-none focus:ring-0 mt-0.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tourist">Tourist Visa</SelectItem>
                  <SelectItem value="business">Business Visa</SelectItem>
                  <SelectItem value="medical">Medical Visa</SelectItem>
                  <SelectItem value="student">Student Visa</SelectItem>
                  <SelectItem value="work">Work Visa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="search-field border-b md:border-b-0 flex-col items-start md:col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Travel Date</div>
          <Popover>
            <PopoverTrigger className="w-full text-left">
              <DateDisplay date={visaDate} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={visaDate} onSelect={setVisaDate} initialFocus disabled={(date) => date < new Date()} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="search-field border-b md:border-b-0 flex-col items-start md:col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Return Date</div>
          <Popover>
            <PopoverTrigger className="w-full text-left">
              <DateDisplay date={visaReturnDate} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={visaReturnDate} onSelect={setVisaReturnDate} initialFocus disabled={(date) => date < (visaDate || new Date())} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="sm:col-span-2 md:col-span-2 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Travellers</div>
          <Popover>
            <PopoverTrigger className="w-full text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black">{String(visaTravellers).padStart(2, '0')}</span>
                <div>
                  <div className="text-sm font-bold">Traveller{visaTravellers > 1 ? 's' : ''}</div>
                  <div className="text-[11px] text-muted-foreground">Bangladeshi</div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Travellers</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                    onClick={() => setVisaTravellers(prev => Math.max(1, prev - 1))}>−</Button>
                  <span className="w-5 text-center text-sm font-bold">{visaTravellers}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                    onClick={() => setVisaTravellers(prev => prev + 1)}>+</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="sm:col-span-2 md:col-span-3 flex items-center justify-center p-3">
          <Button onClick={handleVisaSearch} className="w-full h-12 md:h-full md:min-h-[56px] rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 transition-all active:scale-[0.98]">
            <Search className="w-5 h-5 mr-2" /> Search
          </Button>
        </div>
      </div>
    ),

    // ====== HOLIDAY ======
    holiday: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
          <div className="md:col-span-5 search-field border-b md:border-b-0 flex-col items-start">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Destination</div>
            <div className="flex items-center gap-2 w-full">
              <span className="text-xl font-black text-primary">{HOLIDAY_DESTINATIONS.find(d => d.name === holidayDest)?.flag || "🌍"}</span>
              <div className="flex-1">
                <Select value={holidayDest} onValueChange={setHolidayDest}>
                  <SelectTrigger className="border-0 p-0 h-auto text-sm font-bold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOLIDAY_DESTINATIONS.map(d => (
                      <SelectItem key={d.name} value={d.name}>{d.flag} {d.name}, {d.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-muted-foreground">{HOLIDAY_DESTINATIONS.find(d => d.name === holidayDest)?.country || "Select destination"}</div>
              </div>
            </div>
          </div>
          <div className="md:col-span-4 search-field border-b md:border-b-0 flex-col items-start">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Travel Date</div>
            <Popover>
              <PopoverTrigger className="w-full text-left">
                <DateDisplay date={travelDate} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={travelDate} onSelect={setTravelDate} initialFocus disabled={(date) => date < new Date()} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="md:col-span-3 flex items-center justify-center p-3">
            <Button onClick={handleHolidaySearch} className="w-full h-12 md:h-full md:min-h-[56px] rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 transition-all active:scale-[0.98]">
              <Search className="w-5 h-5 mr-2" /> Search
            </Button>
          </div>
        </div>
      </div>
    ),

    // ====== MEDICAL TOURISM ======
    medical: (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
        <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Destination</div>
          <div className="flex items-center gap-2 w-full">
            <Globe className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <Select value={medicalCountry} onValueChange={setMedicalCountry}>
                <SelectTrigger className="border-0 p-0 h-auto text-sm font-bold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="india">🇮🇳 India</SelectItem>
                  <SelectItem value="thailand">🇹🇭 Thailand</SelectItem>
                  <SelectItem value="singapore">🇸🇬 Singapore</SelectItem>
                  <SelectItem value="malaysia">🇲🇾 Malaysia</SelectItem>
                  <SelectItem value="turkey">🇹🇷 Turkey</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-[11px] text-muted-foreground">Medical Tourism</div>
            </div>
          </div>
        </div>
        <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Treatment</div>
          <Select value={treatmentType} onValueChange={setTreatmentType}>
            <SelectTrigger className="border-0 p-0 h-auto text-sm font-bold shadow-none focus:ring-0">
              <SelectValue placeholder="Select treatment" />
            </SelectTrigger>
            <SelectContent>
              {TREATMENT_TYPES.map(t => (
                <SelectItem key={t} value={t.toLowerCase().replace(/ /g, '-')}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Travel Date</div>
          <Popover>
            <PopoverTrigger className="w-full text-left">
              <DateDisplay date={medicalDate} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={medicalDate} onSelect={setMedicalDate} initialFocus disabled={(date) => date < new Date()} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="md:col-span-2 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Patients</div>
          <Popover>
            <PopoverTrigger className="w-full text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black">{String(medicalPatients).padStart(2, '0')}</span>
                <div>
                  <div className="text-sm font-bold">Patient{medicalPatients > 1 ? 's' : ''}</div>
                  <div className="text-[11px] text-muted-foreground">+ Companion</div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Patients</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                    onClick={() => setMedicalPatients(prev => Math.max(1, prev - 1))}>−</Button>
                  <span className="w-5 text-center text-sm font-bold">{medicalPatients}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-xs rounded-lg"
                    onClick={() => setMedicalPatients(prev => prev + 1)}>+</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="md:col-span-2 flex items-center justify-center p-3">
          <Button onClick={handleMedicalSearch} className="w-full h-12 md:h-full md:min-h-[56px] rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 transition-all active:scale-[0.98]">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>
    ),

    // ====== CAR RENTAL ======
    cars: (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
        <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
          <CityInput
            label="Pickup Location"
            value={pickupCity}
            onChange={setPickupCity}
            cities={HOTEL_CITIES.filter(c => ["Dhaka", "Chittagong", "Cox's Bazar", "Sylhet", "Rajshahi", "Gazipur", "Rangpur", "Sreemangal"].includes(c))}
            icon={<MapPin className="w-5 h-5 text-primary shrink-0" />}
            placeholder="Pickup city..."
          />
        </div>
        <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
          <CityInput
            label="Drop-off Location"
            value={dropoffCity}
            onChange={setDropoffCity}
            cities={HOTEL_CITIES.filter(c => ["Dhaka", "Chittagong", "Cox's Bazar", "Sylhet", "Rajshahi", "Gazipur", "Rangpur", "Sreemangal"].includes(c))}
            icon={<MapPin className="w-5 h-5 text-secondary shrink-0" />}
            placeholder="Drop-off city..."
          />
        </div>
        <div className="grid grid-cols-2 md:contents">
          <div className="md:col-span-2 search-field border-b md:border-b-0 border-r flex-col items-start">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Pickup Date</div>
            <Popover>
              <PopoverTrigger className="w-full text-left">
                <DateDisplay date={pickupDate} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={pickupDate} onSelect={setPickupDate} initialFocus disabled={(date) => date < new Date()} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="md:col-span-2 search-field border-b md:border-b-0 flex-col items-start">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Drop-off Date</div>
            <Popover>
              <PopoverTrigger className="w-full text-left">
                <DateDisplay date={dropoffDate} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dropoffDate} onSelect={setDropoffDate} initialFocus disabled={(date) => date < (pickupDate || new Date())} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="md:col-span-2 flex items-center justify-center p-3">
          <Button onClick={handleCarSearch} className="w-full h-12 md:h-full md:min-h-[56px] rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 transition-all active:scale-[0.98]">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>
    ),

    // ====== eSIM ======
    esim: (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
        <div className="md:col-span-4 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Destination Country</div>
          <div className="flex items-center gap-2 w-full">
            <Wifi className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <Select value={esimCountry} onValueChange={setEsimCountry}>
                <SelectTrigger className="border-0 p-0 h-auto text-sm font-bold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="thailand">🇹🇭 Thailand</SelectItem>
                  <SelectItem value="malaysia">🇲🇾 Malaysia</SelectItem>
                  <SelectItem value="singapore">🇸🇬 Singapore</SelectItem>
                  <SelectItem value="india">🇮🇳 India</SelectItem>
                  <SelectItem value="uae">🇦🇪 UAE</SelectItem>
                  <SelectItem value="turkey">🇹🇷 Turkey</SelectItem>
                  <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="usa">🇺🇸 United States</SelectItem>
                  <SelectItem value="japan">🇯🇵 Japan</SelectItem>
                  <SelectItem value="south-korea">🇰🇷 South Korea</SelectItem>
                  <SelectItem value="australia">🇦🇺 Australia</SelectItem>
                  <SelectItem value="europe">🇪🇺 Europe (Multi)</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-[11px] text-muted-foreground">eSIM Data Plan</div>
            </div>
          </div>
        </div>
        <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Data Plan</div>
          <Select value={esimPlan} onValueChange={setEsimPlan}>
            <SelectTrigger className="border-0 p-0 h-auto text-sm font-bold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1gb-7d">1 GB — 7 Days</SelectItem>
              <SelectItem value="3gb-15d">3 GB — 15 Days</SelectItem>
              <SelectItem value="5gb-30d">5 GB — 30 Days</SelectItem>
              <SelectItem value="10gb-30d">10 GB — 30 Days</SelectItem>
              <SelectItem value="unlimited-30d">Unlimited — 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Activation Date</div>
          <Popover>
            <PopoverTrigger className="w-full text-left">
              <DateDisplay date={esimDate} fallbackDay="—" fallbackMonth="Select" fallbackWeekday="Date" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={esimDate} onSelect={setEsimDate} initialFocus disabled={(date) => date < new Date()} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="md:col-span-2 flex items-center justify-center p-3">
          <Button onClick={handleEsimSearch} className="w-full h-12 md:h-full md:min-h-[56px] rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 transition-all active:scale-[0.98]">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>
    ),

    // ====== RECHARGE ======
    recharge: (
      <div className="space-y-4">
        <div className="flex gap-2">
          {["prepaid", "postpaid"].map(t => (
            <button key={t} onClick={() => setRechargeType(t)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all border ${
                rechargeType === t
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
          <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Operator</div>
            <Select value={rechargeOperator} onValueChange={setRechargeOperator}>
              <SelectTrigger className="border-0 p-0 h-auto text-sm font-bold shadow-none focus:ring-0">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {RECHARGE_OPERATORS.map(op => (
                  <SelectItem key={op.id} value={op.id}>{op.logo} {op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Phone Number</div>
            <div className="flex items-center gap-2 w-full">
              <PhoneCall className="w-4 h-4 text-primary shrink-0" />
              <Input value={rechargeNumber} onChange={e => setRechargeNumber(e.target.value)}
                placeholder="01XXX-XXXXXX" className="border-0 p-0 h-auto text-sm font-bold shadow-none focus-visible:ring-0" />
            </div>
          </div>
          <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Amount (৳)</div>
            <div className="flex items-center gap-2 w-full">
              <Zap className="w-4 h-4 text-secondary shrink-0" />
              <Input value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)}
                placeholder="Enter amount" type="number" className="border-0 p-0 h-auto text-sm font-bold shadow-none focus-visible:ring-0" />
            </div>
          </div>
          <div className="md:col-span-3 flex items-center justify-center p-3">
            <Button onClick={handleRecharge} className="w-full h-12 md:h-full md:min-h-[56px] rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 transition-all active:scale-[0.98]">
              <Zap className="w-5 h-5 mr-2" /> Recharge
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[50, 100, 200, 500, 1000].map(amt => (
            <button key={amt} onClick={() => setRechargeAmount(String(amt))}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                rechargeAmount === String(amt) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}>
              ৳{amt}
            </button>
          ))}
        </div>
      </div>
    ),

    // ====== PAY BILL ======
    paybill: (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
        <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Category</div>
          <div className="flex items-center gap-2 w-full">
            <Receipt className="w-5 h-5 text-primary shrink-0" />
            <Select value={billCategory} onValueChange={setBillCategory}>
              <SelectTrigger className="border-0 p-0 h-auto text-sm font-bold shadow-none focus:ring-0">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {BILL_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat.toLowerCase().replace(/ /g, '-')}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Biller Name</div>
          <Input value={billerName} onChange={e => setBillerName(e.target.value)}
            placeholder="e.g. DPDC, Titas Gas" className="border-0 p-0 h-auto text-sm font-bold shadow-none focus-visible:ring-0" />
        </div>
        <div className="md:col-span-2 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Account No.</div>
          <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
            placeholder="Account/Subscriber #" className="border-0 p-0 h-auto text-sm font-bold shadow-none focus-visible:ring-0" />
        </div>
        <div className="md:col-span-2 search-field border-b md:border-b-0 flex-col items-start">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Amount (৳)</div>
          <div className="flex items-center gap-2 w-full">
            <CreditCard className="w-4 h-4 text-secondary shrink-0" />
            <Input value={billAmount} onChange={e => setBillAmount(e.target.value)}
              placeholder="Amount" type="number" className="border-0 p-0 h-auto text-sm font-bold shadow-none focus-visible:ring-0" />
          </div>
        </div>
        <div className="md:col-span-2 flex items-center justify-center p-3">
          <Button onClick={handlePayBill} className="w-full h-12 md:h-full md:min-h-[56px] rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-extrabold shadow-xl shadow-secondary/25 transition-all active:scale-[0.98]">
            <CreditCard className="w-5 h-5 mr-2" /> Pay
          </Button>
        </div>
      </div>
    ),
  };

  return (
    <div className="glass-card-hero rounded-2xl">
      {/* Tabs - Centered and colorful */}
      <div className="flex items-center justify-center gap-0 px-2 sm:px-4 pt-2 sm:pt-3 overflow-x-auto scrollbar-none border-b border-border/40 -webkit-overflow-scrolling-touch">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "text-primary bg-gradient-to-r from-primary/10 to-[hsl(280,70%,55%,0.06)] border border-primary/20 shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : ''}`} />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchWidget;
