import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Plane, Building2, Search, Eye, Download, MoreHorizontal, RotateCcw, XCircle,
  FileText, Globe, Palmtree, CreditCard, Timer, Package, Ban,
} from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";
import { generateTicketPDF } from "@/lib/pdf-generator";
import { AIRPORTS } from "@/lib/airports";
import { useDashboardBookings } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";
import TravelDocVerificationModal from "@/components/TravelDocVerificationModal";

const statusTabs = ["All", "Reserved", "Pending", "In Progress", "Confirmed", "Completed", "Void", "Refund", "Exchange", "Expired", "Cancelled", "Un-Confirmed"];

const statusLabelMap: Record<string, string> = {
  on_hold: "Reserved", "On Hold": "Reserved",
  confirmed: "Confirmed", pending: "Pending", in_progress: "In Progress",
  completed: "Completed", cancelled: "Cancelled", void: "Void",
  refund: "Refund", exchange: "Exchange", expired: "Expired",
  un_confirmed: "Un-Confirmed", ticketed: "Ticketed",
};
function displayStatus(status: string) { return statusLabelMap[status] || status; }

const statusColors: Record<string, string> = {
  "Confirmed": "bg-accent/10 text-accent border-accent/20", "confirmed": "bg-accent/10 text-accent border-accent/20",
  "Ticketed": "bg-accent/10 text-accent border-accent/20", "ticketed": "bg-accent/10 text-accent border-accent/20",
  "Pending": "bg-warning/10 text-warning border-warning/20", "pending": "bg-warning/10 text-warning border-warning/20",
  "In Progress": "bg-primary/10 text-primary border-primary/20", "in_progress": "bg-primary/10 text-primary border-primary/20",
  "Completed": "bg-muted text-muted-foreground border-border", "completed": "bg-muted text-muted-foreground border-border",
  "Cancelled": "bg-destructive/10 text-destructive border-destructive/20", "cancelled": "bg-destructive/10 text-destructive border-destructive/20",
  "Void": "bg-destructive/10 text-destructive border-destructive/20", "void": "bg-destructive/10 text-destructive border-destructive/20",
  "Refund": "bg-accent/10 text-accent border-accent/20", "refund": "bg-accent/10 text-accent border-accent/20",
  "Exchange": "bg-primary/10 text-primary border-primary/20", "exchange": "bg-primary/10 text-primary border-primary/20",
  "Expired": "bg-muted text-muted-foreground border-border", "expired": "bg-muted text-muted-foreground border-border",
  "Reserved": "bg-warning/10 text-warning border-warning/20", "On Hold": "bg-warning/10 text-warning border-warning/20", "on_hold": "bg-warning/10 text-warning border-warning/20",
  "Un-Confirmed": "bg-destructive/10 text-destructive border-destructive/20", "un_confirmed": "bg-destructive/10 text-destructive border-destructive/20",
};

const BD_AIRPORTS = ["DAC", "CXB", "CGP", "ZYL", "JSR", "RJH", "SPD", "BZL", "IRD", "TKR"];
function isDomesticRoute(origin?: string, destination?: string): boolean {
  if (!origin || !destination) return true;
  return BD_AIRPORTS.includes(origin.toUpperCase()) && BD_AIRPORTS.includes(destination.toUpperCase());
}

const typeIcons: Record<string, typeof Plane> = { flight: Plane, hotel: Building2, visa: Globe, holiday: Palmtree };

