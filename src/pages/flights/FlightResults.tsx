import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plane, Clock, ArrowRight, Filter, X, Luggage,
  SlidersHorizontal, ChevronDown, ChevronUp, Shield, Timer,
  CircleDot, Zap, TrendingUp, Check, Info, FileText,
  ChevronLeft, ChevronRight, Star, Sun, Moon, Sunrise, Sunset,
  ArrowLeftRight, Users, Search, CalendarDays, MapPin,
  Navigation, Package,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useFlightSearch } from "@/hooks/useApiData";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import DataLoader from "@/components/DataLoader";
import { AIRPORTS } from "@/lib/airports";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { format } from "date-fns";

/* ─── Airline logo — dynamic CDN, no hardcoded map ─── */
function getAirlineLogo(code?: string): string | null {
  if (!code) return null;
  return `https://images.kiwi.com/airlines/64/${code}.png`;
}

/* ─── Airport names & cities — from airports.ts registry (no hardcoded map) ─── */
const AIRPORT_NAME_MAP = new Map(AIRPORTS.map(a => [a.code, a.name]));
const AIRPORT_CITY_MAP = new Map(AIRPORTS.map(a => [a.code, a.city]));
function getAirportName(code: string): string {
  return AIRPORT_NAME_MAP.get(code) || `${code} Airport`;
}
function getAirportCity(code: string): string {
  return AIRPORT_CITY_MAP.get(code) || code;
}

/* ─── Airline Alliance Mapping — real IATA memberships ─── */
const AIRLINE_ALLIANCES: Record<string, string> = {
  TK:'Star Alliance',SQ:'Star Alliance',AI:'Star Alliance',TG:'Star Alliance',NH:'Star Alliance',
  UA:'Star Alliance',LH:'Star Alliance',AC:'Star Alliance',ET:'Star Alliance',MS:'Star Alliance',
  TP:'Star Alliance',SK:'Star Alliance',CA:'Star Alliance',NZ:'Star Alliance',OZ:'Star Alliance',
  SA:'Star Alliance',AV:'Star Alliance',CM:'Star Alliance',OU:'Star Alliance',LO:'Star Alliance',
  SN:'Star Alliance',OS:'Star Alliance',A3:'Star Alliance',ZH:'Star Alliance',
  MU:'SkyTeam',CZ:'SkyTeam',KE:'SkyTeam',GA:'SkyTeam',VN:'SkyTeam',SV:'SkyTeam',
  AF:'SkyTeam',KL:'SkyTeam',DL:'SkyTeam',AZ:'SkyTeam',AR:'SkyTeam',AM:'SkyTeam',
  CI:'SkyTeam',RO:'SkyTeam',ME:'SkyTeam',SU:'SkyTeam',
  QR:'oneworld',BA:'oneworld',CX:'oneworld',MH:'oneworld',JL:'oneworld',AA:'oneworld',
  IB:'oneworld',AY:'oneworld',QF:'oneworld',RJ:'oneworld',UL:'oneworld',S7:'oneworld',
  LA:'oneworld',FJ:'oneworld',AT:'oneworld',
};

function fmtDurationMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

