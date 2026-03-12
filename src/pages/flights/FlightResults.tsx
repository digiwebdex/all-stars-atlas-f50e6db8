import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

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

/* ─── Leg Mini — compact leg display for grouped cards ─── */
const LegMini = ({ flight, label, labelColor }: { flight: any; label: string; labelColor: string }) => {
  const logo = getAirlineLogo(flight.airlineCode);
  const departTime = formatTime(flight.departureTime);
  const arriveTime = formatTime(flight.arrivalTime);
  const duration = flight.duration || "";
  const stops = flight.stops ?? 0;
  const stopsLabel = stops === 0 ? "Non-Stop" : `${stops} Stop${stops > 1 ? "s" : ""}`;
  const nextDay = isNextDay(flight.departureTime, flight.arrivalTime);
  const fromCode = flight.origin || "";
  const toCode = flight.destination || "";

  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1.5">
        <span className={`font-semibold ${labelColor}`}>{label}:</span>{" "}
        {flight.airline}, {formatShortDate(flight.departureTime)}
      </p>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Origin */}
        <div className="text-center shrink-0">
          <p className="text-xs sm:text-[10px] font-medium text-muted-foreground">{fromCode}</p>
          <p className="text-base sm:text-xl font-black tracking-tight">{departTime}</p>
        </div>

        {/* Duration bar */}
        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-[50px]">
          <div className="w-full flex items-center">
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
            <div className="flex-1 h-[1px] bg-border relative">
              <Plane className="w-3.5 h-3.5 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground">{duration}</p>
          <p className={`text-[10px] font-semibold ${stops === 0 ? "text-foreground" : "text-warning"}`}>{stopsLabel}</p>
        </div>

        {/* Destination */}
        <div className="text-center shrink-0">
          <p className="text-xs sm:text-[10px] font-medium text-muted-foreground">{toCode}</p>
          <p className="text-base sm:text-xl font-black tracking-tight">
            {arriveTime}
            {nextDay && <sup className="text-[7px] text-destructive font-bold ml-0.5">+1 days</sup>}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Round Trip Grouped Card — both legs in one card ─── */
