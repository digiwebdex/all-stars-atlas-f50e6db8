import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Plane, Building2, Search, Eye, Download, MoreHorizontal, RotateCcw, XCircle,
  FileText, Globe, Palmtree, CreditCard, Timer, Clock, Luggage, Shield,
  ArrowRight, Users, AlertTriangle, Copy,
} from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";
import { generateTicketPDF } from "@/lib/pdf-generator";
import { AIRPORTS } from "@/lib/airports";
import { useDashboardBookings } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";
import PaymentReminderBanner from "@/components/PaymentReminder";

const statusTabs = ["All", "On Hold", "Pending", "In Progress", "Confirmed", "Completed", "Void", "Refund", "Exchange", "Expired", "Cancelled", "Un-Confirmed"];

const statusColors: Record<string, string> = {
  "Confirmed": "bg-accent/10 text-accent border-accent/20", "confirmed": "bg-accent/10 text-accent border-accent/20",
  "Pending": "bg-warning/10 text-warning border-warning/20", "pending": "bg-warning/10 text-warning border-warning/20",
  "In Progress": "bg-primary/10 text-primary border-primary/20", "in_progress": "bg-primary/10 text-primary border-primary/20",
  "Completed": "bg-muted text-muted-foreground border-border", "completed": "bg-muted text-muted-foreground border-border",
  "Cancelled": "bg-destructive/10 text-destructive border-destructive/20", "cancelled": "bg-destructive/10 text-destructive border-destructive/20",
  "Void": "bg-destructive/10 text-destructive border-destructive/20", "void": "bg-destructive/10 text-destructive border-destructive/20",
  "Refund": "bg-accent/10 text-accent border-accent/20", "refund": "bg-accent/10 text-accent border-accent/20",
  "Exchange": "bg-primary/10 text-primary border-primary/20", "exchange": "bg-primary/10 text-primary border-primary/20",
  "Expired": "bg-muted text-muted-foreground border-border", "expired": "bg-muted text-muted-foreground border-border",
  "On Hold": "bg-warning/10 text-warning border-warning/20", "on_hold": "bg-warning/10 text-warning border-warning/20",
  "Un-Confirmed": "bg-destructive/10 text-destructive border-destructive/20", "un_confirmed": "bg-destructive/10 text-destructive border-destructive/20",
};

const typeIcons: Record<string, typeof Plane> = { flight: Plane, hotel: Building2, visa: Globe, holiday: Palmtree };

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
  const aircraft = outbound.aircraft || outbound.legs?.[0]?.aircraft || "";
  const departureTime = outbound.departureTime || details.departureTime || "";
  const arrivalTime = outbound.arrivalTime || details.arrivalTime || "";
  const duration = outbound.duration || details.duration || "";
  const stops = outbound.stops ?? details.stops ?? 0;
  const baggage = outbound.baggage || details.baggage || null;
  const refundable = outbound.refundable ?? details.refundable ?? false;
  const legs = outbound.legs || [];
  const seatsAvailable = outbound.seatsAvailable || details.seatsAvailable || null;
  const returnFlight = details.return || null;
  const isRoundTrip = !!details.isRoundTrip;
  const source = outbound.source || details.source || "db";
  const fareDetails = outbound.fareDetails || details.fareDetails || null;
  const timeLimit = outbound.timeLimit || details.timeLimit || null;
  const title = origin && destination ? `${origin} → ${destination}` : details.route || details.destination || `${b.bookingType || "flight"} Booking`;
  const paxCount = passengers.length || 1;
  const paxNames = passengers.map((p: any) => `${p.firstName || ""} ${p.lastName || ""}`.trim()).filter(Boolean);

  return {
    id: b.bookingRef || b.id, rawId: b.id, type: b.bookingType || "flight", status: b.status || "pending", title,
    amount: `৳${(b.totalAmount || 0).toLocaleString()}`, rawAmount: b.totalAmount || 0,
    date: b.bookedAt ? new Date(b.bookedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
    pnr: b.pnr || details.gdsPnr || "—", pax: paxCount, paxNames, ticketNo: b.ticketNo || "—",
    paymentMethod: b.paymentMethod || "—", paymentStatus: b.paymentStatus || "—", paymentDeadline: b.paymentDeadline || null,
    airline, airlineCode, flightNumber, cabinClass, aircraft, departureTime, arrivalTime, duration, stops, baggage, refundable,
    legs, seatsAvailable, returnFlight, isRoundTrip, source, fareDetails, timeLimit, origin, destination,
    details, passengers, contactInfo: b.contactInfo || {}, addOns: details.addOns || {},
    baseFare: details.baseFare || 0, taxes: details.taxes || 0, serviceCharge: details.serviceCharge || 0,
  };
}

