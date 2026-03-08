import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Download, Plane, ArrowRight, Printer, Mail, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { generateTicketPDF } from "@/lib/pdf-generator";

const BookingConfirmation = () => {
  const { toast } = useToast();
  const location = useLocation();

  // Pull booking data from navigation state or use defaults
  const booking = (location.state as any)?.booking || {};
  const bookingRef = booking.bookingRef || `BK-${Date.now().toString(36).toUpperCase()}`;
  const route = booking.route || "Dhaka → Cox's Bazar";
  const date = booking.date || new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const flightNo = booking.flightNo || "BG-435";
  const cabin = booking.class || "Economy";
  const departTime = booking.departTime || "07:30";
  const arriveTime = booking.arriveTime || "08:35";
  const stops = booking.stops || "Non-stop";
  const passenger = booking.passenger || "Traveller";
  const pnr = booking.pnr || bookingRef.substring(0, 6).toUpperCase();
  const ticketNo = booking.ticketNo || `997-${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  const baseFare = booking.baseFare || 0;
  const taxes = booking.taxes || 0;
  const serviceCharge = booking.serviceCharge || 0;
  const total = booking.total || baseFare + taxes + serviceCharge;
  const paymentMethod = booking.paymentMethod || "Pending";
  const serviceType = booking.type || "Flight";

  const handleDownload = () => {
    generateTicketPDF({
      id: bookingRef, pnr, airline: booking.airline || "Seven Trip", flightNo,
      from: route.split('→')[0]?.trim() || "DAC", to: route.split('→')[1]?.trim() || "CXB",
      date, time: departTime, passenger, seat: booking.seat || "—", class: cabin,
    });
    toast({ title: "Downloaded", description: `E-Ticket ${pnr}.pdf saved` });
  };

  const handlePrint = () => window.print();

  const handleEmail = () => {
    toast({ title: "Email Sent", description: "Booking confirmation has been sent to your email." });
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
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

            {/* Details */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{route}</p>
                <p className="text-xs text-muted-foreground">{date} · {flightNo} · {cabin}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{departTime} - {arriveTime}</p>
                <p className="text-xs text-muted-foreground">{stops}</p>
              </div>
            </div>

            {/* Passenger */}
            <div className="space-y-2 text-sm mb-4">
              <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Passenger Details</h3>
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{passenger}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">PNR</span><span className="font-mono font-bold text-primary">{pnr}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ticket No.</span><span className="font-mono">{ticketNo}</span></div>
            </div>

            <Separator className="mb-4" />

            {/* Payment */}
            <div className="space-y-2 text-sm">
              <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Payment Summary</h3>
              {baseFare > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Base Fare</span><span>৳{baseFare.toLocaleString()}</span></div>}
              {taxes > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Taxes & Fees</span><span>৳{taxes.toLocaleString()}</span></div>}
              {serviceCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service Charge</span><span>৳{serviceCharge.toLocaleString()}</span></div>}
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
            <Link to="/">
              <Home className="w-5 h-5" />
              <span className="text-xs">Go Home</span>
            </Link>
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
            <Button variant="outline" size="sm" asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingConfirmation;
