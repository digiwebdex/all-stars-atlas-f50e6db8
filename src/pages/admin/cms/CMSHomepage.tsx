import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Plus, Trash2, Edit2, GripVertical, Eye, EyeOff,
  Plane, Hotel, MapPin, Star, Quote, BarChart3, Shield, ArrowUp, ArrowDown, Upload, Image
} from "lucide-react";
import { toast } from "sonner";

// ── Hero Section State ──
const defaultHero = {
  badge: "Bangladesh's Most Trusted Travel Platform",
  heading: "Your Journey,",
  headingHighlight: "Simplified.",
  subtitle: "Book flights, hotels, holidays & visa — all in one place.\nBest prices, 24/7 support, instant confirmation.",
  videoUrl: "/videos/hero-beach.mp4",
  posterUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80",
  overlayOpacity: 30,
};

const defaultStats = [
  { id: "1", value: "500000", suffix: "+", label: "Happy Travellers", visible: true },
  { id: "2", value: "120", suffix: "+", label: "Airlines", visible: true },
  { id: "3", value: "50000", suffix: "+", label: "Hotels", visible: true },
  { id: "4", value: "45", suffix: "+", label: "Visa Countries", visible: true },
];

const defaultFeatures = [
  { id: "1", title: "Secure Booking", desc: "SSL encrypted, PCI-DSS compliant", icon: "Shield", visible: true },
  { id: "2", title: "Best Price Guarantee", desc: "We match any lower price you find", icon: "BadgePercent", visible: true },
  { id: "3", title: "24/7 Support", desc: "Call, chat, or email anytime", icon: "Headphones", visible: true },
  { id: "4", title: "IATA Accredited", desc: "Trusted by global airlines", icon: "Award", visible: true },
];

const defaultOffers = [
  { id: "1", title: "Exclusive Fares on Int'l Flights", discount: "Up to 16% OFF", desc: "International flights with partner bank cards", gradient: "blue", emoji: "✈️", visible: true },
  { id: "2", title: "Domestic Flight Deals", discount: "৳1,000 OFF", desc: "Save on domestic routes with credit cards", gradient: "green", emoji: "🏷️", visible: true },
  { id: "3", title: "Student Fare Special", discount: "Extra Baggage", desc: "Affordable flights with extra luggage allowance", gradient: "orange", emoji: "🎓", visible: true },
  { id: "4", title: "Hotel Weekday Deals", discount: "30% OFF", desc: "Luxury hotels at budget prices on weekdays", gradient: "purple", emoji: "🏨", visible: true },
];

