import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FlightSearch from "@/components/search/FlightSearch";
import HotelSearch from "@/components/search/HotelSearch";
import VisaSearch from "@/components/search/VisaSearch";
import HolidaySearch from "@/components/search/HolidaySearch";
import {
  Plane, Building2, FileText, Palmtree, Star, MapPin,
  Shield, Headphones, BadgePercent, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const searchTabs = [
  { value: "flights", label: "Flights", icon: Plane },
  { value: "hotels", label: "Hotels", icon: Building2 },
  { value: "visa", label: "Visa", icon: FileText },
  { value: "holidays", label: "Holidays", icon: Palmtree },
];

const offers = [
  { title: "Domestic Flights", discount: "Up to 15% OFF", desc: "Save big on domestic routes this season", color: "from-primary to-blue-600" },
  { title: "International Hotels", discount: "Flat ৳2000 OFF", desc: "Book 3 nights and get exclusive savings", color: "from-accent to-teal-600" },
  { title: "Visa Processing", discount: "Free Consultation", desc: "Expert visa assistance for 50+ countries", color: "from-secondary to-orange-600" },
];

const destinations = [
  { name: "Cox's Bazar", country: "Bangladesh", price: "৳4,500", image: "🏖️" },
  { name: "Maldives", country: "South Asia", price: "৳45,000", image: "🌴" },
  { name: "Bangkok", country: "Thailand", price: "৳25,000", image: "🏯" },
  { name: "Kuala Lumpur", country: "Malaysia", price: "৳22,000", image: "🏙️" },
  { name: "Istanbul", country: "Turkey", price: "৳55,000", image: "🕌" },
  { name: "Dubai", country: "UAE", price: "৳35,000", image: "🏗️" },
];

const features = [
  { icon: Shield, title: "Secure Booking", desc: "100% secure payment with data protection" },
  { icon: BadgePercent, title: "Best Price Guarantee", desc: "We match any lower price you find" },
  { icon: Headphones, title: "24/7 Support", desc: "Round the clock customer assistance" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("flights");

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[600px] md:min-h-[700px] hero-gradient overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 pt-28 md:pt-36 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-4 leading-tight">
              Your Journey Begins Here
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto">
              Find the best deals on flights, hotels, visa & holidays. Trusted by thousands of travelers.
            </p>
          </motion.div>

          {/* Search Widget */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <div className="glass-card rounded-2xl p-5 md:p-6 shadow-2xl">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl mb-5 h-auto flex-wrap">
                  {searchTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center gap-2 px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg"
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TabsContent value="flights" className="mt-0"><FlightSearch /></TabsContent>
                    <TabsContent value="hotels" className="mt-0"><HotelSearch /></TabsContent>
                    <TabsContent value="visa" className="mt-0"><VisaSearch /></TabsContent>
                    <TabsContent value="holidays" className="mt-0"><HolidaySearch /></TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{f.title}</h4>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive Offers */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Exclusive Offers</h2>
              <p className="text-muted-foreground mt-1">Limited time deals you don't want to miss</p>
            </div>
            <Button variant="ghost" className="hidden md:flex text-primary">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {offers.map((offer, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${offer.color} p-6 text-primary-foreground cursor-pointer group`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-3">
                  {offer.discount}
                </span>
                <h3 className="text-lg font-bold mb-1">{offer.title}</h3>
                <p className="text-sm text-primary-foreground/80">{offer.desc}</p>
                <Button size="sm" variant="secondary" className="mt-4 group-hover:translate-x-1 transition-transform">
                  Book Now <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Popular Destinations</h2>
            <p className="text-muted-foreground mt-1">Explore trending travel spots</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {destinations.map((dest, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-card rounded-xl p-4 text-center hover:shadow-lg transition-all cursor-pointer border border-border hover:border-primary/30"
              >
                <div className="text-4xl mb-3">{dest.image}</div>
                <h4 className="font-semibold text-sm">{dest.name}</h4>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {dest.country}
                </p>
                <p className="text-sm font-bold text-primary mt-2">from {dest.price}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">What Travellers Say</h2>
            <p className="text-muted-foreground mt-1">Trusted by thousands of happy customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Rahim Ahmed", text: "Booked my Hajj flight through TravelHub. Best price and seamless experience!", rating: 5 },
              { name: "Fatima Khan", text: "Visa processing was incredibly smooth. Got my Thailand visa in just 3 days.", rating: 5 },
              { name: "Kamal Hossain", text: "Amazing hotel deals in Cox's Bazar. The customer support was very responsive.", rating: 4 },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-4 h-4 ${j < review.rating ? "fill-warning text-warning" : "text-muted"}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4">"{review.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {review.name[0]}
                  </div>
                  <span className="text-sm font-medium">{review.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 md:py-20 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            Sign up today and get exclusive deals, earn rewards, and manage all your travel in one place.
          </p>
          <Button size="lg" asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-8">
            <Link to="/auth/register">Create Free Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
