// Reactive in-memory store for homepage content
// Shared between CMSHomepage (admin editor) and Index (public homepage)
// Persists to localStorage so edits survive page reloads

const STORAGE_KEY = 'seventrip_homepage_cms';

export interface HomepageContent {
  hero: {
    badge: string;
    heading: string;
    headingHighlight: string;
    subtitle: string;
    videoUrl: string;
    posterUrl: string;
    overlayOpacity: number;
  };
  stats: { id: string; value: string; suffix: string; label: string; visible: boolean }[];
  features: { id: string; title: string; desc: string; icon: string; visible: boolean }[];
  offers: { id: string; title: string; discount: string; desc: string; gradient: string; emoji: string; visible: boolean }[];
  destinations: { id: string; name: string; hotels: string; img: string; category: string; visible: boolean }[];
  intlDestinations: { id: string; name: string; hotels: string; img: string; category: string; visible: boolean }[];
  airlines: { id: string; name: string; code: string; visible: boolean }[];
  hotels: { id: string; name: string; location: string; rating: string; reviews: string; price: string; img: string; visible: boolean }[];
  packages: { id: string; name: string; days: string; price: string; rating: string; reviews: string; img: string; visible: boolean }[];
  routes: { id: string; from: string; fromCode: string; to: string; toCode: string; price: string; visible: boolean }[];
  testimonials: { id: string; name: string; role: string; text: string; avatar: string; visible: boolean }[];
  sections: { key: string; label: string; visible: boolean; order: number }[];
}

