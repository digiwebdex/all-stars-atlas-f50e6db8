import { useState, useRef, useEffect, useCallback } from "react";
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

// === AIRPORT DATABASE (Bangladesh + major international) ===
const AIRPORTS = [
  { code: "DAC", city: "Dhaka", name: "Hazrat Shahjalal Intl Airport", country: "BD" },
  { code: "CXB", city: "Cox's Bazar", name: "Cox's Bazar Airport", country: "BD" },
  { code: "CGP", city: "Chattogram", name: "Shah Amanat Intl Airport", country: "BD" },
  { code: "ZYL", city: "Sylhet", name: "Osmani Intl Airport", country: "BD" },
  { code: "JSR", city: "Jashore", name: "Jashore Airport", country: "BD" },
  { code: "RJH", city: "Rajshahi", name: "Shah Makhdum Airport", country: "BD" },
  { code: "SPD", city: "Saidpur", name: "Saidpur Airport", country: "BD" },
  { code: "BZL", city: "Barisal", name: "Barisal Airport", country: "BD" },
  { code: "DXB", city: "Dubai", name: "Dubai Intl Airport", country: "AE" },
  { code: "SIN", city: "Singapore", name: "Changi Airport", country: "SG" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "TH" },
  { code: "KUL", city: "Kuala Lumpur", name: "KLIA Airport", country: "MY" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose Airport", country: "IN" },
  { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl Airport", country: "IN" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Intl Airport", country: "IN" },
  { code: "KTM", city: "Kathmandu", name: "Tribhuvan Intl Airport", country: "NP" },
  { code: "DOH", city: "Doha", name: "Hamad Intl Airport", country: "QA" },
  { code: "IST", city: "Istanbul", name: "Istanbul Airport", country: "TR" },
  { code: "JED", city: "Jeddah", name: "King Abdulaziz Intl Airport", country: "SA" },
  { code: "MLE", city: "Malé", name: "Velana Intl Airport", country: "MV" },
  { code: "LHR", city: "London", name: "Heathrow Airport", country: "GB" },
  { code: "JFK", city: "New York", name: "John F. Kennedy Intl Airport", country: "US" },
  { code: "MED", city: "Madinah", name: "Prince Mohammad Airport", country: "SA" },
  { code: "CMB", city: "Colombo", name: "Bandaranaike Intl Airport", country: "LK" },
  { code: "HKG", city: "Hong Kong", name: "Hong Kong Intl Airport", country: "HK" },
  { code: "MAA", city: "Chennai", name: "Chennai Intl Airport", country: "IN" },
  { code: "GZA", city: "Guangzhou", name: "Baiyun Intl Airport", country: "CN" },
];

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
    ? list.filter(a =>
        a.city.toLowerCase().includes(query.toLowerCase()) ||
        a.code.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
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
            placeholder={placeholder || "Type city or airport code..."}
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
                <div className="text-sm font-semibold truncate">{a.city}</div>
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

  const scopedAirports = AIRPORTS.filter(a =>
    flightScope === "domestic" ? a.country === "BD" : true
  );

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
    setFromAirport(prev => {
      const oldFrom = prev;
      setToAirport(oldFrom);
      return toAirport;
    });
  }, [toAirport]);

  // ====== SEARCH HANDLERS ======
  const handleFlightSearch = () => {
    if (!fromAirport || !toAirport) return;
    const params = new URLSearchParams({
      from: fromAirport.code, to: toAirport.code, tripType,
      adults: String(passengers.adults), children: String(passengers.children), infants: String(passengers.infants),
      cabin: cabinClass, fare: fareType,
    });
    if (departDate) params.set('depart', format(departDate, 'yyyy-MM-dd'));
    if (returnDate && tripType === 'roundtrip') params.set('return', format(returnDate, 'yyyy-MM-dd'));
    navigate(`/flights?${params.toString()}`);
  };

  const handleHotelSearch = () => {
    const params = new URLSearchParams({ destination: hotelCity });
    if (checkIn) params.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
    params.set('adults', String(hotelGuests.adults));
    params.set('children', String(hotelGuests.children));
    params.set('rooms', String(hotelRooms));
    navigate(`/hotels?${params.toString()}`);
  };

  const handleVisaSearch = () => {
    const country = VISA_COUNTRIES.find(c => c.code === visaCountry);
    const params = new URLSearchParams({
      country: country?.name || visaCountry,
      type: visaType,
      travellers: String(visaTravellers),
    });
    if (visaDate) params.set('date', format(visaDate, 'yyyy-MM-dd'));
    if (visaReturnDate) params.set('return', format(visaReturnDate, 'yyyy-MM-dd'));
    navigate(`/visa?${params.toString()}`);
  };

  const handleHolidaySearch = () => {
    const params = new URLSearchParams({ destination: holidayDest });
    if (travelDate) params.set('date', format(travelDate, 'yyyy-MM-dd'));
    navigate(`/holidays?${params.toString()}`);
  };

  const handleMedicalSearch = () => {
    const params = new URLSearchParams();
    if (medicalCountry) params.set('country', medicalCountry);
    if (treatmentType) params.set('treatment', treatmentType);
    if (medicalDate) params.set('date', format(medicalDate, 'yyyy-MM-dd'));
    params.set('patients', String(medicalPatients));
    navigate(`/medical?${params.toString()}`);
  };

  const handleCarSearch = () => {
    const params = new URLSearchParams({ pickup: pickupCity, dropoff: dropoffCity });
    if (pickupDate) params.set('pickupDate', format(pickupDate, 'yyyy-MM-dd'));
    if (dropoffDate) params.set('dropoffDate', format(dropoffDate, 'yyyy-MM-dd'));
    navigate(`/cars?${params.toString()}`);
  };

  const handleEsimSearch = () => {
    const params = new URLSearchParams({ country: esimCountry, plan: esimPlan });
    if (esimDate) params.set('activation', format(esimDate, 'yyyy-MM-dd'));
    navigate(`/esim?${params.toString()}`);
  };

  const handleRecharge = () => {
    const params = new URLSearchParams();
    if (rechargeOperator) params.set('operator', rechargeOperator);
    if (rechargeNumber) params.set('number', rechargeNumber);
    if (rechargeAmount) params.set('amount', rechargeAmount);
    params.set('type', rechargeType);
    navigate(`/recharge?${params.toString()}`);
  };

  const handlePayBill = () => {
    const params = new URLSearchParams();
    if (billCategory) params.set('category', billCategory);
    if (billerName) params.set('biller', billerName);
    if (accountNumber) params.set('account', accountNumber);
    if (billAmount) params.set('amount', billAmount);
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-2xl bg-background shadow-sm">
          <div className="md:col-span-3 search-field border-b md:border-b-0 flex-col items-start">
            <AirportInput label="From" value={fromAirport} onChange={setFromAirport} placeholder="Type city or airport..." airports={scopedAirports} />
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
            <AirportInput label="To" value={toAirport} onChange={setToAirport} placeholder="Where to?" airports={scopedAirports} />
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
      {/* Tabs */}
      <div className="flex items-center gap-0 px-2 sm:px-3 pt-2 sm:pt-3 overflow-x-auto scrollbar-none border-b border-border/40 -webkit-overflow-scrolling-touch">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`search-tab whitespace-nowrap shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm ${
              activeTab === tab.id ? "search-tab-active" : ""
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchWidget;