function getTimeLeft(deadline: string): { text: string; urgent: boolean } | null {
  const now = new Date();
  const dl = new Date(deadline);
  const diff = dl.getTime() - now.getTime();
  if (diff <= 0) return { text: "Expired", urgent: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return { text: `${days}d ${hours % 24}h left`, urgent: days <= 1 };
  if (hours > 0) return { text: `${hours}h left`, urgent: hours <= 6 };
  const mins = Math.floor(diff / (1000 * 60));
  return { text: `${mins}m left`, urgent: true };
}

function mapBooking(b: any) {
  const details = b.details || {};
  const outbound = details.outbound || {};
  const passengers = b.passengerInfo || [];
  const origin = outbound.origin || details.origin || "";
  const destination = outbound.destination || details.destination || "";
  const airline = outbound.airline || details.airline || "";
  const airlineCode = outbound.airlineCode || details.airlineCode || "";
  const flightNumber = outbound.flightNumber || details.flightNumber || "";
  const cabinClass = outbound.cabinClass || details.cabinClass || "Economy";
  const departureTime = outbound.departureTime || details.departureTime || "";
  const source = outbound.source || details.source || "db";
  const title = origin && destination ? `${origin} → ${destination}` : details.route || details.destination || `${b.bookingType || "flight"} Booking`;
  const paxCount = passengers.length || 1;

  // Dual PNR logic
  const isSabre = (source === 'sabre');
  const airlinePnrVal = details.airlinePnr || (isSabre ? (b.pnr || details.gdsPnr || null) : null);
  const gdsBookingIdVal = details.gdsBookingId || details.gdsBookingResult?.ttiBookingId || (!isSabre ? (b.pnr || details.gdsPnr || null) : null);

  return {
    id: b.bookingRef || b.id, rawId: b.id, type: b.bookingType || "flight", status: b.status || "pending", title,
    amount: `৳${(b.totalAmount || 0).toLocaleString()}`, rawAmount: b.totalAmount || 0,
    date: b.bookedAt ? new Date(b.bookedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
    pnr: b.pnr || details.gdsPnr || "—",
    airlinePnr: airlinePnrVal,
    gdsBookingId: gdsBookingIdVal,
    pax: paxCount,
    paymentDeadline: b.paymentDeadline || null,
    airline, airlineCode, flightNumber, cabinClass, departureTime, origin, destination, source,
    isDomestic: details.isDomestic ?? isDomesticRoute(origin, destination),
    details, passengers,
  };
}

const DashboardBookings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [perPage, setPerPage] = useState("10");
  const [page, setPage] = useState(1);
  const [docVerifyBooking, setDocVerifyBooking] = useState<any>(null);

  const statusParam = activeTab !== "All" ? (activeTab === "Reserved" ? "on_hold" : activeTab.toLowerCase().replace(/[ -]/g, "_")) : undefined;
  const { data, isLoading, error, refetch } = useDashboardBookings({
    status: statusParam, search: search || undefined, limit: Number(perPage), page,
  });

  const resolved = (data as any) || {};
  const rawBookings = resolved?.data || resolved?.bookings || [];
  const bookings = rawBookings.map(mapBooking);

  const tabCounts: Record<string, number> = resolved?.tabCounts || {};
  if (!tabCounts["All"]) {
    tabCounts["All"] = bookings.length;
    statusTabs.forEach(tab => {
      if (tab !== "All") {
        const tabKey = tab === "Reserved" ? "on_hold" : tab.toLowerCase().replace(/ /g, "_");
        tabCounts[tab] = bookings.filter((b: any) => b.status?.toLowerCase() === tabKey || displayStatus(b.status) === tab).length;
      }
    });
  }

  const total = resolved?.total || bookings.length;
  const totalPages = Math.ceil(total / Number(perPage)) || 1;
  const paginatedBookings = bookings.slice((page - 1) * Number(perPage), page * Number(perPage));

  const handlePayNow = (booking: any) => {
    if (!booking.isDomestic && booking.type === "flight") {
      setDocVerifyBooking(booking);
    } else {
      window.location.href = "/dashboard/payments";
    }
  };

  const handleDocVerified = () => {
    toast({ title: "Documents Verified ✓", description: "Passport & visa verified. Redirecting to payment..." });
    setDocVerifyBooking(null);
    window.location.href = "/dashboard/payments";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold">My Bookings</h1><p className="text-xs sm:text-sm text-muted-foreground mt-1">{total} total bookings</p></div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => {
          downloadCSV('bookings', ['ID', 'Type', 'Route', 'Date', 'PNR', 'Status', 'Amount'], bookings.map((b: any) => [b.id, b.type, b.title, b.date, b.pnr, displayStatus(b.status), b.amount]));
          toast({ title: "Exported", description: "Bookings CSV downloaded." });
        }}><Download className="w-4 h-4 mr-1.5" /> Export</Button>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-border pb-px -mx-1 px-1">
        {statusTabs.map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === tab ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {tab}
            {(tabCounts[tab] ?? 0) > 0 && (
              <span className={`text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold ${
                activeTab === tab ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}>{tabCounts[tab]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by booking ID, destination, PNR..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="flight">Flights</SelectItem><SelectItem value="hotel">Hotels</SelectItem><SelectItem value="visa">Visa</SelectItem><SelectItem value="holiday">Holidays</SelectItem></SelectContent>
        </Select>
      </div>

      <DataLoader isLoading={isLoading} error={error} skeleton="table" retry={refetch}>
        <Card>
          <CardContent className="p-0 table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead><TableHead>Details</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead><TableHead className="hidden lg:table-cell">PNR</TableHead>
                  <TableHead className="hidden sm:table-cell">Pax</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead><TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <Plane className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />No bookings found
                  </TableCell></TableRow>
                ) : paginatedBookings.map((booking: any) => {
                  const Icon = typeIcons[booking.type] || Plane;
                  const timeLeft = booking.paymentDeadline && booking.status === "on_hold" ? getTimeLeft(booking.paymentDeadline) : null;
                  return (
                    <TableRow key={booking.rawId || booking.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/dashboard/bookings/${booking.id}`)}>
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs font-semibold block">{booking.id}</span>
                          {timeLeft && (
                            <span className={`text-[9px] font-bold flex items-center gap-0.5 mt-0.5 ${timeLeft.urgent ? "text-destructive" : "text-warning"}`}>
                              <Timer className="w-2.5 h-2.5" /> {timeLeft.text}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-accent" /></div>
                          <div className="min-w-0"><span className="font-medium text-sm block truncate max-w-[150px] sm:max-w-none">{booking.title}</span>
                            {booking.airline && <span className="text-[10px] text-muted-foreground">{booking.airline} · {booking.flightNumber}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{booking.date}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {booking.pnr && booking.pnr !== "—" ? <code className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-bold">{booking.pnr}</code> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{booking.pax}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${statusColors[booking.status] || ""}`}>{displayStatus(booking.status)}</Badge></TableCell>
                      <TableCell className="text-right font-semibold text-sm">{booking.amount}</TableCell>
                      <TableCell>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/bookings/${booking.id}`); }}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              const getCity = (code: string) => { const ap = AIRPORTS.find(a => a.code === code?.toUpperCase()); return ap ? `${ap.city}, ${ap.country}` : ""; };
                              const outbound = booking.details?.outbound;
                              const returnFlt = booking.details?.return;
                              const buildSeg = (f: any) => ({
                                airline: f?.airline || "Seven Trip", airlineCode: f?.airlineCode || "", flightNumber: f?.flightNumber || "",
                                origin: f?.origin || "", originCity: f?.originCity || getCity(f?.origin),
                                destination: f?.destination || "", destinationCity: f?.destinationCity || getCity(f?.destination),
                                departureTime: f?.departureTime || "", arrivalTime: f?.arrivalTime || "", duration: f?.duration || "",
                                cabinClass: f?.cabinClass || "Economy", aircraft: f?.aircraft || f?.legs?.[0]?.aircraft || "",
                                terminal: f?.terminal || "", arrivalTerminal: f?.arrivalTerminal || "",
                                baggage: f?.baggage || "20Kg", status: "Confirmed", meal: f?.meal || "Meals",
                              });
                              generateTicketPDF({
                                id: booking.id, pnr: booking.pnr !== "—" ? booking.pnr : undefined, gdsPnr: booking.pnr !== "—" ? booking.pnr : undefined, bookingRef: booking.id, source: booking.source,
                                airline: booking.airline || "Seven Trip", flightNo: booking.flightNumber || "",
                                from: booking.origin || "", to: booking.destination || "",
                                date: booking.departureTime || booking.date, time: booking.departureTime || "",
                                passenger: "Traveller", seat: "—", class: booking.cabinClass || "Economy",
                                outbound: outbound ? [buildSeg(outbound)] : [], returnSegments: returnFlt ? [buildSeg(returnFlt)] : [],
                                passengers: booking.passengers?.map((p: any) => ({ title: p.title || "", firstName: p.firstName || "", lastName: p.lastName || "", seat: "" })) || [],
                              });
                              toast({ title: "Downloaded", description: "E-Ticket PDF saved" });
                            }}><FileText className="w-4 h-4 mr-2" /> Download E-Ticket</DropdownMenuItem>
                            {(booking.status === "on_hold") && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePayNow(booking); }}>
                                <CreditCard className="w-4 h-4 mr-2" /> {!booking.isDomestic && booking.type === "flight" ? "Upload Docs & Pay" : "Pay Now"}
                              </DropdownMenuItem>
                            )}
                            {booking.pnr && booking.pnr !== "—" && booking.type === "flight" && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/bookings/${booking.rawId}/extras`); }}><Package className="w-4 h-4 mr-2" /> Buy Extras</DropdownMenuItem>
                            )}
                            {["on_hold", "confirmed", "ticketed", "pending"].includes(booking.status) && (
                              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/bookings/${booking.id}`); }}><Ban className="w-4 h-4 mr-2" /> Cancel Booking</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DataLoader>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Show</span>
          <Select value={perPage} onValueChange={(v) => { setPerPage(v); setPage(1); }}>
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
          </Select>
          <span className="text-muted-foreground">per page</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 bg-accent text-accent-foreground">{page}</Button>
          <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {docVerifyBooking && (
        <TravelDocVerificationModal
          open={!!docVerifyBooking}
          onOpenChange={(open) => { if (!open) setDocVerifyBooking(null); }}
          onVerified={handleDocVerified}
          passengers={docVerifyBooking.passengers || []}
          bookingRef={docVerifyBooking.id}
          bookingId={docVerifyBooking.rawId}
        />
      )}
    </div>
  );
};

export default DashboardBookings;