const RoundTripFlightCard = ({
  outbound, returnFlight, cheapest, isExpanded, onToggleExpand,
}: {
  outbound: any; returnFlight: any; cheapest: number; isExpanded: boolean; onToggleExpand: () => void;
}) => {
  const cardNavigate = useNavigate();
  const [cardSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("itinerary");
  const logo = getAirlineLogo(outbound.airlineCode);
  const totalPrice = (outbound.price || 0) + (returnFlight.price || 0);
  const refundable = outbound.refundable ?? false;
  const fareType = outbound.fareType || (refundable ? "Refundable" : "Non-Refundable");
  const flightNo = [outbound.flightNumber, returnFlight.flightNumber].filter(Boolean).join(", ");

  return (
    <Card className={`overflow-hidden transition-all border ${isExpanded ? "border-accent/30 shadow-md" : "border-border hover:shadow-md"}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Airline section */}
          <div className="flex items-center gap-3 p-3 sm:p-4 sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-border/50">
            <div className="flex flex-col items-center gap-1 shrink-0">
              {logo ? (
                <img src={logo} alt={outbound.airline} className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><span class="text-xs font-bold text-muted-foreground">${(outbound.airlineCode || "").toUpperCase()}</span></div>`; }} />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">{(outbound.airlineCode || "").toUpperCase()}</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-tight">{outbound.airline}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{flightNo}</p>
            </div>
          </div>

          {/* Both legs side by side */}
          <div className="flex-1 flex flex-col sm:flex-row p-3 sm:p-4 gap-3 sm:gap-4">
            <LegMini flight={outbound} label="Departure" labelColor="text-foreground" />
            <div className="hidden sm:block w-px bg-border/60 self-stretch" />
            <div className="sm:hidden h-px bg-border/60" />
            <LegMini flight={returnFlight} label="Return" labelColor="text-foreground" />
          </div>

          {/* Price */}
          <div className="flex items-center justify-between sm:justify-end gap-3 p-4 sm:p-5 sm:w-48 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/20">
            <div className="text-right min-w-0">
              <p className="text-xl sm:text-2xl font-black leading-none whitespace-nowrap">BDT {totalPrice.toLocaleString()}</p>
              {totalPrice === cheapest && totalPrice > 0 && (
                <Badge className="bg-accent/10 text-accent border-0 text-[9px] font-bold mt-1">Cheapest</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="flex items-center px-3 sm:px-5 py-2.5 bg-muted/30 border-t border-border/50">
          <button className="flex items-center gap-1 text-accent font-bold text-xs sm:text-sm hover:underline shrink-0" onClick={onToggleExpand}>
            Flight Details {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <div className="flex-1 flex items-center justify-center gap-3 sm:gap-5">
            <span className={`font-bold text-xs sm:text-sm ${refundable ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{fareType}</span>
            {outbound.airlineCode?.toUpperCase() !== "BG" && (
              <span className="text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">Book &amp; Hold</span>
            )}
          </div>
          <div className="shrink-0">
            <Button size="sm" className="font-bold h-9 px-5 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => cardNavigate(`/flights/book?roundTrip=true&adults=${cardSearchParams.get("adults") || "1"}&children=${cardSearchParams.get("children") || "0"}&infants=${cardSearchParams.get("infants") || "0"}&cabin=${cardSearchParams.get("cabin") || "economy"}`, { state: { outboundFlight: outbound, returnFlight } })}>
              View Prices <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Expanded detail - tabbed view like FlightCard */}
        <AnimatePresence>
          {isExpanded && (() => {
            const paxAdults = parseInt(cardSearchParams.get("adults") || "1");
            const paxChildren = parseInt(cardSearchParams.get("children") || "0");
            const paxInfants = parseInt(cardSearchParams.get("infants") || "0");
            const obBaggage = outbound.baggage || null;
            const retBaggage = returnFlight.baggage || null;

            // Build fare rows from combined outbound + return
            const obBase = outbound.baseFare ?? outbound.price ?? 0;
            const obTax = outbound.taxes ?? 0;
            const retBase = returnFlight.baseFare ?? returnFlight.price ?? 0;
            const retTax = returnFlight.taxes ?? 0;
            const combinedBase = obBase + retBase;
            const combinedTax = obTax + retTax;
            const combinedPrice = totalPrice;

            const fareRows: { paxType: string; baseFare: number; tax: number; other: number; discount: number; aitVat: number; count: number; amount: number }[] = [];
            if (paxAdults > 0) fareRows.push({ paxType: "Adult", baseFare: combinedBase, tax: combinedTax, other: 0, discount: 0, aitVat: 0, count: paxAdults, amount: combinedPrice * paxAdults });
            if (paxChildren > 0) fareRows.push({ paxType: "Child", baseFare: Math.round(combinedBase * 0.75), tax: combinedTax, other: 0, discount: 0, aitVat: 0, count: paxChildren, amount: Math.round(combinedPrice * 0.75) * paxChildren });
            if (paxInfants > 0) fareRows.push({ paxType: "Infant", baseFare: Math.round(combinedBase * 0.1), tax: Math.round(combinedTax * 0.5), other: 0, discount: 0, aitVat: 0, count: paxInfants, amount: Math.round(combinedPrice * 0.1) * paxInfants });
            const totalPayable = fareRows.reduce((s, r) => s + r.amount, 0);

            return (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="border-t border-border">
                  {/* Tabs */}
                  <div className="flex items-center border-b border-border bg-muted/20">
                    <div className="flex overflow-x-auto scrollbar-none">
                      {[
                        { key: "itinerary", label: "Flight Details" },
                        { key: "fare", label: "Fare Summary" },
                        { key: "baggage", label: "Baggage" },
                        { key: "cancellation", label: "Cancellation" },
                        { key: "datechange", label: "Date Change" },
                      ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
                            activeTab === tab.key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto px-3">
                      <button className="flex items-center gap-1 text-accent text-xs font-semibold hover:underline">
                        <Info className="w-3 h-3" /> Fare terms &amp; policy
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    {/* Flight Details */}
                    {activeTab === "itinerary" && (
                      <div className="space-y-6">
                        {[{ leg: outbound, label: "Outbound" }, { leg: returnFlight, label: "Return" }].map(({ leg, label }) => {
                          const legs = leg.legs || [];
                          const legLogo = getAirlineLogo(leg.airlineCode);
                          const cabin = leg.cabinClass || "Economy";
                          const bkClass = leg.bookingClass || "";
                          const cabDisp = bkClass ? `${cabin} - ${bkClass}` : cabin;
                          const seats = leg.availableSeats ?? null;
                          const ac = leg.aircraft || legs[0]?.aircraft || "";

                          return (
                            <div key={label}>
                              <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Plane className={`w-4 h-4 ${label === "Return" ? "rotate-180 text-warning" : "text-accent"}`} />
                                {label}: {leg.origin} → {leg.destination}
                                <span className="text-muted-foreground font-normal text-xs">· {formatDate(leg.departureTime)}</span>
                              </h4>
                              {(legs.length > 0 ? legs : [{ origin: leg.origin, destination: leg.destination, departureTime: leg.departureTime, arrivalTime: leg.arrivalTime, duration: leg.duration, flightNumber: leg.flightNumber, airlineCode: leg.airlineCode, aircraft: ac }]).map((segment: any, i: number) => (
                                <div key={i} className="space-y-3 mb-4">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {legLogo && <img src={legLogo} alt="" className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                    <span className="text-sm font-semibold">{leg.airline}</span>
                                    <span className="text-sm text-muted-foreground">{segment.flightNumber || leg.flightNumber}</span>
                                    {(segment.aircraft || ac) && <><span className="text-muted-foreground text-sm">|</span><span className="text-sm text-muted-foreground">{segment.aircraft || ac}</span></>}
                                    <span className="text-muted-foreground text-sm">|</span>
                                    <span className="text-sm font-medium">{cabDisp}</span>
                                    {seats !== null && seats <= 9 && <span className="text-sm text-orange-500 font-bold">{seats} Seat{seats !== 1 ? "s" : ""} Left</span>}
                                  </div>
                                  <div className="flex items-start justify-between pt-2 pb-1">
                                    <div className="text-left shrink-0 max-w-[38%]">
                                      <p className="text-xl font-black">{formatTime(segment.departureTime)}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(segment.departureTime)}</p>
                                      <p className="text-[11px] text-muted-foreground mt-1">{getAirportName(segment.origin || leg.origin)} ({segment.origin || leg.origin})</p>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center pt-1 px-4">
                                      <div className="w-full relative h-10">
                                        <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                                          <path d="M 8 34 Q 100 2 192 34" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-muted-foreground/40" strokeDasharray="5 4" />
                                          <circle cx="8" cy="34" r="3" className="fill-muted-foreground/60" />
                                          <circle cx="192" cy="34" r="3" className="fill-muted-foreground/60" />
                                        </svg>
                                        <Plane className="w-3.5 h-3.5 text-muted-foreground absolute top-0.5 left-1/2 -translate-x-1/2 rotate-90" />
                                      </div>
                                      <p className="text-xs text-muted-foreground font-medium -mt-0.5">{segment.duration || leg.duration}</p>
                                    </div>
                                    <div className="text-right shrink-0 max-w-[38%]">
                                      <p className="text-xl font-black">{formatTime(segment.arrivalTime)}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(segment.arrivalTime)}</p>
                                      <p className="text-[11px] text-muted-foreground mt-1">{getAirportName(segment.destination || leg.destination)} ({segment.destination || leg.destination})</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Fare Summary */}
                    {activeTab === "fare" && (
                      <div className="space-y-3">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Pax Type</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Base Fare</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Tax</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Other</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Discount</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">AIT VAT</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Pax Count</th>
                                <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground text-xs">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fareRows.map((row, i) => (
                                <tr key={i} className="border-t border-border/50">
                                  <td className="px-3 py-2.5 font-medium">{row.paxType}</td>
                                  <td className="px-3 py-2.5">{row.baseFare.toLocaleString()}</td>
                                  <td className="px-3 py-2.5">{row.tax.toLocaleString()}</td>
                                  <td className="px-3 py-2.5">{row.other}</td>
                                  <td className="px-3 py-2.5">{row.discount}</td>
                                  <td className="px-3 py-2.5">{row.aitVat}</td>
                                  <td className="px-3 py-2.5">{row.count}</td>
                                  <td className="px-3 py-2.5 text-right font-semibold">BDT {row.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end items-center gap-6 pt-1">
                          <span className="font-bold text-sm">Total Payable</span>
                          <span className="font-black text-base">BDT {totalPayable.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Baggage — table layout */}
                    {activeTab === "baggage" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs">Sector</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs">Checkin</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs">Cabin</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-border/50">
                              <td className="px-4 py-3 font-semibold text-base"><span className="flex items-center gap-2">{outbound.origin} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {outbound.destination}</span></td>
                              <td className="px-4 py-3 text-muted-foreground">{obBaggage ? `ADT : ${obBaggage}` : "Not provided"}</td>
                              <td className="px-4 py-3 text-muted-foreground">{outbound.handBaggage ? `ADT : ${outbound.handBaggage}` : "Not provided"}</td>
                            </tr>
                            <tr className="border-t border-border/50">
                              <td className="px-4 py-3 font-semibold text-base"><span className="flex items-center gap-2">{returnFlight.origin} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {returnFlight.destination}</span></td>
                              <td className="px-4 py-3 text-muted-foreground">{retBaggage ? `ADT : ${retBaggage}` : "Not provided"}</td>
                              <td className="px-4 py-3 text-muted-foreground">{returnFlight.handBaggage ? `ADT : ${returnFlight.handBaggage}` : "Not provided"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Cancellation — sector-based from API */}
                    {activeTab === "cancellation" && (
                      <div className="space-y-4">
                        {[{ leg: outbound, label: "" }, { leg: returnFlight, label: "" }].map(({ leg }, idx) => (
                          <div key={idx} className="border border-border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 text-base font-semibold">
                              {leg.origin} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {leg.destination}
                            </div>
                            <table className="w-full text-sm">
                              <thead><tr className="border-t border-border">
                                <th className="text-left px-4 py-2.5 font-semibold text-foreground">Timeframe<br/><span className="font-normal text-xs text-muted-foreground">(From Scheduled flight departure)</span></th>
                                <th className="text-left px-4 py-2.5 font-semibold text-foreground">Airline Fee + Service Fee<br/><span className="font-normal text-xs text-muted-foreground">(Per passenger)</span></th>
                              </tr></thead>
                              <tbody><tr className="border-t border-border/50">
                                <td className="px-4 py-3 text-muted-foreground">Any Time</td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {leg.cancellationPolicy?.beforeDeparture != null
                                    ? `Cancellation allowed with fees + BDT ${Number(leg.cancellationPolicy.beforeDeparture).toLocaleString()}`
                                    : (leg.refundable ?? refundable) ? "Cancellation allowed with fees" : "Non-refundable"}
                                </td>
                              </tr></tbody>
                            </table>
                          </div>
                        ))}
                        <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">*Important:</span> The airline fee is indicative. We do not guarantee the accuracy of this information. All fees mentioned are per passenger. Purchased baggage and seat selections are non-refundable.
                        </div>
                      </div>
                    )}

                    {/* Date Change — sector-based from API */}
                    {activeTab === "datechange" && (
                      <div className="space-y-4">
                        {[{ leg: outbound }, { leg: returnFlight }].map(({ leg }, idx) => (
                          <div key={idx} className="border border-border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 text-base font-semibold">
                              {leg.origin} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {leg.destination}
                            </div>
                            <table className="w-full text-sm">
                              <thead><tr className="border-t border-border">
                                <th className="text-left px-4 py-2.5 font-semibold text-foreground">Timeframe<br/><span className="font-normal text-xs text-muted-foreground">(From Scheduled flight departure)</span></th>
                                <th className="text-left px-4 py-2.5 font-semibold text-foreground">Airline Fee + Service Fee + Fare difference<br/><span className="font-normal text-xs text-muted-foreground">(Per passenger)</span></th>
                              </tr></thead>
                              <tbody><tr className="border-t border-border/50">
                                <td className="px-4 py-3 text-muted-foreground">Any Time</td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {leg.dateChangePolicy?.changeAllowed === false
                                    ? "Date change not permitted"
                                    : leg.dateChangePolicy?.changeFee != null
                                      ? `Date change allowed with fees + BDT ${Number(leg.dateChangePolicy.changeFee).toLocaleString()}`
                                      : "Date change allowed with fees"}
                                </td>
                              </tr></tbody>
                            </table>
                          </div>
                        ))}
                        <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">*Important:</span> The airline fee is indicative. We do not guarantee the accuracy of this information. All fees mentioned are per passenger. Date change charges are applicable only on selecting the same airline on a new date. The difference in fares between the old and the new booking will also be payable by the user.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

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
  const searchedCabin = cardSearchParams.get("cabin") || cardSearchParams.get("class") || "";
  const logo = getAirlineLogo(flight.airlineCode);
  const departTime = formatTime(flight.departureTime);
  const arriveTime = formatTime(flight.arrivalTime);
  const departDateStr = formatShortDate(flight.departureTime);
  const arriveDateStr = formatShortDate(flight.arrivalTime);
  const fromCode = flight.origin || "";
  const toCode = flight.destination || "";
  const flightNo = flight.flightNumber || "";
  // Always use the REAL cabin class from the API — never override with searched cabin
  const cabin = flight.cabinClass || "Economy";
  const bookingClass = flight.bookingClass || "";
  const availableSeats = flight.availableSeats ?? null;
  const duration = flight.duration || "";
  const stops = flight.stops ?? 0;
  const price = flight.price ?? 0;
  const baseFare = flight.baseFare ?? price;
  const taxes = flight.taxes ?? 0;
  const refundable = flight.refundable ?? false;
  const fareType = flight.fareType || (refundable ? "Refundable" : "Non-Refundable");
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
            <span className={`font-bold text-xs sm:text-sm ${refundable ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{fareType}</span>
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
                Select <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
                  <div className="ml-auto px-3">
                    <button className="flex items-center gap-1 text-accent text-xs font-semibold hover:underline">
                      <Info className="w-3 h-3" /> Fare terms &amp; policy
                    </button>
                  </div>
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

                  {/* Fare Summary Tab — real API data, table layout matching reference */}
                  {activeDetailTab === "fare" && (() => {
                    const paxAdults = parseInt(cardSearchParams.get("adults") || "1");
                    const paxChildren = parseInt(cardSearchParams.get("children") || "0");
                    const paxInfants = parseInt(cardSearchParams.get("infants") || "0");
                    // Use fareDetails from API if available, otherwise construct from top-level
                    const fareRows: { paxType: string; baseFare: number; tax: number; other: number; discount: number; aitVat: number; count: number; amount: number }[] = [];
                    
                    // Check if flight has per-pax fare breakdown
                    const fd = flight.fareDetails || [];
                    if (fd.length > 0 && fd[0]?.baseFare) {
                      // Use detailed fare breakdown from API
                      fd.forEach((f: any) => {
                        fareRows.push({
                          paxType: f.paxType || "Adult",
                          baseFare: f.baseFare || 0,
                          tax: f.tax || f.taxes || 0,
                          other: f.other || 0,
                          discount: f.discount || 0,
                          aitVat: f.aitVat || 0,
                          count: f.count || f.paxCount || 1,
                          amount: f.amount || f.total || ((f.baseFare || 0) + (f.tax || f.taxes || 0) + (f.other || 0) - (f.discount || 0) + (f.aitVat || 0)) * (f.count || f.paxCount || 1),
                        });
                      });
                    } else {
                      // Construct from top-level baseFare/taxes
                      if (paxAdults > 0) fareRows.push({ paxType: "Adult", baseFare: baseFare, tax: taxes, other: 0, discount: 0, aitVat: 0, count: paxAdults, amount: price * paxAdults });
                      if (paxChildren > 0) fareRows.push({ paxType: "Child", baseFare: Math.round(baseFare * 0.75), tax: taxes, other: 0, discount: 0, aitVat: 0, count: paxChildren, amount: Math.round(price * 0.75) * paxChildren });
                      if (paxInfants > 0) fareRows.push({ paxType: "Infant", baseFare: Math.round(baseFare * 0.1), tax: Math.round(taxes * 0.5), other: 0, discount: 0, aitVat: 0, count: paxInfants, amount: Math.round(price * 0.1) * paxInfants });
                    }
                    const totalPayable = fareRows.reduce((s, r) => s + r.amount, 0);

                    return (
                      <div className="space-y-3">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Pax Type</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Base Fare</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Tax</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Other</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Discount</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">AIT VAT</th>
                                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground text-xs">Pax Count</th>
                                <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground text-xs">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fareRows.map((row, i) => (
                                <tr key={i} className="border-t border-border/50">
                                  <td className="px-3 py-2.5 font-medium">{row.paxType}</td>
                                  <td className="px-3 py-2.5">{row.baseFare.toLocaleString()}</td>
                                  <td className="px-3 py-2.5">{row.tax.toLocaleString()}</td>
                                  <td className="px-3 py-2.5">{row.other}</td>
                                  <td className="px-3 py-2.5">{row.discount}</td>
                                  <td className="px-3 py-2.5">{row.aitVat}</td>
                                  <td className="px-3 py-2.5">{row.count}</td>
                                  <td className="px-3 py-2.5 text-right font-semibold">BDT {row.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end items-center gap-6 pt-1">
                          <span className="font-bold text-sm">Total Payable</span>
                          <span className="font-black text-base">BDT {totalPayable.toLocaleString()}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground"><Info className="w-3 h-3 inline mr-1" />{refundable ? "This fare is refundable. Cancellation charges may apply." : "This fare is non-refundable. Change and cancellation fees apply as per airline policy."}</p>
                      </div>
                    );
                  })()}

                  {/* Baggage Tab — real API data, table layout */}
                  {activeDetailTab === "baggage" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs">Sector</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs">Checkin</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs">Cabin</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-border/50">
                            <td className="px-4 py-3 font-semibold text-base flex items-center gap-2">{fromCode} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {toCode}</td>
                            <td className="px-4 py-3 text-muted-foreground">{baggage ? `ADT : ${baggage}` : "Not provided"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{handBaggage ? `ADT : ${handBaggage}` : "Not provided"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Cancellation Tab — sector-based layout from API */}
                  {activeDetailTab === "cancellation" && (
                    <div className="space-y-4">
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 text-base font-semibold">
                          {fromCode} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {toCode}
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-t border-border">
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">Timeframe<br/><span className="font-normal text-xs text-muted-foreground">(From Scheduled flight departure)</span></th>
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">Airline Fee + Service Fee<br/><span className="font-normal text-xs text-muted-foreground">(Per passenger)</span></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-border/50">
                              <td className="px-4 py-3 text-muted-foreground">Any Time</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {cancellationPolicy?.beforeDeparture != null
                                  ? `Cancellation allowed with fees + BDT ${Number(cancellationPolicy.beforeDeparture).toLocaleString()}`
                                  : refundable ? "Cancellation allowed with fees" : "Non-refundable"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">*Important:</span> The airline fee is indicative. We do not guarantee the accuracy of this information. All fees mentioned are per passenger. Purchased baggage and seat selections are non-refundable.
                      </div>
                    </div>
                  )}

                  {/* Date Change Tab — sector-based layout from API */}
                  {activeDetailTab === "datechange" && (
                    <div className="space-y-4">
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 text-base font-semibold">
                          {fromCode} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {toCode}
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-t border-border">
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">Timeframe<br/><span className="font-normal text-xs text-muted-foreground">(From Scheduled flight departure)</span></th>
                              <th className="text-left px-4 py-2.5 font-semibold text-foreground">Airline Fee + Service Fee + Fare difference<br/><span className="font-normal text-xs text-muted-foreground">(Per passenger)</span></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-border/50">
                              <td className="px-4 py-3 text-muted-foreground">Any Time</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {dateChangePolicy?.changeAllowed === false
                                  ? "Date change not permitted"
                                  : dateChangePolicy?.changeFee != null
                                    ? `Date change allowed with fees + BDT ${Number(dateChangePolicy.changeFee).toLocaleString()}`
                                    : "Date change allowed with fees"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">*Important:</span> The airline fee is indicative. We do not guarantee the accuracy of this information. All fees mentioned are per passenger. Date change charges are applicable only on selecting the same airline on a new date. The difference in fares between the old and the new booking will also be payable by the user.
                      </div>
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

  // Multi-city state
  const tripType = searchParams.get("tripType") || "";
  const isMultiCity = tripType === "multicity";
  const segmentsParam = searchParams.get("segments") || "";
  const multiCitySegments: { from: string; to: string; date: string }[] = useMemo(() => {
    if (!isMultiCity || !segmentsParam) return [];
    try { return JSON.parse(segmentsParam); } catch { return []; }
  }, [isMultiCity, segmentsParam]);

  const [multiCityResults, setMultiCityResults] = useState<Record<number, any[]>>({});
  const [multiCityLoading, setMultiCityLoading] = useState(false);
  const [multiCityError, setMultiCityError] = useState<string | null>(null);
  const [selectedMultiCityFlights, setSelectedMultiCityFlights] = useState<Record<number, any>>({});

  const fromCode = searchParams.get("from") || "";
  const toCode = searchParams.get("to") || "";
  const departDate = searchParams.get("depart") || "";
  const returnDate = searchParams.get("return") || "";
  const adults = searchParams.get("adults") || "1";
  const children = searchParams.get("children") || "0";
  const infants = searchParams.get("infants") || "0";
  const cabinClass = searchParams.get("cabin") || searchParams.get("class") || "";
  const totalPax = parseInt(adults) + parseInt(children) + parseInt(infants);
  const hasRequiredParams = isMultiCity ? multiCitySegments.length >= 2 : (!!fromCode && !!toCode && !!departDate);
  const isRoundTrip = !!returnDate && !isMultiCity;

  // Standard search params (one-way / round-trip)
  const params = (!isMultiCity && hasRequiredParams) ? {
    from: fromCode, to: toCode, date: departDate,
    return: returnDate || undefined, adults,
    children: children !== "0" ? children : undefined,
    infants: infants !== "0" ? infants : undefined,
    cabinClass: cabinClass || undefined,
  } : undefined;

  const { data: rawData, isLoading: standardLoading, error, refetch } = useFlightSearch(params);
  const apiData = (rawData as any) || {};
  const flights = isMultiCity ? [] : (apiData.data || apiData.flights || []);
  const hasDirections = flights.some((f: any) => f.direction === "return");
  const isLoading = isMultiCity ? multiCityLoading : standardLoading;

  // Multi-city: search each segment in parallel via API
  useEffect(() => {
    if (!isMultiCity || multiCitySegments.length < 2) return;
    setMultiCityLoading(true);
    setMultiCityError(null);
    setMultiCityResults({});
    setSelectedMultiCityFlights({});

    const searchAll = async () => {
      try {
        const results: Record<number, any[]> = {};
        const promises = multiCitySegments.map(async (seg, i) => {
          const searchParams: Record<string, string> = {
            from: seg.from, to: seg.to, date: seg.date,
            adults, cabinClass: cabinClass || "",
          };
          if (children !== "0") searchParams.children = children;
          if (infants !== "0") searchParams.infants = infants;
          const data = await api.get<any>(API_ENDPOINTS.FLIGHTS_SEARCH, searchParams);
          results[i] = data?.data || data?.flights || [];
        });
        await Promise.all(promises);
        setMultiCityResults(results);
      } catch (err: any) {
        setMultiCityError(err.message || "Failed to search flights");
      } finally {
        setMultiCityLoading(false);
      }
    };
    searchAll();
  }, [isMultiCity, segmentsParam, adults, children, infants, cabinClass]);

  const outboundFlights = useMemo(() => flights.filter((f: any) => f.direction !== "return"), [flights]);
  const returnFlights = useMemo(() => flights.filter((f: any) => f.direction === "return"), [flights]);

  // Round-trip: group outbound+return into pairs by airline
  const roundTripPairs = useMemo(() => {
    if (!isRoundTrip || !hasDirections) return [];
    const pairs: { outbound: any; returnFlight: any; totalPrice: number }[] = [];
    const usedReturnIds = new Set<string>();

    // For each outbound, find the cheapest same-airline return
    const sortedOutbound = [...outboundFlights].sort((a, b) => (a.price || 0) - (b.price || 0));
    
    for (const ob of sortedOutbound) {
      // Find cheapest return from same airline
      let bestReturn = returnFlights
        .filter((r: any) => r.airlineCode === ob.airlineCode)
        .sort((a: any, b: any) => (a.price || 0) - (b.price || 0))[0];
      
      // If no same-airline return, find cheapest overall return
      if (!bestReturn) {
        bestReturn = [...returnFlights].sort((a: any, b: any) => (a.price || 0) - (b.price || 0))[0];
      }
      
      if (bestReturn) {
        pairs.push({
          outbound: ob,
          returnFlight: bestReturn,
          totalPrice: (ob.price || 0) + (bestReturn.price || 0),
        });
      }
    }

    // Also add unique return flights paired with cheapest outbound (for airlines that only have return)
    const outboundAirlines = new Set(outboundFlights.map((f: any) => f.airlineCode));
    const returnOnlyAirlines = returnFlights.filter((r: any) => !outboundAirlines.has(r.airlineCode));
    
    if (returnOnlyAirlines.length > 0) {
      const cheapestOutbound = [...outboundFlights].sort((a: any, b: any) => (a.price || 0) - (b.price || 0))[0];
      if (cheapestOutbound) {
        for (const ret of returnOnlyAirlines) {
          pairs.push({
            outbound: cheapestOutbound,
            returnFlight: ret,
            totalPrice: (cheapestOutbound.price || 0) + (ret.price || 0),
          });
        }
      }
    }

    return pairs;
  }, [isRoundTrip, hasDirections, outboundFlights, returnFlights]);

  // Combine all multi-city flights for filter computation
  const allMultiCityFlights = useMemo(() => {
    if (!isMultiCity) return [];
    return Object.values(multiCityResults).flat();
  }, [isMultiCity, multiCityResults]);

  const allFlightsForFilters = isMultiCity ? allMultiCityFlights : flights;

  const airlines = useMemo(() => apiData.airlines || [...new Set(allFlightsForFilters.map((f: any) => f.airline).filter(Boolean))], [apiData.airlines, allFlightsForFilters]);
  const cheapest = useMemo(() => apiData.cheapest || (allFlightsForFilters.length > 0 ? Math.min(...allFlightsForFilters.map((f: any) => f.price || Infinity)) : 0), [apiData.cheapest, allFlightsForFilters]);
  const maxPrice = useMemo(() => allFlightsForFilters.length > 0 ? Math.max(...allFlightsForFilters.map((f: any) => f.price || 0)) : 200000, [allFlightsForFilters]);
  const minPrice = useMemo(() => allFlightsForFilters.length > 0 ? Math.min(...allFlightsForFilters.map((f: any) => f.price || 0)) : 0, [allFlightsForFilters]);

  useEffect(() => { if (allFlightsForFilters.length > 0) setPriceRange([Math.max(0, minPrice - 100), maxPrice]); }, [minPrice, maxPrice, allFlightsForFilters.length]);

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

  // Filtered + sorted round-trip pairs
  const filteredPairs = useMemo(() => {
    if (!isRoundTrip || !hasDirections) return [];
    const filtered = roundTripPairs.filter(p => {
      // Apply airline filter to outbound
      if (selectedAirlines.length > 0 && !selectedAirlines.includes(p.outbound.airline)) return false;
      // Apply price filter to total
      if (p.totalPrice < priceRange[0] || p.totalPrice > priceRange[1]) return false;
      // Stops filter on outbound
      if (stopsFilter !== "all") {
        const stops = p.outbound.stops ?? 0;
        if (stopsFilter === "0" && stops !== 0) return false;
        if (stopsFilter === "1" && stops !== 1) return false;
        if (stopsFilter === "2+" && stops < 2) return false;
      }
      // Depart time on outbound
      if (p.outbound.departureTime) {
        const hour = new Date(p.outbound.departureTime).getHours();
        if (hour < departTimeRange[0] || hour > departTimeRange[1]) return false;
      }
      return true;
    });
    // Sort by total price or outbound criteria
    if (sortBy === "cheapest" || sortBy === "best") {
      filtered.sort((a, b) => a.totalPrice - b.totalPrice);
    } else if (sortBy === "fastest") {
      filtered.sort((a, b) => ((a.outbound.durationMinutes || 0) + (a.returnFlight.durationMinutes || 0)) - ((b.outbound.durationMinutes || 0) + (b.returnFlight.durationMinutes || 0)));
    } else if (sortBy === "departure") {
      filtered.sort((a, b) => new Date(a.outbound.departureTime).getTime() - new Date(b.outbound.departureTime).getTime());
    }
    return filtered;
  }, [roundTripPairs, isRoundTrip, hasDirections, selectedAirlines, priceRange, stopsFilter, departTimeRange, sortBy]);

  // Cabin class mismatch detection — searched for Business/First but API returned only Economy
  const searchedCabinNorm = (cabinClass || "").toLowerCase();
  const hasCabinMismatch = useMemo(() => {
    if (!searchedCabinNorm || searchedCabinNorm === "economy") return false;
    const relevantFlights = isMultiCity ? allMultiCityFlights : flights;
    if (relevantFlights.length === 0) return false;
    // Check if ANY result matches the searched cabin
    const searchedLabel = searchedCabinNorm.charAt(0).toUpperCase() + searchedCabinNorm.slice(1);
    return !relevantFlights.some((f: any) => (f.cabinClass || "").toLowerCase() === searchedCabinNorm || (f.cabinClass || "") === searchedLabel);
  }, [searchedCabinNorm, flights, allMultiCityFlights, isMultiCity]);

  const resetFilters = useCallback(() => { setSelectedAirlines([]); setPriceRange([0, maxPrice]); setStopsFilter("all"); setDepartTimeRange([0, 24]); }, [maxPrice]);

  const sources = apiData.sources || {};

  const handleBookRoundTrip = () => {
    if (!selectedOutbound || !selectedReturn) return;
    navigate(`/flights/book?roundTrip=true&adults=${adults}&children=${children}&infants=${infants}&cabin=${cabinClass || "economy"}`, { state: { outboundFlight: selectedOutbound, returnFlight: selectedReturn } });
  };

  const roundTripTotal = (selectedOutbound?.price || 0) + (selectedReturn?.price || 0);

  // Multi-city booking handler
  const handleBookMultiCity = () => {
    const selectedFlights = Object.values(selectedMultiCityFlights);
    if (selectedFlights.length !== multiCitySegments.length) return;
    // Pass first segment as outbound, rest via state
    navigate(`/flights/book?adults=${adults}&children=${children}&infants=${infants}&cabin=${cabinClass || "economy"}`, {
      state: { outboundFlight: selectedFlights[0], multiCityFlights: selectedFlights },
    });
  };

  const multiCityTotal = useMemo(() => {
    return Object.values(selectedMultiCityFlights).reduce((sum, f) => sum + (f?.price || 0), 0);
  }, [selectedMultiCityFlights]);

  const totalMultiCityFlights = useMemo(() => {
    return Object.values(multiCityResults).reduce((sum, arr) => sum + arr.length, 0);
  }, [multiCityResults]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Plane className="w-5 h-5 text-accent" />
                {isMultiCity ? (
                  <>
                    {multiCitySegments.map((s, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                        <span>{s.from}</span>
                      </span>
                    ))}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span>{multiCitySegments[multiCitySegments.length - 1]?.to || "—"}</span>
                    <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[10px] ml-2">Multi-City</Badge>
                  </>
                ) : (
                  <>
                    {fromCode || "—"} <ArrowRight className="w-5 h-5" /> {toCode || "—"}
                    {isRoundTrip && <Badge className="bg-accent/10 text-accent border-0 text-[10px] ml-2">Round Trip</Badge>}
                  </>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isMultiCity ? (
                  <>
                    {multiCitySegments.map((s, i) => s.date).join(", ")} · {totalPax} Passenger(s){cabinClass ? ` · ${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}` : ""} · <strong className="text-foreground">{totalMultiCityFlights} flights found</strong>
                  </>
                ) : (
                  <>
                    {departDate}{returnDate ? ` – ${returnDate}` : ""} · {totalPax} Passenger(s){cabinClass ? ` · ${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}` : ""}
                    {isRoundTrip && hasDirections ? (
                      <> · <strong className="text-accent">Showing {filteredPairs.length} flights &amp; {airlines.length} Airlines</strong> <span className="text-accent">(Fares include. AIT VAT)</span></>
                    ) : (
                      <> · <strong className="text-foreground">{flights.length} flights found</strong>
                        {sources.tti > 0 && <span className="text-muted-foreground ml-1">({sources.tti} Air Astra)</span>}
                        {sources.sabre > 0 && <span className="text-muted-foreground ml-1">({sources.sabre} Sabre)</span>}
                        {sources.flyhub > 0 && <span className="text-muted-foreground ml-1">({sources.flyhub} FlyHub)</span>}
                      </>
                    )}
                  </>
                )}
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
              {isMultiCity ? (
                /* ── MULTI-CITY RESULTS ── */
                multiCityLoading ? (
                  <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
                ) : multiCityError ? (
                  <Card><CardContent className="py-12 text-center text-destructive"><p className="font-semibold">{multiCityError}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>Retry</Button></CardContent></Card>
                ) : (
                  <div className="space-y-6">
                    {hasCabinMismatch && (
                      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {searchedCabinNorm.charAt(0).toUpperCase() + searchedCabinNorm.slice(1)} class is not available on this route
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            The airlines operating this route do not offer {searchedCabinNorm.charAt(0).toUpperCase() + searchedCabinNorm.slice(1)} class. Showing available Economy class fares instead. All prices shown are real-time from the airline.
                          </p>
                        </div>
                      </div>
                    )}
                    {multiCitySegments.map((seg, segIdx) => {
                      const segFlights = sortFlights(applyFilters(multiCityResults[segIdx] || []), sortBy);
                      const segColors = ["bg-accent/10 text-accent", "bg-blue-500/10 text-blue-600", "bg-purple-500/10 text-purple-600", "bg-amber-500/10 text-amber-600", "bg-rose-500/10 text-rose-600"];
                      const selectedFlight = selectedMultiCityFlights[segIdx];

                      return (
                        <div key={segIdx}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${segColors[segIdx % segColors.length]}`}>
                              <Plane className="w-4 h-4" /><span className="text-sm font-bold">Flight {segIdx + 1}</span>
                            </div>
                            <span className="text-sm font-medium">{seg.from} → {seg.to}</span>
                            <span className="text-xs text-muted-foreground">{seg.date} · {segFlights.length} flights</span>
                            {selectedFlight && (
                              <Badge className="bg-accent/10 text-accent border-0 text-xs ml-auto">
                                <Check className="w-3 h-3 mr-1" /> {formatTime(selectedFlight.departureTime)} – {formatTime(selectedFlight.arrivalTime)} · ৳{selectedFlight.price?.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-3">
                            {segFlights.length === 0 ? (
                              <Card><CardContent className="py-8 text-center text-muted-foreground"><p>No flights found for {seg.from} → {seg.to} on {seg.date}</p></CardContent></Card>
                            ) : segFlights.map((flight: any) => (
                              <FlightCard key={flight.id} flight={flight} cheapest={cheapest}
                                isExpanded={expandedFlight === flight.id} onToggleExpand={() => setExpandedFlight(expandedFlight === flight.id ? null : flight.id)}
                                selectionMode isSelected={selectedFlight?.id === flight.id}
                                onSelect={() => setSelectedMultiCityFlights(prev => ({
                                  ...prev,
                                  [segIdx]: prev[segIdx]?.id === flight.id ? undefined : flight,
                                }))} />
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Sticky multi-city booking bar */}
                    <AnimatePresence>
                      {Object.keys(selectedMultiCityFlights).some(k => selectedMultiCityFlights[parseInt(k)]) && (
                        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                          className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t-2 border-accent shadow-2xl">
                          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 overflow-x-auto">
                              {multiCitySegments.map((seg, i) => {
                                const sf = selectedMultiCityFlights[i];
                                return sf ? (
                                  <div key={i} className="flex items-center gap-2 shrink-0">
                                    <Plane className="w-4 h-4 text-accent" />
                                    <div>
                                      <p className="text-[10px] text-muted-foreground">Flight {i + 1}</p>
                                      <p className="text-xs font-bold">{seg.from} → {seg.to} · ৳{sf.price?.toLocaleString()}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div key={i} className="flex items-center gap-2 shrink-0 opacity-40">
                                    <Plane className="w-4 h-4" />
                                    <div>
                                      <p className="text-[10px] text-muted-foreground">Flight {i + 1}</p>
                                      <p className="text-xs font-medium">{seg.from} → {seg.to}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total ({Object.values(selectedMultiCityFlights).filter(Boolean).length}/{multiCitySegments.length} selected)</p>
                                <p className="text-xl font-black text-accent">৳{multiCityTotal.toLocaleString()}</p>
                              </div>
                              <Button size="lg" className="font-bold shadow-lg px-6 bg-accent text-accent-foreground hover:bg-accent/90"
                                disabled={Object.values(selectedMultiCityFlights).filter(Boolean).length !== multiCitySegments.length}
                                onClick={handleBookMultiCity}>
                                {Object.values(selectedMultiCityFlights).filter(Boolean).length !== multiCitySegments.length
                                  ? `Select All ${multiCitySegments.length} Flights`
                                  : "Book Multi-City"}
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              ) : (
              <DataLoader isLoading={isLoading} error={error} skeleton="cards" retry={refetch}>
                {/* Cabin class mismatch alert for one-way / round-trip */}
                {hasCabinMismatch && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 mb-4">
                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {searchedCabinNorm.charAt(0).toUpperCase() + searchedCabinNorm.slice(1)} class is not available on this route
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        The airlines operating this route do not offer {searchedCabinNorm.charAt(0).toUpperCase() + searchedCabinNorm.slice(1)} class. Showing available Economy class fares instead. All prices shown are real-time from the airline.
                      </p>
                    </div>
                  </div>
                )}
                {isRoundTrip && hasDirections ? (
                  <div className="space-y-3">
                    {/* Header: showing X round-trip combinations */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2 bg-accent/10 text-accent rounded-lg px-3 py-1.5">
                        <Plane className="w-4 h-4" /><span className="text-sm font-bold">Round Trip</span>
                      </div>
                      <span className="text-sm font-medium">{fromCode} ↔ {toCode}</span>
                      <span className="text-xs text-muted-foreground">{filteredPairs.length} combinations</span>
                      <span className="text-xs text-muted-foreground italic">(Fares include. AIT VAT)</span>
                    </div>

                    {filteredPairs.length === 0 ? (
                      <Card><CardContent className="py-8 text-center text-muted-foreground"><p>No round-trip flights found matching your filters</p></CardContent></Card>
                    ) : filteredPairs.map((pair, idx) => (
                      <RoundTripFlightCard
                        key={`${pair.outbound.id}-${pair.returnFlight.id}-${idx}`}
                        outbound={pair.outbound}
                        returnFlight={pair.returnFlight}
                        cheapest={filteredPairs.length > 0 ? Math.min(...filteredPairs.map(p => p.totalPrice)) : 0}
                        isExpanded={expandedFlight === `${pair.outbound.id}-${pair.returnFlight.id}`}
                        onToggleExpand={() => {
                          const pairId = `${pair.outbound.id}-${pair.returnFlight.id}`;
                          setExpandedFlight(expandedFlight === pairId ? null : pairId);
                        }}
                      />
                    ))}
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
              )}
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
