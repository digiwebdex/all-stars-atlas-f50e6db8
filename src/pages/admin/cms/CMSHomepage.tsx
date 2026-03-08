import { useState, useEffect } from "react";
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
import {
  Save, Plus, Trash2, GripVertical, Eye,
  Plane, Hotel, MapPin, Star, Quote, BarChart3, Shield, ArrowUp, ArrowDown, Image
} from "lucide-react";
import { toast } from "sonner";
import { useHomepageContent, setHomepageContent, type HomepageContent } from "@/lib/homepage-store";

const sectionIcons: Record<string, typeof Image> = {
  hero: Image, stats: BarChart3, features: Shield, offers: Star,
  exploreBD: MapPin, airlines: Plane, intlDestinations: MapPin,
  hotels: Hotel, packages: MapPin, routes: Plane, testimonials: Quote, appDownload: Star,
};

const CMSHomepage = () => {
  const content = useHomepageContent();
  const [hero, setHero] = useState(content.hero);
  const [stats, setStats] = useState(content.stats);
  const [features, setFeatures] = useState(content.features);
  const [offers, setOffers] = useState(content.offers);
  const [destinations, setDestinations] = useState(content.destinations);
  const [intlDest, setIntlDest] = useState(content.intlDestinations);
  const [airlines, setAirlines] = useState(content.airlines);
  const [hotels, setHotels] = useState(content.hotels);
  const [packages, setPackages] = useState(content.packages);
  const [routes, setRoutes] = useState(content.routes);
  const [testimonials, setTestimonials] = useState(content.testimonials);
  const [sections, setSections] = useState(content.sections);

  const handleSave = () => {
    const updated: HomepageContent = {
      hero, stats, features, offers, destinations,
      intlDestinations: intlDest, airlines, hotels, packages, routes, testimonials, sections,
    };
    setHomepageContent(updated);
    toast.success("Homepage content saved! Changes are now live on the homepage.");
  };

  const moveSection = (index: number, dir: "up" | "down") => {
    const newSections = [...sections];
    const swapIdx = dir === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSections.length) return;
    [newSections[index], newSections[swapIdx]] = [newSections[swapIdx], newSections[index]];
    newSections.forEach((s, i) => s.order = i);
    setSections(newSections);
  };

  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], visible: !newSections[index].visible };
    setSections(newSections);
  };

  const removeItem = (list: any[], setList: (v: any[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const toggleItemVisibility = (list: any[], setList: (v: any[]) => void, index: number) => {
    const newList = [...list];
    newList[index] = { ...newList[index], visible: !newList[index].visible };
    setList(newList);
  };

  const renderItemTable = (
    title: string, items: any[], setItems: (v: any[]) => void,
    columns: { key: string; label: string }[], type: string
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
              {columns.map(c => <TableHead key={c.key} className="text-xs">{c.label}</TableHead>)}
              <TableHead className="w-10 text-xs">Visible</TableHead>
              <TableHead className="w-20 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={item.id || idx} className={!item.visible ? "opacity-40" : ""}>
                {columns.map(c => (
                  <TableCell key={c.key} className="py-2">
                    <Input value={item[c.key] || ""} onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx] = { ...newItems[idx], [c.key]: e.target.value };
                      setItems(newItems);
                    }} className="h-8 text-xs" />
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
          <p className="text-sm text-muted-foreground mt-1">Edit all homepage content, sections, and layout. Changes sync to live homepage instantly.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open("/", "_blank")}>
            <Eye className="w-4 h-4 mr-1.5" /> Preview
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1.5" /> Save & Publish
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
              <CardDescription className="text-xs">Reorder sections and toggle visibility. Changes apply after clicking "Save & Publish".</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {sections.map((section, idx) => {
                const SIcon = sectionIcons[section.key] || Star;
                return (
                  <div key={section.key} className={`flex items-center gap-3 p-3 rounded-lg border ${section.visible ? "bg-card" : "bg-muted/50 opacity-60"}`}>
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <SIcon className="w-4 h-4 text-primary" />
                    <span className="flex-1 text-sm font-medium">{section.label}</span>
                    <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, "up")} disabled={idx === 0}><ArrowUp className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(idx, "down")} disabled={idx === sections.length - 1}><ArrowDown className="w-3.5 h-3.5" /></Button>
                    </div>
                    <Switch checked={section.visible} onCheckedChange={() => toggleSection(idx)} />
                  </div>
                );
              })}
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
            <CardHeader className="pb-3"><CardTitle className="text-base">Stats Strip</CardTitle></CardHeader>
            <CardContent className="p-0">
              {renderItemTable("Statistics", stats, setStats, [
                { key: "value", label: "Value" }, { key: "suffix", label: "Suffix" }, { key: "label", label: "Label" },
              ], "stat")}
            </CardContent>
          </Card>

          {renderItemTable("Trust Features", features, setFeatures, [
            { key: "title", label: "Title" }, { key: "desc", label: "Description" }, { key: "icon", label: "Icon" },
          ], "feature")}
        </TabsContent>

        {/* OFFERS */}
        <TabsContent value="offers" className="space-y-4">
          {renderItemTable("Exclusive Offers", offers, setOffers, [
            { key: "title", label: "Title" }, { key: "discount", label: "Discount Badge" },
            { key: "desc", label: "Description" }, { key: "emoji", label: "Emoji" }, { key: "gradient", label: "Color" },
          ], "offer")}
        </TabsContent>

        {/* DESTINATIONS */}
        <TabsContent value="destinations" className="space-y-4">
          {renderItemTable("Explore Bangladesh (Domestic)", destinations, setDestinations, [
            { key: "name", label: "Name" }, { key: "hotels", label: "Hotels Count" }, { key: "img", label: "Image URL" },
          ], "dest")}
          {renderItemTable("Popular Destinations (International)", intlDest, setIntlDest, [
            { key: "name", label: "Name" }, { key: "hotels", label: "Hotels Count" }, { key: "img", label: "Image URL" },
          ], "intldest")}
          {renderItemTable("Top Airlines", airlines, setAirlines, [
            { key: "name", label: "Airline Name" }, { key: "code", label: "IATA Code" },
          ], "airline")}
        </TabsContent>

        {/* HOTELS & TOURS */}
        <TabsContent value="content" className="space-y-4">
          {renderItemTable("Best Hotels", hotels, setHotels, [
            { key: "name", label: "Hotel Name" }, { key: "location", label: "Location" },
            { key: "rating", label: "Stars" }, { key: "price", label: "Price/Night" }, { key: "img", label: "Image URL" },
          ], "hotel")}
          {renderItemTable("Holiday Tour Packages", packages, setPackages, [
            { key: "name", label: "Destination" }, { key: "days", label: "Duration" },
            { key: "price", label: "Price" }, { key: "rating", label: "Rating" }, { key: "img", label: "Image URL" },
          ], "package")}
        </TabsContent>

        {/* MORE */}
        <TabsContent value="misc" className="space-y-4">
          {renderItemTable("Domestic Flight Routes", routes, setRoutes, [
            { key: "from", label: "From" }, { key: "fromCode", label: "Code" },
            { key: "to", label: "To" }, { key: "toCode", label: "Code" }, { key: "price", label: "Price" },
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
