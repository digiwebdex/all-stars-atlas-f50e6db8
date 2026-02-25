const sections = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing and using TravelHub Bangladesh ('the Platform'), you agree to be bound by these Terms and Conditions. If you do not agree, please discontinue use immediately. These terms apply to all users, including browsers, customers, and contributors of content."
  },
  {
    title: "2. Services",
    content: "TravelHub provides an online platform for booking flights, hotels, visa processing, holiday packages, and related travel services. We act as an intermediary between you and travel service providers (airlines, hotels, visa authorities). The actual services are provided by third-party suppliers."
  },
  {
    title: "3. Booking & Payment",
    content: "All bookings are subject to availability and confirmation by the respective service provider. Prices displayed are in Bangladeshi Taka (BDT) and include applicable taxes unless stated otherwise. Payment must be completed within the specified time to secure your booking. We accept bank transfers, mobile banking (bKash, Nagad), and credit/debit cards."
  },
  {
    title: "4. Cancellation & Refund",
    content: "Cancellation policies vary by service provider and fare type. Refunds, if applicable, will be processed according to the supplier's cancellation policy. Service fees charged by TravelHub are non-refundable. Refund processing may take 7-30 business days depending on the payment method."
  },
  {
    title: "5. User Responsibilities",
    content: "You are responsible for providing accurate personal information, including passport details and contact information. You must ensure all traveller documents (passport, visa, health certificates) are valid for your journey. TravelHub is not liable for denied boarding or entry due to incorrect or incomplete documentation."
  },
  {
    title: "6. Intellectual Property",
    content: "All content on the Platform, including text, graphics, logos, images, and software, is the property of TravelHub Bangladesh and protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without written permission."
  },
  {
    title: "7. Privacy",
    content: "Your use of the Platform is also governed by our Privacy Policy. We collect and process personal data in accordance with applicable data protection laws of Bangladesh."
  },
  {
    title: "8. Limitation of Liability",
    content: "TravelHub acts as an intermediary and is not liable for any loss, damage, or inconvenience arising from the services provided by third-party suppliers. Our total liability shall not exceed the amount paid for the specific booking in question."
  },
  {
    title: "9. Modifications",
    content: "We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated date. Continued use of the Platform after changes constitutes acceptance of the new terms."
  },
  {
    title: "10. Governing Law",
    content: "These terms are governed by the laws of the People's Republic of Bangladesh. Any disputes shall be resolved in the courts of Dhaka, Bangladesh."
  },
];

const Terms = () => (
  <div className="min-h-screen bg-muted/30">
    <section className="relative bg-gradient-to-br from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)] pt-24 lg:pt-32 pb-16 overflow-hidden">
      <div className="container mx-auto px-4 relative text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Terms & Conditions</h1>
        <p className="text-white/60 text-sm sm:text-base">Last updated: February 25, 2026</p>
      </div>
    </section>
    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="space-y-8">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-bold mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Terms;
