// Centralized CMS defaults for ALL pages
// These serve as fallback data when the API is unavailable
// The backend stores per-page JSON content editable from the admin CMS

import { BLOG_POSTS, DESTINATIONS, PROMOTIONS, CMS_PAGES, EMAIL_TEMPLATES, MEDIA_FILES, FAQ_DATA, OPEN_POSITIONS, TEAM_MEMBERS, COMPANY_VALUES, COMPANY_STATS, TESTIMONIALS } from "./content-data";

// ====== PAGE CONTENT TYPES ======

export interface PageHero {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  gradient?: string; // e.g. "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]"
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  visible: boolean;
  order: number;
}

export interface ListItemSection {
  id: string;
  title: string;
  items: string[];
  visible: boolean;
  order: number;
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  bio?: string;
}

export interface CompanyValue {
  icon: string;
  title: string;
  desc: string;
}

export interface JobPosition {
  id: number;
  title: string;
  dept: string;
  location: string;
  type: string;
  description: string;
  requirements?: string[];
}

export interface Perk {
  icon: string;
  title: string;
  desc: string;
}

export interface ContactInfoItem {
  icon: string;
  title: string;
  text: string;
}

export interface FAQCategory {
  category: string;
  items: { q: string; a: string }[];
}

export interface RefundPolicySection {
  title: string;
  items: string[];
}

export interface RefundTimeline {
  icon: string;
  label: string;
  desc: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  img: string;
}

export interface ServicePageContent {
  hero: PageHero;
  intro?: string;
  features?: { icon: string; title: string; desc: string }[];
  steps?: { step: string; title: string; desc: string }[];
  faqs?: { q: string; a: string }[];
  ctaTitle?: string;
  ctaSubtitle?: string;
  visible: boolean;
}

// ====== VISA APPLICATION CONFIG ======

export interface VisaCountryOption {
  code: string;
  name: string;
  flag: string;
  visaTypes: string[];
  processingOptions: { label: string; days: string; extraFee: number }[];
  baseFee: number;
  serviceFee: number;
  requiredDocs: string[];
  active: boolean;
}

export interface VisaApplicationConfig {
  countries: VisaCountryOption[];
  formSteps: { label: string }[];
  defaultProcessing: string;
  termsText: string;
  estimatedProcessingNote: string;
}

// ====== MASTER CMS CONTENT TYPE ======

export interface CmsPageContent {
  slug: string;
  pageTitle: string;
  hero: PageHero;
  sections?: ContentSection[];
  storyText?: string;
  values?: CompanyValue[];
  stats?: { value: string; label: string }[];
  team?: TeamMember[];
  contactInfo?: ContactInfoItem[];
  formTitle?: string;
  faqCategories?: FAQCategory[];
  perks?: Perk[];
  positions?: JobPosition[];
  careersEmail?: string;
  refundNotice?: string;
  refundPolicies?: RefundPolicySection[];
  refundTimeline?: RefundTimeline[];
  blogPosts?: BlogPost[];
  blogCategories?: string[];
  serviceContent?: ServicePageContent;
  // Visa application config
  visaConfig?: VisaApplicationConfig;
}

// ====== DEFAULT CONTENT FOR ALL PAGES ======