// Default content (matches what's hardcoded in Index.tsx)
const DEFAULT_CONTENT: HomepageContent = {
  hero: {
    badge: "Bangladesh's Most Trusted Travel Platform",
    heading: "Your Journey,",
    headingHighlight: "Simplified.",
    subtitle: "Book flights, hotels, holidays & visa — all in one place.\nBest prices, 24/7 support, instant confirmation.",
    videoUrl: "/videos/hero-beach.mp4",
    posterUrl: "/images/hero-beach.jpg",
    overlayOpacity: 30,
  },
  stats: [
    { id: "1", value: "500000", suffix: "+", label: "Happy Travellers", visible: true },
    { id: "2", value: "120", suffix: "+", label: "Airlines", visible: true },
    { id: "3", value: "50000", suffix: "+", label: "Hotels", visible: true },
    { id: "4", value: "45", suffix: "+", label: "Visa Countries", visible: true },
  ],
  features: [
    { id: "1", title: "Secure Booking", desc: "SSL encrypted, PCI-DSS compliant", icon: "Shield", visible: true },
    { id: "2", title: "Best Price Guarantee", desc: "We match any lower price you find", icon: "BadgePercent", visible: true },
    { id: "3", title: "24/7 Support", desc: "Call, chat, or email anytime", icon: "Headphones", visible: true },
    { id: "4", title: "IATA Accredited", desc: "Trusted by global airlines", icon: "Award", visible: true },
  ],
  offers: [
    { id: "1", title: "Exclusive Fares on Int'l Flights", discount: "Up to 16% OFF", desc: "International flights with partner bank cards", gradient: "blue", emoji: "✈️", visible: true },
    { id: "2", title: "Domestic Flight Deals", discount: "৳1,000 OFF", desc: "Save on domestic routes with credit cards", gradient: "green", emoji: "🏷️", visible: true },
    { id: "3", title: "Student Fare Special", discount: "Extra Baggage", desc: "Affordable flights with extra luggage allowance", gradient: "orange", emoji: "🎓", visible: true },
    { id: "4", title: "Hotel Weekday Deals", discount: "30% OFF", desc: "Luxury hotels at budget prices on weekdays", gradient: "purple", emoji: "🏨", visible: true },
  ],
  destinations: [
    { id: "1", name: "Cox's Bazar", hotels: "97", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Cox%27s_Bazar.jpg", category: "domestic", visible: true },
    { id: "2", name: "Sylhet", hotels: "44", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/AzOSQlJV2UD8QhKVOKLteYWlrI9brl.png", category: "domestic", visible: true },
    { id: "3", name: "Chittagong", hotels: "36", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/8gohsAnVmFQmPRtUKSrdpIMi1SlE16.gif", category: "domestic", visible: true },
    { id: "4", name: "Dhaka", hotels: "43", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/XjOR77hq4zWYqqMRK8yI2uRfemtbgg.png", category: "domestic", visible: true },
    { id: "5", name: "Sreemangal", hotels: "6", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/wcmMawEQourNqilRyE2GOHHv0tYzVP.png", category: "domestic", visible: true },
    { id: "6", name: "Gazipur", hotels: "12", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/TdXdFC08piA8Csi3X8qqreie9UUzif.png", category: "domestic", visible: true },
  ],
  intlDestinations: [
    { id: "7", name: "Kathmandu", hotels: "1,152", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kathamandu.jpg", category: "international", visible: true },
    { id: "8", name: "Bangkok", hotels: "4,351", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg", category: "international", visible: true },
    { id: "9", name: "Singapore", hotels: "813", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Singapore.jpg", category: "international", visible: true },
    { id: "10", name: "Kuala Lumpur", hotels: "2,464", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kuala_Lumpur.jpg", category: "international", visible: true },
    { id: "11", name: "Maldives", hotels: "36", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Maafushi.jpg", category: "international", visible: true },
    { id: "12", name: "Kolkata", hotels: "1,319", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kolkata.jpg", category: "international", visible: true },
  ],
  airlines: [
    { id: "1", name: "Biman Bangladesh", code: "BG", visible: true },
    { id: "2", name: "US-Bangla", code: "BS", visible: true },
    { id: "3", name: "NOVOAIR", code: "VQ", visible: true },
    { id: "4", name: "Air Astra", code: "2A", visible: true },
    { id: "5", name: "Emirates", code: "EK", visible: true },
    { id: "6", name: "Singapore Airlines", code: "SQ", visible: true },
    { id: "7", name: "Malaysia Airlines", code: "MH", visible: true },
    { id: "8", name: "Qatar Airways", code: "QR", visible: true },
    { id: "9", name: "Saudia", code: "SV", visible: true },
    { id: "10", name: "Turkish Airlines", code: "TK", visible: true },
    { id: "11", name: "Thai Airways", code: "TG", visible: true },
    { id: "12", name: "IndiGo", code: "6E", visible: true },
  ],
  hotels: [
    { id: "1", name: "Sea Pearl Beach Resort & Spa", location: "Cox's Bazar", rating: "5", reviews: "431", price: "৳8,500", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/agoda-2564409-60592569-839740.jpg", visible: true },
    { id: "2", name: "Bhawal Resort & Spa", location: "Gazipur", rating: "5", reviews: "264", price: "৳6,200", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/bhawal-resort-spa-20210907174024.jpg", visible: true },
    { id: "3", name: "Grand Sylhet Hotel & Resort", location: "Sylhet", rating: "5", reviews: "159", price: "৳5,900", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/267736179_149939317369872_2872125975221274736_n.jpg", visible: true },
    { id: "4", name: "Sayeman Beach Resort", location: "Cox's Bazar", rating: "5", reviews: "453", price: "৳7,800", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/sayeman_-1.PNG", visible: true },
  ],
  packages: [
    { id: "1", name: "Bangkok", days: "4N/5D", price: "৳42,000", rating: "5", reviews: "57", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg", visible: true },
    { id: "2", name: "Maldives", days: "3N/4D", price: "৳68,000", rating: "5", reviews: "29", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Maafushi.jpg", visible: true },
    { id: "3", name: "Kolkata", days: "3N/4D", price: "৳22,000", rating: "4.5", reviews: "97", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kolkata.jpg", visible: true },
    { id: "4", name: "Kuala Lumpur", days: "4N/5D", price: "৳48,000", rating: "5", reviews: "68", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kuala_Lumpur.jpg", visible: true },
    { id: "5", name: "Singapore", days: "3N/4D", price: "৳55,000", rating: "5", reviews: "33", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Singapore.jpg", visible: true },
    { id: "6", name: "Dubai", days: "5N/6D", price: "৳75,000", rating: "5", reviews: "36", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Dubai.jpg", visible: true },
  ],
  routes: [
    { id: "1", from: "Dhaka", fromCode: "DAC", to: "Cox's Bazar", toCode: "CXB", price: "৳4,200", visible: true },
    { id: "2", from: "Dhaka", fromCode: "DAC", to: "Jashore", toCode: "JSR", price: "৳3,800", visible: true },
    { id: "3", from: "Dhaka", fromCode: "DAC", to: "Chattogram", toCode: "CGP", price: "৳3,500", visible: true },
    { id: "4", from: "Dhaka", fromCode: "DAC", to: "Sylhet", toCode: "ZYL", price: "৳3,900", visible: true },
    { id: "5", from: "Dhaka", fromCode: "DAC", to: "Barisal", toCode: "BZL", price: "৳3,200", visible: true },
    { id: "6", from: "Dhaka", fromCode: "DAC", to: "Saidpur", toCode: "SPD", price: "৳4,100", visible: true },
  ],
  testimonials: [
    { id: "1", name: "Rafiq Ahmed", role: "Frequent Traveller", text: "Best travel platform in Bangladesh! The flight booking is incredibly smooth and prices are always competitive.", avatar: "RA", visible: true },
    { id: "2", name: "Fatema Khatun", role: "Business Traveller", text: "I use Seven Trip for all my corporate travel. The visa processing is fast and hassle-free.", avatar: "FK", visible: true },
    { id: "3", name: "Kamal Hossain", role: "Family Traveller", text: "Booked our family holiday to Maldives through Seven Trip. Amazing packages at unbeatable prices!", avatar: "KH", visible: true },
  ],
  sections: [
    { key: "hero", label: "Hero Banner", visible: true, order: 0 },
    { key: "stats", label: "Stats Strip", visible: true, order: 1 },
    { key: "features", label: "Trust Features", visible: true, order: 2 },
    { key: "offers", label: "Exclusive Offers", visible: true, order: 3 },
    { key: "exploreBD", label: "Explore Bangladesh", visible: true, order: 4 },
    { key: "airlines", label: "Top Airlines", visible: true, order: 5 },
    { key: "intlDestinations", label: "Popular Destinations", visible: true, order: 6 },
    { key: "hotels", label: "Best Hotels", visible: true, order: 7 },
    { key: "packages", label: "Tour Packages", visible: true, order: 8 },
    { key: "routes", label: "Domestic Routes", visible: true, order: 9 },
    { key: "testimonials", label: "Testimonials", visible: true, order: 10 },
    { key: "appDownload", label: "App Download CTA", visible: true, order: 11 },
  ],
};

// Subscribers for reactive updates
type Listener = () => void;
const listeners = new Set<Listener>();

let cachedContent: HomepageContent | null = null;

export function getHomepageContent(): HomepageContent {
  if (cachedContent) return cachedContent;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedContent = JSON.parse(stored);
      return cachedContent!;
    }
  } catch { /* ignore */ }
  cachedContent = DEFAULT_CONTENT;
  return cachedContent;
}

export function setHomepageContent(content: HomepageContent) {
  cachedContent = content;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch { /* ignore */ }
  listeners.forEach(fn => fn());
}

export function subscribeHomepage(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// React hook
import { useSyncExternalStore } from 'react';

export function useHomepageContent(): HomepageContent {
  return useSyncExternalStore(
    subscribeHomepage,
    getHomepageContent,
    getHomepageContent
  );
}