const defaultDestinations = [
  { id: "1", name: "Cox's Bazar", hotels: "97", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Cox%27s_Bazar.jpg", category: "domestic", visible: true },
  { id: "2", name: "Sylhet", hotels: "44", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/AzOSQlJV2UD8QhKVOKLteYWlrI9brl.png", category: "domestic", visible: true },
  { id: "3", name: "Chittagong", hotels: "36", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/8gohsAnVmFQmPRtUKSrdpIMi1SlE16.gif", category: "domestic", visible: true },
  { id: "4", name: "Dhaka", hotels: "43", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/XjOR77hq4zWYqqMRK8yI2uRfemtbgg.png", category: "domestic", visible: true },
  { id: "5", name: "Sreemangal", hotels: "6", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/wcmMawEQourNqilRyE2GOHHv0tYzVP.png", category: "domestic", visible: true },
  { id: "6", name: "Gazipur", hotels: "12", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/TdXdFC08piA8Csi3X8qqreie9UUzif.png", category: "domestic", visible: true },
];

const defaultIntlDestinations = [
  { id: "7", name: "Kathmandu", hotels: "1,152", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kathamandu.jpg", category: "international", visible: true },
  { id: "8", name: "Bangkok", hotels: "4,351", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg", category: "international", visible: true },
  { id: "9", name: "Singapore", hotels: "813", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Singapore.jpg", category: "international", visible: true },
  { id: "10", name: "Kuala Lumpur", hotels: "2,464", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kuala_Lumpur.jpg", category: "international", visible: true },
  { id: "11", name: "Maldives", hotels: "36", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Maafushi.jpg", category: "international", visible: true },
  { id: "12", name: "Kolkata", hotels: "1,319", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kolkata.jpg", category: "international", visible: true },
];

const defaultAirlines = [
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
];

const defaultHotels = [
  { id: "1", name: "Sea Pearl Beach Resort & Spa", location: "Cox's Bazar", rating: "5", reviews: "431", price: "৳8,500", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/agoda-2564409-60592569-839740.jpg", visible: true },
  { id: "2", name: "Bhawal Resort & Spa", location: "Gazipur", rating: "5", reviews: "264", price: "৳6,200", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/bhawal-resort-spa-20210907174024.jpg", visible: true },
  { id: "3", name: "Grand Sylhet Hotel & Resort", location: "Sylhet", rating: "5", reviews: "159", price: "৳5,900", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/267736179_149939317369872_2872125975221274736_n.jpg", visible: true },
  { id: "4", name: "Sayeman Beach Resort", location: "Cox's Bazar", rating: "5", reviews: "453", price: "৳7,800", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/sayeman_-1.PNG", visible: true },
];

const defaultPackages = [
  { id: "1", name: "Bangkok", days: "4N/5D", price: "৳42,000", rating: "5", reviews: "57", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg", visible: true },
  { id: "2", name: "Maldives", days: "3N/4D", price: "৳68,000", rating: "5", reviews: "29", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Maafushi.jpg", visible: true },
  { id: "3", name: "Kolkata", days: "3N/4D", price: "৳22,000", rating: "4.5", reviews: "97", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kolkata.jpg", visible: true },
  { id: "4", name: "Kuala Lumpur", days: "4N/5D", price: "৳48,000", rating: "5", reviews: "68", img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kuala_Lumpur.jpg", visible: true },
];

const defaultRoutes = [
  { id: "1", from: "Dhaka", fromCode: "DAC", to: "Cox's Bazar", toCode: "CXB", price: "৳4,200", visible: true },
  { id: "2", from: "Dhaka", fromCode: "DAC", to: "Jashore", toCode: "JSR", price: "৳3,800", visible: true },
  { id: "3", from: "Dhaka", fromCode: "DAC", to: "Chattogram", toCode: "CGP", price: "৳3,500", visible: true },
  { id: "4", from: "Dhaka", fromCode: "DAC", to: "Sylhet", toCode: "ZYL", price: "৳3,900", visible: true },
];

const defaultTestimonials = [
  { id: "1", name: "Rafiq Ahmed", role: "Frequent Traveller", text: "Best travel platform in Bangladesh! The flight booking is incredibly smooth and prices are always competitive.", avatar: "RA", visible: true },
  { id: "2", name: "Fatema Khatun", role: "Business Traveller", text: "I use Seven Trip for all my corporate travel. The visa processing is fast and hassle-free.", avatar: "FK", visible: true },
  { id: "3", name: "Kamal Hossain", role: "Family Traveller", text: "Booked our family holiday to Maldives through Seven Trip. Amazing packages at unbeatable prices!", avatar: "KH", visible: true },
];

const sectionOrder = [
  { key: "hero", label: "Hero Banner", icon: Image },
  { key: "stats", label: "Stats Strip", icon: BarChart3 },
  { key: "features", label: "Trust Features", icon: Shield },
  { key: "offers", label: "Exclusive Offers", icon: Star },
  { key: "exploreBD", label: "Explore Bangladesh", icon: MapPin },
  { key: "airlines", label: "Top Airlines", icon: Plane },
  { key: "intlDestinations", label: "Popular Destinations", icon: MapPin },
  { key: "hotels", label: "Best Hotels", icon: Hotel },
  { key: "packages", label: "Tour Packages", icon: MapPin },
  { key: "routes", label: "Domestic Routes", icon: Plane },
  { key: "testimonials", label: "Testimonials", icon: Quote },
  { key: "appDownload", label: "App Download CTA", icon: Star },
];

const CMSHomepage = () => {
  const [hero, setHero] = useState(defaultHero);
  const [stats, setStats] = useState(defaultStats);
  const [features, setFeatures] = useState(defaultFeatures);
  const [offers, setOffers] = useState(defaultOffers);
  const [destinations, setDestinations] = useState(defaultDestinations);
  const [intlDest, setIntlDest] = useState(defaultIntlDestinations);
  const [airlines, setAirlines] = useState(defaultAirlines);
  const [hotels, setHotels] = useState(defaultHotels);
  const [packages, setPackages] = useState(defaultPackages);
  const [routes, setRoutes] = useState(defaultRoutes);
  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [sections, setSections] = useState(sectionOrder.map((s, i) => ({ ...s, visible: true, order: i })));
  const [editDialog, setEditDialog] = useState<{ type: string; item: any; index: number } | null>(null);

  const handleSave = () => {
    toast.success("Homepage content saved successfully!");
  };

  const moveSection = (index: number, dir: "up" | "down") => {
    const newSections = [...sections];
    const swapIdx = dir === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSections.length) return;
    [newSections[index], newSections[swapIdx]] = [newSections[swapIdx], newSections[index]];
    setSections(newSections);
  };

  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index].visible = !newSections[index].visible;
    setSections(newSections);
  };

  const removeItem = (list: any[], setList: (v: any[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const toggleItemVisibility = (list: any[], setList: (v: any[]) => void, index: number) => {
    const newList = [...list];
    newList[index].visible = !newList[index].visible;
    setList(newList);
  };

  // Generic table editor
  const renderItemTable = (
    title: string,
    items: any[],
    setItems: (v: any[]) => void,
    columns: { key: string; label: string }[],
    type: string
  ) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Button size="sm" onClick={() => {
            const newItem: any = { id: String(Date.now()), visible: true };
            columns.forEach(c => newItem[c.key] = "");
            setItems([...items, newItem]);
            toast.success("New item added. Edit it below.");
          }}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(c => (
                <TableHead key={c.key} className="text-xs">{c.label}</TableHead>
              ))}
              <TableHead className="w-10 text-xs">Visible</TableHead>
              <TableHead className="w-20 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={item.id || idx} className={!item.visible ? "opacity-40" : ""}>
                {columns.map(c => (
                  <TableCell key={c.key} className="py-2">
                    <Input
                      value={item[c.key] || ""}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx] = { ...newItems[idx], [c.key]: e.target.value };
                        setItems(newItems);
                      }}
                      className="h-8 text-xs"
                    />
                  </TableCell>
                ))}
                <TableCell className="py-2">
                  <Switch checked={item.visible} onCheckedChange={() => toggleItemVisibility(items, setItems, idx)} />
                </TableCell>
                <TableCell className="py-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(items, setItems, idx)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Homepage CMS</h1>
          <p className="text-sm text-muted-foreground mt-1">Edit all homepage content, sections, and layout</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open("/", "_blank")}>
            <Eye className="w-4 h-4 mr-1.5" /> Preview
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1.5" /> Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sections" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 w-full h-auto gap-1">
          <TabsTrigger value="sections" className="text-xs">Section Order</TabsTrigger>
          <TabsTrigger value="hero" className="text-xs">Hero</TabsTrigger>
          <TabsTrigger value="offers" className="text-xs">Offers</TabsTrigger>
          <TabsTrigger value="destinations" className="text-xs">Destinations</TabsTrigger>
          <TabsTrigger value="content" className="text-xs">Hotels & Tours</TabsTrigger>
          <TabsTrigger value="misc" className="text-xs">More</TabsTrigger>
        </TabsList>

        {/* SECTION ORDER */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Section Order & Visibility</CardTitle>
              <CardDescription className="text-xs">Drag sections to reorder. Toggle visibility to show/hide on homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {sections.map((section, idx) => (
                <div key={section.key} className={`flex items-center gap-3 p-3 rounded-lg border ${section.visible ? "bg-card" : "bg-muted/50 opacity-60"}`}>
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <section.icon className="w-4 h-4 text-primary" />
                  <span className="flex-1 text-sm font-medium">{section.label}</span>
                  <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, "up")} disabled={idx === 0}>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, "down")} disabled={idx === sections.length - 1}>
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Switch checked={section.visible} onCheckedChange={() => toggleSection(idx)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HERO */}
        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hero Banner</CardTitle>
              <CardDescription className="text-xs">Main hero section with video background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Badge Text</Label>
                  <Input value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Heading</Label>
                  <Input value={hero.heading} onChange={(e) => setHero({ ...hero, heading: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Heading Highlight (orange text)</Label>
                  <Input value={hero.headingHighlight} onChange={(e) => setHero({ ...hero, headingHighlight: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Overlay Opacity (%)</Label>
                  <Input type="number" min={0} max={100} value={hero.overlayOpacity} onChange={(e) => setHero({ ...hero, overlayOpacity: Number(e.target.value) })} className="h-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Subtitle</Label>
                <Textarea value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} rows={3} />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Video URL</Label>
                  <Input value={hero.videoUrl} onChange={(e) => setHero({ ...hero, videoUrl: e.target.value })} className="h-9" />
                  <p className="text-[10px] text-muted-foreground">Upload to Media Library first, then paste the URL here</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Poster/Fallback Image URL</Label>
                  <Input value={hero.posterUrl} onChange={(e) => setHero({ ...hero, posterUrl: e.target.value })} className="h-9" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Stats Strip</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderItemTable("Statistics", stats, setStats, [
                { key: "value", label: "Value" },
                { key: "suffix", label: "Suffix" },
                { key: "label", label: "Label" },
              ], "stat")}
            </CardContent>
          </Card>

          {renderItemTable("Trust Features", features, setFeatures, [
            { key: "title", label: "Title" },
            { key: "desc", label: "Description" },
            { key: "icon", label: "Icon" },
          ], "feature")}
        </TabsContent>

        {/* OFFERS */}
        <TabsContent value="offers" className="space-y-4">
          {renderItemTable("Exclusive Offers", offers, setOffers, [
            { key: "title", label: "Title" },
            { key: "discount", label: "Discount Badge" },
            { key: "desc", label: "Description" },
            { key: "emoji", label: "Emoji" },
            { key: "gradient", label: "Color" },
          ], "offer")}
        </TabsContent>

        {/* DESTINATIONS */}
        <TabsContent value="destinations" className="space-y-4">
          {renderItemTable("Explore Bangladesh (Domestic)", destinations, setDestinations, [
            { key: "name", label: "Name" },
            { key: "hotels", label: "Hotels Count" },
            { key: "img", label: "Image URL" },
          ], "dest")}

          {renderItemTable("Popular Destinations (International)", intlDest, setIntlDest, [
            { key: "name", label: "Name" },
            { key: "hotels", label: "Hotels Count" },
            { key: "img", label: "Image URL" },
          ], "intldest")}

          {renderItemTable("Top Airlines", airlines, setAirlines, [
            { key: "name", label: "Airline Name" },
            { key: "code", label: "IATA Code" },
          ], "airline")}
        </TabsContent>

        {/* HOTELS & TOURS */}
        <TabsContent value="content" className="space-y-4">
          {renderItemTable("Best Hotels", hotels, setHotels, [
            { key: "name", label: "Hotel Name" },
            { key: "location", label: "Location" },
            { key: "rating", label: "Stars" },
            { key: "price", label: "Price/Night" },
            { key: "img", label: "Image URL" },
          ], "hotel")}

          {renderItemTable("Holiday Tour Packages", packages, setPackages, [
            { key: "name", label: "Destination" },
            { key: "days", label: "Duration" },
            { key: "price", label: "Price" },
            { key: "rating", label: "Rating" },
            { key: "img", label: "Image URL" },
          ], "package")}
        </TabsContent>

        {/* MORE */}
        <TabsContent value="misc" className="space-y-4">
          {renderItemTable("Domestic Flight Routes", routes, setRoutes, [
            { key: "from", label: "From" },
            { key: "fromCode", label: "Code" },
            { key: "to", label: "To" },
            { key: "toCode", label: "Code" },
            { key: "price", label: "Price" },
          ], "route")}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Testimonials</CardTitle>
                <Button size="sm" onClick={() => setTestimonials([...testimonials, { id: String(Date.now()), name: "", role: "", text: "", avatar: "", visible: true }])}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {testimonials.map((t, idx) => (
                <div key={t.id} className={`p-4 rounded-lg border space-y-3 ${!t.visible ? "opacity-40" : ""}`}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Name</Label>
                      <Input value={t.name} onChange={(e) => { const n = [...testimonials]; n[idx] = { ...n[idx], name: e.target.value }; setTestimonials(n); }} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Role</Label>
                      <Input value={t.role} onChange={(e) => { const n = [...testimonials]; n[idx] = { ...n[idx], role: e.target.value }; setTestimonials(n); }} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Avatar Initials</Label>
                      <Input value={t.avatar} onChange={(e) => { const n = [...testimonials]; n[idx] = { ...n[idx], avatar: e.target.value }; setTestimonials(n); }} className="h-8 text-xs" />
                    </div>
                    <div className="flex items-end gap-2">
                      <Switch checked={t.visible} onCheckedChange={() => toggleItemVisibility(testimonials, setTestimonials, idx)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(testimonials, setTestimonials, idx)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Testimonial Text</Label>
                    <Textarea value={t.text} onChange={(e) => { const n = [...testimonials]; n[idx] = { ...n[idx], text: e.target.value }; setTestimonials(n); }} rows={2} className="text-xs" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CMSHomepage;