export const CMS_PAGE_DEFAULTS: Record<string, CmsPageContent> = {
  "/about": {
    slug: "/about",
    pageTitle: "About Us",
    hero: {
      title: "About Seven Trip",
      subtitle: "Bangladesh's most trusted travel platform since 2018",
      gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]",
    },
    storyText: "Founded in 2018 in Dhaka, Seven Trip started with a simple vision: to transform how Bangladeshis book travel. What began as a small team passionate about travel has grown into the country's leading online travel agency, serving over 500,000 happy travellers. We combine cutting-edge technology with deep local expertise to offer flights, hotels, visa processing, and holiday packages — all at the best prices with instant confirmation.",
    values: COMPANY_VALUES.map(v => ({ icon: v.icon, title: v.title, desc: v.desc })),
    stats: COMPANY_STATS,
    team: TEAM_MEMBERS,
  },

  "/contact": {
    slug: "/contact",
    pageTitle: "Contact Us",
    hero: {
      title: "Contact Us",
      subtitle: "We're here to help with your travel needs 24/7",
      gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]",
    },
    contactInfo: [
      { icon: "MapPin", title: "Office Address", text: "123 Travel Street, Motijheel C/A\nDhaka 1000, Bangladesh" },
      { icon: "Phone", title: "Phone", text: "+880 1234-567890\n+880 9876-543210" },
      { icon: "Mail", title: "Email", text: "support@seventrip.com.bd\nbooking@seventrip.com.bd" },
      { icon: "Clock", title: "Working Hours", text: "Sunday - Thursday: 9AM - 8PM\nFriday - Saturday: 10AM - 6PM" },
    ],
    formTitle: "Send us a Message",
  },

  "/faq": {
    slug: "/faq",
    pageTitle: "FAQ",
    hero: {
      title: "Frequently Asked Questions",
      subtitle: "Find quick answers to common questions about our services",
      gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]",
    },
    faqCategories: FAQ_DATA,
  },

  "/terms": {
    slug: "/terms",
    pageTitle: "Terms & Conditions",
    hero: {
      title: "Terms & Conditions",
      subtitle: "Last updated: February 25, 2026",
      gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]",
    },
    sections: [
      { id: "1", title: "1. Acceptance of Terms", content: "By accessing and using Seven Trip Bangladesh ('the Platform'), you agree to be bound by these Terms and Conditions. If you do not agree, please discontinue use immediately. These terms apply to all users, including browsers, customers, and contributors of content.", visible: true, order: 0 },
      { id: "2", title: "2. Services", content: "Seven Trip provides an online platform for booking flights, hotels, visa processing, holiday packages, and related travel services. We act as an intermediary between you and travel service providers (airlines, hotels, visa authorities). The actual services are provided by third-party suppliers.", visible: true, order: 1 },
      { id: "3", title: "3. Booking & Payment", content: "All bookings are subject to availability and confirmation by the respective service provider. Prices displayed are in Bangladeshi Taka (BDT) and include applicable taxes unless stated otherwise. Payment must be completed within the specified time to secure your booking. We accept bank transfers, mobile banking (bKash, Nagad), and credit/debit cards.", visible: true, order: 2 },
      { id: "4", title: "4. Cancellation & Refund", content: "Cancellation policies vary by service provider and fare type. Refunds, if applicable, will be processed according to the supplier's cancellation policy. Service fees charged by Seven Trip are non-refundable. Refund processing may take 7-30 business days depending on the payment method.", visible: true, order: 3 },
      { id: "5", title: "5. User Responsibilities", content: "You are responsible for providing accurate personal information, including passport details and contact information. You must ensure all traveller documents (passport, visa, health certificates) are valid for your journey. Seven Trip is not liable for denied boarding or entry due to incorrect or incomplete documentation.", visible: true, order: 4 },
      { id: "6", title: "6. Intellectual Property", content: "All content on the Platform, including text, graphics, logos, images, and software, is the property of Seven Trip Bangladesh and protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without written permission.", visible: true, order: 5 },
      { id: "7", title: "7. Privacy", content: "Your use of the Platform is also governed by our Privacy Policy. We collect and process personal data in accordance with applicable data protection laws of Bangladesh.", visible: true, order: 6 },
      { id: "8", title: "8. Limitation of Liability", content: "Seven Trip acts as an intermediary and is not liable for any loss, damage, or inconvenience arising from the services provided by third-party suppliers. Our total liability shall not exceed the amount paid for the specific booking in question.", visible: true, order: 7 },
      { id: "9", title: "9. Modifications", content: "We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated date. Continued use of the Platform after changes constitutes acceptance of the new terms.", visible: true, order: 8 },
      { id: "10", title: "10. Governing Law", content: "These terms are governed by the laws of the People's Republic of Bangladesh. Any disputes shall be resolved in the courts of Dhaka, Bangladesh.", visible: true, order: 9 },
    ],
  },

  "/privacy": {
    slug: "/privacy",
    pageTitle: "Privacy Policy",
    hero: {
      title: "Privacy Policy",
      subtitle: "Last updated: February 25, 2026",
      gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]",
    },
    sections: [
      { id: "1", title: "1. Information We Collect", content: "We collect personal information you provide directly, including name, email, phone number, passport details, and payment information. We also automatically collect device information, IP address, browser type, and usage data through cookies and similar technologies.", visible: true, order: 0 },
      { id: "2", title: "2. How We Use Your Information", content: "We use your information to process bookings and payments, communicate about your travel arrangements, provide customer support, send promotional offers (with your consent), improve our services, comply with legal obligations, and prevent fraud.", visible: true, order: 1 },
      { id: "3", title: "3. Information Sharing", content: "We share your information with airlines, hotels, and other travel service providers to fulfill your bookings. We may also share with payment processors, government authorities (visa applications), and analytics providers. We never sell your personal data to third parties.", visible: true, order: 2 },
      { id: "4", title: "4. Data Security", content: "We implement industry-standard security measures including SSL encryption, PCI-DSS compliance for payment processing, and regular security audits. Access to personal data is restricted to authorized personnel only.", visible: true, order: 3 },
      { id: "5", title: "5. Cookies", content: "We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your browser settings.", visible: true, order: 4 },
      { id: "6", title: "6. Data Retention", content: "We retain your personal data for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Booking records are retained for a minimum of 5 years for regulatory compliance.", visible: true, order: 5 },
      { id: "7", title: "7. Your Rights", content: "You have the right to access, correct, or delete your personal data. You can opt out of marketing communications at any time. To exercise these rights, contact us at privacy@seventrip.com.bd.", visible: true, order: 6 },
      { id: "8", title: "8. Children's Privacy", content: "Our services are not directed to children under 18. We do not knowingly collect personal data from minors without parental consent.", visible: true, order: 7 },
      { id: "9", title: "9. Changes to This Policy", content: "We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on our Platform.", visible: true, order: 8 },
      { id: "10", title: "10. Contact Us", content: "For questions about this Privacy Policy or your personal data, contact our Data Protection Officer at privacy@seventrip.com.bd or call +880 1234-567890.", visible: true, order: 9 },
    ],
  },

  "/careers": {
    slug: "/careers",
    pageTitle: "Careers",
    hero: {
      title: "Join Our Team",
      subtitle: "Help us revolutionize travel in Bangladesh. We're always looking for talented people.",
      gradient: "from-[hsl(167,72%,41%)] to-[hsl(217,91%,50%)]",
    },
    perks: [
      { icon: "Heart", title: "Health Insurance", desc: "Comprehensive health coverage for you and your family" },
      { icon: "Rocket", title: "Travel Benefits", desc: "Discounted flights, hotels, and holiday packages" },
      { icon: "Users", title: "Great Team", desc: "Work with passionate travel enthusiasts" },
      { icon: "Briefcase", title: "Growth", desc: "Career development opportunities and training" },
    ],
    positions: OPEN_POSITIONS,
    careersEmail: "careers@seventrip.com.bd",
  },

  "/refund-policy": {
    slug: "/refund-policy",
    pageTitle: "Refund Policy",
    hero: {
      title: "Refund Policy",
      subtitle: "Last updated: February 25, 2026",
      gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]",
    },
    refundNotice: "All refund requests are subject to the terms and conditions of the respective service provider. Seven Trip facilitates refunds but the final decision rests with the airline, hotel, or service provider.",
    refundPolicies: [
      { title: "Flight Bookings", items: ["Refund eligibility depends on the airline's fare rules and ticket type.", "Non-refundable tickets: Only applicable taxes and surcharges may be refunded.", "Refundable tickets: Full fare minus airline cancellation charges and Seven Trip service fee (৳500 per ticket).", "No-show: No refund unless covered by travel insurance.", "Refund requests must be submitted within 90 days of the scheduled departure."] },
      { title: "Hotel Bookings", items: ["Free cancellation bookings: Full refund if cancelled before the specified deadline.", "Non-refundable bookings: No refund will be processed.", "Partial stays: Refund for unused nights subject to hotel policy.", "Seven Trip service fee of ৳300 applies to all hotel refunds."] },
      { title: "Visa Processing", items: ["Visa service fees are non-refundable once document processing has begun.", "If the visa application is rejected, embassy/consulate fees are non-refundable as per their policy.", "Seven Trip processing fee is refundable only if the application was not submitted to the embassy."] },
      { title: "Holiday Packages", items: ["Cancellation 30+ days before departure: 10% of package cost.", "Cancellation 15-29 days before departure: 25% of package cost.", "Cancellation 7-14 days before departure: 50% of package cost.", "Cancellation less than 7 days before departure: No refund.", "Custom/tailor-made packages: Refund terms will be communicated at booking."] },
    ],
    refundTimeline: [
      { icon: "CreditCard", label: "Refund Initiated", desc: "Within 48 hours of approval" },
      { icon: "Clock", label: "Processing Time", desc: "7-15 business days for cards, 3-5 for mobile banking" },
      { icon: "CheckCircle2", label: "Refund Credited", desc: "To original payment method" },
    ],
  },

  "/blog": {
    slug: "/blog",
    pageTitle: "Blog",
    hero: {
      title: "Travel Blog",
      subtitle: "Tips, guides, and inspiration for your next adventure",
      gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]",
    },
    blogPosts: BLOG_POSTS.filter(p => p.status === "published").map(p => ({
      id: p.id, title: p.title, excerpt: p.excerpt, category: p.category,
      author: p.author, date: p.date, readTime: p.readTime, img: p.img,
    })),
    blogCategories: ["All", "Destinations", "Travel Tips", "Visa Guide", "Hotels", "Medical"],
  },

  // ====== SERVICE PAGES ======
  "/flights": {
    slug: "/flights",
    pageTitle: "Flight Booking",
    hero: { title: "Search Flights", subtitle: "Compare 120+ airlines and find the best deals", gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]" },
    serviceContent: {
      hero: { title: "Search Flights", subtitle: "Compare 120+ airlines and find the best deals" },
      intro: "Search, compare, and book flights from Bangladesh to anywhere in the world. We partner with 120+ airlines to bring you the best fares.",
      features: [
        { icon: "Plane", title: "120+ Airlines", desc: "Compare fares across all major carriers" },
        { icon: "Tag", title: "Best Price Guarantee", desc: "We match any lower price you find" },
        { icon: "Shield", title: "Secure Booking", desc: "SSL encrypted, PCI-DSS compliant" },
        { icon: "Headphones", title: "24/7 Support", desc: "Call, chat, or email anytime" },
      ],
      visible: true,
    },
  },

  "/hotels": {
    slug: "/hotels",
    pageTitle: "Hotel Reservation",
    hero: { title: "Find Hotels", subtitle: "50,000+ properties worldwide at best prices", gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]" },
    serviceContent: {
      hero: { title: "Find Hotels", subtitle: "50,000+ properties worldwide" },
      intro: "Book hotels at the best prices. From luxury resorts to budget-friendly stays, we have options for every traveller.",
      features: [
        { icon: "Building2", title: "50K+ Hotels", desc: "Worldwide coverage" },
        { icon: "BadgePercent", title: "Exclusive Deals", desc: "Member-only discounts" },
        { icon: "Shield", title: "Free Cancellation", desc: "On most bookings" },
        { icon: "Star", title: "Verified Reviews", desc: "Real guest ratings" },
      ],
      visible: true,
    },
  },

  "/visa": {
    slug: "/visa",
    pageTitle: "Visa Processing",
    hero: { title: "Visa Services", subtitle: "Fast processing for 45+ countries", gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]" },
    serviceContent: {
      hero: { title: "Visa Services", subtitle: "Fast visa processing for 45+ countries" },
      intro: "Apply for tourist, business, and student visas online. Our expert team handles the paperwork while you plan your trip.",
      steps: [
        { step: "1", title: "Select Country", desc: "Choose your destination and visa type" },
        { step: "2", title: "Submit Documents", desc: "Upload required documents securely" },
        { step: "3", title: "Track Progress", desc: "Real-time status updates" },
        { step: "4", title: "Receive Visa", desc: "Get your visa delivered" },
      ],
      visible: true,
    },
  },

  "/holidays": {
    slug: "/holidays",
    pageTitle: "Holiday Packages",
    hero: { title: "Holiday Packages", subtitle: "All-inclusive packages for unforgettable trips", gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]" },
    serviceContent: {
      hero: { title: "Holiday Packages", subtitle: "All-inclusive packages" },
      intro: "Discover curated holiday packages with flights, hotels, and sightseeing included. Perfect for families, couples, and solo travellers.",
      visible: true,
    },
  },

  "/medical": {
    slug: "/medical",
    pageTitle: "Medical Tourism",
    hero: { title: "Medical Tourism", subtitle: "World-class treatment at affordable prices", gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]" },
    serviceContent: {
      hero: { title: "Medical Tourism", subtitle: "World-class treatment at affordable prices" },
      intro: "Access top hospitals in India, Thailand, Singapore, and more. We arrange everything — appointments, visa, flights, and accommodation.",
      features: [
        { icon: "Stethoscope", title: "Top Hospitals", desc: "JCI-accredited facilities" },
        { icon: "Plane", title: "Travel Arranged", desc: "Flights, visa & accommodation" },
        { icon: "Users", title: "Patient Coordinator", desc: "Dedicated support throughout" },
        { icon: "Shield", title: "Verified Doctors", desc: "Specialist consultations" },
      ],
      visible: true,
    },
  },

  "/esim": {
    slug: "/esim",
    pageTitle: "eSIM Plans",
    hero: { title: "Travel eSIM", subtitle: "Stay connected worldwide without roaming charges", gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]" },
    serviceContent: {
      hero: { title: "Travel eSIM", subtitle: "Stay connected worldwide" },
      intro: "Buy eSIM plans for 100+ countries. Activate instantly with a QR code — no physical SIM needed.",
      visible: true,
    },
  },

  "/cars": {
    slug: "/cars",
    pageTitle: "Car Rental",
    hero: { title: "Car Rental", subtitle: "Reliable vehicles for every journey", gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]" },
    serviceContent: {
      hero: { title: "Car Rental", subtitle: "Reliable vehicles for every journey" },
      intro: "Rent cars for airport transfers, city tours, or long-distance travel. Choose from economy to luxury vehicles.",
      visible: true,
    },
  },

  "/visa/apply": {
    slug: "/visa/apply",
    pageTitle: "Visa Application",
    hero: {
      title: "Apply for Visa",
      subtitle: "Complete your visa application online",
      gradient: "from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)]",
    },
    visaConfig: {
      countries: [
        {
          code: "thailand", name: "Thailand", flag: "🇹🇭",
          visaTypes: ["Tourist", "Business", "Medical"],
          processingOptions: [
            { label: "Normal", days: "5-7 days", extraFee: 0 },
            { label: "Express", days: "2-3 days", extraFee: 1500 },
          ],
          baseFee: 3500, serviceFee: 1000,
          requiredDocs: [
            "Valid passport (min 6 months validity)",
            "Recent passport-size photo (white background)",
            "Bank statement (last 6 months)",
            "Hotel booking confirmation",
            "Return flight ticket",
            "No Objection Certificate (if employed)",
            "Business registration (if self-employed)",
          ],
          active: true,
        },
        {
          code: "malaysia", name: "Malaysia", flag: "🇲🇾",
          visaTypes: ["Tourist", "Business", "Student"],
          processingOptions: [
            { label: "Normal", days: "5-7 days", extraFee: 0 },
            { label: "Express", days: "2-3 days", extraFee: 1200 },
          ],
          baseFee: 3000, serviceFee: 1000,
          requiredDocs: [
            "Valid passport (min 6 months validity)",
            "Recent passport-size photo (white background)",
            "Bank statement (last 3 months)",
            "Hotel booking confirmation",
            "Return flight ticket",
          ],
          active: true,
        },
        {
          code: "singapore", name: "Singapore", flag: "🇸🇬",
          visaTypes: ["Tourist", "Business"],
          processingOptions: [
            { label: "Normal", days: "4-6 days", extraFee: 0 },
            { label: "Express", days: "1-2 days", extraFee: 2000 },
          ],
          baseFee: 4500, serviceFee: 1000,
          requiredDocs: [
            "Valid passport (min 6 months validity)",
            "Recent passport-size photo (white background)",
            "Bank statement (last 6 months)",
            "Hotel booking confirmation",
            "Return flight ticket",
            "Employment proof or business letter",
          ],
          active: true,
        },
        {
          code: "uae", name: "UAE", flag: "🇦🇪",
          visaTypes: ["Tourist", "Business", "Transit"],
          processingOptions: [
            { label: "Normal", days: "5-7 days", extraFee: 0 },
            { label: "Express", days: "2-3 days", extraFee: 2500 },
          ],
          baseFee: 5000, serviceFee: 1500,
          requiredDocs: [
            "Valid passport (min 6 months validity)",
            "Recent passport-size photo (white background)",
            "Bank statement (last 6 months)",
            "Hotel booking confirmation",
            "Return flight ticket",
            "No Objection Certificate (if employed)",
            "Invitation letter (for business visa)",
          ],
          active: true,
        },
      ],
      formSteps: [
        { label: "Visa Details" },
        { label: "Personal Info" },
        { label: "Documents" },
        { label: "Review" },
      ],
      defaultProcessing: "normal",
      termsText: "I confirm all information is accurate and I agree to the Terms & Conditions",
      estimatedProcessingNote: "Estimated processing: 5-7 business days",
    },
  },
};

// Helper to get page content with defaults
export const getPageDefaults = (slug: string): CmsPageContent | null => {
  return CMS_PAGE_DEFAULTS[slug] || null;
};

// Get all CMS-managed page slugs
export const getAllCmsPageSlugs = (): string[] => Object.keys(CMS_PAGE_DEFAULTS);
