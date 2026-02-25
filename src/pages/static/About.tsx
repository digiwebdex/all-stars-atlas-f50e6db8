import { Building2, Users, Globe, Award, Target, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const values = [
  { icon: Target, title: "Our Mission", desc: "To make travel accessible, affordable, and enjoyable for every Bangladeshi traveller through technology and exceptional service." },
  { icon: Heart, title: "Customer First", desc: "Every decision we make starts with the question: 'How does this benefit our travellers?' Your satisfaction is our success." },
  { icon: Globe, title: "Global Reach", desc: "Partnerships with 120+ airlines and 50,000+ hotels worldwide, bringing the entire world within your reach." },
  { icon: Award, title: "IATA Accredited", desc: "Fully accredited by IATA and a proud member of ATAB, ensuring the highest standards of service and reliability." },
];

const stats = [
  { value: "500K+", label: "Happy Travellers" },
  { value: "120+", label: "Airline Partners" },
  { value: "50K+", label: "Hotels Worldwide" },
  { value: "45+", label: "Visa Countries" },
  { value: "8+", label: "Years of Service" },
  { value: "24/7", label: "Customer Support" },
];

const team = [
  { name: "Arifur Rahman", role: "Founder & CEO", avatar: "AR" },
  { name: "Nusrat Jahan", role: "Head of Operations", avatar: "NJ" },
  { name: "Tanvir Hasan", role: "CTO", avatar: "TH" },
  { name: "Sabrina Akter", role: "Head of Customer Experience", avatar: "SA" },
];

const About = () => (
  <div className="min-h-screen bg-muted/30">
    <section className="relative bg-gradient-to-br from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)] pt-24 lg:pt-32 pb-16 overflow-hidden">
      <div className="container mx-auto px-4 relative text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">About TravelHub</h1>
        <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto">Bangladesh's most trusted travel platform since 2018</p>
      </div>
    </section>

    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
            Founded in 2018 in Dhaka, TravelHub started with a simple vision: to transform how Bangladeshis book travel. 
            What began as a small team passionate about travel has grown into the country's leading online travel agency, 
            serving over 500,000 happy travellers. We combine cutting-edge technology with deep local expertise to offer 
            flights, hotels, visa processing, and holiday packages — all at the best prices with instant confirmation.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {values.map((v, i) => (
            <Card key={i} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-sm mb-2">{v.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-gradient-to-br from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)] rounded-2xl p-8 sm:p-12 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-white">{s.value}</div>
                <div className="text-xs text-white/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Our Leadership</h2>
          <p className="text-sm text-muted-foreground">The people behind TravelHub</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-3xl mx-auto">
          {team.map((t, i) => (
            <Card key={i} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bold text-lg">
                  {t.avatar}
                </div>
                <h4 className="font-bold text-sm">{t.name}</h4>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default About;
