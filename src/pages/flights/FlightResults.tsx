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

/* ─── Airport names — from airports.ts registry (no hardcoded map) ─── */
const AIRPORT_NAME_MAP = new Map(AIRPORTS.map(a => [a.code, a.name]));
function getAirportName(code: string): string {
  return AIRPORT_NAME_MAP.get(code) || `${code} Airport`;
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
              <StopDotsWithTooltip flight={flight} stops={stops} />
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

  const stopsLabel = stops === 0 ? "Non-Stop" : `${stops} Stop${stops > 1 ? "s" : ""}`;
  const cabinDisplay = bookingClass ? `${cabin} - ${bookingClass}` : cabin;
  const distanceKm = calcDistanceKm(fromCode, toCode);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

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

          {/* Flight times + baggage info */}
          <div className="flex-1 p-3 sm:p-5">
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

            {/* Baggage + Seats + Class info row */}
            <div className="flex items-center flex-wrap gap-3 mt-2">
              {handBaggage && (
                <span className="flex items-center gap-1 text-[10px] text-accent font-medium">
                  <Package className="w-3 h-3" /> {handBaggage}
                </span>
              )}
              {baggage && (
                <span className="flex items-center gap-1 text-[10px] text-accent font-medium">
                  <Luggage className="w-3 h-3" /> {baggage}
                </span>
              )}
              {availableSeats !== null && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <Users className="w-3 h-3" /> {availableSeats} Seat{availableSeats !== 1 ? "s" : ""}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground font-medium">Class: {bookingClass || cabin.charAt(0)}</span>
            </div>
          </div>

          {/* Price section */}
          <div className="flex flex-col items-end gap-1 p-4 sm:p-5 sm:w-56 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/20">
            <p className="text-xl sm:text-2xl font-black leading-none whitespace-nowrap">BDT {price.toLocaleString()}</p>
            {baseFare > 0 && (
              <p className="text-[10px] text-muted-foreground line-through">BDT {Math.round(price * 1.05).toLocaleString()}</p>
            )}
            <p className="text-[10px] text-muted-foreground">Price for {parseInt(new URLSearchParams(window.location.search).get("adults") || "1")} traveller{parseInt(new URLSearchParams(window.location.search).get("adults") || "1") > 1 ? "s" : ""}</p>
            {price === cheapest && price > 0 && (
              <Badge className="bg-accent/10 text-accent border-0 text-[9px] font-bold">Cheapest</Badge>
            )}
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
                    
                    // Check if flight has per-pax fare breakdown from API
                    const fd = flight.fareDetails || [];
                    if (fd.length > 0 && fd[0]?.baseFare) {
                      // Use detailed fare breakdown — but fix currency: derive baseFare = amount - tax
                      fd.forEach((f: any) => {
                        const fTax = f.tax || f.taxes || 0;
                        const fAmount = f.amount || f.total || 0;
                        const fCount = f.count || f.paxCount || 1;
                        // If amount exists, derive baseFare to guarantee sum integrity
                        const fBase = fAmount > 0 ? Math.max(0, Math.round((fAmount / fCount) - fTax)) : Math.max(0, Math.round((price) - fTax));
                        fareRows.push({
                          paxType: f.paxType || "Adult",
                          baseFare: fBase,
                          tax: fTax,
                          other: f.other || 0,
                          discount: f.discount || 0,
                          aitVat: f.aitVat || 0,
                          count: fCount,
                          amount: fAmount > 0 ? fAmount : (fBase + fTax + (f.other || 0) - (f.discount || 0) + (f.aitVat || 0)) * fCount,
                        });
                      });
                    } else {
                      // Construct from top-level — baseFare already derived as (price - taxes)
                      if (paxAdults > 0) fareRows.push({ paxType: "Adult", baseFare, tax: taxes, other: 0, discount: 0, aitVat: 0, count: paxAdults, amount: price * paxAdults });
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
    if (allFlightsForFilters.length > 0) {
      setPriceRange([Math.max(0, minPrice - 100), maxPrice]);
      setDurationRange([minDuration, maxDuration]);
      if (maxLayoverDuration > 0) setLayoverDurationRange([0, maxLayoverDuration]);
    }
  }, [minPrice, maxPrice, allFlightsForFilters.length, minDuration, maxDuration, maxLayoverDuration]);

  const toggleAirline = useCallback((a: string) => setSelectedAirlines(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]), []);
  const toggleAlliance = useCallback((a: string) => setSelectedAlliances(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]), []);
  const toggleLayoverAirport = useCallback((a: string) => setSelectedLayoverAirports(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]), []);
  const toggleBaggage = useCallback((b: string) => setSelectedBaggage(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]), []);

  // Airline stats for the top bar — from real API data
  const airlineStats = useMemo(() => {
    const relevantFlights = isRoundTrip && hasDirections ? outboundFlights : (isMultiCity ? allMultiCityFlights : flights);
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
  }, [flights, outboundFlights, isRoundTrip, hasDirections, isMultiCity, allMultiCityFlights]);

  // Quick sort summaries — Cheapest, Fastest, Best from real data
  const quickSortSummary = useMemo(() => {
    const relevantFlights = isRoundTrip && hasDirections
      ? outboundFlights.map((f: any) => ({ ...f, price: f.price || 0 }))
      : (isMultiCity ? allMultiCityFlights : flights);
    if (relevantFlights.length === 0) return { cheapest: null, fastest: null, best: null };
    const sorted = [...relevantFlights];
    const cheapestFlight = sorted.sort((a, b) => (a.price || 0) - (b.price || 0))[0];
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
  }, [flights, outboundFlights, isRoundTrip, hasDirections, isMultiCity, allMultiCityFlights]);

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
      return true;
    });
    if (sortBy === "cheapest" || sortBy === "best") filtered.sort((a, b) => a.totalPrice - b.totalPrice);
    else if (sortBy === "fastest") filtered.sort((a, b) => ((a.outbound.durationMinutes || 0) + (a.returnFlight.durationMinutes || 0)) - ((b.outbound.durationMinutes || 0) + (b.returnFlight.durationMinutes || 0)));
    else if (sortBy === "departure") filtered.sort((a, b) => new Date(a.outbound.departureTime).getTime() - new Date(b.outbound.departureTime).getTime());
    return filtered;
  }, [roundTripPairs, isRoundTrip, hasDirections, airlineFilter, selectedAirlines, priceRange, stopsFilter, departTimeRange, arrivalTimeRange, refundableOnly, selectedAlliances, durationRange, sortBy]);

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
      {/* Header */}
      {/* ─── BDFare-style Search Modification Bar ─── */}
      <div className="bg-foreground pt-20 sm:pt-28 lg:pt-36 pb-0">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-2 py-3">
            {/* Trip Type */}
            <div className="bg-foreground/80 border border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-1.5 shrink-0">
              <Plane className="w-3.5 h-3.5 text-background/70" />
              <span className="text-xs sm:text-sm font-medium text-background">
                {isMultiCity ? "Multi-City" : isRoundTrip ? "Return" : "One Way"}
              </span>
              <ChevronDown className="w-3 h-3 text-background/50" />
            </div>

            {/* Route */}
            {isMultiCity ? (
              <div className="bg-foreground/80 border border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-1.5 shrink-0">
                <span className="text-xs sm:text-sm font-medium text-background">
                  {multiCitySegments.map(s => s.from).join(" → ")} → {multiCitySegments[multiCitySegments.length - 1]?.to || "—"}
                </span>
              </div>
            ) : (
              <>
                <div className="bg-foreground/80 border border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-1.5 shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-background">{fromCode || "—"}</span>
                  <span className="text-[10px] text-background/60">
                    {AIRPORTS.find(a => a.code === fromCode)?.city || fromCode}
                  </span>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-background/50 shrink-0" />
                <div className="bg-foreground/80 border border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-1.5 shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-background">{toCode || "—"}</span>
                  <span className="text-[10px] text-background/60">
                    {AIRPORTS.find(a => a.code === toCode)?.city || toCode}
                  </span>
                </div>
              </>
            )}

            {/* Dates */}
            <div className="bg-foreground/80 border border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-1.5 shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-background/70" />
              <span className="text-xs sm:text-sm font-medium text-background">
                {isMultiCity
                  ? multiCitySegments.map(s => s.date).filter(Boolean).join(", ")
                  : departDate
                    ? (() => { try { return format(new Date(departDate), "dd MMM, EEE, yy"); } catch { return departDate; } })()
                    : "—"
                }
              </span>
            </div>
            {isRoundTrip && returnDate && (
              <div className="bg-foreground/80 border border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-1.5 shrink-0">
                <CalendarDays className="w-3.5 h-3.5 text-background/70" />
                <span className="text-xs sm:text-sm font-medium text-background">
                  {(() => { try { return format(new Date(returnDate), "dd MMM, EEE, yy"); } catch { return returnDate; } })()}
                </span>
              </div>
            )}

            {/* Passengers & Cabin */}
            <div className="bg-foreground/80 border border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-1.5 shrink-0">
              <Users className="w-3.5 h-3.5 text-background/70" />
              <span className="text-xs sm:text-sm font-medium text-background">
                {totalPax} Person{totalPax > 1 ? "s" : ""}{cabinClass ? `, ${cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}` : ", Economy"}
              </span>
            </div>

            {/* Airlines dropdown placeholder */}
            <div className="bg-foreground/80 border border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-1.5 shrink-0">
              <span className="text-xs sm:text-sm text-background/60">Airlines</span>
              <ChevronDown className="w-3 h-3 text-background/50" />
            </div>

            {/* Search button */}
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg px-5 h-9 shrink-0 ml-auto" asChild>
              <Link to="/">
                <Search className="w-3.5 h-3.5 mr-1.5" /> Search
              </Link>
            </Button>
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
                <>Showing <strong>{filteredPairs.length} flights</strong> &amp; <strong>{airlines.length} Airlines</strong> <span className="text-muted-foreground font-normal text-xs">(Fares include. AIT VAT)</span></>
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
                    onReset={resetFilters}
                  />
                </CardContent>
              </Card>
            </aside>

            {/* Main content */}
            <div className="flex-1 space-y-3">
              {/* Airline filter bar — real API data, 3D card with working scroll */}
              {airlineStats.length > 0 && !isMultiCity && (
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
