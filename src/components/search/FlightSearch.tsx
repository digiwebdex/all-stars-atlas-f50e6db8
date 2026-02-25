import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  PlaneTakeoff, PlaneLanding, CalendarDays, Users, ArrowLeftRight, Search, ChevronDown
} from "lucide-react";

const FlightSearch = () => {
  const [tripType, setTripType] = useState("roundtrip");
  const [departDate, setDepartDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState("economy");
  const [fareType, setFareType] = useState("regular");

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  return (
    <div className="space-y-5">
      {/* Trip Type + Fare Type Row */}
      <div className="flex flex-wrap items-center gap-4">
        <RadioGroup value={tripType} onValueChange={setTripType} className="flex gap-3">
          {[
            { value: "oneway", label: "One Way" },
            { value: "roundtrip", label: "Round Trip" },
            { value: "multicity", label: "Multi City" },
          ].map((t) => (
            <Label key={t.value} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-foreground/80">
              <RadioGroupItem value={t.value} />
              {t.label}
            </Label>
          ))}
        </RadioGroup>

        <div className="ml-auto flex gap-2">
          {["Regular", "Student", "Umrah"].map((f) => (
            <button
              key={f}
              onClick={() => setFareType(f.toLowerCase())}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                fareType === f.toLowerCase()
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Search Fields */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* From */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">From</Label>
          <div className="relative">
            <PlaneTakeoff className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input placeholder="Dhaka (DAC)" className="pl-10 h-12 bg-background" />
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center">
          <button className="w-10 h-10 rounded-full border-2 border-primary/20 hover:border-primary flex items-center justify-center text-primary transition-colors hover:bg-primary/5">
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* To */}
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">To</Label>
          <div className="relative">
            <PlaneLanding className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input placeholder="Cox's Bazar (CXB)" className="pl-10 h-12 bg-background" />
          </div>
        </div>

        {/* Depart */}
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Departure</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-12 justify-start text-left font-normal bg-background">
                <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                {departDate ? format(departDate, "dd MMM, yy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={departDate} onSelect={setDepartDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Return */}
        {tripType === "roundtrip" && (
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Return</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-12 justify-start text-left font-normal bg-background">
                  <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                  {returnDate ? format(returnDate, "dd MMM, yy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Passengers & Class (collapses into remaining space) */}
        <div className={`${tripType === "roundtrip" ? "md:col-span-1" : "md:col-span-3"} space-y-1.5`}>
          <Label className="text-xs text-muted-foreground">Travellers</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-12 justify-start text-left font-normal bg-background">
                <Users className="w-4 h-4 mr-2 text-primary" />
                <span className="truncate">{totalPassengers} Pax</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                {[
                  { key: "adults" as const, label: "Adults", desc: "12+ years" },
                  { key: "children" as const, label: "Children", desc: "2-11 years" },
                  { key: "infants" as const, label: "Infants", desc: "Under 2" },
                ].map((p) => (
                  <div key={p.key} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPassengers((prev) => ({
                          ...prev,
                          [p.key]: Math.max(p.key === "adults" ? 1 : 0, prev[p.key] - 1),
                        }))}
                      >
                        -
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{passengers[p.key]}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPassengers((prev) => ({
                          ...prev,
                          [p.key]: prev[p.key] + 1,
                        }))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-border">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Cabin Class</Label>
                  <Select value={cabinClass} onValueChange={setCabinClass}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Economy", "Premium Economy", "Business", "First"].map((c) => (
                        <SelectItem key={c} value={c.toLowerCase().replace(" ", "-")}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex justify-end">
        <Button size="lg" className="h-12 px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold shadow-lg">
          <Search className="w-4 h-4 mr-2" />
          Search Flights
        </Button>
      </div>
    </div>
  );
};

export default FlightSearch;
