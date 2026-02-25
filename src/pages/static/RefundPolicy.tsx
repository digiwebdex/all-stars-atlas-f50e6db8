import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, CreditCard, CheckCircle2 } from "lucide-react";

const policies = [
  {
    title: "Flight Bookings",
    items: [
      "Refund eligibility depends on the airline's fare rules and ticket type.",
      "Non-refundable tickets: Only applicable taxes and surcharges may be refunded.",
      "Refundable tickets: Full fare minus airline cancellation charges and TravelHub service fee (৳500 per ticket).",
      "No-show: No refund unless covered by travel insurance.",
      "Refund requests must be submitted within 90 days of the scheduled departure.",
    ],
  },
  {
    title: "Hotel Bookings",
    items: [
      "Free cancellation bookings: Full refund if cancelled before the specified deadline.",
      "Non-refundable bookings: No refund will be processed.",
      "Partial stays: Refund for unused nights subject to hotel policy.",
      "TravelHub service fee of ৳300 applies to all hotel refunds.",
    ],
  },
  {
    title: "Visa Processing",
    items: [
      "Visa service fees are non-refundable once document processing has begun.",
      "If the visa application is rejected, embassy/consulate fees are non-refundable as per their policy.",
      "TravelHub processing fee is refundable only if the application was not submitted to the embassy.",
    ],
  },
  {
    title: "Holiday Packages",
    items: [
      "Cancellation 30+ days before departure: 10% of package cost.",
      "Cancellation 15-29 days before departure: 25% of package cost.",
      "Cancellation 7-14 days before departure: 50% of package cost.",
      "Cancellation less than 7 days before departure: No refund.",
      "Custom/tailor-made packages: Refund terms will be communicated at booking.",
    ],
  },
];

const timeline = [
  { icon: CreditCard, label: "Refund Initiated", desc: "Within 48 hours of approval" },
  { icon: Clock, label: "Processing Time", desc: "7-15 business days for cards, 3-5 for mobile banking" },
  { icon: CheckCircle2, label: "Refund Credited", desc: "To original payment method" },
];

const RefundPolicy = () => (
  <div className="min-h-screen bg-muted/30">
    <section className="relative bg-gradient-to-br from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)] pt-24 lg:pt-32 pb-16 overflow-hidden">
      <div className="container mx-auto px-4 relative text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Refund Policy</h1>
        <p className="text-white/60 text-sm sm:text-base">Last updated: February 25, 2026</p>
      </div>
    </section>

    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="mb-8 border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              All refund requests are subject to the terms and conditions of the respective service provider. 
              TravelHub facilitates refunds but the final decision rests with the airline, hotel, or service provider.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8 mb-12">
          {policies.map((p, i) => (
            <div key={i}>
              <h2 className="text-lg font-bold mb-3">{p.title}</h2>
              <ul className="space-y-2">
                {p.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-bold mb-4">Refund Timeline</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {timeline.map((t, i) => (
            <Card key={i}>
              <CardContent className="flex items-start gap-3 p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <t.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{t.label}</h4>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default RefundPolicy;
