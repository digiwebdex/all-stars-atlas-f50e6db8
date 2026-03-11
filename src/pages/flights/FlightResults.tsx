import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Plane, Clock, ArrowRight, Filter, X, Luggage,
  SlidersHorizontal, ChevronDown, ChevronUp, Shield, Timer,
  CircleDot, Zap, TrendingUp, Check, Info, FileText,
} from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useFlightSearch } from "@/hooks/useApiData";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import DataLoader from "@/components/DataLoader";
import { AIRPORTS } from "@/lib/airports";

/* ─── Airline logo — dynamic CDN, no hardcoded map ─── */
function getAirlineLogo(code?: string): string | null {
  if (!code) return null;
  return `https://images.kiwi.com/airlines/64/${code}.png`;
}

/* ─── Airport names — from airports.ts registry (no hardcoded map) ─── */
const AIRPORT_NAME_MAP = new Map(AIRPORTS.map(a => [a.code, a.name]));
function getAirportName(code: string): string {
  return AIRPORT_NAME_MAP.get(code) || `${code} Airport`;
}

function formatTime(datetime?: string): string {
  if (!datetime) return "--:--";
  try { const d = new Date(datetime); return isNaN(d.getTime()) ? datetime : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return datetime; }
}

function formatDate(datetime?: string): string {
  if (!datetime) return "";
  try { const d = new Date(datetime); return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "2-digit" }); } catch { return ""; }
}

