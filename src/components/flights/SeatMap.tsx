import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, X, AlertTriangle, Plane } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Types ─── */
type SeatStatus = "available" | "occupied" | "selected" | "blocked";
type SeatType = "standard" | "window" | "middle" | "aisle" | "extra-legroom" | "premium" | "exit-row" | "front-row";

interface Seat {
  id: string;
  row: number;
  col: string;
  type: SeatType;
  status: SeatStatus;
  price: number;
  currency?: string;
  label: string;
}

interface SeatMapProps {
  flightNumber: string;
  aircraft?: string;
  cabinClass?: string;
  passengers: { firstName: string; lastName: string; title: string }[];
  selectedSeats: Record<number, string>;
  onSeatSelect: (passengerIndex: number, seatId: string, price: number) => void;
  onSeatDeselect: (passengerIndex: number) => void;
  isDomestic?: boolean;
  // API data passed from parent
  seatMapData?: any;
  seatMapSource?: string;
  seatMapLoading?: boolean;
}

/* ─── Parse API seat data into flat Seat[] ─── */
function parseApiSeatData(data: any): { seats: Seat[]; columns: string[]; exitRows: number[]; aisleAfter: number[] } | null {
  if (!data?.layout?.rows || data.layout.rows.length === 0) return null;

  const layout = data.layout;
  const seats: Seat[] = [];

  for (const row of layout.rows) {
    for (const apiSeat of row.seats) {
      let type: SeatType = "standard";
      if (apiSeat.isExit || apiSeat.type === "exit-row") type = "exit-row";
      else if (apiSeat.type === "window") type = "window";
      else if (apiSeat.type === "aisle") type = "aisle";
      else if (apiSeat.type === "middle") type = "middle";
      else if (apiSeat.type === "extra-legroom") type = "extra-legroom";
      else if (apiSeat.type === "premium") type = "premium";
      else if (apiSeat.type === "front-row") type = "front-row";

      seats.push({
        id: apiSeat.id || `${apiSeat.row}${apiSeat.col}`,
        row: apiSeat.row,
        col: apiSeat.col,
        type,
        status: apiSeat.status === "occupied" ? "occupied" : apiSeat.status === "blocked" ? "blocked" : "available",
        price: apiSeat.price || 0,
        currency: apiSeat.currency || "BDT",
        label: apiSeat.label || `${apiSeat.row}${apiSeat.col}`,
      });
    }
  }

  return {
    seats,
    columns: layout.columns || [...new Set(seats.map(s => s.col))].sort(),
    exitRows: layout.exitRows || [],
    aisleAfter: layout.aisleAfter || [],
  };
}

/* ─── Color map ─── */
const seatColors: Record<string, string> = {
  available: "bg-accent/10 border-accent/30 hover:bg-accent/20 cursor-pointer",
  occupied: "bg-muted/60 border-muted-foreground/20 cursor-not-allowed opacity-50",
  selected: "bg-accent border-accent text-accent-foreground cursor-pointer ring-2 ring-accent/40",
  blocked: "bg-muted border-muted cursor-not-allowed opacity-30",
};

const typeLabels: Record<SeatType, { label: string; color: string }> = {
  standard: { label: "Standard", color: "bg-card border-border" },
  window: { label: "Window", color: "bg-sky-500/10 border-sky-500/30" },
  middle: { label: "Middle", color: "bg-card border-border" },
  aisle: { label: "Aisle", color: "bg-violet-500/10 border-violet-500/30" },
  "extra-legroom": { label: "Extra Legroom", color: "bg-amber-500/10 border-amber-500/30" },
  premium: { label: "Premium", color: "bg-yellow-500/10 border-yellow-500/30" },
  "exit-row": { label: "Exit Row", color: "bg-red-500/10 border-red-500/30" },
  "front-row": { label: "Front Row", color: "bg-emerald-500/10 border-emerald-500/30" },
};

