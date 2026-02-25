import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Calendar, Plane, Building2, UtensilsCrossed, Camera, CheckCircle2, ArrowRight, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

const pkg = {
  name: "Bangkok Explorer", destination: "Bangkok, Thailand", duration: "4N/5D",
  price: 42000, originalPrice: 52000, rating: 4.8, reviews: 57,
  img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg",
  description: "Explore the vibrant capital of Thailand with our all-inclusive package. From ancient temples to bustling night markets, experience the best of Bangkok.",
  includes: ["Return flights (Dhaka-Bangkok)", "4-star hotel accommodation", "Daily breakfast & 2 dinners", "Airport transfers", "City tour with guide", "Floating market excursion"],
  excludes: ["Travel insurance", "Personal expenses", "Optional activities", "Visa fees"],
};

const itinerary = [
  { day: 1, title: "Arrival in Bangkok", activities: ["Airport pickup & hotel transfer", "Evening free — explore Khao San Road", "Welcome dinner at riverside restaurant"] },
  { day: 2, title: "Grand Palace & Temples", activities: ["Grand Palace & Wat Phra Kaew", "Wat Pho (Reclining Buddha)", "Wat Arun (Temple of Dawn)", "Evening: Asiatique Night Market"] },
  { day: 3, title: "Floating Market & Culture", activities: ["Damnoen Saduak Floating Market", "Maeklong Railway Market", "Afternoon: Thai cooking class", "Evening free"] },
  { day: 4, title: "Shopping & Entertainment", activities: ["MBK Center & Siam Paragon shopping", "Jim Thompson House museum", "Afternoon: Thai massage", "Farewell dinner cruise on Chao Phraya"] },
  { day: 5, title: "Departure", activities: ["Breakfast at hotel", "Free time for last-minute shopping", "Airport transfer & departure"] },
];

const HolidayDetail = () => (
  <div className="min-h-screen bg-muted/30">
    <div className="relative h-[300px] sm:h-[400px]">
      <img src={pkg.img} alt={pkg.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 container mx-auto">
        <Badge className="bg-secondary text-secondary-foreground text-xs font-bold mb-2">Best Seller</Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-white">{pkg.name}</h1>
        <p className="text-white/60 text-sm flex items-center gap-2 mt-1"><MapPin className="w-4 h-4" /> {pkg.destination} · <Calendar className="w-4 h-4" /> {pkg.duration}</p>
      </div>
    </div>

    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>

          {/* What's Included */}
          <div>
            <h2 className="text-lg font-bold mb-3">What's Included</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {pkg.includes.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-success shrink-0" /> {item}</div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-3">Not Included</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {pkg.excludes.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><span className="w-4 h-4 text-center">✕</span> {item}</div>
              ))}
            </div>
          </div>

          {/* Itinerary */}
          <div>
            <h2 className="text-lg font-bold mb-4">Day-by-Day Itinerary</h2>
            <div className="space-y-4">
              {itinerary.map((day) => (
                <Card key={day.day}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-primary">D{day.day}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm mb-2">{day.title}</h3>
                        <ul className="space-y-1">
                          {day.activities.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-28">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-sm font-bold">{pkg.rating}</span>
                <span className="text-xs text-muted-foreground">({pkg.reviews} reviews)</span>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground line-through">৳{pkg.originalPrice.toLocaleString()}</p>
                <p className="text-3xl font-black text-primary">৳{pkg.price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per person · all inclusive</p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-semibold">{pkg.duration}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Next Available</span><span className="font-semibold">Mar 15, 2026</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Group Size</span><span className="font-semibold">Min 2 persons</span></div>
              </div>
              <Button className="w-full h-11 font-bold shadow-lg shadow-primary/20" asChild>
                <Link to="/booking/confirmation">Book This Package <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/contact">Enquire Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

export default HolidayDetail;