function formatShortDate(datetime?: string): string {
  if (!datetime) return "";
  try { const d = new Date(datetime); return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", weekday: "short" }); } catch { return ""; }
}

function isNextDay(depart?: string, arrive?: string): boolean {
  if (!depart || !arrive) return false;
  return new Date(arrive).getDate() !== new Date(depart).getDate();
}

/* ─── Filter panel ─── */
const FilterPanel = ({
  priceRange, setPriceRange, maxPrice,
  airlines, selectedAirlines, toggleAirline,
  stopsFilter, setStopsFilter,
  departTimeRange, setDepartTimeRange,
  onReset,
}: {
  priceRange: number[]; setPriceRange: (v: number[]) => void; maxPrice: number;
  airlines: string[]; selectedAirlines: string[]; toggleAirline: (a: string) => void;
  stopsFilter: string; setStopsFilter: (v: string) => void;
  departTimeRange: number[]; setDepartTimeRange: (v: number[]) => void;
  onReset: () => void;
}) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Stops</h4>
      <div className="flex gap-1.5 flex-wrap">
        {[{ key: "all", label: "Any" }, { key: "0", label: "Non-stop" }, { key: "1", label: "1 Stop" }, { key: "2+", label: "2+ Stops" }].map((opt) => (
          <button key={opt.key} onClick={() => setStopsFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              stopsFilter === opt.key ? "bg-accent text-accent-foreground border-accent" : "bg-card text-muted-foreground border-border hover:border-foreground/30"
            }`}>{opt.label}</button>
        ))}
      </div>
    </div>
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Price Range</h4>
      <Slider min={0} max={maxPrice} step={100} value={priceRange} onValueChange={setPriceRange} className="mb-2" />
      <div className="flex justify-between text-xs text-muted-foreground"><span>৳{priceRange[0].toLocaleString()}</span><span>৳{priceRange[1].toLocaleString()}</span></div>
    </div>
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Departure Time</h4>
      <Slider min={0} max={24} step={1} value={departTimeRange} onValueChange={setDepartTimeRange} className="mb-2" />
      <div className="flex justify-between text-xs text-muted-foreground"><span>{departTimeRange[0]}:00</span><span>{departTimeRange[1]}:00</span></div>
    </div>
    {airlines.length > 0 && (
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Airlines</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {airlines.map((a: string) => (
            <label key={a} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox checked={selectedAirlines.includes(a)} onCheckedChange={() => toggleAirline(a)} />
              <span className="text-xs font-medium group-hover:text-foreground text-muted-foreground transition-colors">{a}</span>
            </label>
          ))}
        </div>
      </div>
    )}
  </div>
);

/* ─── Flight Card — exact reference design ─── */
const FlightCard = ({
  flight, cheapest, isExpanded, onToggleExpand,
  selectionMode = false, isSelected = false, onSelect,
}: {
  flight: any; cheapest: number; isExpanded: boolean; onToggleExpand: () => void;
  selectionMode?: boolean; isSelected?: boolean; onSelect?: () => void;
}) => {
  const cardNavigate = useNavigate();
  const [cardSearchParams] = useSearchParams();
  const logo = getAirlineLogo(flight.airlineCode);
  const departTime = formatTime(flight.departureTime);
  const arriveTime = formatTime(flight.arrivalTime);
  const departDateStr = formatShortDate(flight.departureTime);
  const arriveDateStr = formatShortDate(flight.arrivalTime);
  const fromCode = flight.origin || "";
  const toCode = flight.destination || "";
  const flightNo = flight.flightNumber || "";
  const cabin = flight.cabinClass || "Economy";
  const bookingClass = flight.bookingClass || "";
  const availableSeats = flight.availableSeats ?? null;
  const duration = flight.duration || "";
  const stops = flight.stops ?? 0;
  const price = flight.price ?? 0;
  const baseFare = flight.baseFare ?? price;
  const taxes = flight.taxes ?? 0;
  const refundable = flight.refundable ?? false;
  const nextDay = isNextDay(flight.departureTime, flight.arrivalTime);
  const legs = flight.legs || [];
  const stopCodes = flight.stopCodes || [];
  const aircraft = flight.aircraft || legs[0]?.aircraft || "";
  const source = flight.source || "db";
  const baggage = flight.baggage || null;
  const handBaggage = flight.handBaggage || null;
  const cancellationPolicy = flight.cancellationPolicy || null;
  const dateChangePolicy = flight.dateChangePolicy || null;
  const [activeDetailTab, setActiveDetailTab] = useState("itinerary");

  const stopsLabel = stops === 0 ? "Non-Stop" : `${stops} Stop${stops > 1 ? "s" : ""}`;
  const cabinDisplay = bookingClass ? `${cabin} - ${bookingClass}` : cabin;

  return (
    <Card className={`overflow-hidden transition-all border ${isSelected ? "border-accent ring-2 ring-accent/20 shadow-lg" : isExpanded ? "border-accent/30 shadow-md" : "border-border hover:shadow-md"}`}>
      <CardContent className="p-0">
        {/* ── Main card row ── */}
        <div className="flex flex-col sm:flex-row">
          {/* Airline section */}
          <div className="flex items-center gap-3 p-3 sm:p-5 sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-border/50">
            <div className="flex flex-col items-center gap-1 shrink-0">
              {logo ? (
                <img src={logo} alt={flight.airline} className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center"><span class="text-xs font-bold text-muted-foreground">${(flight.airlineCode || "").toUpperCase()}</span></div>`; }} />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">{(flight.airlineCode || "").toUpperCase()}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-tight">{flight.airline}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{flightNo}</p>
              {availableSeats !== null && availableSeats <= 9 && (
                <p className="text-[10px] sm:text-[11px] font-bold text-orange-500 mt-0.5">{availableSeats} Seat{availableSeats !== 1 ? "s" : ""} Left</p>
              )}
            </div>
          </div>

          {/* Flight times section */}
          <div className="flex-1 flex items-center p-3 sm:p-5">
            <div className="flex-1 flex items-center gap-2 sm:gap-5">
              {/* Departure */}
              <div className="text-center shrink-0">
                <p className="text-lg sm:text-2xl font-black tracking-tight">{departTime}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5">{departDateStr}</p>
              </div>

              {/* Duration bar with plane icon */}
              <div className="flex-1 flex flex-col items-center gap-0.5 sm:gap-1 min-w-[60px] sm:min-w-[100px]">
                <div className="w-full relative">
                  <div className="w-full flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    <div className="flex-1 h-[1.5px] bg-border relative">
                      <Plane className="w-4 h-4 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      {stops > 0 && Array.from({ length: Math.min(stops, 3) }).map((_, i) => (
                        <div key={i} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-muted-foreground/50"
                          style={{ left: `${((i + 1) / (stops + 1)) * 100}%`, transform: "translate(-50%, -50%)" }} />
                      ))}
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{duration}</p>
                <p className={`text-[11px] font-semibold ${stops === 0 ? "text-foreground" : "text-warning"}`}>{stopsLabel}</p>
              </div>

              {/* Arrival */}
              <div className="text-center shrink-0">
                <p className="text-lg sm:text-2xl font-black tracking-tight">
                  {arriveTime}
                  {nextDay && <sup className="text-[8px] sm:text-[9px] text-destructive font-bold ml-0.5">+1</sup>}
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5">{arriveDateStr}</p>
              </div>
            </div>
          </div>

          {/* Price section */}
          <div className="flex items-center justify-between sm:justify-end gap-3 p-4 sm:p-5 sm:w-52 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/20">
            <div className="text-right min-w-0">
              <p className="text-xl sm:text-2xl font-black leading-none whitespace-nowrap">BDT {price.toLocaleString()} <ChevronDown className="w-3.5 h-3.5 inline text-muted-foreground" /></p>
              {price === cheapest && price > 0 && (
                <Badge className="bg-accent/10 text-accent border-0 text-[9px] font-bold mt-1">Cheapest</Badge>
              )}
            </div>
          </div>
        </div>

        {/* ── Info bar: Flight Details ▲ | Refundable  Book & Hold | View Prices ▼ ── */}
        <div className="flex items-center px-3 sm:px-5 py-2.5 bg-muted/30 border-t border-border/50">
          {/* Left: Flight Details toggle */}
          <button className="flex items-center gap-1 text-accent font-bold text-xs sm:text-sm hover:underline shrink-0" onClick={onToggleExpand}>
            Flight Details {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Center: Refundable + Book & Hold badges */}
          <div className="flex-1 flex items-center justify-center gap-3 sm:gap-5">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">{refundable ? "Refundable" : "Partially Refundable"}</span>
            {flight.airlineCode?.toUpperCase() !== "BG" && (
              <span className="text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">Book &amp; Hold</span>
            )}
          </div>

          {/* Right: View Prices / Select button */}
          <div className="shrink-0">
            {selectionMode ? (
              <Button size="sm" className="font-bold h-9 px-5 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={onSelect}>
                {isSelected ? <><Check className="w-3.5 h-3.5 mr-1" /> Selected</> : "Select Flight"}
              </Button>
            ) : (
              <Button size="sm" className="font-bold h-9 px-5 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => cardNavigate(`/flights/book?adults=${cardSearchParams.get("adults") || "1"}&children=${cardSearchParams.get("children") || "0"}&infants=${cardSearchParams.get("infants") || "0"}&cabin=${cardSearchParams.get("cabin") || "economy"}`, { state: { outboundFlight: flight } })}>
                View Prices <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Expanded detail panel ── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="border-t border-border">
                {/* Tab headers + Fare terms & policy link */}
                <div className="flex items-center border-b border-border bg-muted/20">
                  <div className="flex overflow-x-auto scrollbar-none">
                    {[
                      { key: "itinerary", label: "Flight Details" },
                      { key: "fare", label: "Fare Summary" },
                      { key: "baggage", label: "Baggage" },
                      { key: "cancellation", label: "Cancellation" },
                      { key: "datechange", label: "Date Change" },
                    ].map(tab => (
                      <button key={tab.key} onClick={() => setActiveDetailTab(tab.key)}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
                          activeDetailTab === tab.key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <span className="ml-auto pr-4 text-xs sm:text-sm text-accent font-medium flex items-center gap-1 shrink-0 cursor-pointer hover:underline">
                    <Info className="w-3.5 h-3.5" /> Fare terms &amp; policy
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  {/* ── Flight Details Tab — exact reference design ── */}
                  {activeDetailTab === "itinerary" && (
                    <div className="space-y-6">
                      {(legs.length > 0 ? legs : [{ origin: fromCode, destination: toCode, departureTime: flight.departureTime, arrivalTime: flight.arrivalTime, duration, durationMinutes: flight.durationMinutes, flightNumber: flightNo, airlineCode: flight.airlineCode, aircraft, originTerminal: "", destinationTerminal: "" }]).map((leg: any, i: number) => {
                        const legLogo = getAirlineLogo(leg.airlineCode || flight.airlineCode);
                        const legDepartDate = formatDate(leg.departureTime);
                        const legStopsLabel = stops === 0 ? "Non-Stop" : `${stops} Stop${stops > 1 ? "s" : ""}`;
                        const legOrigin = leg.origin || fromCode;
                        const legDest = leg.destination || toCode;

                        return (
                          <div key={i} className="space-y-4">
                            {/* Route header: DAC ✈ CXB | 14 Apr, Tue | Non-Stop */}
                            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-semibold text-foreground border-b border-border/50 pb-3">
                              <span className="font-bold">{legOrigin}</span>
                              <Plane className="w-4 h-4 text-muted-foreground" />
                              <span className="font-bold">{legDest}</span>
                              <span className="text-muted-foreground font-normal">|</span>
                              <span className="text-muted-foreground font-normal text-sm">{legDepartDate}</span>
                              <span className="text-muted-foreground font-normal">|</span>
                              <span className="font-semibold text-sm">{legStopsLabel}</span>
                            </div>

                            {/* Airline detail line: logo | AirAstra | 2A 445 | AT7 | Economy - S | 5 Seats Left */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                              {legLogo && <img src={legLogo} alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                              <span className="text-sm font-semibold">{flight.airline}</span>
                              <span className="text-sm text-muted-foreground">{leg.flightNumber || flightNo}</span>
                              <span className="text-muted-foreground text-sm">|</span>
                              {(leg.aircraft || aircraft) && (
                                <>
                                  <span className="text-sm text-muted-foreground">{leg.aircraft || aircraft}</span>
                                  <span className="text-muted-foreground text-sm">|</span>
                                </>
                              )}
                              <span className="text-sm font-medium">{cabinDisplay}</span>
                              {availableSeats !== null && availableSeats <= 9 && (
                                <span className="text-sm text-orange-500 font-bold">{availableSeats} Seat{availableSeats !== 1 ? "s" : ""} Left</span>
                              )}
                            </div>

                            {/* Timeline arc visual — matching reference exactly */}
                            <div className="flex items-start justify-between pt-3 pb-2">
                              {/* Departure info */}
                              <div className="text-left shrink-0 max-w-[38%]">
                                <p className="text-xl sm:text-2xl font-black">{formatTime(leg.departureTime)}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{legDepartDate}</p>
                                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                                  {leg.originTerminal ? `Terminal: ${leg.originTerminal}, ` : ""}{getAirportName(legOrigin)} ({legOrigin})
                                </p>
                              </div>

                              {/* Arc */}
                              <div className="flex-1 flex flex-col items-center justify-center pt-1 px-3 sm:px-8">
                                <div className="w-full relative h-12">
                                  <svg className="w-full h-full" viewBox="0 0 200 45" preserveAspectRatio="none">
                                    <path d="M 8 38 Q 100 2 192 38" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground/40" strokeDasharray="5 4" />
                                    <circle cx="8" cy="38" r="3" className="fill-muted-foreground/60" />
                                    <circle cx="192" cy="38" r="3" className="fill-muted-foreground/60" />
                                  </svg>
                                  <Plane className="w-4 h-4 text-muted-foreground absolute top-1 left-1/2 -translate-x-1/2 rotate-90" />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium -mt-1">{leg.duration || duration}</p>
                              </div>

                              {/* Arrival info */}
                              <div className="text-right shrink-0 max-w-[38%]">
                                <p className="text-xl sm:text-2xl font-black">{formatTime(leg.arrivalTime)}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(leg.arrivalTime)}</p>
                                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                                  {leg.destinationTerminal ? `Terminal: ${leg.destinationTerminal}, ` : ""}{getAirportName(legDest)} ({legDest})
                                </p>
                              </div>
                            </div>

                            {/* Transit between legs */}
                            {i < (legs.length > 0 ? legs.length : 1) - 1 && legs.length > 1 && (
                              <div className="flex items-center gap-2 py-2 px-4 my-1">
                                <div className="flex-1 h-px bg-warning/30" />
                                <div className="flex items-center gap-1.5 text-xs text-warning font-semibold bg-warning/10 px-3 py-1 rounded-full">
                                  <Clock className="w-3 h-3" />
                                  {(() => {
                                    if (legs[i + 1]?.departureTime && leg.arrivalTime) {
                                      const layoverMin = Math.round((new Date(legs[i + 1].departureTime).getTime() - new Date(leg.arrivalTime).getTime()) / 60000);
                                      const h = Math.floor(layoverMin / 60);
                                      const m = layoverMin % 60;
                                      return `Transit Time: ${h > 0 ? `${h}H ` : ""}${m}M`;
                                    }
                                    return "Transit";
                                  })()}
                                </div>
                                <div className="flex-1 h-px bg-warning/30" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fare Summary Tab — real API data */}
                  {activeDetailTab === "fare" && (
                    <div className="max-w-md space-y-2 text-sm">
                      <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Base Fare</span><span className="font-semibold">৳{baseFare.toLocaleString()}</span></div>
                      <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Taxes & Fees</span><span className="font-semibold">{taxes > 0 ? `৳${taxes.toLocaleString()}` : "Included"}</span></div>
                      <Separator />
                      <div className="flex justify-between py-1.5 text-base"><span className="font-bold">Total Fare</span><span className="font-black text-accent">৳{price.toLocaleString()}</span></div>
                      <p className="text-[11px] text-muted-foreground mt-2"><Info className="w-3 h-3 inline mr-1" />{refundable ? "This fare is refundable. Cancellation charges may apply." : "This fare is partially refundable. Change and cancellation fees apply."}</p>
                    </div>
                  )}

                  {/* Baggage Tab — real API data */}
                  {activeDetailTab === "baggage" && (
                    <div className="max-w-md space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-xl border border-accent/10"><Luggage className="w-5 h-5 text-accent" /><div><p className="text-sm font-semibold">Checked Baggage</p><p className="text-xs text-muted-foreground">{baggage ? `${baggage} per passenger` : "As per airline policy"}</p></div></div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"><Luggage className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm font-semibold">Hand Baggage</p><p className="text-xs text-muted-foreground">{handBaggage ? `${handBaggage} per passenger` : "As per airline policy"}</p></div></div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"><span className="text-sm font-medium">Cabin Class</span><span className="text-sm text-muted-foreground ml-auto">{cabinDisplay}</span></div>
                    </div>
                  )}

                  {/* Cancellation Tab — real API data */}
                  {activeDetailTab === "cancellation" && (
                    <div className="max-w-md space-y-3">
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${refundable ? "bg-accent/5 border-accent/20" : "bg-warning/5 border-warning/20"}`}>
                        <Shield className={`w-5 h-5 ${refundable ? "text-accent" : "text-warning"}`} />
                        <div><p className="text-sm font-semibold">{refundable ? "Refundable Fare" : "Non-Refundable Fare"}</p><p className="text-xs text-muted-foreground">{refundable ? "Full refund available (cancellation fees may apply)" : "Cancellation charges apply as per airline policy"}</p></div>
                      </div>
                      {cancellationPolicy?.ruleText ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cancellationPolicy.ruleText}</p>
                      ) : (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-1.5 border-b border-border/50"><span className="text-muted-foreground">Before Departure</span><span className="font-semibold">{cancellationPolicy?.beforeDeparture != null ? `৳${Number(cancellationPolicy.beforeDeparture).toLocaleString()} fee` : refundable ? "Refundable (fees apply)" : "As per airline policy"}</span></div>
                          <div className="flex justify-between py-1.5 border-b border-border/50"><span className="text-muted-foreground">After Departure</span><span className="font-semibold text-destructive">{cancellationPolicy?.afterDeparture || "Non-refundable"}</span></div>
                          <div className="flex justify-between py-1.5"><span className="text-muted-foreground">No Show</span><span className="font-semibold text-destructive">{cancellationPolicy?.noShow || "Non-refundable"}</span></div>
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground"><Info className="w-3 h-3 inline mr-1" />Cancellation charges are determined by the airline and may vary. Contact support for exact amounts.</p>
                    </div>
                  )}

                  {/* Date Change Tab — real API data */}
                  {activeDetailTab === "datechange" && (
                    <div className="max-w-md space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border"><Clock className="w-5 h-5 text-muted-foreground" /><div><p className="text-sm font-semibold">Date Change Policy</p><p className="text-xs text-muted-foreground">{dateChangePolicy?.ruleText || "Subject to airline fare rules and availability"}</p></div></div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-border/50"><span className="text-muted-foreground">Date Change</span><span className="font-semibold">{dateChangePolicy?.changeAllowed !== false ? (dateChangePolicy?.changeFee != null ? `৳${Number(dateChangePolicy.changeFee).toLocaleString()} fee` : "Allowed (fees apply)") : "Not allowed"}</span></div>
                        <div className="flex justify-between py-1.5 border-b border-border/50"><span className="text-muted-foreground">Route Change</span><span className="font-semibold text-destructive">Not allowed</span></div>
                        <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Fare Difference</span><span className="font-semibold">Applicable</span></div>
                      </div>
                      <p className="text-[11px] text-muted-foreground"><Info className="w-3 h-3 inline mr-1" />Date changes are subject to seat availability and fare difference.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

/* ─── Sort tabs ─── */
const SORT_OPTIONS = [
  { value: "best", label: "Best", icon: Zap },
  { value: "cheapest", label: "Cheapest", icon: TrendingUp },
  { value: "earliest", label: "Earliest", icon: Clock },
  { value: "fastest", label: "Fastest", icon: Timer },
];

function sortFlights(flights: any[], sortBy: string) {
  const sorted = [...flights];
  switch (sortBy) {
    case "cheapest": return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "earliest": return sorted.sort((a, b) => {
      const da = a.departureTime ? new Date(a.departureTime).getTime() : Infinity;
      const db = b.departureTime ? new Date(b.departureTime).getTime() : Infinity;
      return da - db;
    });
    case "fastest": return sorted.sort((a, b) => (a.durationMinutes || Infinity) - (b.durationMinutes || Infinity));
    case "best": default:
      return sorted.sort((a, b) => {
        const scoreA = (a.price || 0) * 0.5 + (a.durationMinutes || 0) * 30 + (a.stops || 0) * 3000;
        const scoreB = (b.price || 0) * 0.5 + (b.durationMinutes || 0) * 30 + (b.stops || 0) * 3000;
        return scoreA - scoreB;
      });
  }
}

/* ─── Main page ─── */
const FlightResults = () => {
  const { data: page } = useCmsPageContent("/flights");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("best");
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [stopsFilter, setStopsFilter] = useState("all");
  const [departTimeRange, setDepartTimeRange] = useState([0, 24]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);
  const [selectedOutbound, setSelectedOutbound] = useState<any>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  const fromCode = searchParams.get("from") || "";
  const toCode = searchParams.get("to") || "";
  const departDate = searchParams.get("depart") || "";
  const returnDate = searchParams.get("return") || "";
  const adults = searchParams.get("adults") || "1";
  const children = searchParams.get("children") || "0";
  const infants = searchParams.get("infants") || "0";
  const cabinClass = searchParams.get("cabin") || searchParams.get("class") || "";
  const totalPax = parseInt(adults) + parseInt(children) + parseInt(infants);
  const hasRequiredParams = !!fromCode && !!toCode && !!departDate;
  const isRoundTrip = !!returnDate;

  const params = hasRequiredParams ? {
    from: fromCode, to: toCode, date: departDate,
    return: returnDate || undefined, adults,
    children: children !== "0" ? children : undefined,
    infants: infants !== "0" ? infants : undefined,
    cabinClass: cabinClass || undefined,
  } : undefined;

  const { data: rawData, isLoading, error, refetch } = useFlightSearch(params);
  const apiData = (rawData as any) || {};
  const flights = apiData.data || apiData.flights || [];
  const hasDirections = flights.some((f: any) => f.direction === "return");

  const outboundFlights = useMemo(() => flights.filter((f: any) => f.direction !== "return"), [flights]);
  const returnFlights = useMemo(() => flights.filter((f: any) => f.direction === "return"), [flights]);

  const airlines = useMemo(() => apiData.airlines || [...new Set(flights.map((f: any) => f.airline).filter(Boolean))], [apiData.airlines, flights]);
  const cheapest = useMemo(() => apiData.cheapest || (flights.length > 0 ? Math.min(...flights.map((f: any) => f.price || Infinity)) : 0), [apiData.cheapest, flights]);
  const maxPrice = useMemo(() => flights.length > 0 ? Math.max(...flights.map((f: any) => f.price || 0)) : 200000, [flights]);
  const minPrice = useMemo(() => flights.length > 0 ? Math.min(...flights.map((f: any) => f.price || 0)) : 0, [flights]);

  useEffect(() => { if (flights.length > 0) setPriceRange([Math.max(0, minPrice - 100), maxPrice]); }, [minPrice, maxPrice, flights.length]);

  const toggleAirline = useCallback((a: string) => setSelectedAirlines(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]), []);

  const applyFilters = useCallback((list: any[]) => {
    return list.filter((f: any) => {
      if (selectedAirlines.length > 0 && !selectedAirlines.includes(f.airline)) return false;
      if (f.price < priceRange[0] || f.price > priceRange[1]) return false;
      if (stopsFilter !== "all") {
        const stops = f.stops ?? 0;
        if (stopsFilter === "0" && stops !== 0) return false;
        if (stopsFilter === "1" && stops !== 1) return false;
        if (stopsFilter === "2+" && stops < 2) return false;
      }
      if (f.departureTime) {
        const hour = new Date(f.departureTime).getHours();
        if (hour < departTimeRange[0] || hour > departTimeRange[1]) return false;
      }
      return true;
    });
  }, [selectedAirlines, priceRange, stopsFilter, departTimeRange]);

  const filteredOutbound = useMemo(() => sortFlights(applyFilters(outboundFlights), sortBy), [outboundFlights, sortBy, applyFilters]);
  const filteredReturn = useMemo(() => sortFlights(applyFilters(returnFlights), sortBy), [returnFlights, sortBy, applyFilters]);
  const filteredAll = useMemo(() => sortFlights(applyFilters(flights), sortBy), [flights, sortBy, applyFilters]);

  const resetFilters = useCallback(() => { setSelectedAirlines([]); setPriceRange([0, maxPrice]); setStopsFilter("all"); setDepartTimeRange([0, 24]); }, [maxPrice]);

  const sources = apiData.sources || {};

  const handleBookRoundTrip = () => {
    if (!selectedOutbound || !selectedReturn) return;
    navigate(`/flights/book?roundTrip=true&adults=${adults}&children=${children}&infants=${infants}&cabin=${cabinClass || "economy"}`, { state: { outboundFlight: selectedOutbound, returnFlight: selectedReturn } });
  };

  const roundTripTotal = (selectedOutbound?.price || 0) + (selectedReturn?.price || 0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Plane className="w-5 h-5 text-accent" /> {fromCode || "—"} <ArrowRight className="w-5 h-5" /> {toCode || "—"}
                {isRoundTrip && <Badge className="bg-accent/10 text-accent border-0 text-[10px] ml-2">Round Trip</Badge>}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {departDate}{returnDate ? ` – ${returnDate}` : ""} · {totalPax} Passenger(s){cabinClass ? ` · ${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}` : ""} · <strong className="text-foreground">{flights.length} flights found</strong>
                {sources.tti > 0 && <span className="text-muted-foreground ml-1">({sources.tti} Air Astra)</span>}
                {sources.sabre > 0 && <span className="text-muted-foreground ml-1">({sources.sabre} Sabre)</span>}
                {sources.flyhub > 0 && <span className="text-muted-foreground ml-1">({sources.flyhub} FlyHub)</span>}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">Modify Search</Link>
              </Button>
              {cheapest > 0 && (
                <Badge className="bg-accent/10 text-accent border-0 font-semibold h-9 px-3">
                  From ৳{cheapest.toLocaleString()}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!hasRequiredParams ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Plane className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-lg font-bold mb-2">Search for Flights</h2>
              <p className="text-muted-foreground mb-4">Use the search widget to find flights with your travel dates.</p>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild><Link to="/">Search Flights</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-6">
            {/* Sidebar filters */}
            <aside className="hidden lg:block w-64 shrink-0">
              <Card className="sticky top-28">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
                    <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={resetFilters}>Reset</Button>
                  </div>
                  <FilterPanel priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice}
                    airlines={airlines} selectedAirlines={selectedAirlines} toggleAirline={toggleAirline}
                    stopsFilter={stopsFilter} setStopsFilter={setStopsFilter}
                    departTimeRange={departTimeRange} setDepartTimeRange={setDepartTimeRange} onReset={resetFilters} />
                </CardContent>
              </Card>
            </aside>

            {/* Main content */}
            <div className="flex-1 space-y-3">
              {/* Sort tabs */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1 overflow-x-auto scrollbar-none">
                  {SORT_OPTIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button key={s.value} onClick={() => setSortBy(s.value)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                          sortBy === s.value
                            ? "bg-accent text-accent-foreground shadow-sm"
                            : "bg-card border border-border text-muted-foreground hover:text-foreground"
                        }`}>
                        <Icon className="w-3.5 h-3.5" />{s.label}
                      </button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" className="lg:hidden shrink-0" onClick={() => setShowFilters(true)}>
                  <Filter className="w-4 h-4 mr-1" /> Filters
                </Button>
              </div>

              {/* Results */}
              <DataLoader isLoading={isLoading} error={error} skeleton="cards" retry={refetch}>
                {isRoundTrip && hasDirections ? (
                  <div className="space-y-6">
                    {/* Outbound */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 bg-accent/10 text-accent rounded-lg px-3 py-1.5">
                          <Plane className="w-4 h-4" /><span className="text-sm font-bold">Outbound</span>
                        </div>
                        <span className="text-sm font-medium">{fromCode} → {toCode}</span>
                        <span className="text-xs text-muted-foreground">{departDate} · {filteredOutbound.length} flights</span>
                        {selectedOutbound && (
                          <Badge className="bg-accent/10 text-accent border-0 text-xs ml-auto">
                            <Check className="w-3 h-3 mr-1" /> {formatTime(selectedOutbound.departureTime)} – {formatTime(selectedOutbound.arrivalTime)} · ৳{selectedOutbound.price?.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-3">
                        {filteredOutbound.length === 0 ? (
                          <Card><CardContent className="py-8 text-center text-muted-foreground"><p>No outbound flights found</p></CardContent></Card>
                        ) : filteredOutbound.map((flight: any) => (
                          <FlightCard key={flight.id} flight={flight} cheapest={cheapest}
                            isExpanded={expandedFlight === flight.id} onToggleExpand={() => setExpandedFlight(expandedFlight === flight.id ? null : flight.id)}
                            selectionMode isSelected={selectedOutbound?.id === flight.id}
                            onSelect={() => setSelectedOutbound(selectedOutbound?.id === flight.id ? null : flight)} />
                        ))}
                      </div>
                    </div>

                    {/* Return */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2 bg-warning/10 text-warning rounded-lg px-3 py-1.5">
                          <Plane className="w-4 h-4 rotate-180" /><span className="text-sm font-bold">Return</span>
                        </div>
                        <span className="text-sm font-medium">{toCode} → {fromCode}</span>
                        <span className="text-xs text-muted-foreground">{returnDate} · {filteredReturn.length} flights</span>
                        {selectedReturn && (
                          <Badge className="bg-accent/10 text-accent border-0 text-xs ml-auto">
                            <Check className="w-3 h-3 mr-1" /> {formatTime(selectedReturn.departureTime)} – {formatTime(selectedReturn.arrivalTime)} · ৳{selectedReturn.price?.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-3">
                        {filteredReturn.length === 0 ? (
                          <Card><CardContent className="py-8 text-center text-muted-foreground"><p>No return flights found</p></CardContent></Card>
                        ) : filteredReturn.map((flight: any) => (
                          <FlightCard key={flight.id} flight={flight} cheapest={cheapest}
                            isExpanded={expandedFlight === flight.id} onToggleExpand={() => setExpandedFlight(expandedFlight === flight.id ? null : flight.id)}
                            selectionMode isSelected={selectedReturn?.id === flight.id}
                            onSelect={() => setSelectedReturn(selectedReturn?.id === flight.id ? null : flight)} />
                        ))}
                      </div>
                    </div>

                    {/* Sticky booking bar */}
                    <AnimatePresence>
                      {(selectedOutbound || selectedReturn) && (
                        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                          className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t-2 border-accent shadow-2xl">
                          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6 overflow-x-auto">
                              {selectedOutbound && (
                                <div className="flex items-center gap-2 shrink-0"><Plane className="w-4 h-4 text-accent" />
                                  <div><p className="text-xs text-muted-foreground">Outbound</p>
                                    <p className="text-sm font-bold">{selectedOutbound.origin} → {selectedOutbound.destination} · ৳{selectedOutbound.price?.toLocaleString()}</p></div>
                                </div>
                              )}
                              {selectedReturn && (
                                <div className="flex items-center gap-2 shrink-0"><Plane className="w-4 h-4 text-warning rotate-180" />
                                  <div><p className="text-xs text-muted-foreground">Return</p>
                                    <p className="text-sm font-bold">{selectedReturn.origin} → {selectedReturn.destination} · ৳{selectedReturn.price?.toLocaleString()}</p></div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-black text-accent">৳{roundTripTotal.toLocaleString()}</p></div>
                              <Button size="lg" className="font-bold shadow-lg px-6 bg-accent text-accent-foreground hover:bg-accent/90"
                                disabled={!selectedOutbound || !selectedReturn} onClick={handleBookRoundTrip}>
                                {!selectedOutbound ? "Select Outbound" : !selectedReturn ? "Select Return" : "Book Round Trip"}
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* ONE-WAY */
                  <>
                    {filteredAll.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                          <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="font-semibold">No flights found</p>
                          <p className="text-sm mt-1 max-w-md mx-auto">
                            {selectedAirlines.length > 0 || stopsFilter !== "all" ? "Try adjusting your filters" : "No flights available for this route."}
                          </p>
                          {selectedAirlines.length > 0 || stopsFilter !== "all" ? (
                            <Button variant="outline" size="sm" className="mt-3" onClick={resetFilters}>Clear Filters</Button>
                          ) : (
                            <Button variant="outline" size="sm" className="mt-3" asChild><Link to="/">Try a Different Route</Link></Button>
                          )}
                        </CardContent>
                      </Card>
                    ) : filteredAll.map((flight: any) => (
                      <FlightCard key={flight.id} flight={flight} cheapest={cheapest}
                        isExpanded={expandedFlight === flight.id} onToggleExpand={() => setExpandedFlight(expandedFlight === flight.id ? null : flight.id)} />
                    ))}
                  </>
                )}
              </DataLoader>
            </div>
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowFilters(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-card overflow-y-auto p-5 z-50 lg:hidden shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
              </div>
              <FilterPanel priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice}
                airlines={airlines} selectedAirlines={selectedAirlines} toggleAirline={toggleAirline}
                stopsFilter={stopsFilter} setStopsFilter={setStopsFilter}
                departTimeRange={departTimeRange} setDepartTimeRange={setDepartTimeRange} onReset={resetFilters} />
              <Button className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setShowFilters(false)}>Apply Filters</Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlightResults;