const SeatMap = ({
  flightNumber, aircraft, cabinClass, passengers,
  selectedSeats, onSeatSelect, onSeatDeselect,
  seatMapData, seatMapSource, seatMapLoading,
}: SeatMapProps) => {
  const [activePassenger, setActivePassenger] = useState(0);

  // Parse real API data (must be before any early return)
  const parsed = useMemo(() => parseApiSeatData(seatMapData), [seatMapData]);

  const seats = parsed?.seats || [];
  const columns = parsed?.columns || [];
  const exitRowNums = parsed?.exitRows || [];
  const aisleAfter = parsed?.aisleAfter || [];

  // Group seats by row (must be before any early return)
  const rows = useMemo(() => {
    const map = new Map<number, Seat[]>();
    for (const seat of seats) {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row)!.push(seat);
    }
    for (const [, rowSeats] of map) {
      rowSeats.sort((a, b) => a.col.localeCompare(b.col));
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [seats]);

  // If loading
  if (seatMapLoading) {
    return (
      <div className="space-y-3 py-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-[300px] w-full max-w-[400px] mx-auto" />
      </div>
    );
  }

  // If no real seat data available
  if (!parsed || parsed.seats.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
          <Plane className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Seat Selection Not Available</p>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time seat map data is not available for this flight from the airline's system.
          </p>
          <p className="text-xs text-muted-foreground">
            Seats will be assigned at check-in or you can select seats on the airline's website.
          </p>
        </div>
        {seatMapSource && seatMapSource !== "none" && (
          <Badge variant="outline" className="text-[9px]">Source: {seatMapSource}</Badge>
        )}
      </div>
    );
  }

  const cols = columns.length;
  const isNarrow = cols <= 4;
  const exitRowSet = new Set(exitRowNums);
  const selectedSeatIds = new Set(Object.values(selectedSeats));

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "occupied" || seat.status === "blocked") return;

    const alreadySelectedByCurrentPax = selectedSeats[activePassenger] === seat.id;
    if (alreadySelectedByCurrentPax) {
      onSeatDeselect(activePassenger);
      return;
    }

    if (selectedSeatIds.has(seat.id)) return;

    onSeatSelect(activePassenger, seat.id, seat.price);

    const nextUnassigned = passengers.findIndex((_, i) => i > activePassenger && !selectedSeats[i]);
    if (nextUnassigned >= 0) setActivePassenger(nextUnassigned);
  };

  const getSeatDisplayStatus = (seat: Seat): SeatStatus => {
    if (selectedSeatIds.has(seat.id)) return "selected";
    return seat.status;
  };

  const totalSeatCost = Object.entries(selectedSeats).reduce((sum, [, seatId]) => {
    const seat = seats.find(s => s.id === seatId);
    return sum + (seat?.price || 0);
  }, 0);

  // Determine aisle positions based on API data or column count
  const getIsGap = (colIndex: number): boolean => {
    if (aisleAfter.length > 0) {
      return aisleAfter.includes(colIndex);
    }
    // Auto-detect based on column layout
    if (cols <= 4) return colIndex === 1;
    if (cols >= 9) return colIndex === 2 || colIndex === 5;
    return colIndex === 2; // Standard 3-3 layout
  };

  return (
    <div className="space-y-4">
      {/* Passenger selector */}
      <div className="flex flex-wrap gap-2">
        {passengers.map((pax, i) => (
          <button key={i} onClick={() => setActivePassenger(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
              activePassenger === i
                ? "border-accent bg-accent/10 text-accent"
                : selectedSeats[i] ? "border-accent/40 bg-accent/5 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
            }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              activePassenger === i ? "bg-accent text-accent-foreground" : selectedSeats[i] ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
            }`}>{i + 1}</span>
            <span>{pax.title} {pax.firstName || `Pax ${i + 1}`}</span>
            {selectedSeats[i] && <Badge className="bg-accent/10 text-accent border-0 text-[9px] h-4">{selectedSeats[i]}</Badge>}
          </button>
        ))}
      </div>

      {/* Aircraft info header */}
      <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-muted-foreground">Flight: </span>
            <span className="font-bold">{flightNumber}</span>
          </div>
          {aircraft && (
            <div className="text-xs">
              <span className="text-muted-foreground">Aircraft: </span>
              <span className="font-bold">{aircraft}</span>
            </div>
          )}
          <div className="text-xs">
            <span className="text-muted-foreground">Class: </span>
            <span className="font-bold">{cabinClass || "Economy"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {seatMapSource && seatMapSource !== "none" && (
            <Badge variant="outline" className="text-[9px] border-accent/30 text-accent">
              {seatMapSource === "sabre" ? "Live Sabre Data" : seatMapSource === "tti" ? "Live Airline Data" : seatMapSource}
            </Badge>
          )}
          {totalSeatCost > 0 && (
            <Badge className="bg-accent/10 text-accent border-accent/20 font-bold">Seat Total: ৳{totalSeatCost.toLocaleString()}</Badge>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px]">
        {[
          { label: "Available", class: "bg-accent/10 border-accent/30" },
          { label: "Selected", class: "bg-accent border-accent" },
          { label: "Occupied", class: "bg-muted/60 border-muted-foreground/20 opacity-50" },
          { label: "Exit Row", class: "bg-red-500/10 border-red-500/30" },
          { label: "Extra Legroom", class: "bg-amber-500/10 border-amber-500/30" },
          { label: "Front Row", class: "bg-emerald-500/10 border-emerald-500/30" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded border ${item.class}`} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Seat grid */}
      <div className="overflow-x-auto pb-2">
        <div className={`mx-auto ${isNarrow ? "max-w-[280px]" : cols >= 9 ? "max-w-[500px]" : "max-w-[380px]"}`}>
          {/* Column headers */}
          <div className="flex items-center justify-center gap-0 mb-1">
            <div className="w-7 shrink-0" />
            {columns.map((col, i) => (
              <div key={col} className="flex">
                {getIsGap(i) && <div className="w-5" />}
                <div className="w-8 h-6 flex items-center justify-center text-[10px] font-bold text-muted-foreground">{col}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
            {rows.map(([rowNum, rowSeats]) => {
              const isExit = exitRowSet.has(rowNum);
              return (
                <div key={rowNum} className="relative">
                  {isExit && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 text-[8px] text-red-500 font-bold rotate-90 origin-center">EXIT</div>
                  )}
                  <div className="flex items-center justify-center gap-0">
                    <div className="w-7 shrink-0 text-[10px] text-muted-foreground font-medium text-right pr-1.5">{rowNum}</div>
                    {rowSeats.map((seat, i) => {
                      const displayStatus = getSeatDisplayStatus(seat);
                      const selectedByPax = Object.entries(selectedSeats).find(([, id]) => id === seat.id);
                      return (
                        <div key={seat.id} className="flex">
                          {getIsGap(i) && <div className="w-5" />}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleSeatClick(seat)}
                                disabled={seat.status === "occupied" || seat.status === "blocked"}
                                className={`w-8 h-7 rounded-t-md border text-[9px] font-bold transition-all relative ${
                                  displayStatus === "selected"
                                    ? seatColors.selected
                                    : displayStatus === "occupied"
                                    ? seatColors.occupied
                                    : seat.type === "exit-row" ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 cursor-pointer"
                                    : seat.type === "extra-legroom" ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer"
                                    : seat.type === "front-row" ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer"
                                    : seatColors.available
                                }`}
                              >
                                {displayStatus === "selected" && selectedByPax
                                  ? <span className="text-[9px]">P{Number(selectedByPax[0]) + 1}</span>
                                  : displayStatus === "occupied" ? <X className="w-3 h-3 mx-auto opacity-40" /> : null
                                }
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-bold">{seat.label} — {typeLabels[seat.type]?.label || "Standard"}</p>
                              {seat.status !== "occupied" && (
                                <p className="text-muted-foreground">{seat.price === 0 ? "Free" : `৳${seat.price}`}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected seats summary */}
      {Object.keys(selectedSeats).length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected Seats</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedSeats).map(([paxIdx, seatId]) => {
              const seat = seats.find(s => s.id === seatId);
              const pax = passengers[Number(paxIdx)];
              return (
                <div key={paxIdx} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
                  <span className="text-xs font-medium">{pax?.title} {pax?.firstName || `Pax ${Number(paxIdx) + 1}`}</span>
                  <Badge className="bg-accent text-accent-foreground border-0 text-[10px] font-bold h-5">{seatId}</Badge>
                  <span className="text-[10px] text-muted-foreground">{seat?.price === 0 ? "Free" : `৳${seat?.price}`}</span>
                  <button onClick={() => onSeatDeselect(Number(paxIdx))} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p>Seat selection is subject to airline confirmation. Final seat assignments will be confirmed at check-in. Seat prices are per passenger per segment.</p>
      </div>
    </div>
  );
};

export default SeatMap;
