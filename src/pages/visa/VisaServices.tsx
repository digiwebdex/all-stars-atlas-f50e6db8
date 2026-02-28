import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Globe, FileText, Clock, CheckCircle2, ArrowRight, Search,
  Upload, Shield, Headphones, Star, Users
} from "lucide-react";
import { useState } from "react";

const countries = [
  { name: "Thailand", flag: "🇹🇭", processing: "3-5 Days", fee: "৳4,500", type: "Tourist", popular: true },
  { name: "Malaysia", flag: "🇲🇾", processing: "5-7 Days", fee: "৳6,200", type: "Tourist / Business", popular: true },
  { name: "Singapore", flag: "🇸🇬", processing: "5-7 Days", fee: "৳5,800", type: "Tourist", popular: true },
  { name: "UAE", flag: "🇦🇪", processing: "3-5 Days", fee: "৳8,500", type: "Tourist / Business", popular: true },
  { name: "India", flag: "🇮🇳", processing: "7-10 Days", fee: "৳3,200", type: "Tourist / Medical", popular: false },
  { name: "Turkey", flag: "🇹🇷", processing: "10-15 Days", fee: "৳7,500", type: "Tourist", popular: false },
  { name: "UK", flag: "🇬🇧", processing: "15-20 Days", fee: "৳12,000", type: "Tourist / Business", popular: false },
  { name: "USA", flag: "🇺🇸", processing: "30-60 Days", fee: "৳15,000", type: "Tourist / Business", popular: false },
  { name: "Canada", flag: "🇨🇦", processing: "20-30 Days", fee: "৳14,000", type: "Tourist / Student", popular: false },
  { name: "Australia", flag: "🇦🇺", processing: "15-20 Days", fee: "৳13,000", type: "Tourist / Student", popular: false },
  { name: "Japan", flag: "🇯🇵", processing: "7-10 Days", fee: "৳9,000", type: "Tourist", popular: false },
  { name: "South Korea", flag: "🇰🇷", processing: "7-10 Days", fee: "৳8,000", type: "Tourist", popular: false },
];

const steps = [
  { icon: Globe, title: "Choose Country", desc: "Select your destination and visa type" },
  { icon: FileText, title: "Submit Documents", desc: "Upload required documents securely" },
  { icon: Clock, title: "Processing", desc: "We handle embassy coordination" },
  { icon: CheckCircle2, title: "Get Your Visa", desc: "Receive visa at your doorstep" },
];

const features = [
  { icon: Shield, title: "99% Approval Rate", desc: "Expert document verification" },
  { icon: Clock, title: "Express Processing", desc: "Fastest turnaround in Bangladesh" },
  { icon: Headphones, title: "Dedicated Support", desc: "Personal visa consultant" },
  { icon: Star, title: "100K+ Visas Processed", desc: "Trusted by thousands" },
];

const VisaServices = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = countries.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "popular" && !c.popular) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)] pt-24 lg:pt-32 pb-16 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0VjBoLTJWMTRIMjBWMGgtMnYxNEgwdjJoMTR2MTRIMHYyaDE0djE0aDJ2LTE0aDE0djE0aDJ2LTE0aDE0di0ySDM2VjE2aDEydi0ySDM2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl mx-auto text-center">
            <Badge className="bg-white/15 text-white border-white/20 mb-4 text-xs font-semibold">
              <Users className="w-3.5 h-3.5 mr-1" /> 100,000+ Visas Processed
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Visa Processing <br />Made Simple
            </h1>
            <p className="text-white/65 text-sm sm:text-base mb-8 max-w-lg mx-auto">
              Get your visa hassle-free with Bangladesh's most trusted visa service. 99% approval rate, doorstep delivery.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search country..."
                className="h-12 pl-12 pr-4 rounded-xl text-base bg-white shadow-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-primary mb-0.5">Step {i + 1}</p>
                  <h4 className="text-sm font-bold">{step.title}</h4>
                  <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Available Countries</h2>
            <div className="flex gap-1">
              {["all", "popular"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                  }`}
                >
                  {f === "all" ? "All Countries" : "Popular"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((country, i) => (
              <Card key={i} className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{country.flag}</span>
                      <div>
                        <h3 className="font-bold text-sm">{country.name}</h3>
                        <p className="text-xs text-muted-foreground">{country.type}</p>
                      </div>
                    </div>
                    {country.popular && <Badge variant="outline" className="text-[10px] bg-secondary/10 text-secondary">Popular</Badge>}
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Processing</span>
                      <span className="font-semibold">{country.processing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span className="font-bold text-primary">{country.fee}</span>
                    </div>
                  </div>
                  <Button className="w-full font-semibold group-hover:shadow-lg transition-shadow" size="sm" asChild>
                    <Link to={`/visa/apply?country=${encodeURIComponent(country.name)}&type=${encodeURIComponent(country.type)}`}>
                      Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-10 sm:py-14 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-bold text-sm mb-1">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VisaServices;