/* ─── Per-airline fare calculation helper ─── */
function getAirlineFareParams(
  airlineCode: string,
  markupSettings: { discount: number; aitVat: number; airlineMarkups?: Record<string, any> }
): { discountPct: number; aitVatPct: number } {
  const airlineMarkups = markupSettings.airlineMarkups || {};
  const entry = airlineMarkups[airlineCode];
  if (entry && !entry.useGlobal) {
    return {
      discountPct: entry.discount ?? markupSettings.discount,
      aitVatPct: markupSettings.aitVat, // AIT VAT is always global
    };
  }
  return { discountPct: markupSettings.discount, aitVatPct: markupSettings.aitVat };
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

/* ─── Airport coordinates for distance calculation ─── */
const AIRPORT_COORDS: Record<string, [number, number]> = {
  DAC:[23.8433,90.3978],CXB:[21.4522,91.9639],CGP:[22.2496,91.8133],ZYL:[24.9632,91.8668],
  JSR:[23.1838,89.1608],RJH:[24.4372,88.6165],SPD:[25.7591,88.9089],BZL:[22.801,90.3012],
  DEL:[28.5562,77.1],BOM:[19.0887,72.8679],BLR:[13.1986,77.7066],MAA:[12.9941,80.1709],
  CCU:[22.6547,88.4467],HYD:[17.2403,78.4294],COK:[10.152,76.4019],DXB:[25.2528,55.3644],
  SIN:[1.3502,103.9944],KUL:[2.7456,101.7072],BKK:[13.6811,100.7472],HKG:[22.3089,113.9145],
  DOH:[25.2609,51.6138],AUH:[24.4331,54.6511],RUH:[24.9576,46.6988],JED:[21.6796,39.1565],
  IST:[41.2753,28.7519],LHR:[51.4706,-0.4619],CDG:[49.0097,2.5479],FRA:[50.0333,8.5706],
  AMS:[52.3086,4.7639],JFK:[40.6413,-73.7781],LAX:[33.9416,-118.4085],SFO:[37.6213,-122.379],
  NRT:[35.7647,140.3864],ICN:[37.4602,126.4407],PEK:[40.0799,116.6031],SYD:[-33.9461,151.1772],
  CMB:[7.1801,79.8841],KTM:[27.6966,85.3591],MCT:[23.5933,58.2844],BAH:[26.2708,50.6336],
  CAN:[23.3924,113.299],PVG:[31.1443,121.8083],MNL:[14.5086,121.0194],SGN:[10.8188,106.652],
  HAN:[21.2212,105.807],RGN:[16.9073,96.1332],CGK:[-6.1256,106.6558],AMD:[23.0728,72.6347],
};

function calcDistanceKm(from: string, to: string): number | null {
  const c1 = AIRPORT_COORDS[from], c2 = AIRPORT_COORDS[to];
  if (!c1 || !c2) return null;
  const R = 6371;
  const dLat = (c2[0] - c1[0]) * Math.PI / 180;
  const dLon = (c2[1] - c1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(c1[0] * Math.PI / 180) * Math.cos(c2[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* ─── Session Timer Component ─── */
const SessionTimer = ({ startTime }: { startTime: number }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const remaining = Math.max(0, 20 * 60 - elapsed); // 20 min session
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining < 120;
  return (
    <div className={`flex items-center gap-1.5 text-xs font-bold tabular-nums ${isLow ? "text-destructive" : "text-muted-foreground"}`}>
      <Timer className="w-3.5 h-3.5" />
      <span>{mins} min</span>
      <span className="animate-pulse">:</span>
      <span>{String(secs).padStart(2, '0')} sec</span>
    </div>
  );
};

/* ─── Filter panel — BDFare-grade advanced filters ─── */
const FilterPanel = ({
  flights, priceRange, setPriceRange, maxPrice,
  selectedAirlines, toggleAirline,
  stopsFilter, setStopsFilter,
  departTimeRange, setDepartTimeRange,
  arrivalTimeRange, setArrivalTimeRange,
  durationRange, setDurationRange,
  selectedAlliances, toggleAlliance,
  refundableOnly, setRefundableOnly,
  selectedLayoverAirports, toggleLayoverAirport,
  layoverDurationRange, setLayoverDurationRange,
  isRoundTrip, originCode, destCode,
  selectedBaggage, toggleBaggage,
  onReset,
}: any) => {
  // Compute all stats from real flight data
  const popularFilterStats = useMemo(() => {
    const stats: { key: string; label: string; count: number; cheapest: number }[] = [];
    const cheapestOf = (arr: any[]) => arr.length > 0 ? Math.min(...arr.map((f: any) => f.price || Infinity)) : 0;
    const nonStop = flights.filter((f: any) => (f.stops ?? 0) === 0);
    const oneStop = flights.filter((f: any) => (f.stops ?? 0) === 1);
    const multiStop = flights.filter((f: any) => (f.stops ?? 0) > 1);
    const earlyMorning = flights.filter((f: any) => { if (!f.departureTime) return false; return new Date(f.departureTime).getHours() < 6; });
    const lateDep = flights.filter((f: any) => { if (!f.departureTime) return false; return new Date(f.departureTime).getHours() >= 18; });
    const refundable = flights.filter((f: any) => f.refundable === true);
    if (nonStop.length > 0) stats.push({ key: 'nonstop', label: 'Non Stop', count: nonStop.length, cheapest: cheapestOf(nonStop) });
    if (oneStop.length > 0) stats.push({ key: '1stop', label: '1 Stop', count: oneStop.length, cheapest: cheapestOf(oneStop) });
    if (multiStop.length > 0) stats.push({ key: '1+stop', label: '1+ Stop', count: multiStop.length, cheapest: cheapestOf(multiStop) });
    if (earlyMorning.length > 0) stats.push({ key: 'early', label: 'Early Morning Departures', count: earlyMorning.length, cheapest: cheapestOf(earlyMorning) });
    if (lateDep.length > 0) stats.push({ key: 'late', label: 'Late Departures', count: lateDep.length, cheapest: cheapestOf(lateDep) });
    if (refundable.length > 0) stats.push({ key: 'refundable', label: 'Refundable', count: refundable.length, cheapest: cheapestOf(refundable) });
    return stats;
  }, [flights]);

  const allianceStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of flights) { const a = AIRLINE_ALLIANCES[f.airlineCode]; if (a) map[a] = (map[a] || 0) + 1; }
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [flights]);

  const durationBounds = useMemo(() => {
    const ds = flights.map((f: any) => f.durationMinutes || 0).filter((d: number) => d > 0);
    return { min: ds.length > 0 ? Math.min(...ds) : 0, max: ds.length > 0 ? Math.max(...ds) : 1440 };
  }, [flights]);

  const timeSlotStats = useMemo(() => {
    const slots = [
      { key: 'before6', label: 'Before 6 AM', minH: 0, maxH: 6 },
      { key: '6to12', label: '6 AM - 12 PM', minH: 6, maxH: 12 },
      { key: '12to18', label: '12 PM - 6 PM', minH: 12, maxH: 18 },
      { key: 'after18', label: 'After 6 PM', minH: 18, maxH: 24 },
    ];
    const depart: any[] = [], arrive: any[] = [];
    for (const slot of slots) {
      const df = flights.filter((f: any) => { if (!f.departureTime) return false; const h = new Date(f.departureTime).getHours(); return h >= slot.minH && h < slot.maxH; });
      const af = flights.filter((f: any) => { if (!f.arrivalTime) return false; const h = new Date(f.arrivalTime).getHours(); return h >= slot.minH && h < slot.maxH; });
      if (df.length > 0) depart.push({ ...slot, count: df.length, cheapest: Math.min(...df.map((f: any) => f.price || Infinity)) });
      if (af.length > 0) arrive.push({ ...slot, count: af.length, cheapest: Math.min(...af.map((f: any) => f.price || Infinity)) });
    }
    return { depart, arrive };
  }, [flights]);

  const layoverAirportStats = useMemo(() => {
    const map: Record<string, { code: string; name: string; count: number; cheapest: number }> = {};
    for (const f of flights) {
      const codes = (f.stopCodes || []).length > 0 ? f.stopCodes : (f.legs || []).slice(0, -1).map((l: any) => l.destination).filter(Boolean);
      for (const code of codes) {
        if (!code) continue;
        if (!map[code]) map[code] = { code, name: getAirportName(code), count: 0, cheapest: Infinity };
        map[code].count++;
        if ((f.price || Infinity) < map[code].cheapest) map[code].cheapest = f.price;
      }
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [flights]);

  const layoverDurationBounds = useMemo(() => {
    const ds: number[] = [];
    for (const f of flights) {
      const legs = f.legs || [];
      for (let i = 0; i < legs.length - 1; i++) {
        if (legs[i].arrivalTime && legs[i + 1].departureTime) {
          const m = Math.round((new Date(legs[i + 1].departureTime).getTime() - new Date(legs[i].arrivalTime).getTime()) / 60000);
          if (m > 0) ds.push(m);
        }
      }
    }
    return { min: ds.length > 0 ? Math.min(...ds) : 0, max: ds.length > 0 ? Math.max(...ds) : 0 };
  }, [flights]);

  // Baggage stats — extract unique baggage values from API data
  const baggageStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of flights) {
      const bag = f.baggage || null;
      if (bag) {
        const key = String(bag).trim();
        map[key] = (map[key] || 0) + 1;
      }
    }
    return Object.entries(map).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }, [flights]);

  const airlineList = useMemo(() => {
    const map: Record<string, { name: string; code: string; count: number; cheapest: number }> = {};
    for (const f of flights) {
      const name = f.airline || ''; const code = f.airlineCode || ''; if (!name) continue;
      if (!map[name]) map[name] = { name, code, count: 0, cheapest: Infinity };
      map[name].count++;
      if ((f.price || Infinity) < map[name].cheapest) map[name].cheapest = f.price;
    }
    return Object.values(map).sort((a, b) => a.cheapest - b.cheapest);
  }, [flights]);

  const slotIcons: Record<string, any> = { before6: Moon, '6to12': Sunrise, '12to18': Sun, after18: Sunset };
  const isPopularActive = (key: string) => {
    if (key === 'nonstop') return stopsFilter === '0';
    if (key === '1stop') return stopsFilter === '1';
    if (key === '1+stop') return stopsFilter === '2+';
    if (key === 'refundable') return refundableOnly;
    if (key === 'early') return departTimeRange[0] === 0 && departTimeRange[1] === 6;
    if (key === 'late') return departTimeRange[0] === 18 && departTimeRange[1] === 24;
    return false;
  };
  const handlePopularToggle = (key: string) => {
    if (key === 'nonstop') setStopsFilter(stopsFilter === '0' ? 'all' : '0');
    else if (key === '1stop') setStopsFilter(stopsFilter === '1' ? 'all' : '1');
    else if (key === '1+stop') setStopsFilter(stopsFilter === '2+' ? 'all' : '2+');
    else if (key === 'refundable') setRefundableOnly(!refundableOnly);
    else if (key === 'early') setDepartTimeRange(departTimeRange[0] === 0 && departTimeRange[1] === 6 ? [0, 24] : [0, 6]);
    else if (key === 'late') setDepartTimeRange(departTimeRange[0] === 18 ? [0, 24] : [18, 24]);
  };

  return (
    <div className="space-y-5">
      {/* Popular Filter */}
      {popularFilterStats.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Popular Filter</h4>
          <div className="space-y-2">
            {popularFilterStats.map(pf => (
              <label key={pf.key} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox checked={isPopularActive(pf.key)} onCheckedChange={() => handlePopularToggle(pf.key)} />
                  <span className="text-xs group-hover:text-foreground text-muted-foreground transition-colors truncate">
                    {pf.label} ({pf.count})
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium shrink-0 ml-2">BDT {pf.cheapest.toLocaleString()}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Alliances */}
      {allianceStats.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Alliances</h4>
          <div className="space-y-2">
            {allianceStats.map(a => (
              <label key={a.name} className="flex items-center gap-2 cursor-pointer group">
                <Checkbox checked={selectedAlliances.includes(a.name)} onCheckedChange={() => toggleAlliance(a.name)} />
                <span className="text-xs group-hover:text-foreground text-muted-foreground transition-colors">{a.name} ({a.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Price range</h4>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Minimum Price</span><span>Maximum Price</span></div>
        <div className="flex justify-between text-xs font-semibold mb-2"><span>{priceRange[0].toLocaleString()}</span><span>{priceRange[1].toLocaleString()}</span></div>
        <Slider min={0} max={maxPrice} step={100} value={priceRange} onValueChange={setPriceRange} />
      </div>

      {/* By Duration */}
      {durationBounds.max > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">By Duration</h4>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Minimum Time</span><span>Maximum Time</span></div>
          <div className="flex justify-between text-xs font-semibold mb-2"><span>{fmtDurationMins(durationRange[0])}</span><span>{fmtDurationMins(durationRange[1])}</span></div>
          <Slider min={durationBounds.min} max={durationBounds.max} step={5} value={durationRange} onValueChange={setDurationRange} />
        </div>
      )}

      {/* Onward Journey label for round trips */}
      {isRoundTrip && <Separator className="my-1" />}
      {isRoundTrip && <h4 className="text-sm font-bold text-foreground">Onward Journey</h4>}

      {/* Departure From [Origin] */}
      {timeSlotStats.depart.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Departure {originCode ? `From ${originCode}` : ''}
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {timeSlotStats.depart.map((slot: any) => {
              const Icon = slotIcons[slot.key] || Clock;
              const isActive = departTimeRange[0] === slot.minH && departTimeRange[1] === slot.maxH;
              return (
                <button key={slot.key} onClick={() => setDepartTimeRange(isActive ? [0, 24] : [slot.minH, slot.maxH])}
                  className={`flex flex-col items-start gap-0.5 p-2 rounded-lg border text-left transition-all ${isActive ? 'border-accent bg-accent/5' : 'border-border hover:border-foreground/30'}`}>
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium leading-tight">{slot.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">BDT {slot.cheapest.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Arrival At [Destination] */}
      {timeSlotStats.arrive.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Arrival {destCode ? `At ${destCode}` : ''}
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {timeSlotStats.arrive.map((slot: any) => {
              const Icon = slotIcons[slot.key] || Clock;
              const isActive = arrivalTimeRange[0] === slot.minH && arrivalTimeRange[1] === slot.maxH;
              return (
                <button key={slot.key} onClick={() => setArrivalTimeRange(isActive ? [0, 24] : [slot.minH, slot.maxH])}
                  className={`flex flex-col items-start gap-0.5 p-2 rounded-lg border text-left transition-all ${isActive ? 'border-accent bg-accent/5' : 'border-border hover:border-foreground/30'}`}>
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium leading-tight">{slot.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">BDT {slot.cheapest.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Return Journey label */}
      {isRoundTrip && <Separator className="my-1" />}
      {isRoundTrip && <h4 className="text-sm font-bold text-foreground">Return Journey</h4>}

      {/* Layover Airports */}
      {layoverAirportStats.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Layover Airports</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {layoverAirportStats.map(la => (
              <label key={la.code} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox checked={selectedLayoverAirports.includes(la.code)} onCheckedChange={() => toggleLayoverAirport(la.code)} />
                  <span className="text-[10px] group-hover:text-foreground text-muted-foreground transition-colors leading-tight truncate">
                    {la.name} ({la.count})
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium shrink-0 ml-1">BDT {la.cheapest.toLocaleString()}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Layover Duration */}
      {layoverDurationBounds.max > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Layover duration</h4>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Minimum Time</span><span>Maximum Time</span></div>
          <div className="flex justify-between text-xs font-semibold mb-2"><span>{fmtDurationMins(layoverDurationRange[0])}</span><span>{fmtDurationMins(layoverDurationRange[1])}</span></div>
          <Slider min={layoverDurationBounds.min} max={layoverDurationBounds.max} step={5} value={layoverDurationRange} onValueChange={setLayoverDurationRange} />
        </div>
      )}

      {/* Baggage Filter — chip buttons from real API data */}
      {baggageStats.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Baggage Filter</h4>
          <div className="flex flex-wrap gap-1.5">
            {baggageStats.map(b => {
              const isActive = selectedBaggage.includes(b.label);
              return (
                <button key={b.label} onClick={() => toggleBaggage(b.label)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                    isActive
                      ? "bg-accent/10 border-accent text-accent"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}>
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preferred Airlines — with logos */}
      {airlineList.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Preferred Airlines</h4>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {airlineList.map((a: any) => (
              <label key={a.name} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox checked={selectedAirlines.includes(a.name)} onCheckedChange={() => toggleAirline(a.name)} />
                <img
                  src={getAirlineLogo(a.code) || ''}
                  alt={a.name}
                  className="w-5 h-5 rounded-full object-contain shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xs group-hover:text-foreground text-muted-foreground transition-colors truncate">{a.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Transit Info Tooltip — BDFare-style layover popup ─── */
const TransitTooltipContent = ({ flight, stopIndex }: { flight: any; stopIndex: number }) => {
  const legs = flight.legs || [];
  const stopCodes = flight.stopCodes || [];
  
  // Get transit airport from legs or stopCodes
  let transitCode = "";
  let transitName = "";
  let layoverMins = 0;
  
  if (legs.length > stopIndex + 1) {
    const arrLeg = legs[stopIndex];
    const depLeg = legs[stopIndex + 1];
    transitCode = arrLeg?.destination || stopCodes[stopIndex] || "";
    if (arrLeg?.arrivalTime && depLeg?.departureTime) {
      layoverMins = Math.round((new Date(depLeg.departureTime).getTime() - new Date(arrLeg.arrivalTime).getTime()) / 60000);
    }
  } else if (stopCodes[stopIndex]) {
    transitCode = stopCodes[stopIndex];
  }
  
  transitName = transitCode ? getAirportName(transitCode) : "Transit Airport";
  const h = Math.floor(Math.abs(layoverMins) / 60);
  const m = Math.abs(layoverMins) % 60;
  
  return (
    <div className="text-sm">
      <p className="font-bold text-background mb-2">Transit (Plane Change)</p>
      <p className="text-background/70 text-xs mb-1">{stopIndex + 1}{stopIndex === 0 ? "st" : stopIndex === 1 ? "nd" : "rd"} Transit</p>
      <p className="text-background font-medium text-xs">{transitCode ? `${transitName} (${transitCode})` : "Transit Airport"}</p>
      {layoverMins > 0 && (
        <p className="text-accent font-bold text-xs mt-2">Layover Time: {h > 0 ? `${h}h` : ""}{m > 0 ? `${m}m` : ""}</p>
      )}
    </div>
  );
};

/* ─── Stop Dots with Transit Tooltips ─── */
const StopDotsWithTooltip = ({ flight, stops }: { flight: any; stops: number }) => {
  if (stops === 0) return null;
  
  return (
    <TooltipProvider delayDuration={200}>
      {Array.from({ length: Math.min(stops, 3) }).map((_, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-warning/80 border-2 border-card cursor-pointer hover:scale-150 transition-transform z-10"
              style={{ left: `${((i + 1) / (stops + 1)) * 100}%`, transform: "translate(-50%, -50%)" }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-foreground border-foreground/80 text-background p-3 rounded-xl shadow-2xl max-w-[260px]">
            <TransitTooltipContent flight={flight} stopIndex={i} />
          </TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
};

/* ─── Fare Options Panel — BDFare-inspired but unique design ─── */
const FareOptionsPanel = ({ flights, onBook }: { flights: any[]; onBook: (flight: any) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Build fare options from the flight's fareDetails or generate from the flight itself
  const fareOptions = useMemo(() => {
    if (flights.length === 0) return [];
    const primary = flights[0];
    const fd = primary.fareDetails || [];
    
    // If API returns multiple fare options (branded fares from Sabre/BDFare), use them
    if (fd.length > 1) {
      // Sort by price ascending
      const sorted = [...fd].sort((a: any, b: any) => (a.price || a.amount || 0) - (b.price || b.amount || 0));
      return sorted.map((f: any, i: number) => {
        // Use brand name if available, otherwise generate label
        const label = f.brandName 
          ? f.brandName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          : f.label || `Fare Option ${i + 1}`;
        return {
          id: `option-${i}`,
          label,
          handBaggage: f.handBaggage || primary.handBaggage || null,
          checkedBaggage: f.baggage || f.checkedBaggage || primary.baggage || null,
          meal: f.mealIncluded ? "Included" : null,
          seatSelection: f.seatSelection ?? false,
          rebooking: f.rebookingAllowed !== false,
          cancellation: f.cancellationAllowed !== false,
          miles: f.milesAccrual ?? false,
          bookingClass: f.bookingClass || f.cabinClass || primary.bookingClass || "",
          grossFare: f.price || f.amount || f.total || primary.price || 0,
          refundable: f.refundable ?? primary.refundable ?? false,
          flight: { ...primary, price: f.price || primary.price, fareDetails: [f] },
          isBestValue: i === 0,
        };
      });
    } else if (fd.length === 1 && fd[0].brandName) {
      // Single branded fare
      const f = fd[0];
      return [{
        id: "option-0",
        label: f.brandName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
        handBaggage: f.handBaggage || primary.handBaggage || null,
        checkedBaggage: f.baggage || primary.baggage || null,
        meal: f.mealIncluded ? "Included" : null,
        seatSelection: f.seatSelection ?? false,
        rebooking: f.rebookingAllowed !== false,
        cancellation: f.cancellationAllowed !== false,
        miles: false,
        bookingClass: f.bookingClass || primary.bookingClass || "",
        grossFare: f.price || primary.price || 0,
        refundable: f.refundable ?? primary.refundable ?? false,
        flight: primary,
        isBestValue: true,
      }];
    }
    
    // Generate a single option from the flight data
    return [{
      id: "option-0",
      label: "Available Fare",
      handBaggage: primary.handBaggage || null,
      checkedBaggage: primary.baggage || null,
      meal: primary.mealIncluded ? "Included" : null,
      seatSelection: false,
      rebooking: true,
      cancellation: primary.refundable ?? false,
      miles: false,
      bookingClass: primary.bookingClass || primary.cabinClass?.charAt(0) || "",
      grossFare: primary.price || 0,
      refundable: primary.refundable ?? false,
      flight: primary,
      isBestValue: true,
    }];
  }, [flights]);

  const fareTypeLabels = [
    { key: "handBaggage", label: "Hand Baggage", icon: Package },
    { key: "checkedBaggage", label: "Checked Baggage", icon: Luggage },
    { key: "meal", label: "Meal", icon: () => <span className="text-base">🍽</span> },
    { key: "seatSelection", label: "Seat Selection", icon: () => <span className="text-base">💺</span> },
    { key: "rebooking", label: "Rebooking", icon: FileText },
    { key: "cancellation", label: "Cancellation", icon: Shield },
    { key: "miles", label: "Miles", icon: Star },
    { key: "bookingClass", label: "Booking Class", icon: () => <span className="text-base">🎫</span> },
  ];

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
      className="overflow-hidden border-t border-border">
      <div className="p-4 sm:p-5 bg-muted/10">
        <div className="flex gap-0">
          {/* Left: Fare Type Labels */}
          <div className="w-40 shrink-0 pt-12">
            {fareTypeLabels.map((ft) => {
              const Icon = ft.icon;
              return (
                <div key={ft.key} className="h-11 flex items-center gap-2 px-3">
                  <span className="text-muted-foreground"><Icon className="w-4 h-4" /></span>
                  <span className="text-xs font-medium text-muted-foreground">{ft.label}</span>
                </div>
              );
            })}
            <div className="h-16" />
          </div>

          {/* Right: Scrollable fare options */}
          <div className="flex-1 relative min-w-0">
            {fareOptions.length > 2 && (
              <>
                <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
                  onClick={() => scrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
                  onClick={() => scrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-none px-1">
              {fareOptions.map((opt, idx) => (
                <div key={opt.id}
                  className={`shrink-0 w-48 rounded-xl border transition-all hover:shadow-md ${
                    opt.isBestValue ? "border-accent/40 bg-accent/[0.03] shadow-sm" : "border-border bg-card"
                  }`}>
                  {/* Header */}
                  <div className={`px-4 py-3 rounded-t-xl text-center ${
                    opt.isBestValue ? "bg-accent/10" : "bg-muted/40"
                  }`}>
                    <p className={`text-sm font-bold ${opt.isBestValue ? "text-accent" : "text-foreground"}`}>{opt.label}</p>
                    {opt.isBestValue && <p className="text-[10px] text-accent/70 font-medium mt-0.5">Best Value</p>}
                  </div>

                  {/* Values */}
                  <div>
                    {fareTypeLabels.map((ft) => {
                      const val = opt[ft.key as keyof typeof opt];
                      let display: React.ReactNode;

                      if (ft.key === "handBaggage" || ft.key === "checkedBaggage" || ft.key === "meal") {
                        display = val ? <span className="text-xs font-medium text-foreground">{String(val)}</span> : <span className="text-xs text-muted-foreground">Not included</span>;
                      } else if (ft.key === "bookingClass") {
                        display = <span className="text-xs font-semibold text-foreground">{String(val || "—")}</span>;
                      } else if (typeof val === "boolean") {
                        display = val
                          ? <span className="text-xs font-medium text-accent">Available</span>
                          : <X className="w-4 h-4 text-destructive/60 mx-auto" />;
                      } else if (typeof val === "string" && val) {
                        display = <span className="text-xs font-medium text-warning">{val}</span>;
                      } else {
                        display = <X className="w-4 h-4 text-destructive/60 mx-auto" />;
                      }

                      return (
                        <div key={ft.key} className="h-11 flex items-center justify-center px-3 border-t border-border/30">
                          {display}
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer: Gross Fare + Book */}
                  <div className="px-4 py-3 border-t border-border/50 text-center space-y-2">
                    <p className="text-[10px] text-muted-foreground">Gross Fare</p>
                    <p className="text-base font-black text-foreground">BDT {opt.grossFare.toLocaleString()}</p>
                    <Button size="sm" className="w-full font-bold rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground h-9"
                      onClick={() => onBook(opt.flight)}>
                      Book Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Reward Points Calculator — 1% of fare ─── */
function calcRewardPoints(price: number): number {
  return Math.round(price * 0.01);
}

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
      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">
        <span className={`font-semibold ${labelColor}`}>{label}:</span>{" "}
        {flight.airline}, {formatShortDate(flight.departureTime)}
      </p>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Origin */}
        <div className="text-center shrink-0">
          <p className="text-[10px] sm:text-[10px] font-medium text-muted-foreground">{fromCode}</p>
          <p className="text-sm sm:text-base lg:text-lg font-black tracking-tight">{departTime}</p>
        </div>

        {/* Duration bar */}
        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-[40px]">
          <div className="w-full flex items-center">
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
            <div className="flex-1 h-[1px] bg-border relative">
              <Plane className="w-3 h-3 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <StopDotsWithTooltip flight={flight} stops={stops} />
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
          </div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground">{duration}</p>
          <p className={`text-[9px] sm:text-[10px] font-semibold ${stops === 0 ? "text-foreground" : "text-warning"}`}>{stopsLabel}</p>
        </div>

        {/* Destination */}
        <div className="text-center shrink-0">
          <p className="text-[10px] sm:text-[10px] font-medium text-muted-foreground">{toCode}</p>
          <p className="text-sm sm:text-base lg:text-lg font-black tracking-tight">
            {arriveTime}
            {nextDay && <sup className="text-[7px] text-destructive font-bold ml-0.5">+1</sup>}
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
  const [showFareOptions, setShowFareOptions] = useState(false);
  const logo = getAirlineLogo(outbound.airlineCode);
  const totalPrice = (outbound.price || 0) + (returnFlight.price || 0);
  const refundable = outbound.refundable ?? false;
  const fareType = outbound.fareType || (refundable ? "Refundable" : "Non-Refundable");
  const flightNo = [outbound.flightNumber, returnFlight.flightNumber].filter(Boolean).join(", ");

  return (
    <Card className={`overflow-hidden transition-all border ${isExpanded ? "border-accent/30 shadow-md" : "border-border hover:shadow-md"}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row min-w-0">
          {/* Airline section */}
          <div className="flex items-center gap-3 p-3 sm:p-4 sm:w-36 lg:w-40 shrink-0 border-b sm:border-b-0 sm:border-r border-border/50">
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
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold leading-tight truncate">{outbound.airline}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">{flightNo}</p>
            </div>
          </div>

          {/* Both legs side by side */}
          <div className="flex-1 flex flex-col sm:flex-row p-3 sm:p-4 gap-3 sm:gap-3 min-w-0">
            <LegMini flight={outbound} label="Departure" labelColor="text-foreground" />
            <div className="hidden sm:block w-px bg-border/60 self-stretch shrink-0" />
            <div className="sm:hidden h-px bg-border/60" />
            <LegMini flight={returnFlight} label="Return" labelColor="text-foreground" />
          </div>

          {/* Price */}
          <div className="flex flex-col items-end gap-1 p-3 sm:p-4 sm:w-40 lg:w-48 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              {totalPrice === cheapest && totalPrice > 0 && (
                <Badge className="bg-accent/10 text-accent border-0 text-[9px] font-bold">Cheapest</Badge>
              )}
              {/* Reward Points Badge */}
              {totalPrice > 0 && (
                <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 text-[9px] font-bold flex items-center gap-1">
                  <span className="text-sm">🪙</span> +{calcRewardPoints(totalPrice).toLocaleString()}
                </Badge>
              )}
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-black leading-none whitespace-nowrap">BDT {totalPrice.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Price for {parseInt(new URLSearchParams(window.location.search).get("adults") || "1")} traveller{parseInt(new URLSearchParams(window.location.search).get("adults") || "1") > 1 ? "s" : ""}</p>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-[11px] text-accent font-semibold flex items-center gap-1 hover:underline mt-0.5">
                  Price Breakdown <ChevronRight className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="left" className="w-64 p-3">
                <p className="text-xs font-bold mb-2">Fare Breakdown</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Outbound</span><span className="font-medium">BDT {(outbound.price || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Return</span><span className="font-medium">BDT {(returnFlight.price || 0).toLocaleString()}</span></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold"><span>Total</span><span>BDT {totalPrice.toLocaleString()}</span></div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Baggage + Seats + Class info row — BDFare style */}
        <div className="flex items-center flex-wrap gap-3 px-3 sm:px-5 py-2 border-t border-border/30">
          {outbound.handBaggage && (
            <span className="flex items-center gap-1.5 text-xs text-accent font-medium">
              <Package className="w-3.5 h-3.5" /> {outbound.handBaggage}
            </span>
          )}
          {outbound.baggage && (
            <span className="flex items-center gap-1.5 text-xs text-accent font-medium">
              <Luggage className="w-3.5 h-3.5" /> {outbound.baggage}
            </span>
          )}
          {(outbound.availableSeats ?? null) !== null && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Users className="w-3.5 h-3.5" /> {outbound.availableSeats} Seat{outbound.availableSeats !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-medium">Class: {outbound.bookingClass || outbound.cabinClass?.charAt(0) || "Y"}</span>
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
              onClick={() => setShowFareOptions(!showFareOptions)}>
              View Prices {showFareOptions ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Fare Options Panel */}
        <AnimatePresence>
          {showFareOptions && (
            <FareOptionsPanel flights={[{ ...outbound, price: totalPrice, baggage: outbound.baggage, handBaggage: outbound.handBaggage, fareDetails: outbound.fareDetails }]}
              onBook={() => cardNavigate(`/flights/book?roundTrip=true&adults=${cardSearchParams.get("adults") || "1"}&children=${cardSearchParams.get("children") || "0"}&infants=${cardSearchParams.get("infants") || "0"}&cabin=${cardSearchParams.get("cabin") || "economy"}`, { state: { outboundFlight: outbound, returnFlight } })} />
          )}
        </AnimatePresence>

        {/* Expanded detail - tabbed view like FlightCard */}
        <AnimatePresence>
          {isExpanded && (() => {
            const paxAdults = parseInt(cardSearchParams.get("adults") || "1");
            const paxChildren = parseInt(cardSearchParams.get("children") || "0");
            const paxInfants = parseInt(cardSearchParams.get("infants") || "0");
            const obBaggage = outbound.baggage || null;
            const retBaggage = returnFlight.baggage || null;

            // Build fare rows — derive baseFare as (price - taxes) to ensure BDT consistency
            const obPrice = outbound.price ?? 0;
            const obTax = outbound.taxes ?? 0;
            const obBase = Math.max(0, Math.round(obPrice - obTax));
            const retPrice = returnFlight.price ?? 0;
            const retTax = returnFlight.taxes ?? 0;
            const retBase = Math.max(0, Math.round(retPrice - retTax));
            const combinedBase = obBase + retBase;
            const combinedTax = obTax + retTax;
            const combinedPrice = totalPrice;

            const DISCOUNT_PCT = outbound.fareRules?.discount ?? 6.30;
            const AIT_VAT_PCT = outbound.fareRules?.aitVat ?? 0.3;

            const fareRows: { paxType: string; baseFare: number; tax: number; other: number; discount: number; aitVat: number; count: number; amount: number }[] = [];
            if (paxAdults > 0) {
              const disc = Math.round(combinedBase * DISCOUNT_PCT / 100);
              const aitVat = Math.round((combinedBase - disc) * AIT_VAT_PCT / 100);
              fareRows.push({ paxType: "Adult", baseFare: combinedBase, tax: combinedTax, other: 0, discount: disc, aitVat, count: paxAdults, amount: (combinedBase - disc + combinedTax + aitVat) * paxAdults });
            }
            if (paxChildren > 0) {
              const childBase = Math.round(combinedBase * 0.75);
              const disc = Math.round(childBase * DISCOUNT_PCT / 100);
              const aitVat = Math.round((childBase - disc) * AIT_VAT_PCT / 100);
              fareRows.push({ paxType: "Child", baseFare: childBase, tax: combinedTax, other: 0, discount: disc, aitVat, count: paxChildren, amount: (childBase - disc + combinedTax + aitVat) * paxChildren });
            }
            if (paxInfants > 0) {
              const infantBase = Math.round(combinedBase * 0.1);
              const infantTax = Math.round(combinedTax * 0.5);
              const disc = Math.round(infantBase * DISCOUNT_PCT / 100);
              const aitVat = Math.round((infantBase - disc) * AIT_VAT_PCT / 100);
              fareRows.push({ paxType: "Infant", baseFare: infantBase, tax: infantTax, other: 0, discount: disc, aitVat, count: paxInfants, amount: (infantBase - disc + infantTax + aitVat) * paxInfants });
            }
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
                                  {/* Layover between segments */}
                                  {i < (legs.length > 0 ? legs.length : 1) - 1 && legs.length > 1 && (() => {
                                    const nextSeg = legs[i + 1];
                                    const transitCode = segment.destination || "";
                                    const transitCity = transitCode ? getAirportCity(transitCode) : "";
                                    let layoverStr = "";
                                    if (nextSeg?.departureTime && segment.arrivalTime) {
                                      const layoverMin = Math.round((new Date(nextSeg.departureTime).getTime() - new Date(segment.arrivalTime).getTime()) / 60000);
                                      const h = Math.floor(layoverMin / 60);
                                      const m = layoverMin % 60;
                                      layoverStr = `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`;
                                    }
                                    return (
                                      <div className="flex items-center gap-2 py-3 px-4 my-2">
                                        <div className="flex-1 h-px bg-warning/30" />
                                        <div className="flex items-center gap-2 text-xs bg-warning/10 px-4 py-2 rounded-full border border-warning/20">
                                          <span className="text-destructive font-semibold">Change of planes</span>
                                          <span className="text-foreground font-medium">
                                            {layoverStr && <>{layoverStr} </>}Layover{transitCity ? ` in ${transitCity}` : ""}
                                          </span>
                                        </div>
                                        <div className="flex-1 h-px bg-warning/30" />
                                      </div>
                                    );
                                  })()}
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

/* ─── Multi-City Expanded Details Panel — matches one-way/round-trip system ─── */
const MultiCityExpandedDetails = ({ flight, segments }: { flight: any; segments: any[] }) => {
  const [activeTab, setActiveTab] = useState("itinerary");
  const [cardSearchParams] = useSearchParams();
  const price = flight.price ?? 0;
  const taxes = flight.taxes ?? 0;
  const baseFare = Math.max(0, Math.round(price - taxes));
  const refundable = flight.refundable ?? false;

  // Fare calculation matching one-way/round-trip
  const paxAdults = parseInt(cardSearchParams.get("adults") || "1");
  const paxChildren = parseInt(cardSearchParams.get("children") || "0");
  const paxInfants = parseInt(cardSearchParams.get("infants") || "0");
  const DISCOUNT_PCT = flight.fareRules?.discount ?? 6.3;
  const AIT_VAT_PCT = flight.fareRules?.aitVat ?? 0.3;

  const fareRows: { paxType: string; baseFare: number; tax: number; other: number; discount: number; aitVat: number; count: number; amount: number }[] = [];
  if (paxAdults > 0) {
    const disc = Math.round(baseFare * DISCOUNT_PCT / 100);
    const aitVat = Math.round((baseFare - disc) * AIT_VAT_PCT / 100);
    fareRows.push({ paxType: "Adult", baseFare, tax: taxes, other: 0, discount: disc, aitVat, count: paxAdults, amount: (baseFare - disc + taxes + aitVat) * paxAdults });
  }
  if (paxChildren > 0) {
    const childBase = Math.round(baseFare * 0.75);
    const disc = Math.round(childBase * DISCOUNT_PCT / 100);
    const aitVat = Math.round((childBase - disc) * AIT_VAT_PCT / 100);
    fareRows.push({ paxType: "Child", baseFare: childBase, tax: taxes, other: 0, discount: disc, aitVat, count: paxChildren, amount: (childBase - disc + taxes + aitVat) * paxChildren });
  }
  if (paxInfants > 0) {
    const infantBase = Math.round(baseFare * 0.1);
    const infantTax = Math.round(taxes * 0.5);
    const disc = Math.round(infantBase * DISCOUNT_PCT / 100);
    const aitVat = Math.round((infantBase - disc) * AIT_VAT_PCT / 100);
    fareRows.push({ paxType: "Infant", baseFare: infantBase, tax: infantTax, other: 0, discount: disc, aitVat, count: paxInfants, amount: (infantBase - disc + infantTax + aitVat) * paxInfants });
  }
  const totalPayable = fareRows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="border-t border-border/50 bg-muted/10">
      {/* Tabs */}
      <div className="flex border-b border-border/50">
        <div className="flex overflow-x-auto scrollbar-none">
          {[
            { key: "itinerary", label: "Flight Details" },
            { key: "fare", label: "Fare Summary" },
            { key: "baggage", label: "Baggage" },
            { key: "cancellation", label: "Cancellation" },
            { key: "datechange", label: "Date Change" },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="ml-auto px-3 flex items-center">
          <button className="flex items-center gap-1 text-accent text-xs font-semibold hover:underline">
            <Info className="w-3 h-3" /> Fare terms &amp; policy
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Flight Details Tab — full airport names, layover info, seats left */}
        {activeTab === "itinerary" && (
          <div className="space-y-6">
            {segments.map((seg: any, i: number) => {
              const segLegs = seg.legs || [];
              const logo = getAirlineLogo(seg.airlineCode);
              const cabin = seg.cabinClass || flight.cabinClass || "Economy";
              const bkClass = seg.bookingClass || flight.bookingClass || "";
              const cabDisp = bkClass ? `${cabin} - ${bkClass}` : cabin;
              const seats = seg.availableSeats ?? flight.availableSeats ?? null;
              const ac = seg.aircraft || "";

              return (
                <div key={i}>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Plane className="w-4 h-4 text-accent" />
                    {seg.origin} → {seg.destination}
                    <span className="text-muted-foreground font-normal text-xs">· {formatShortDate(seg.departureTime)}</span>
                    <span className="text-muted-foreground font-normal text-xs">· {seg.stops === 0 ? "Non-Stop" : `${seg.stops} Stop${seg.stops > 1 ? "s" : ""}`}</span>
                  </h4>
                  {(segLegs.length > 0 ? segLegs : [{ origin: seg.origin, destination: seg.destination, departureTime: seg.departureTime, arrivalTime: seg.arrivalTime, duration: seg.duration, flightNumber: seg.flightNumber, airlineCode: seg.airlineCode, aircraft: ac }]).map((leg: any, li: number) => (
                    <div key={li} className="space-y-3 mb-4">
                      {/* Airline info row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {logo && <img src={logo} alt="" className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                        <span className="text-sm font-semibold">{seg.airline || flight.airline}</span>
                        <span className="text-sm text-muted-foreground">{leg.flightNumber || seg.flightNumber}</span>
                        {(leg.aircraft || ac) && <><span className="text-muted-foreground text-sm">|</span><span className="text-sm text-muted-foreground">{leg.aircraft || ac}</span></>}
                        <span className="text-muted-foreground text-sm">|</span>
                        <span className="text-sm font-medium">{cabDisp}</span>
                        {seats !== null && seats <= 9 && <span className="text-sm text-orange-500 font-bold">{seats} Seat{seats !== 1 ? "s" : ""} Left</span>}
                      </div>
                      {/* Times with arc and full airport names */}
                      <div className="flex items-start justify-between pt-2 pb-1">
                        <div className="text-left shrink-0 max-w-[38%]">
                          <p className="text-xl font-black">{formatTime(leg.departureTime || seg.departureTime)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatShortDate(leg.departureTime || seg.departureTime)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{getAirportName(leg.origin || seg.origin)} ({leg.origin || seg.origin})</p>
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
                          <p className="text-xs text-muted-foreground font-medium -mt-0.5">{leg.duration || seg.duration}</p>
                        </div>
                        <div className="text-right shrink-0 max-w-[38%]">
                          <p className="text-xl font-black">{formatTime(leg.arrivalTime || seg.arrivalTime)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatShortDate(leg.arrivalTime || seg.arrivalTime)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{getAirportName(leg.destination || seg.destination)} ({leg.destination || seg.destination})</p>
                        </div>
                      </div>
                      {/* Layover between legs */}
                      {li < (segLegs.length > 0 ? segLegs.length : 1) - 1 && segLegs.length > 1 && (() => {
                        const nextLeg = segLegs[li + 1];
                        const transitCode = leg.destination || "";
                        const transitCity = transitCode ? getAirportCity(transitCode) : "";
                        let layoverStr = "";
                        if (nextLeg?.departureTime && leg.arrivalTime) {
                          const layoverMin = Math.round((new Date(nextLeg.departureTime).getTime() - new Date(leg.arrivalTime).getTime()) / 60000);
                          const h = Math.floor(layoverMin / 60);
                          const m = layoverMin % 60;
                          layoverStr = `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`;
                        }
                        return (
                          <div className="flex items-center gap-2 py-3 px-4 my-2">
                            <div className="flex-1 h-px bg-warning/30" />
                            <div className="flex items-center gap-2 text-xs bg-warning/10 px-4 py-2 rounded-full border border-warning/20">
                              <span className="text-destructive font-semibold">Change of planes</span>
                              <span className="text-foreground font-medium">
                                {layoverStr && <>{layoverStr} </>}Layover{transitCity ? ` in ${transitCity}` : ""}
                              </span>
                            </div>
                            <div className="flex-1 h-px bg-warning/30" />
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Fare Summary — full table with Discount, AIT VAT matching one-way/round-trip */}
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

        {/* Baggage — table layout matching one-way/round-trip */}
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
                {segments.map((seg: any, i: number) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="px-4 py-3 font-semibold text-base"><span className="flex items-center gap-2">{seg.origin} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {seg.destination}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{seg.baggage ? `ADT : ${seg.baggage}` : "Not provided"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{seg.handBaggage ? `ADT : ${seg.handBaggage}` : "Not provided"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cancellation — sector-based matching one-way/round-trip */}
        {activeTab === "cancellation" && (
          <div className="space-y-4">
            {segments.map((seg: any, i: number) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 text-base font-semibold">
                  {seg.origin} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {seg.destination}
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="border-t border-border">
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">Timeframe<br/><span className="font-normal text-xs text-muted-foreground">(From Scheduled flight departure)</span></th>
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">Airline Fee + Service Fee<br/><span className="font-normal text-xs text-muted-foreground">(Per passenger)</span></th>
                  </tr></thead>
                  <tbody><tr className="border-t border-border/50">
                    <td className="px-4 py-3 text-muted-foreground">Any Time</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {seg.cancellationPolicy?.beforeDeparture != null
                        ? `Cancellation allowed with fees + BDT ${Number(seg.cancellationPolicy.beforeDeparture).toLocaleString()}`
                        : refundable ? "Cancellation allowed with fees" : "Non-refundable"}
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

        {/* Date Change — sector-based matching one-way/round-trip */}
        {activeTab === "datechange" && (
          <div className="space-y-4">
            {segments.map((seg: any, i: number) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 text-base font-semibold">
                  {seg.origin} <Plane className="w-3.5 h-3.5 text-muted-foreground" /> {seg.destination}
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="border-t border-border">
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">Timeframe<br/><span className="font-normal text-xs text-muted-foreground">(From Scheduled flight departure)</span></th>
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">Airline Fee + Service Fee + Fare difference<br/><span className="font-normal text-xs text-muted-foreground">(Per passenger)</span></th>
                  </tr></thead>
                  <tbody><tr className="border-t border-border/50">
                    <td className="px-4 py-3 text-muted-foreground">Any Time</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {seg.dateChangePolicy?.changeAllowed === false
                        ? "Date change not permitted"
                        : seg.dateChangePolicy?.changeFee != null
                          ? `Date change allowed with fees + BDT ${Number(seg.dateChangePolicy.changeFee).toLocaleString()}`
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
  );
};

/* ─── Multi-City Flight Card — combined itinerary with all segments ─── */
const MultiCityFlightCard = ({
  flight, cheapest, isExpanded, onToggleExpand,
}: {
  flight: any; cheapest: number; isExpanded: boolean; onToggleExpand: () => void;
}) => {
  const cardNavigate = useNavigate();
  const [cardSearchParams] = useSearchParams();
  const segments = flight.segments || [];
  const price = flight.price ?? 0;
  const refundable = flight.refundable ?? false;
  const fareType = flight.fareType || (refundable ? "Refundable" : "Non-Refundable");

  return (
    <Card className={`overflow-hidden transition-all border ${isExpanded ? "border-accent/30 shadow-md" : "border-border hover:shadow-md"}`}>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* All segment legs */}
          <div className="flex-1 flex flex-col">
            {segments.map((seg: any, i: number) => {
              const logo = getAirlineLogo(seg.airlineCode);
              const segLegs = seg.legs || [];
              return (
                <div key={i} className={`flex items-center gap-3 sm:gap-5 p-3 sm:p-4 ${i > 0 ? "border-t border-border/50" : ""}`}>
                  {/* Airline */}
                  <div className="flex flex-col items-center gap-1 w-20 sm:w-24 shrink-0">
                    {logo ? <img src={logo} alt={seg.airline} className="w-8 h-8 object-contain" /> : <Plane className="w-6 h-6 text-muted-foreground" />}
                    <p className="text-[10px] text-muted-foreground font-medium truncate max-w-full">{seg.airline}</p>
                    <p className="text-[9px] text-muted-foreground">{seg.flightNumber}</p>
                  </div>
                  {/* Times */}
                  <div className="flex-1 flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="text-center shrink-0">
                      <p className="text-lg sm:text-xl font-black leading-tight">{formatTime(seg.departureTime)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatShortDate(seg.departureTime)}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">{seg.origin}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-0.5 min-w-[80px]">
                      <p className="text-[10px] text-muted-foreground">{seg.duration}</p>
                      <div className="w-full flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <div className="flex-1 h-px bg-border relative">
                          {seg.stops > 0 && <Plane className="w-3 h-3 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />}
                        </div>
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      </div>
                      <p className={`text-[10px] font-bold ${seg.stops === 0 ? "text-accent" : "text-destructive"}`}>
                        {seg.stops === 0 ? "Non-Stop" : `${seg.stops} Stop${seg.stops > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div className="text-center shrink-0">
                      <p className="text-lg sm:text-xl font-black leading-tight">{formatTime(seg.arrivalTime)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatShortDate(seg.arrivalTime)}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">{seg.destination}</p>
                    </div>
                  </div>
                  {/* Baggage + class (only on first row) or segment label */}
                  <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 w-24">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {seg.handBaggage && <span className="flex items-center gap-0.5 text-accent"><Luggage className="w-3 h-3" /> {seg.handBaggage}</span>}
                      {seg.baggage && <span className="flex items-center gap-0.5 text-accent"><Luggage className="w-3 h-3" /> {seg.baggage}</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Class: {flight.bookingClass || "E"}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Price section */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-t border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              {price === cheapest && price > 0 && <Badge className="bg-accent/10 text-accent border-0 text-[9px] font-bold">Cheapest</Badge>}
              {price > 0 && (
                <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 text-[9px] font-bold flex items-center gap-1">
                  <span className="text-sm">🪙</span> +{calcRewardPoints(price).toLocaleString()}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-black text-accent">BDT {price.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Price for {parseInt(cardSearchParams.get("adults") || "1")} traveller{parseInt(cardSearchParams.get("adults") || "1") > 1 ? "s" : ""}</p>
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
            {flight.airlineCode?.toUpperCase() !== "BG" && (
              <span className="text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">Book &amp; Hold</span>
            )}
          </div>
          <Button size="sm" className="font-bold h-9 px-5 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => {
              const bookingSegments = flight?.segments?.length > 0 ? flight.segments : [flight];
              cardNavigate(`/flights/book?multiCity=true&adults=${cardSearchParams.get("adults") || "1"}&children=${cardSearchParams.get("children") || "0"}&infants=${cardSearchParams.get("infants") || "0"}&cabin=${cardSearchParams.get("cabin") || "economy"}`, {
                state: { outboundFlight: bookingSegments[0], multiCityFlights: bookingSegments },
              });
            }}>
            Book Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* Expanded Details Panel */}
        {isExpanded && (
          <MultiCityExpandedDetails flight={flight} segments={segments} />
        )}
      </CardContent>
    </Card>
  );
};


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
  const taxes = flight.taxes ?? 0;
  // CRITICAL: baseFare from API may be in foreign currency (e.g. USD from Sabre).
  // Always derive baseFare in BDT as (price - taxes) to ensure the breakdown sums correctly.
  const baseFare = Math.max(0, Math.round(price - taxes));
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
  const [showFareOptions, setShowFareOptions] = useState(false);

  const stopsLabel = stops === 0 ? "Non-Stop" : `${stops} Stop${stops > 1 ? "s" : ""}`;
  const cabinDisplay = bookingClass ? `${cabin} - ${bookingClass}` : cabin;
  const distanceKm = calcDistanceKm(fromCode, toCode);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  return (
    <Card className={`overflow-hidden transition-all border ${isSelected ? "border-accent ring-2 ring-accent/20 shadow-lg" : isExpanded ? "border-accent/30 shadow-md" : "border-border hover:shadow-md"}`}>
      <CardContent className="p-0">
        {/* ── Main card row ── */}
        <div className="flex flex-col sm:flex-row min-w-0">
          {/* Airline section */}
          <div className="flex items-center gap-3 p-3 sm:p-4 sm:w-36 lg:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-border/50">
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
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold leading-tight truncate">{flight.airline}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">{flightNo}</p>
              {availableSeats !== null && availableSeats <= 9 && (
                <p className="text-[10px] sm:text-[11px] font-bold text-orange-500 mt-0.5">{availableSeats} Seat{availableSeats !== 1 ? "s" : ""} Left</p>
              )}
            </div>
          </div>

          {/* Flight times + baggage info */}
          <div className="flex-1 p-3 sm:p-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-5">
              {/* Departure */}
              <div className="text-center shrink-0">
                <p className="text-lg sm:text-2xl font-black tracking-tight">{departTime}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5">{departDateStr}</p>
              </div>

              {/* Duration bar */}
              <div className="flex-1 flex flex-col items-center gap-0.5 sm:gap-1 min-w-[60px] sm:min-w-[100px]">
                <div className="w-full relative">
                  <div className="w-full flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    <div className="flex-1 h-[1.5px] bg-border relative">
                      <Plane className="w-4 h-4 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      <StopDotsWithTooltip flight={flight} stops={stops} />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{duration}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-[11px] font-semibold ${stops === 0 ? "text-foreground" : "text-warning"}`}>{stopsLabel}</p>
                  {distanceKm && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {distanceKm.toLocaleString()} Km
                    </span>
                  )}
                </div>
              </div>

              {/* Arrival */}
              <div className="text-center shrink-0">
                <p className="text-lg sm:text-2xl font-black tracking-tight">
                  {arriveTime}
                  {nextDay && <sup className="text-[8px] sm:text-[9px] text-destructive font-bold ml-0.5">+1 days</sup>}
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5">{arriveDateStr}</p>
              </div>
            </div>

            {/* Baggage + Seats + Class info row — BDFare style */}
            <div className="flex items-center flex-wrap gap-3 mt-2">
              {handBaggage && (
                <span className="flex items-center gap-1.5 text-xs text-accent font-medium">
                  <Package className="w-3.5 h-3.5" /> {handBaggage}
                </span>
              )}
              {baggage && (
                <span className="flex items-center gap-1.5 text-xs text-accent font-medium">
                  <Luggage className="w-3.5 h-3.5" /> {baggage}
                </span>
              )}
              {availableSeats !== null && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Users className="w-3.5 h-3.5" /> {availableSeats} Seat{availableSeats !== 1 ? "s" : ""}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-medium">Class: {bookingClass || cabin.charAt(0)}</span>
            </div>
          </div>

          {/* Price section */}
          <div className="flex flex-col items-end gap-1 p-4 sm:p-5 sm:w-56 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              {price === cheapest && price > 0 && (
                <Badge className="bg-accent/10 text-accent border-0 text-[9px] font-bold">Cheapest</Badge>
              )}
              {/* Reward Points Badge */}
              {price > 0 && (
                <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 text-[9px] font-bold flex items-center gap-1">
                  <span className="text-sm">🪙</span> +{calcRewardPoints(price).toLocaleString()}
                </Badge>
              )}
            </div>
            <p className="text-xl sm:text-2xl font-black leading-none whitespace-nowrap">BDT {price.toLocaleString()}</p>
            {baseFare > 0 && (
              <p className="text-[10px] text-muted-foreground line-through">BDT {Math.round(price * 1.05).toLocaleString()}</p>
            )}
            <p className="text-[10px] text-muted-foreground">Price for {parseInt(new URLSearchParams(window.location.search).get("adults") || "1")} traveller{parseInt(new URLSearchParams(window.location.search).get("adults") || "1") > 1 ? "s" : ""}</p>
            <Popover open={showPriceBreakdown} onOpenChange={setShowPriceBreakdown}>
              <PopoverTrigger asChild>
                <button className="text-[11px] text-accent font-semibold flex items-center gap-1 hover:underline mt-0.5">
                  Price Breakdown <ChevronRight className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="left" className="w-64 p-3">
                <p className="text-xs font-bold mb-2">Fare Breakdown</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Base Fare</span><span className="font-medium">BDT {baseFare.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxes & Fees</span><span className="font-medium">BDT {taxes.toLocaleString()}</span></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold"><span>Total</span><span>BDT {price.toLocaleString()}</span></div>
                </div>
              </PopoverContent>
            </Popover>
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
              <Button size="sm" className="font-bold h-9 px-5 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => setShowFareOptions(!showFareOptions)}>
                View Prices {showFareOptions ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
              </Button>
            )}
          </div>
        </div>

        {/* Fare Options Panel */}
        <AnimatePresence>
          {showFareOptions && (
            <FareOptionsPanel flights={[flight]}
              onBook={() => cardNavigate(`/flights/book?adults=${cardSearchParams.get("adults") || "1"}&children=${cardSearchParams.get("children") || "0"}&infants=${cardSearchParams.get("infants") || "0"}&cabin=${cardSearchParams.get("cabin") || "economy"}`, { state: { outboundFlight: flight } })} />
          )}
        </AnimatePresence>

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

                            {/* Transit between legs — BDFare style: "Change of planes Xh Ym Layover in City" */}
                            {i < (legs.length > 0 ? legs.length : 1) - 1 && legs.length > 1 && (
                              <div className="flex items-center gap-2 py-3 px-4 my-2">
                                <div className="flex-1 h-px bg-warning/30" />
                                <div className="flex items-center gap-2 text-xs bg-warning/10 px-4 py-2 rounded-full border border-warning/20">
                                  <span className="text-destructive font-semibold">Change of planes</span>
                                  {(() => {
                                    const transitCode = leg.destination || stopCodes[i] || "";
                                    const transitCity = transitCode ? getAirportCity(transitCode) : "";
                                    let layoverStr = "";
                                    if (legs[i + 1]?.departureTime && leg.arrivalTime) {
                                      const layoverMin = Math.round((new Date(legs[i + 1].departureTime).getTime() - new Date(leg.arrivalTime).getTime()) / 60000);
                                      const h = Math.floor(layoverMin / 60);
                                      const m = layoverMin % 60;
                                      layoverStr = `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`;
                                    }
                                    return (
                                      <span className="text-foreground font-medium">
                                        {layoverStr && <>{layoverStr} </>}Layover{transitCity ? ` in ${transitCity}` : ""}
                                      </span>
                                    );
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
                    // Discount and AIT VAT percentages from server-side per-airline fare rules
                    const DISCOUNT_PCT = flight.fareRules?.discount ?? 6.30;
                    const AIT_VAT_PCT = flight.fareRules?.aitVat ?? 0.3;

                    const fareRows: { paxType: string; baseFare: number; tax: number; other: number; discount: number; aitVat: number; count: number; amount: number }[] = [];

                    // Construct fare rows with discount and AIT VAT
                    if (paxAdults > 0) {
                      const disc = Math.round(baseFare * DISCOUNT_PCT / 100);
                      const aitVat = Math.round((baseFare - disc) * AIT_VAT_PCT / 100);
                      fareRows.push({ paxType: "Adult", baseFare, tax: taxes, other: 0, discount: disc, aitVat, count: paxAdults, amount: (baseFare - disc + taxes + aitVat) * paxAdults });
                    }
                    if (paxChildren > 0) {
                      const childBase = Math.round(baseFare * 0.75);
                      const disc = Math.round(childBase * DISCOUNT_PCT / 100);
                      const aitVat = Math.round((childBase - disc) * AIT_VAT_PCT / 100);
                      fareRows.push({ paxType: "Child", baseFare: childBase, tax: taxes, other: 0, discount: disc, aitVat, count: paxChildren, amount: (childBase - disc + taxes + aitVat) * paxChildren });
                    }
                    if (paxInfants > 0) {
                      const infantBase = Math.round(baseFare * 0.1);
                      const infantTax = Math.round(taxes * 0.5);
                      const disc = Math.round(infantBase * DISCOUNT_PCT / 100);
                      const aitVat = Math.round((infantBase - disc) * AIT_VAT_PCT / 100);
                      fareRows.push({ paxType: "Infant", baseFare: infantBase, tax: infantTax, other: 0, discount: disc, aitVat, count: paxInfants, amount: (infantBase - disc + infantTax + aitVat) * paxInfants });
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

/* ─── Similar Flights Grouping — group by airline+stops, expandable ─── */
function groupSimilarFlights(flights: any[]): { primary: any; similar: any[]; totalOptions: number }[] {
  const groups: Record<string, any[]> = {};
  for (const f of flights) {
    const key = `${f.airlineCode || ''}_${f.stops ?? 0}_${f.origin || ''}_${f.destination || ''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }
  return Object.values(groups).map(g => {
    const sorted = g.sort((a, b) => (a.price || 0) - (b.price || 0));
    return { primary: sorted[0], similar: sorted.slice(1), totalOptions: sorted.length };
  });
}

/* ─── Main page ─── */
const FlightResults = () => {
  const { data: page } = useCmsPageContent("/flights");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("best");

  // Fetch admin markup settings for fare calculation
  const [markupSettings, setMarkupSettings] = useState<{ discount: number; aitVat: number; airlineMarkups?: Record<string, any> }>({ discount: 6.30, aitVat: 0.3 });
  useEffect(() => {
    api.get<any>("/admin/settings").then(res => {
      const settings = res?.settings || res?.data || res || {};
      let markupConfig: any = {};
      let airlineMarkupConfig: any = {};
      for (const s of (Array.isArray(settings) ? settings : [])) {
        if (s.setting_key === 'markup_config') try { markupConfig = JSON.parse(s.setting_value); } catch {}
        if (s.setting_key === 'airline_markup_config') try { airlineMarkupConfig = JSON.parse(s.setting_value); } catch {}
      }
      // If settings is object with keys
      if (settings.markup_config) try { markupConfig = typeof settings.markup_config === 'string' ? JSON.parse(settings.markup_config) : settings.markup_config; } catch {}
      if (settings.airline_markup_config) try { airlineMarkupConfig = typeof settings.airline_markup_config === 'string' ? JSON.parse(settings.airline_markup_config) : settings.airline_markup_config; } catch {}
      const flightConfig = markupConfig?.flight || markupConfig || {};
      setMarkupSettings({
        discount: flightConfig.fareSummaryDiscount ?? 6.30,
        aitVat: flightConfig.fareSummaryAitVat ?? 0.3,
        airlineMarkups: airlineMarkupConfig || {},
      });
    }).catch(() => {});
  }, []);
  const [airlineFilter, setAirlineFilter] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [stopsFilter, setStopsFilter] = useState("all");
  const [departTimeRange, setDepartTimeRange] = useState([0, 24]);
  const [arrivalTimeRange, setArrivalTimeRange] = useState([0, 24]);
  const [durationRange, setDurationRange] = useState([0, 5000]);
  const [selectedAlliances, setSelectedAlliances] = useState<string[]>([]);
  const [refundableOnly, setRefundableOnly] = useState(false);
  const [selectedLayoverAirports, setSelectedLayoverAirports] = useState<string[]>([]);
  const [layoverDurationRange, setLayoverDurationRange] = useState([0, 5000]);
  const [selectedBaggage, setSelectedBaggage] = useState<string[]>([]);
  const airlineBarRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);
  const [selectedOutbound, setSelectedOutbound] = useState<any>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [searchStartTime] = useState(Date.now());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Inline editing state
  const [editFrom, setEditFrom] = useState("");
  const [editTo, setEditTo] = useState("");
  const [editDepart, setEditDepart] = useState<Date | undefined>();
  const [editReturn, setEditReturn] = useState<Date | undefined>();
  const [editAdults, setEditAdults] = useState(1);
  const [editChildren, setEditChildren] = useState(0);
  const [editInfants, setEditInfants] = useState(0);
  const [editCabin, setEditCabin] = useState("");
  const [showRouteEdit, setShowRouteEdit] = useState(false);
  const [showDateEdit, setShowDateEdit] = useState(false);
  const [showPaxEdit, setShowPaxEdit] = useState(false);
  const [airportSearch, setAirportSearch] = useState("");
  const [editingField, setEditingField] = useState<"from" | "to" | null>(null);

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

  // Initialize inline edit state from URL params
  useEffect(() => {
    setEditFrom(fromCode); setEditTo(toCode);
    setEditDepart(departDate ? new Date(departDate) : undefined);
    setEditReturn(returnDate ? new Date(returnDate) : undefined);
    setEditAdults(parseInt(adults)); setEditChildren(parseInt(children)); setEditInfants(parseInt(infants));
    setEditCabin(cabinClass);
  }, [fromCode, toCode, departDate, returnDate, adults, children, infants, cabinClass]);

  // Navigate with new params helper
  const applySearchEdit = useCallback(() => {
    const p = new URLSearchParams();
    if (editFrom) p.set("from", editFrom);
    if (editTo) p.set("to", editTo);
    if (editDepart) p.set("depart", format(editDepart, "yyyy-MM-dd"));
    if (editReturn) p.set("return", format(editReturn, "yyyy-MM-dd"));
    p.set("adults", String(editAdults));
    if (editChildren > 0) p.set("children", String(editChildren));
    if (editInfants > 0) p.set("infants", String(editInfants));
    if (editCabin) p.set("cabin", editCabin);
    if (isMultiCity) p.set("tripType", "multicity");
    navigate(`/flights?${p.toString()}`);
    setShowRouteEdit(false); setShowDateEdit(false); setShowPaxEdit(false);
  }, [editFrom, editTo, editDepart, editReturn, editAdults, editChildren, editInfants, editCabin, isMultiCity, navigate]);

  // Prev / Next day navigation
  const shiftDate = useCallback((days: number) => {
    const p = new URLSearchParams(searchParams.toString());
    if (departDate) {
      const d = new Date(departDate);
      d.setDate(d.getDate() + days);
      if (d >= new Date(new Date().toDateString())) {
        p.set("depart", format(d, "yyyy-MM-dd"));
      }
    }
    if (returnDate && days > 0) {
      const r = new Date(returnDate);
      r.setDate(r.getDate() + days);
      p.set("return", format(r, "yyyy-MM-dd"));
    }
    navigate(`/flights?${p.toString()}`);
  }, [departDate, returnDate, searchParams, navigate]);

  // Filtered airports for inline search
  const filteredAirports = useMemo(() => {
    if (!airportSearch) return AIRPORTS.slice(0, 10);
    const q = airportSearch.toLowerCase();
    return AIRPORTS.filter(a => a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)).slice(0, 8);
  }, [airportSearch]);

  // Search params — works for all modes: one-way, round-trip, AND multi-city
  const params = hasRequiredParams ? (() => {
    const p: Record<string, string | undefined> = {
      adults,
      children: children !== "0" ? children : undefined,
      infants: infants !== "0" ? infants : undefined,
      cabinClass: cabinClass || undefined,
    };
    if (isMultiCity) {
      // Send segments as JSON to backend — single Sabre BFM request
      p.segments = JSON.stringify(multiCitySegments);
    } else {
      p.from = fromCode;
      p.to = toCode;
      p.date = departDate;
      if (returnDate) p.return = returnDate;
    }
    return p;
  })() : undefined;

  const { data: rawData, isLoading: standardLoading, error, refetch } = useFlightSearch(params);
  const apiData = (rawData as any) || {};
  // For multi-city: combined itineraries come back with isMultiCity=true flag
  const flights = apiData.data || apiData.flights || [];
  const multiCityFlights = useMemo(() => isMultiCity ? flights.filter((f: any) => f.isMultiCity || f.direction === 'multicity') : [], [isMultiCity, flights]);
  const hasDirections = flights.some((f: any) => f.direction === "return");
  const isLoading = standardLoading;

  const outboundFlights = useMemo(() => flights.filter((f: any) => f.direction !== "return"), [flights]);
  const returnFlights = useMemo(() => flights.filter((f: any) => f.direction === "return"), [flights]);

  // Round-trip: pair outbound+return — all valid combinations
  // Sabre grouped format has independent indices per direction, so idx matching is unreliable.
  // Instead: pair same-airline first, then cross-airline with cheapest counterpart.
  const roundTripPairs = useMemo(() => {
    if (!isRoundTrip || !hasDirections) return [];
    const pairs: { outbound: any; returnFlight: any; totalPrice: number }[] = [];

    // Group outbound and return by airline
    const outboundByAirline: Record<string, any[]> = {};
    const returnByAirline: Record<string, any[]> = {};
    for (const f of outboundFlights) {
      const code = f.airlineCode || 'XX';
      if (!outboundByAirline[code]) outboundByAirline[code] = [];
      outboundByAirline[code].push(f);
    }
    for (const f of returnFlights) {
      const code = f.airlineCode || 'XX';
      if (!returnByAirline[code]) returnByAirline[code] = [];
      returnByAirline[code].push(f);
    }

    const allAirlines = new Set([...Object.keys(outboundByAirline), ...Object.keys(returnByAirline)]);

    for (const airline of allAirlines) {
      const obs = outboundByAirline[airline] || [];
      const rets = returnByAirline[airline] || [];

      if (obs.length > 0 && rets.length > 0) {
        // Same-airline: pair each outbound with each return
        for (const ob of obs) {
          for (const ret of rets) {
            // Use totalRoundTripPrice if both came from same itinerary, else sum
            const total = ob.totalRoundTripPrice || ((ob.price || 0) + (ret.price || 0));
            pairs.push({ outbound: ob, returnFlight: ret, totalPrice: total });
          }
        }
      } else if (obs.length > 0) {
        // Outbound-only airline: pair with cheapest return overall
        const cheapestReturn = [...returnFlights].sort((a: any, b: any) => (a.price || 0) - (b.price || 0))[0];
        if (cheapestReturn) {
          for (const ob of obs) {
            pairs.push({ outbound: ob, returnFlight: cheapestReturn, totalPrice: (ob.price || 0) + (cheapestReturn.price || 0) });
          }
        }
      } else if (rets.length > 0) {
        // Return-only airline: pair with cheapest outbound
        const cheapestOutbound = [...outboundFlights].sort((a: any, b: any) => (a.price || 0) - (b.price || 0))[0];
        if (cheapestOutbound) {
          for (const ret of rets) {
            pairs.push({ outbound: cheapestOutbound, returnFlight: ret, totalPrice: (cheapestOutbound.price || 0) + (ret.price || 0) });
          }
        }
      }
    }

    // Deduplicate by outbound.id + returnFlight.id
    const seen = new Set<string>();
    return pairs.filter(p => {
      const key = `${p.outbound.id}__${p.returnFlight.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [isRoundTrip, hasDirections, outboundFlights, returnFlights]);

  // Combine all multi-city flights for filter computation
  const allMultiCityFlights = multiCityFlights;

  const allFlightsForFilters = isMultiCity ? allMultiCityFlights : flights;

  const airlines = useMemo(() => apiData.airlines || [...new Set(allFlightsForFilters.map((f: any) => f.airline).filter(Boolean))], [apiData.airlines, allFlightsForFilters]);
  const cheapest = useMemo(() => apiData.cheapest || (allFlightsForFilters.length > 0 ? Math.min(...allFlightsForFilters.map((f: any) => f.price || Infinity)) : 0), [apiData.cheapest, allFlightsForFilters]);

  // For round-trip mode, compute price bounds from pair totalPrices; for one-way from individual prices
  const maxPrice = useMemo(() => {
    if (isRoundTrip && hasDirections && roundTripPairs.length > 0) {
      return Math.max(...roundTripPairs.map(p => p.totalPrice || 0));
    }
    return allFlightsForFilters.length > 0 ? Math.max(...allFlightsForFilters.map((f: any) => f.price || 0)) : 200000;
  }, [allFlightsForFilters, isRoundTrip, hasDirections, roundTripPairs]);
  const minPrice = useMemo(() => {
    if (isRoundTrip && hasDirections && roundTripPairs.length > 0) {
      return Math.min(...roundTripPairs.map(p => p.totalPrice || 0));
    }
    return allFlightsForFilters.length > 0 ? Math.min(...allFlightsForFilters.map((f: any) => f.price || 0)) : 0;
  }, [allFlightsForFilters, isRoundTrip, hasDirections, roundTripPairs]);

  // Duration bounds for slider init
  const maxDuration = useMemo(() => {
    const ds = allFlightsForFilters.map((f: any) => f.durationMinutes || 0).filter((d: number) => d > 0);
    return ds.length > 0 ? Math.max(...ds) : 1440;
  }, [allFlightsForFilters]);
  const minDuration = useMemo(() => {
    const ds = allFlightsForFilters.map((f: any) => f.durationMinutes || 0).filter((d: number) => d > 0);
    return ds.length > 0 ? Math.min(...ds) : 0;
  }, [allFlightsForFilters]);

  // Layover duration bounds
  const maxLayoverDuration = useMemo(() => {
    const ds: number[] = [];
    for (const f of allFlightsForFilters) {
      const legs = f.legs || [];
      for (let i = 0; i < legs.length - 1; i++) {
        if (legs[i].arrivalTime && legs[i + 1].departureTime) {
          const m = Math.round((new Date(legs[i + 1].departureTime).getTime() - new Date(legs[i].arrivalTime).getTime()) / 60000);
          if (m > 0) ds.push(m);
        }
      }
    }
    return ds.length > 0 ? Math.max(...ds) : 0;
  }, [allFlightsForFilters]);

  useEffect(() => {
    if (allFlightsForFilters.length > 0 || (isRoundTrip && roundTripPairs.length > 0)) {
      setPriceRange([Math.max(0, minPrice - 100), maxPrice]);
      setDurationRange([minDuration, maxDuration]);
      if (maxLayoverDuration > 0) setLayoverDurationRange([0, maxLayoverDuration]);
    }
  }, [minPrice, maxPrice, allFlightsForFilters.length, minDuration, maxDuration, maxLayoverDuration, isRoundTrip, roundTripPairs.length]);

  const toggleAirline = useCallback((a: string) => setSelectedAirlines(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]), []);
  const toggleAlliance = useCallback((a: string) => setSelectedAlliances(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]), []);
  const toggleLayoverAirport = useCallback((a: string) => setSelectedLayoverAirports(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]), []);
  const toggleBaggage = useCallback((b: string) => setSelectedBaggage(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]), []);

  // Airline stats for the top bar — count from round-trip pairs for correct display
  const airlineStats = useMemo(() => {
    if (isRoundTrip && hasDirections) {
      // Count from actual pairs so airline bar matches displayed results
      const map: Record<string, { code: string; name: string; cheapest: number; count: number }> = {};
      for (const p of roundTripPairs) {
        const code = p.outbound.airlineCode || '';
        const name = p.outbound.airline || code;
        if (!code) continue;
        if (!map[code]) map[code] = { code, name, cheapest: p.totalPrice, count: 0 };
        map[code].count++;
        if (p.totalPrice < map[code].cheapest) map[code].cheapest = p.totalPrice;
      }
      return Object.values(map).sort((a, b) => a.cheapest - b.cheapest);
    }
    const relevantFlights = isMultiCity ? allMultiCityFlights : flights;
    const map: Record<string, { code: string; name: string; cheapest: number; count: number }> = {};
    for (const f of relevantFlights) {
      const code = f.airlineCode || '';
      const name = f.airline || code;
      if (!code) continue;
      if (!map[code]) map[code] = { code, name, cheapest: f.price || Infinity, count: 0 };
      map[code].count++;
      if ((f.price || Infinity) < map[code].cheapest) map[code].cheapest = f.price;
    }
    return Object.values(map).sort((a, b) => a.cheapest - b.cheapest);
  }, [flights, roundTripPairs, isRoundTrip, hasDirections, isMultiCity, allMultiCityFlights]);

  // Quick sort summaries — Cheapest, Fastest, Best from real data
  const quickSortSummary = useMemo(() => {
    if (isRoundTrip && hasDirections && roundTripPairs.length > 0) {
      const cheapestPair = [...roundTripPairs].sort((a, b) => a.totalPrice - b.totalPrice)[0];
      const fastestPair = [...roundTripPairs].sort((a, b) => 
        ((a.outbound.durationMinutes || 0) + (a.returnFlight.durationMinutes || 0)) - 
        ((b.outbound.durationMinutes || 0) + (b.returnFlight.durationMinutes || 0))
      )[0];
      const bestPair = [...roundTripPairs].sort((a, b) => {
        const sa = a.totalPrice * 0.5 + ((a.outbound.durationMinutes || 0) + (a.returnFlight.durationMinutes || 0)) * 30;
        const sb = b.totalPrice * 0.5 + ((b.outbound.durationMinutes || 0) + (b.returnFlight.durationMinutes || 0)) * 30;
        return sa - sb;
      })[0];
      return {
        cheapest: cheapestPair ? { price: cheapestPair.totalPrice, duration: cheapestPair.outbound.duration || '' } : null,
        fastest: fastestPair ? { price: fastestPair.totalPrice, duration: fastestPair.outbound.duration || '' } : null,
        best: bestPair ? { price: bestPair.totalPrice, duration: bestPair.outbound.duration || '' } : null,
      };
    }
    const relevantFlights = isMultiCity ? allMultiCityFlights : flights;
    if (relevantFlights.length === 0) return { cheapest: null, fastest: null, best: null };
    const cheapestFlight = [...relevantFlights].sort((a, b) => (a.price || 0) - (b.price || 0))[0];
    const fastestFlight = [...relevantFlights].sort((a, b) => (a.durationMinutes || Infinity) - (b.durationMinutes || Infinity))[0];
    const bestFlight = [...relevantFlights].sort((a, b) => {
      const sa = (a.price || 0) * 0.5 + (a.durationMinutes || 0) * 30 + (a.stops || 0) * 3000;
      const sb = (b.price || 0) * 0.5 + (b.durationMinutes || 0) * 30 + (b.stops || 0) * 3000;
      return sa - sb;
    })[0];
    return {
      cheapest: cheapestFlight ? { price: cheapestFlight.price, duration: cheapestFlight.duration || '' } : null,
      fastest: fastestFlight ? { price: fastestFlight.price, duration: fastestFlight.duration || '' } : null,
      best: bestFlight ? { price: bestFlight.price, duration: bestFlight.duration || '' } : null,
    };
  }, [flights, roundTripPairs, isRoundTrip, hasDirections, isMultiCity, allMultiCityFlights]);

  const applyFilters = useCallback((list: any[]) => {
    return list.filter((f: any) => {
      if (airlineFilter && f.airlineCode !== airlineFilter) return false;
      if (selectedAirlines.length > 0 && !selectedAirlines.includes(f.airline)) return false;
      if (f.price < priceRange[0] || f.price > priceRange[1]) return false;
      if (stopsFilter !== "all") {
        const stops = f.stops ?? 0;
        if (stopsFilter === "0" && stops !== 0) return false;
        if (stopsFilter === "1" && stops !== 1) return false;
        if (stopsFilter === "2+" && stops < 2) return false;
      }
      // Departure time
      if (departTimeRange[0] !== 0 || departTimeRange[1] !== 24) {
        if (f.departureTime) {
          const hour = new Date(f.departureTime).getHours();
          if (hour < departTimeRange[0] || hour >= departTimeRange[1]) return false;
        }
      }
      // Arrival time
      if (arrivalTimeRange[0] !== 0 || arrivalTimeRange[1] !== 24) {
        if (f.arrivalTime) {
          const hour = new Date(f.arrivalTime).getHours();
          if (hour < arrivalTimeRange[0] || hour >= arrivalTimeRange[1]) return false;
        }
      }
      // Refundable only
      if (refundableOnly && !f.refundable) return false;
      // Alliance filter
      if (selectedAlliances.length > 0) {
        const alliance = AIRLINE_ALLIANCES[f.airlineCode || ''];
        if (!alliance || !selectedAlliances.includes(alliance)) return false;
      }
      // Duration filter
      if (durationRange[0] > 0 || durationRange[1] < 5000) {
        const dur = f.durationMinutes || 0;
        if (dur > 0 && (dur < durationRange[0] || dur > durationRange[1])) return false;
      }
      // Layover airports
      if (selectedLayoverAirports.length > 0) {
        const codes = (f.stopCodes || []).length > 0 ? f.stopCodes : (f.legs || []).slice(0, -1).map((l: any) => l.destination).filter(Boolean);
        if (!codes.some((c: string) => selectedLayoverAirports.includes(c))) return false;
      }
      // Layover duration
      if (layoverDurationRange[0] > 0 || layoverDurationRange[1] < 5000) {
        const legs = f.legs || [];
        if (legs.length > 1) {
          let valid = false;
          for (let i = 0; i < legs.length - 1; i++) {
            if (legs[i].arrivalTime && legs[i + 1].departureTime) {
              const m = Math.round((new Date(legs[i + 1].departureTime).getTime() - new Date(legs[i].arrivalTime).getTime()) / 60000);
              if (m >= layoverDurationRange[0] && m <= layoverDurationRange[1]) { valid = true; break; }
            }
          }
          if (!valid) return false;
        }
      }
      // Baggage filter
      if (selectedBaggage.length > 0) {
        const bag = String(f.baggage || '').trim();
        if (!bag || !selectedBaggage.includes(bag)) return false;
      }
      return true;
    });
  }, [airlineFilter, selectedAirlines, priceRange, stopsFilter, departTimeRange, arrivalTimeRange, refundableOnly, selectedAlliances, durationRange, selectedLayoverAirports, layoverDurationRange, selectedBaggage]);

  const filteredOutbound = useMemo(() => sortFlights(applyFilters(outboundFlights), sortBy), [outboundFlights, sortBy, applyFilters]);
  const filteredReturn = useMemo(() => sortFlights(applyFilters(returnFlights), sortBy), [returnFlights, sortBy, applyFilters]);
  const filteredAll = useMemo(() => sortFlights(applyFilters(flights), sortBy), [flights, sortBy, applyFilters]);

  // Filtered + sorted round-trip pairs
  const filteredPairs = useMemo(() => {
    if (!isRoundTrip || !hasDirections) return [];
    const filtered = roundTripPairs.filter(p => {
      if (airlineFilter && p.outbound.airlineCode !== airlineFilter) return false;
      if (selectedAirlines.length > 0 && !selectedAirlines.includes(p.outbound.airline)) return false;
      if (p.totalPrice < priceRange[0] || p.totalPrice > priceRange[1]) return false;
      if (stopsFilter !== "all") {
        const stops = p.outbound.stops ?? 0;
        if (stopsFilter === "0" && stops !== 0) return false;
        if (stopsFilter === "1" && stops !== 1) return false;
        if (stopsFilter === "2+" && stops < 2) return false;
      }
      if (departTimeRange[0] !== 0 || departTimeRange[1] !== 24) {
        if (p.outbound.departureTime) {
          const hour = new Date(p.outbound.departureTime).getHours();
          if (hour < departTimeRange[0] || hour >= departTimeRange[1]) return false;
        }
      }
      if (arrivalTimeRange[0] !== 0 || arrivalTimeRange[1] !== 24) {
        if (p.outbound.arrivalTime) {
          const h = new Date(p.outbound.arrivalTime).getHours();
          if (h < arrivalTimeRange[0] || h >= arrivalTimeRange[1]) return false;
        }
      }
      if (refundableOnly && !p.outbound.refundable) return false;
      if (selectedAlliances.length > 0) {
        const alliance = AIRLINE_ALLIANCES[p.outbound.airlineCode || ''];
        if (!alliance || !selectedAlliances.includes(alliance)) return false;
      }
      if (durationRange[0] > 0 || durationRange[1] < 5000) {
        const dur = p.outbound.durationMinutes || 0;
        if (dur > 0 && (dur < durationRange[0] || dur > durationRange[1])) return false;
      }
      // Layover airports filter
      if (selectedLayoverAirports.length > 0) {
        const obCodes = (p.outbound.stopCodes || []).length > 0 ? p.outbound.stopCodes : (p.outbound.legs || []).slice(0, -1).map((l: any) => l.destination).filter(Boolean);
        const retCodes = (p.returnFlight.stopCodes || []).length > 0 ? p.returnFlight.stopCodes : (p.returnFlight.legs || []).slice(0, -1).map((l: any) => l.destination).filter(Boolean);
        const allCodes = [...obCodes, ...retCodes];
        if (!allCodes.some((c: string) => selectedLayoverAirports.includes(c))) return false;
      }
      // Layover duration filter
      if (layoverDurationRange[0] > 0 || layoverDurationRange[1] < 5000) {
        let valid = false;
        for (const flight of [p.outbound, p.returnFlight]) {
          const legs = flight.legs || [];
          for (let i = 0; i < legs.length - 1; i++) {
            if (legs[i].arrivalTime && legs[i + 1].departureTime) {
              const m = Math.round((new Date(legs[i + 1].departureTime).getTime() - new Date(legs[i].arrivalTime).getTime()) / 60000);
              if (m >= layoverDurationRange[0] && m <= layoverDurationRange[1]) { valid = true; break; }
            }
          }
          if (valid) break;
        }
        // Only filter if there are layovers
        const hasLayovers = (p.outbound.stops || 0) > 0 || (p.returnFlight.stops || 0) > 0;
        if (hasLayovers && !valid) return false;
      }
      // Baggage filter
      if (selectedBaggage.length > 0) {
        const bag = String(p.outbound.baggage || '').trim();
        if (!bag || !selectedBaggage.includes(bag)) return false;
      }
      return true;
    });
    if (sortBy === "cheapest" || sortBy === "best") filtered.sort((a, b) => a.totalPrice - b.totalPrice);
    else if (sortBy === "fastest") filtered.sort((a, b) => ((a.outbound.durationMinutes || 0) + (a.returnFlight.durationMinutes || 0)) - ((b.outbound.durationMinutes || 0) + (b.returnFlight.durationMinutes || 0)));
    else if (sortBy === "departure") filtered.sort((a, b) => new Date(a.outbound.departureTime).getTime() - new Date(b.outbound.departureTime).getTime());
    return filtered;
  }, [roundTripPairs, isRoundTrip, hasDirections, airlineFilter, selectedAirlines, priceRange, stopsFilter, departTimeRange, arrivalTimeRange, refundableOnly, selectedAlliances, durationRange, sortBy, selectedLayoverAirports, layoverDurationRange, selectedBaggage]);

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

  const resetFilters = useCallback(() => {
    setSelectedAirlines([]); setPriceRange([0, maxPrice]); setStopsFilter("all");
    setDepartTimeRange([0, 24]); setArrivalTimeRange([0, 24]); setDurationRange([minDuration, maxDuration]);
    setSelectedAlliances([]); setRefundableOnly(false); setSelectedLayoverAirports([]);
    setLayoverDurationRange([0, maxLayoverDuration || 5000]); setAirlineFilter(null);
    setSelectedBaggage([]);
  }, [maxPrice, minDuration, maxDuration, maxLayoverDuration]);

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
      {/* ─── BDFare-style Interactive Search Modification Bar ─── */}
      <div className="bg-card border-b border-border pt-20 sm:pt-28 lg:pt-36 pb-0">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-2.5 py-4">
            {/* Trip Type */}
            <div className="bg-muted border border-border rounded-lg px-4 py-2.5 flex items-center gap-2 shrink-0">
              <Plane className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {isMultiCity ? "Multi-City" : isRoundTrip ? "Return" : "One Way"}
              </span>
            </div>

            {/* Route — clickable with inline airport picker */}
            {!isMultiCity && (
              <Popover open={showRouteEdit} onOpenChange={setShowRouteEdit}>
                <PopoverTrigger asChild>
                  <button className="bg-muted border border-border hover:border-primary/50 rounded-lg px-4 py-2.5 flex items-center gap-2 shrink-0 transition-colors">
                    <span className="text-sm font-bold text-foreground">{fromCode || "—"}</span>
                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-bold text-foreground">{toCode || "—"}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3" align="start">
                  <p className="text-xs font-bold text-muted-foreground mb-2">Edit Route</p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium">From</label>
                      <input
                        className="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                        value={editingField === "from" ? airportSearch : editFrom}
                        onFocus={() => { setEditingField("from"); setAirportSearch(editFrom); }}
                        onChange={(e) => setAirportSearch(e.target.value)}
                        placeholder="Airport code or city"
                      />
                      {editingField === "from" && (
                        <div className="max-h-32 overflow-y-auto border border-border rounded-md mt-1">
                          {filteredAirports.map(a => (
                            <button key={a.code} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 flex justify-between"
                              onClick={() => { setEditFrom(a.code); setEditingField(null); setAirportSearch(""); }}>
                              <span className="font-bold">{a.code}</span>
                              <span className="text-muted-foreground truncate ml-2">{a.city} - {a.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium">To</label>
                      <input
                        className="w-full h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                        value={editingField === "to" ? airportSearch : editTo}
                        onFocus={() => { setEditingField("to"); setAirportSearch(editTo); }}
                        onChange={(e) => setAirportSearch(e.target.value)}
                        placeholder="Airport code or city"
                      />
                      {editingField === "to" && (
                        <div className="max-h-32 overflow-y-auto border border-border rounded-md mt-1">
                          {filteredAirports.map(a => (
                            <button key={a.code} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 flex justify-between"
                              onClick={() => { setEditTo(a.code); setEditingField(null); setAirportSearch(""); }}>
                              <span className="font-bold">{a.code}</span>
                              <span className="text-muted-foreground truncate ml-2">{a.city} - {a.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button size="sm" className="w-full bg-accent text-accent-foreground" onClick={applySearchEdit}>
                      <Search className="w-3.5 h-3.5 mr-1.5" /> Search
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {isMultiCity && (
              <div className="bg-muted border border-border rounded-lg px-4 py-2.5 flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-foreground">
                  {multiCitySegments.map(s => s.from).join(" → ")} → {multiCitySegments[multiCitySegments.length - 1]?.to || "—"}
                </span>
              </div>
            )}

            {/* Prev Day button */}
            {!isMultiCity && (
              <button onClick={() => shiftDate(-1)}
                className="bg-muted border border-border hover:border-primary/50 rounded-lg p-2.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                title="Previous Day">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Dates — clickable with calendar picker */}
            <Popover open={showDateEdit} onOpenChange={setShowDateEdit}>
              <PopoverTrigger asChild>
                <button className="bg-muted border border-border hover:border-primary/50 rounded-lg px-4 py-2.5 flex items-center gap-2 shrink-0 transition-colors">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {isMultiCity
                      ? multiCitySegments.map(s => s.date).filter(Boolean).join(", ")
                      : departDate
                        ? (() => { try { return format(new Date(departDate), "dd MMM, EEE"); } catch { return departDate; } })()
                        : "—"
                    }
                    {isRoundTrip && returnDate && (() => { try { return ` — ${format(new Date(returnDate), "dd MMM, EEE")}`; } catch { return ""; } })()}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <p className="text-xs font-bold text-muted-foreground mb-2">
                  {isRoundTrip ? "Select Departure Date" : "Select Date"}
                </p>
                <Calendar mode="single" selected={editDepart} onSelect={(d) => { setEditDepart(d || undefined); if (!isRoundTrip) { setEditDepart(d || undefined); } }}
                  disabled={(date) => date < new Date(new Date().toDateString())} />
                {isRoundTrip && (
                  <>
                    <p className="text-xs font-bold text-muted-foreground mb-2 mt-3">Return Date</p>
                    <Calendar mode="single" selected={editReturn} onSelect={(d) => setEditReturn(d || undefined)}
                      disabled={(date) => date < (editDepart || new Date())} />
                  </>
                )}
                <Button size="sm" className="w-full mt-3 bg-accent text-accent-foreground" onClick={applySearchEdit}>
                  <Search className="w-3.5 h-3.5 mr-1.5" /> Search
                </Button>
              </PopoverContent>
            </Popover>

            {/* Next Day button */}
            {!isMultiCity && (
              <button onClick={() => shiftDate(1)}
                className="bg-muted border border-border hover:border-primary/50 rounded-lg p-2.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                title="Next Day">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Passengers & Cabin — clickable with counter */}
            <Popover open={showPaxEdit} onOpenChange={setShowPaxEdit}>
              <PopoverTrigger asChild>
                <button className="bg-muted border border-border hover:border-primary/50 rounded-lg px-4 py-2.5 flex items-center gap-2 shrink-0 transition-colors">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {totalPax} Pax{cabinClass ? `, ${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}` : ""}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <p className="text-xs font-bold text-muted-foreground mb-3">Passengers & Cabin</p>
                <div className="space-y-3">
                  {[
                    { label: "Adults", value: editAdults, set: setEditAdults, min: 1, max: 9 },
                    { label: "Children (2-11)", value: editChildren, set: setEditChildren, min: 0, max: 6 },
                    { label: "Infants (0-2)", value: editInfants, set: setEditInfants, min: 0, max: editAdults },
                  ].map(p => (
                    <div key={p.label} className="flex items-center justify-between">
                      <span className="text-xs font-medium">{p.label}</span>
                      <div className="flex items-center gap-2">
                        <button className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm hover:bg-muted"
                          onClick={() => p.set(Math.max(p.min, p.value - 1))}>−</button>
                        <span className="text-sm font-bold w-5 text-center">{p.value}</span>
                        <button className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-sm hover:bg-muted"
                          onClick={() => p.set(Math.min(p.max, p.value + 1))}>+</button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium">Cabin Class</label>
                    <select className="w-full h-9 px-2 text-sm border border-border rounded-md bg-background mt-1"
                      value={editCabin} onChange={(e) => setEditCabin(e.target.value)}>
                      <option value="economy">Economy</option>
                      <option value="premium_economy">Premium Economy</option>
                      <option value="business">Business</option>
                      <option value="first">First</option>
                    </select>
                  </div>
                  <Button size="sm" className="w-full bg-accent text-accent-foreground" onClick={applySearchEdit}>
                    <Search className="w-3.5 h-3.5 mr-1.5" /> Search
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Session Timer */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <SessionTimer startTime={searchStartTime} />
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg px-6 h-10" onClick={applySearchEdit}>
                <Search className="w-4 h-4 mr-1.5" /> Modify
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results info bar */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-foreground font-semibold">
              {isMultiCity ? (
                <>Showing <strong>{totalMultiCityFlights}</strong> flights</>
              ) : isRoundTrip && hasDirections ? (
                <>Showing <strong>{filteredPairs.length} flights</strong> &amp; <strong>{airlineStats.length} Airlines</strong> <span className="text-muted-foreground font-normal text-xs">(Fares include. AIT VAT)</span></>
              ) : (
                <>Showing <strong>{flights.length} flights</strong>
                  {sources.tti > 0 && <span className="text-muted-foreground font-normal text-xs ml-1">({sources.tti} Air Astra)</span>}
                  {sources.sabre > 0 && <span className="text-muted-foreground font-normal text-xs ml-1">({sources.sabre} Sabre)</span>}
                  {sources.flyhub > 0 && <span className="text-muted-foreground font-normal text-xs ml-1">({sources.flyhub} FlyHub)</span>}
                </>
              )}
            </p>
            {cheapest > 0 && (
              <span className="text-xs text-muted-foreground">Sort by: <strong className="text-accent">{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</strong></span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
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
            <aside className="hidden lg:block w-72 shrink-0">
              <Card className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto shadow-[0_4px_20px_-4px_hsl(var(--foreground)/0.08),0_1px_3px_hsl(var(--foreground)/0.06)] border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
                    <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={resetFilters}>Reset</Button>
                  </div>
                  <FilterPanel
                    flights={allFlightsForFilters}
                    priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice}
                    selectedAirlines={selectedAirlines} toggleAirline={toggleAirline}
                    stopsFilter={stopsFilter} setStopsFilter={setStopsFilter}
                    departTimeRange={departTimeRange} setDepartTimeRange={setDepartTimeRange}
                    arrivalTimeRange={arrivalTimeRange} setArrivalTimeRange={setArrivalTimeRange}
                    durationRange={durationRange} setDurationRange={setDurationRange}
                    selectedAlliances={selectedAlliances} toggleAlliance={toggleAlliance}
                    refundableOnly={refundableOnly} setRefundableOnly={setRefundableOnly}
                    selectedLayoverAirports={selectedLayoverAirports} toggleLayoverAirport={toggleLayoverAirport}
                    layoverDurationRange={layoverDurationRange} setLayoverDurationRange={setLayoverDurationRange}
                    isRoundTrip={isRoundTrip} originCode={fromCode} destCode={toCode}
                    selectedBaggage={selectedBaggage} toggleBaggage={toggleBaggage}
                    onReset={resetFilters}
                  />
                </CardContent>
              </Card>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Airline filter bar — real API data, 3D card with working scroll */}
              {airlineStats.length > 0 && (
                <Card className="shadow-[0_4px_20px_-4px_hsl(var(--foreground)/0.08),0_1px_3px_hsl(var(--foreground)/0.06)] border-border/60 overflow-hidden">
                  <div className="flex items-center">
                    <button
                      className="shrink-0 px-1 sm:px-2 text-accent font-semibold text-xs hover:bg-muted/50 transition-colors border-r border-border hidden sm:block"
                      onClick={resetFilters}
                    >
                      Reset
                    </button>
                    <button
                      className="shrink-0 px-1.5 sm:px-2 py-3 text-muted-foreground hover:text-foreground transition-colors border-r border-border"
                      onClick={() => airlineBarRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div ref={airlineBarRef} className="flex-1 overflow-x-auto scrollbar-none">
                      <div className="flex">
                        {airlineStats.map((a) => {
                          const isActive = airlineFilter === a.code;
                          return (
                            <button
                              key={a.code}
                              onClick={() => setAirlineFilter(isActive ? null : a.code)}
                              className={`flex items-center gap-2 px-3 py-2.5 whitespace-nowrap border-r border-border last:border-r-0 transition-colors shrink-0 ${
                                isActive ? "bg-accent/10" : "hover:bg-muted/50"
                              }`}
                            >
                              <img
                                src={getAirlineLogo(a.code) || ''}
                                alt={a.name}
                                className="w-5 h-5 rounded-full object-contain shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div className="text-left">
                                <p className={`text-xs font-bold leading-tight ${isActive ? "text-accent" : "text-foreground"}`}>
                                  {a.code}
                                </p>
                                <p className={`text-[10px] leading-tight ${isActive ? "text-accent" : "text-muted-foreground"}`}>
                                  BDT {a.cheapest.toLocaleString()} ({a.count})
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      className="shrink-0 px-1.5 sm:px-2 py-3 text-muted-foreground hover:text-foreground transition-colors border-l border-border"
                      onClick={() => airlineBarRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              )}

              {/* Quick sort chips — Cheapest / Fastest / Best, 3D cards */}
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0">
                  {[
                    { key: "cheapest", label: "Cheapest", icon: TrendingUp, data: quickSortSummary.cheapest },
                    { key: "fastest", label: "Fastest", icon: Zap, data: quickSortSummary.fastest },
                    { key: "best", label: "Best", icon: Star, data: quickSortSummary.best },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isActive = sortBy === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setSortBy(s.key)}
                        className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all ${
                          isActive
                            ? "bg-card border border-accent shadow-[0_4px_16px_-4px_hsl(var(--accent)/0.3),0_1px_3px_hsl(var(--foreground)/0.06)]"
                            : "bg-card border border-border shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06)] hover:shadow-[0_4px_12px_-4px_hsl(var(--foreground)/0.1)] hover:border-foreground/20"
                        }`}
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-accent" : ""}`} />
                          <span className={`font-bold ${isActive ? "text-foreground" : ""}`}>{s.label}</span>
                        </div>
                        {s.data && (
                          <span className={`text-[10px] sm:text-xs ${isActive ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                            BDT {s.data.price?.toLocaleString()}{s.data.duration ? ` | ${s.data.duration}` : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" className="lg:hidden shrink-0 shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.06)]" onClick={() => setShowFilters(true)}>
                  <Filter className="w-4 h-4 mr-1" /> Filters
                </Button>
              </div>

              {/* Results */}
              {isMultiCity ? (
                /* ── MULTI-CITY RESULTS — combined itinerary cards like BDFare ── */
                <DataLoader isLoading={isLoading} error={error} skeleton="cards" retry={refetch}>
                  {hasCabinMismatch && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 mb-4">
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {searchedCabinNorm.charAt(0).toUpperCase() + searchedCabinNorm.slice(1)} class is not available on this route
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Showing available Economy class fares instead. All prices shown are real-time from the airline.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2 bg-accent/10 text-accent rounded-lg px-3 py-1.5">
                        <Plane className="w-4 h-4" /><span className="text-sm font-bold">Multi-City</span>
                      </div>
                      <span className="text-sm font-medium">{multiCitySegments.map(s => s.from).join(" → ")} → {multiCitySegments[multiCitySegments.length - 1]?.to}</span>
                      <span className="text-xs text-muted-foreground">{multiCityFlights.length} itineraries</span>
                      <span className="text-xs text-muted-foreground italic">(Fares include. AIT VAT)</span>
                    </div>

                    {multiCityFlights.length === 0 ? (
                      <Card><CardContent className="py-8 text-center text-muted-foreground"><p>No multi-city itineraries found</p></CardContent></Card>
                    ) : sortFlights(applyFilters(multiCityFlights), sortBy).map((mcFlight: any) => (
                      <MultiCityFlightCard
                        key={mcFlight.id}
                        flight={mcFlight}
                        cheapest={multiCityFlights.length > 0 ? Math.min(...multiCityFlights.map((f: any) => f.price || Infinity)) : 0}
                        isExpanded={expandedFlight === mcFlight.id}
                        onToggleExpand={() => setExpandedFlight(expandedFlight === mcFlight.id ? null : mcFlight.id)}
                      />
                    ))}
                  </div>
                </DataLoader>
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
                  /* ONE-WAY with Similar Flights Grouping */
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
                    ) : (() => {
                      const groups = groupSimilarFlights(filteredAll);
                      return groups.map((group) => {
                        const groupKey = `${group.primary.airlineCode}_${group.primary.stops}_${group.primary.id}`;
                        const isGroupExpanded = expandedGroups.has(groupKey);
                        return (
                          <div key={groupKey}>
                            <FlightCard flight={group.primary} cheapest={cheapest}
                              isExpanded={expandedFlight === group.primary.id} onToggleExpand={() => setExpandedFlight(expandedFlight === group.primary.id ? null : group.primary.id)} />
                            {group.similar.length > 0 && (
                              <>
                                <button
                                  onClick={() => setExpandedGroups(prev => {
                                    const next = new Set(prev);
                                    if (next.has(groupKey)) next.delete(groupKey); else next.add(groupKey);
                                    return next;
                                  })}
                                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-accent bg-accent/5 hover:bg-accent/10 border border-accent/20 border-t-0 rounded-b-xl transition-colors -mt-1"
                                >
                                  {isGroupExpanded ? (
                                    <>Hide Options <ChevronUp className="w-3.5 h-3.5" /></>
                                  ) : (
                                    <>{group.similar.length} More flight{group.similar.length > 1 ? "s" : ""} - View Option{group.similar.length > 1 ? "s" : ""} <ChevronDown className="w-3.5 h-3.5" /></>
                                  )}
                                </button>
                                <AnimatePresence>
                                  {isGroupExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                      className="overflow-hidden space-y-3 mt-2 ml-4 border-l-2 border-accent/20 pl-3">
                                      {group.similar.map((sf: any) => (
                                        <FlightCard key={sf.id} flight={sf} cheapest={cheapest}
                                          isExpanded={expandedFlight === sf.id} onToggleExpand={() => setExpandedFlight(expandedFlight === sf.id ? null : sf.id)} />
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </>
                            )}
                          </div>
                        );
                      });
                    })()}
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
              <FilterPanel
                flights={allFlightsForFilters}
                priceRange={priceRange} setPriceRange={setPriceRange} maxPrice={maxPrice}
                selectedAirlines={selectedAirlines} toggleAirline={toggleAirline}
                stopsFilter={stopsFilter} setStopsFilter={setStopsFilter}
                departTimeRange={departTimeRange} setDepartTimeRange={setDepartTimeRange}
                arrivalTimeRange={arrivalTimeRange} setArrivalTimeRange={setArrivalTimeRange}
                durationRange={durationRange} setDurationRange={setDurationRange}
                selectedAlliances={selectedAlliances} toggleAlliance={toggleAlliance}
                refundableOnly={refundableOnly} setRefundableOnly={setRefundableOnly}
                selectedLayoverAirports={selectedLayoverAirports} toggleLayoverAirport={toggleLayoverAirport}
                layoverDurationRange={layoverDurationRange} setLayoverDurationRange={setLayoverDurationRange}
                isRoundTrip={isRoundTrip} originCode={fromCode} destCode={toCode}
                selectedBaggage={selectedBaggage} toggleBaggage={toggleBaggage}
                onReset={resetFilters}
              />
              <Button className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setShowFilters(false)}>Apply Filters</Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlightResults;
