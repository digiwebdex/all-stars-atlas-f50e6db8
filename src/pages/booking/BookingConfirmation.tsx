import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Download, Plane, ArrowRight, Printer, Mail, Home, Car, Building2, Stethoscope, Smartphone, Globe, ArrowLeftRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { generateTicketPDF } from "@/lib/pdf-generator";

const BookingConfirmation = () => {
  const { toast } = useToast();
  const location = useLocation();

  const booking = (location.state as any)?.booking || {};
  const bookingRef = booking.bookingRef || `BK-${Date.now().toString(36).toUpperCase()}`;
  const route = booking.route || "";
  const date = booking.date || new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const flightNo = booking.flightNo || "";
  const cabin = booking.class || "Economy";
  const departTime = booking.departTime || "";
  const arriveTime = booking.arriveTime || "";
  const stops = booking.stops || "";
  const passenger = booking.passenger || "Traveller";
  const pnr = booking.pnr || bookingRef.substring(0, 6).toUpperCase();
  const ticketNo = booking.ticketNo || "";
  const baseFare = booking.baseFare || 0;
  const taxes = booking.taxes || 0;
  const serviceCharge = booking.serviceCharge || 0;
  const addOns = booking.addOns || 0;
  const total = booking.total || baseFare + taxes + serviceCharge + addOns;
  const paymentMethod = booking.paymentMethod || "Pending";
  const serviceType = booking.type || "Flight";
  const isRoundTrip = booking.isRoundTrip || false;

  const handleDownload = () => {
    // Build enterprise ticket data
    const outboundSegments = [];
    const returnSegments = [];

    if (booking.outbound) {
      // Full flight object from booking flow
      const ob = booking.outbound;
      const legs = ob.legs || [];
      if (legs.length > 0) {
        legs.forEach((leg: any) => {
          outboundSegments.push({
            airline: leg.operatingAirline ? getAirlineName(leg.operatingAirline) : (ob.airline || ""),
            airlineCode: leg.airlineCode || ob.airlineCode || "",
            flightNumber: leg.flightNumber || ob.flightNumber || "",
            origin: leg.origin || ob.origin || "",
            destination: leg.destination || ob.destination || "",
            departureTime: leg.departureTime || ob.departureTime || "",
            arrivalTime: leg.arrivalTime || ob.arrivalTime || "",
            duration: leg.duration || ob.duration || "",
            cabinClass: ob.cabinClass || cabin,
            aircraft: leg.aircraft || ob.aircraft || "",
            terminal: leg.originTerminal || "",
            arrivalTerminal: leg.destinationTerminal || "",
            baggage: ob.baggage || "As per airline policy",
            status: "Confirmed",
            meal: booking.meal || "",
          });
        });
      } else {
        outboundSegments.push({
          airline: ob.airline || booking.airline || "",
          airlineCode: ob.airlineCode || booking.airlineCode || "",
          flightNumber: ob.flightNumber || flightNo,
          origin: ob.origin || route.split(/[→⇄]/)[0]?.trim() || "",
          destination: ob.destination || route.split(/[→⇄]/)[1]?.trim() || "",
          departureTime: ob.departureTime || "",
          arrivalTime: ob.arrivalTime || "",
          duration: ob.duration || "",
          cabinClass: ob.cabinClass || cabin,
          aircraft: ob.aircraft || "",
          baggage: ob.baggage || "As per airline policy",
          status: "Confirmed",
          meal: booking.meal || "",
        });
      }
    } else {
      // Legacy fallback
      outboundSegments.push({
        airline: booking.airline || "Seven Trip",
        airlineCode: booking.airlineCode || "",
        flightNumber: flightNo,
        origin: route.split(/[→⇄]/)[0]?.trim() || "DAC",
        destination: route.split(/[→⇄]/)[1]?.trim() || "CXB",
        departureTime: date,
        arrivalTime: "",
        duration: "",
        cabinClass: cabin,
        baggage: "As per airline policy",
        status: "Confirmed",
        meal: booking.meal || "",
      });
    }

    if (booking.returnFlight) {
      const ret = booking.returnFlight;
      const legs = ret.legs || [];
      if (legs.length > 0) {
        legs.forEach((leg: any) => {
          returnSegments.push({
            airline: leg.operatingAirline ? getAirlineName(leg.operatingAirline) : (ret.airline || ""),
            airlineCode: leg.airlineCode || ret.airlineCode || "",
            flightNumber: leg.flightNumber || ret.flightNumber || "",
            origin: leg.origin || ret.origin || "",
            destination: leg.destination || ret.destination || "",
            departureTime: leg.departureTime || ret.departureTime || "",
            arrivalTime: leg.arrivalTime || ret.arrivalTime || "",
            duration: leg.duration || ret.duration || "",
            cabinClass: ret.cabinClass || cabin,
            aircraft: leg.aircraft || ret.aircraft || "",
            terminal: leg.originTerminal || "",
            arrivalTerminal: leg.destinationTerminal || "",
            baggage: ret.baggage || "As per airline policy",
            status: "Confirmed",
            meal: booking.meal || "",
          });
        });
      } else {
        returnSegments.push({
          airline: ret.airline || "",
          airlineCode: ret.airlineCode || "",
          flightNumber: ret.flightNumber || "",
          origin: ret.origin || "",
          destination: ret.destination || "",
          departureTime: ret.departureTime || "",
          arrivalTime: ret.arrivalTime || "",
          duration: ret.duration || "",
          cabinClass: ret.cabinClass || cabin,
          baggage: ret.baggage || "As per airline policy",
          status: "Confirmed",
          meal: booking.meal || "",
        });
      }
    }

    // Build passenger list
    const passengers = booking.passengers?.map((p: any) => ({
      title: p.title || "",
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      passport: p.passport || "",
      seat: booking.seat || "",
      ticketNumber: ticketNo,
    })) || [{ firstName: passenger, lastName: "", seat: booking.seat || "", ticketNumber: ticketNo }];

    generateTicketPDF({
      bookingRef,
      pnr,
      isRoundTrip,
      outbound: outboundSegments,
      returnSegments,
      passengers,
      meal: booking.meal,
      extraBaggage: booking.extraBaggage,
      totalFare: total,
      currency: "BDT",
      date,
    });

    toast({ title: "Downloaded", description: `E-Ticket ${bookingRef}.pdf saved` });
  };

  const handlePrint = () => window.print();

  const handleEmail = async () => {
    try {
      const { api } = await import("@/lib/api");
      await api.post('/dashboard/bookings/send-confirmation', { bookingRef });
      toast({ title: "Email Sent", description: "Booking confirmation has been sent to your email." });
    } catch (err: any) {
      toast({ title: "Email Failed", description: err?.message || "Could not send confirmation email.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">Booking Confirmed! 🎉</h1>
          <p className="text-sm text-muted-foreground">Your booking has been successfully placed. A confirmation email has been sent.</p>
        </div>

        <Card className="mb-5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Booking Reference</p>
                <p className="text-xl font-black text-primary">{bookingRef}</p>
              </div>
              <Badge className="bg-success/10 text-success font-bold">Confirmed</Badge>
            </div>

            <Separator className="mb-4" />

            {/* Outbound Details */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {serviceType === "Hotel" ? <Building2 className="w-5 h-5 text-primary" /> :
                 serviceType === "Car Rental" ? <Car className="w-5 h-5 text-primary" /> :
                 serviceType === "Medical" ? <Stethoscope className="w-5 h-5 text-primary" /> :
                 serviceType === "eSIM" ? <Smartphone className="w-5 h-5 text-primary" /> :
                 serviceType === "Holiday" ? <Globe className="w-5 h-5 text-primary" /> :
                 <Plane className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {isRoundTrip && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Outbound</Badge>}
                  <p className="text-sm font-bold">{isRoundTrip ? `${booking.outbound?.origin || route.split(/[→⇄]/)[0]?.trim()} → ${booking.outbound?.destination || route.split(/[→⇄]/)[1]?.trim()}` : route}</p>
                </div>
                <p className="text-xs text-muted-foreground">{date}{flightNo !== "—" ? ` · ${flightNo}` : ""}{cabin !== "Economy" || serviceType === "Flight" ? ` · ${cabin}` : ""}</p>
              </div>
              {(departTime !== "—" || arriveTime !== "—") && (
                <div className="text-right">
                  <p className="text-sm font-bold">{departTime} - {arriveTime}</p>
                  <p className="text-xs text-muted-foreground">{stops}</p>
                </div>
              )}
            </div>

            {/* Return Details (if round-trip) */}
            {isRoundTrip && booking.returnFlight && (
              <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl mb-4 border border-amber-200/50 dark:border-amber-800/30">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-amber-600 rotate-180" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">Return</Badge>
                    <p className="text-sm font-bold">{booking.returnFlight.origin} → {booking.returnFlight.destination}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {booking.returnFlight.departureTime ? new Date(booking.returnFlight.departureTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ""}
                    {booking.returnFlight.flightNumber ? ` · ${booking.returnFlight.flightNumber}` : ""}
                    {booking.returnFlight.cabinClass ? ` · ${booking.returnFlight.cabinClass}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {booking.returnFlight.departureTime ? new Date(booking.returnFlight.departureTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}
                    {" - "}
                    {booking.returnFlight.arrivalTime ? new Date(booking.returnFlight.arrivalTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{booking.returnFlight.stops === 0 ? "Non-stop" : `${booking.returnFlight.stops} Stop`}</p>
                </div>
              </div>
            )}

            {/* Passenger */}
            <div className="space-y-2 text-sm mb-4">
              <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Passenger Details</h3>
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{passenger}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">PNR</span><span className="font-mono font-bold text-primary">{pnr}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ticket No.</span><span className="font-mono">{ticketNo}</span></div>
            </div>

            {/* Extras */}
            {(booking.meal || booking.seat || booking.extraBaggage?.length > 0) && (
              <>
                <Separator className="mb-4" />
                <div className="space-y-2 text-sm mb-4">
                  <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Selected Extras</h3>
                  {booking.meal && booking.meal !== "Standard Meal" && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Meal</span><span>{booking.meal}</span></div>
                  )}
                  {booking.seat && booking.seat !== "Standard Seat" && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Seat</span><span>{booking.seat}</span></div>
                  )}
                  {booking.extraBaggage?.map((b: string, i: number) => (
                    <div key={i} className="flex justify-between"><span className="text-muted-foreground">Extra Baggage</span><span>{b}</span></div>
                  ))}
                </div>
              </>
            )}

            <Separator className="mb-4" />

            {/* Payment */}
            <div className="space-y-2 text-sm">
              <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Payment Summary</h3>
              {baseFare > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Base Fare</span><span>৳{baseFare.toLocaleString()}</span></div>}
              {taxes > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Taxes & Fees</span><span>৳{taxes.toLocaleString()}</span></div>}
              {serviceCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service Charge</span><span>৳{serviceCharge.toLocaleString()}</span></div>}
              {addOns > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Add-ons</span><span>৳{addOns.toLocaleString()}</span></div>}
              {total > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black text-primary">৳{total.toLocaleString()}</span></div>
                </>
              )}
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Payment Method</span><span className="font-medium">{paymentMethod}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={handleDownload}>
            <Download className="w-5 h-5" />
            <span className="text-xs">Download E-Ticket</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={handlePrint}>
            <Printer className="w-5 h-5" />
            <span className="text-xs">Print</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={handleEmail}>
            <Mail className="w-5 h-5" />
            <span className="text-xs">Email</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
            <Link to="/"><Home className="w-5 h-5" /><span className="text-xs">Go Home</span></Link>
          </Button>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1 font-bold" asChild>
            <Link to="/dashboard/bookings">View My Bookings <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>

        <Card className="bg-primary/5 border-primary/20 mt-5">
          <CardContent className="p-5 text-center">
            <p className="text-sm font-semibold mb-1">Need help with your booking?</p>
            <p className="text-xs text-muted-foreground mb-3">Our support team is available 24/7</p>
            <Button variant="outline" size="sm" asChild><Link to="/contact">Contact Support</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function getAirlineName(code: string): string {
  const names: Record<string, string> = {
    '2A': 'Air Astra', 'S2': 'Air Astra', 'BG': 'Biman Bangladesh', 'BS': 'US-Bangla Airlines',
    'VQ': 'Novoair', 'EK': 'Emirates', 'QR': 'Qatar Airways', 'SQ': 'Singapore Airlines',
    'TK': 'Turkish Airlines', 'SV': 'Saudia Airlines', 'AI': 'Air India', 'LH': 'Lufthansa',
    'BA': 'British Airways', 'AF': 'Air France', 'EY': 'Etihad Airways',
  };
  return names[code] || code;
}

export default BookingConfirmation;
