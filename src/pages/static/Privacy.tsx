const sections = [
  {
    title: "1. Information We Collect",
    content: "We collect personal information you provide directly, including name, email, phone number, passport details, and payment information. We also automatically collect device information, IP address, browser type, and usage data through cookies and similar technologies."
  },
  {
    title: "2. How We Use Your Information",
    content: "We use your information to process bookings and payments, communicate about your travel arrangements, provide customer support, send promotional offers (with your consent), improve our services, comply with legal obligations, and prevent fraud."
  },
  {
    title: "3. Information Sharing",
    content: "We share your information with airlines, hotels, and other travel service providers to fulfill your bookings. We may also share with payment processors, government authorities (visa applications), and analytics providers. We never sell your personal data to third parties."
  },
  {
    title: "4. Data Security",
    content: "We implement industry-standard security measures including SSL encryption, PCI-DSS compliance for payment processing, and regular security audits. Access to personal data is restricted to authorized personnel only."
  },
  {
    title: "5. Cookies",
    content: "We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your browser settings."
  },
  {
    title: "6. Data Retention",
    content: "We retain your personal data for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Booking records are retained for a minimum of 5 years for regulatory compliance."
  },
  {
    title: "7. Your Rights",
    content: "You have the right to access, correct, or delete your personal data. You can opt out of marketing communications at any time. To exercise these rights, contact us at privacy@travelhub.com.bd."
  },
  {
    title: "8. Children's Privacy",
    content: "Our services are not directed to children under 18. We do not knowingly collect personal data from minors without parental consent."
  },
  {
    title: "9. Changes to This Policy",
    content: "We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on our Platform."
  },
  {
    title: "10. Contact Us",
    content: "For questions about this Privacy Policy or your personal data, contact our Data Protection Officer at privacy@travelhub.com.bd or call +880 1234-567890."
  },
];

const Privacy = () => (
  <div className="min-h-screen bg-muted/30">
    <section className="relative bg-gradient-to-br from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)] pt-24 lg:pt-32 pb-16 overflow-hidden">
      <div className="container mx-auto px-4 relative text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Privacy Policy</h1>
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

export default Privacy;