function fmtTime(dt?: string) { if (!dt) return "—"; try { const d = new Date(dt); return isNaN(d.getTime()) ? dt : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return dt; } }
function fmtDate(dt?: string) { if (!dt) return "—"; try { const d = new Date(dt); return isNaN(d.getTime()) ? dt : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); } catch { return dt; } }
function getAirlineLogo(code?: string): string | null { return code ? `https://images.kiwi.com/airlines/64/${code}.png` : null; }

/* ─── Booking Detail Dialog (Inno Travel Tech Design) ─── */
const BookingDetailDialog = ({ booking, onClose }: { booking: any; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState("itinerary");
  const { toast } = useToast();
  if (!booking) return null;

  const logo = getAirlineLogo(booking.airlineCode);
  const legs = booking.legs || [];

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 w-[95vw] sm:w-auto">
        {/* Header with Booking ID */}
        <div className="bg-accent text-accent-foreground px-4 sm:px-6 py-3 sm:py-4">
          <DialogHeader>
            <DialogTitle className="text-accent-foreground flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 shrink-0" />
                <span className="text-sm sm:text-base truncate">Booking: {booking.id}</span>
              </div>
              <Badge className="bg-accent-foreground/20 text-accent-foreground border-0 text-xs w-fit">
                {booking.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* Booking meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-muted/30 rounded-lg">
              <p className="text-[9px] sm:text-[10px] uppercase text-muted-foreground font-medium">Booking ID</p>
              <p className="text-xs sm:text-sm font-bold font-mono flex items-center gap-1 truncate">{booking.id}
                <button onClick={() => copyText(booking.id, "Booking ID")} className="shrink-0"><Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-muted/30 rounded-lg">
              <p className="text-[9px] sm:text-[10px] uppercase text-muted-foreground font-medium">Airlines PNR</p>
              <p className="text-xs sm:text-sm font-bold font-mono flex items-center gap-1">{booking.pnr}
                {booking.pnr !== "—" && <button onClick={() => copyText(booking.pnr, "PNR")} className="shrink-0"><Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-muted/30 rounded-lg">
              <p className="text-[9px] sm:text-[10px] uppercase text-muted-foreground font-medium">Booking Class</p>
              <p className="text-xs sm:text-sm font-bold">{booking.cabinClass}</p>
            </div>
            <div className="p-2 sm:p-3 bg-muted/30 rounded-lg">
              <p className="text-[9px] sm:text-[10px] uppercase text-muted-foreground font-medium">Journey Type</p>
              <p className="text-xs sm:text-sm font-bold">{booking.isRoundTrip ? "Round Trip" : "One Way"}</p>
            </div>
          </div>

          {/* Tabs: Itinerary / Fare Breakdown / Activity */}
          <div className="flex border-b border-border">
            {[
              { key: "itinerary", label: "Itinerary Information" },
              { key: "fare", label: "Fare Breakdown" },
              { key: "passengers", label: "Passengers" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>{tab.label}</button>
            ))}
          </div>

          {/* Itinerary Tab */}
          {activeTab === "itinerary" && (
            <div className="space-y-4">
              {/* Departure/Arrival cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Departure card */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-accent px-4 py-2"><p className="text-xs font-bold text-accent-foreground uppercase">Departure</p></div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black">{booking.origin}</span>
                      <span className="text-2xl font-black">{fmtTime(booking.departureTime)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{fmtDate(booking.departureTime)}</p>
                    {legs[0]?.originTerminal && <p className="text-xs text-muted-foreground">Terminal {legs[0].originTerminal}</p>}
                  </div>
                </div>
                {/* Arrival card */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-accent px-4 py-2"><p className="text-xs font-bold text-accent-foreground uppercase">Arrival</p></div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black">{booking.destination}</span>
                      <span className="text-2xl font-black">{fmtTime(booking.arrivalTime)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{fmtDate(booking.arrivalTime)}</p>
                    {legs[legs.length - 1]?.destinationTerminal && <p className="text-xs text-muted-foreground">Terminal {legs[legs.length - 1].destinationTerminal}</p>}
                  </div>
                </div>
              </div>

              {/* Flight Details table */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/30 px-4 py-2 border-b border-border">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Flight Details</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border bg-muted/10">
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase text-muted-foreground">Flight Number</th>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase text-muted-foreground">Departure</th>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase text-muted-foreground">Arrival</th>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase text-muted-foreground">Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase text-muted-foreground">Baggage</th>
                    </tr></thead>
                    <tbody>
                      {legs.length > 0 ? legs.map((leg: any, i: number) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getAirlineLogo(leg.airlineCode) && <img src={getAirlineLogo(leg.airlineCode)!} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                              <div><p className="font-bold">{leg.flightNumber}</p><p className="text-[10px] text-muted-foreground">{leg.aircraft || ""}</p></div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold">{leg.origin} {fmtTime(leg.departureTime)}</p>
                            <p className="text-[10px] text-muted-foreground">{fmtDate(leg.departureTime)}</p>
                            {leg.originTerminal && <p className="text-[10px] text-muted-foreground">Terminal {leg.originTerminal}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold">{leg.destination} {fmtTime(leg.arrivalTime)}</p>
                            <p className="text-[10px] text-muted-foreground">{fmtDate(leg.arrivalTime)}</p>
                            {leg.destinationTerminal && <p className="text-[10px] text-muted-foreground">Terminal {leg.destinationTerminal}</p>}
                          </td>
                          <td className="px-4 py-3 font-medium">{leg.duration || `${leg.durationMinutes}m`}</td>
                          <td className="px-4 py-3 font-medium">{booking.baggage}</td>
                        </tr>
                      )) : (
                        <tr className="border-b border-border/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {logo && <img src={logo} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                              <div><p className="font-bold">{booking.flightNumber}</p><p className="text-[10px] text-muted-foreground">{booking.aircraft}</p></div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><p className="font-bold">{booking.origin} {fmtTime(booking.departureTime)}</p><p className="text-[10px] text-muted-foreground">{fmtDate(booking.departureTime)}</p></td>
                          <td className="px-4 py-3"><p className="font-bold">{booking.destination} {fmtTime(booking.arrivalTime)}</p><p className="text-[10px] text-muted-foreground">{fmtDate(booking.arrivalTime)}</p></td>
                          <td className="px-4 py-3 font-medium">{booking.duration}</td>
                          <td className="px-4 py-3 font-medium">{booking.baggage}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Additional info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Luggage className="w-3.5 h-3.5" /> {booking.baggage} checked</span>
                <span>Cabin: {booking.cabinClass}</span>
                {booking.refundable && <span className="flex items-center gap-1 text-accent"><Shield className="w-3.5 h-3.5" /> Refundable</span>}
                <span>{booking.stops === 0 ? "Non-stop" : `${booking.stops} stop(s)`}</span>
              </div>

              {/* Return flight */}
              {booking.isRoundTrip && booking.returnFlight && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 mb-2"><Badge className="bg-warning/10 text-warning border-0 text-xs">Return Flight</Badge></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="bg-warning/80 px-4 py-2"><p className="text-xs font-bold text-warning-foreground uppercase">Departure</p></div>
                      <div className="p-4"><div className="flex items-center justify-between"><span className="text-3xl font-black">{booking.returnFlight.origin}</span><span className="text-2xl font-black">{fmtTime(booking.returnFlight.departureTime)}</span></div>
                        <p className="text-xs text-muted-foreground mt-1">{fmtDate(booking.returnFlight.departureTime)}</p></div>
                    </div>
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="bg-warning/80 px-4 py-2"><p className="text-xs font-bold text-warning-foreground uppercase">Arrival</p></div>
                      <div className="p-4"><div className="flex items-center justify-between"><span className="text-3xl font-black">{booking.returnFlight.destination}</span><span className="text-2xl font-black">{fmtTime(booking.returnFlight.arrivalTime)}</span></div>
                        <p className="text-xs text-muted-foreground mt-1">{fmtDate(booking.returnFlight.arrivalTime)}</p></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Fare Breakdown Tab */}
          {activeTab === "fare" && (
            <div className="space-y-3">
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/30 px-4 py-2 border-b border-border"><p className="text-xs font-bold uppercase text-muted-foreground">Customer Fare Breakdown</p></div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between py-1"><span className="text-muted-foreground">Base Fare</span><span className="font-semibold">৳{(booking.baseFare || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span className="text-muted-foreground">Taxes & Fees</span><span className="font-semibold">৳{(booking.taxes || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span className="text-muted-foreground">Service Charge</span><span className="font-semibold">৳{(booking.serviceCharge || 0).toLocaleString()}</span></div>
                  {booking.addOns?.total > 0 && <div className="flex justify-between py-1"><span className="text-muted-foreground">Add-ons</span><span className="font-semibold">৳{booking.addOns.total.toLocaleString()}</span></div>}
                  <Separator />
                  <div className="flex justify-between text-base font-bold pt-1"><span>Total Payable</span><span className="text-accent">{booking.amount}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg"><p className="text-[10px] uppercase text-muted-foreground font-medium">Payment Method</p><p className="text-sm font-medium capitalize">{booking.paymentMethod}</p></div>
                <div className="p-3 bg-muted/30 rounded-lg"><p className="text-[10px] uppercase text-muted-foreground font-medium">Payment Status</p><p className="text-sm font-medium capitalize">{booking.paymentStatus}</p></div>
              </div>
              {booking.paymentDeadline && (
                <div className="flex items-center gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <Timer className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-destructive font-semibold">
                    Payment Deadline: {new Date(booking.paymentDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Passengers Tab */}
          {activeTab === "passengers" && (
            <div className="space-y-3">
              {booking.passengers?.length > 0 ? booking.passengers.map((p: any, i: number) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-accent/5 px-4 py-2 border-b border-border/50 flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="text-sm font-bold">{p.title} {p.firstName} {p.lastName}</span>
                    {i === 0 && <Badge className="bg-accent/10 text-accent border-0 text-[9px] ml-auto">Primary</Badge>}
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {p.dob && <div><span className="text-muted-foreground">Date of Birth</span><p className="font-medium">{p.dob}</p></div>}
                    {p.nationality && <div><span className="text-muted-foreground">Nationality</span><p className="font-medium">{p.nationality}</p></div>}
                    {p.passport && <div><span className="text-muted-foreground">Document No.</span><p className="font-medium font-mono">{p.passport}</p></div>}
                    {p.passportExpiry && <div><span className="text-muted-foreground">Expiry Date</span><p className="font-medium">{p.passportExpiry}</p></div>}
                    {p.email && <div><span className="text-muted-foreground">Email</span><p className="font-medium">{p.email}</p></div>}
                    {p.phone && <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{p.phone}</p></div>}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-6">No passenger info available</p>
              )}
            </div>
          )}

          {/* Manage actions */}
          <Separator />
          <div className="flex flex-wrap gap-3">
            {(booking.status === "on_hold" || booking.status === "On Hold") && (
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold" onClick={() => { window.location.href = "/dashboard/payments"; }}>
                <CreditCard className="w-4 h-4 mr-1.5" /> Pay Now
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => {
              // Build proper segment data for the PDF from stored flight details
              const getCity = (code: string) => {
                const ap = AIRPORTS.find(a => a.code === code?.toUpperCase());
                return ap ? `${ap.city}, ${ap.country}` : "";
              };
              const buildSegment = (f: any) => ({
                airline: f?.airline || "Seven Trip",
                airlineCode: f?.airlineCode || "",
                flightNumber: f?.flightNumber || "",
                origin: f?.origin || "",
                originCity: f?.originCity || getCity(f?.origin),
                destination: f?.destination || "",
                destinationCity: f?.destinationCity || getCity(f?.destination),
                departureTime: f?.departureTime || "",
                arrivalTime: f?.arrivalTime || "",
                duration: f?.duration || "",
                cabinClass: f?.cabinClass || "Economy",
                aircraft: f?.aircraft || f?.legs?.[0]?.aircraft || "",
                terminal: f?.terminal || "",
                arrivalTerminal: f?.arrivalTerminal || "",
                baggage: f?.baggage || "20kg",
                status: "Confirmed",
                meal: f?.meal || "Meals",
                stops: f?.stops ?? 0,
              });

              const outbound = booking.details?.outbound;
              const returnFlt = booking.returnFlight || booking.details?.return;
              const outboundSegs = outbound ? [buildSegment(outbound)] : [];
              const returnSegs = returnFlt ? [buildSegment(returnFlt)] : [];

              generateTicketPDF({
                id: booking.id,
                pnr: booking.pnr !== "—" ? booking.pnr : undefined,
                bookingRef: booking.pnr !== "—" ? booking.pnr : booking.id,
                airline: booking.airline || "Seven Trip",
                flightNo: booking.flightNumber || "",
                from: booking.origin || "",
                to: booking.destination || "",
                date: booking.departureTime || booking.date,
                time: booking.departureTime || "",
                passenger: booking.paxNames?.[0] || "Traveller",
                seat: "—",
                class: booking.cabinClass || "Economy",
                isRoundTrip: booking.isRoundTrip,
                outbound: outboundSegs,
                returnSegments: returnSegs,
                passengers: booking.passengers?.map((p: any) => ({
                  title: p.title || "",
                  firstName: p.firstName || "",
                  lastName: p.lastName || "",
                  passport: p.passport || "",
                  seat: "",
                })) || [],
              });
            }}>
              <Download className="w-4 h-4 mr-1.5" /> Download E-Ticket
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DashboardBookings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [perPage, setPerPage] = useState("10");
  const [page, setPage] = useState(1);
  const [viewBooking, setViewBooking] = useState<any>(null);

  const { data, isLoading, error, refetch } = useDashboardBookings({
    status: activeTab !== "All" ? activeTab : undefined, search: search || undefined, limit: Number(perPage), page,
  });

  const resolved = (data as any) || {};
  const rawBookings = resolved?.data || resolved?.bookings || [];
  const bookings = rawBookings.map(mapBooking);

  const tabCounts: Record<string, number> = resolved?.tabCounts || {};
  if (!tabCounts["All"]) {
    tabCounts["All"] = bookings.length;
    statusTabs.forEach(tab => {
      if (tab !== "All") {
        const tabKey = tab.toLowerCase().replace(/ /g, "_");
        tabCounts[tab] = bookings.filter((b: any) => b.status?.toLowerCase() === tabKey || b.status?.toLowerCase() === tab.toLowerCase()).length;
      }
    });
  }

  const total = resolved?.total || bookings.length;
  const totalPages = Math.ceil(total / Number(perPage)) || 1;
  const paginatedBookings = bookings.slice((page - 1) * Number(perPage), page * Number(perPage));

  return (
    <div className="space-y-6">
      <PaymentReminderBanner bookings={rawBookings} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold">My Bookings</h1><p className="text-xs sm:text-sm text-muted-foreground mt-1">{total} total bookings</p></div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => {
          downloadCSV('bookings', ['ID', 'Type', 'Route', 'Date', 'Status', 'Amount'], bookings.map((b: any) => [b.id, b.type, b.title, b.date, b.status, b.amount]));
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
                  return (
                    <TableRow key={booking.rawId || booking.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewBooking(booking)}>
                      <TableCell className="font-mono text-xs font-semibold">{booking.id}</TableCell>
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
                      <TableCell><Badge variant="outline" className={`text-[10px] ${statusColors[booking.status] || ""}`}>{booking.status}</Badge></TableCell>
                      <TableCell className="text-right font-semibold text-sm">{booking.amount}</TableCell>
                      <TableCell>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewBooking(booking); }}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              generateTicketPDF({ id: booking.id, pnr: booking.pnr || booking.id, airline: booking.airline || "Seven Trip",
                                flightNo: booking.flightNumber || "ST-001", from: booking.origin || "Origin", to: booking.destination || "Destination",
                                date: booking.date, time: fmtTime(booking.departureTime), passenger: booking.paxNames?.[0] || "Traveller",
                                seat: "—", class: booking.cabinClass || "Economy" });
                              toast({ title: "Downloaded", description: `E-Ticket PDF saved` });
                            }}><FileText className="w-4 h-4 mr-2" /> Download E-Ticket</DropdownMenuItem>
                            {(booking.status === "Confirmed" || booking.status === "confirmed") && (<>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast({ title: "Request Submitted", description: "Reissue request submitted." }); }}><RotateCcw className="w-4 h-4 mr-2" /> Request Reissue</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); toast({ title: "Request Submitted", description: "Refund request submitted." }); }}><XCircle className="w-4 h-4 mr-2" /> Request Refund</DropdownMenuItem>
                            </>)}
                            {(booking.status === "On Hold" || booking.status === "on_hold") && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = "/dashboard/payments"; }}><CreditCard className="w-4 h-4 mr-2" /> Pay Now</DropdownMenuItem>
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

      <BookingDetailDialog booking={viewBooking} onClose={() => setViewBooking(null)} />
    </div>
  );
};

export default DashboardBookings;
