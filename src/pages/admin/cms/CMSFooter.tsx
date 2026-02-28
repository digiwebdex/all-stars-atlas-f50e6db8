import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Save, Plus, Trash2, Eye, Link as LinkIcon, Mail, Phone, MapPin,
  Facebook, Instagram, Twitter, Youtube, Globe, MessageCircle
} from "lucide-react";
import { toast } from "sonner";

const defaultContactInfo = {
  address: "123 Travel Street, Dhaka 1205, Bangladesh",
  phone: "+880 1234-567890",
  email: "support@seventrip.com",
  whatsapp: "+880 1234-567890",
};

const defaultSocialLinks = [
  { id: "1", platform: "Facebook", url: "https://facebook.com/seventrip", icon: "Facebook", visible: true },
  { id: "2", platform: "Instagram", url: "https://instagram.com/seventrip", icon: "Instagram", visible: true },
  { id: "3", platform: "Twitter", url: "https://twitter.com/seventrip", icon: "Twitter", visible: true },
  { id: "4", platform: "YouTube", url: "https://youtube.com/seventrip", icon: "Youtube", visible: true },
];

const defaultServiceLinks = [
  { id: "1", label: "Flight Booking", href: "/flights", visible: true },
  { id: "2", label: "Hotel Reservation", href: "/hotels", visible: true },
  { id: "3", label: "Visa Processing", href: "/visa", visible: true },
  { id: "4", label: "Holiday Packages", href: "/holidays", visible: true },
  { id: "5", label: "Travel Insurance", href: "#", visible: true },
  { id: "6", label: "eSIM", href: "/esim", visible: true },
  { id: "7", label: "Car Rental", href: "/cars", visible: true },
  { id: "8", label: "Medical Tourism", href: "/medical", visible: true },
];

const defaultCompanyLinks = [
  { id: "1", label: "About Us", href: "/about", visible: true },
  { id: "2", label: "Contact", href: "/contact", visible: true },
  { id: "3", label: "Blog", href: "#", visible: true },
  { id: "4", label: "Careers", href: "/careers", visible: true },
  { id: "5", label: "FAQ", href: "/faq", visible: true },
  { id: "6", label: "Terms & Conditions", href: "/terms", visible: true },
  { id: "7", label: "Privacy Policy", href: "/privacy", visible: true },
  { id: "8", label: "Refund Policy", href: "/refund-policy", visible: true },
];

const defaultPaymentMethods = [
  { id: "1", name: "bKash", visible: true },
  { id: "2", name: "Nagad", visible: true },
  { id: "3", name: "VISA", visible: true },
  { id: "4", name: "Master", visible: true },
  { id: "5", name: "AMEX", visible: true },
  { id: "6", name: "PayPal", visible: true },
];

const defaultBadges = [
  { id: "1", emoji: "✈️", text: "IATA Accredited", visible: true },
  { id: "2", emoji: "🏆", text: "ATAB Member", visible: true },
  { id: "3", emoji: "⭐", text: "Superbrands Award", visible: true },
];

const defaultNewsletter = {
  heading: "Get Travel Deals & Tips",
  subtitle: "Subscribe for exclusive offers. No spam, unsubscribe anytime.",
  buttonText: "Subscribe",
  enabled: true,
};

const defaultBrandInfo = {
  description: "Bangladesh's most trusted travel platform. Book flights, hotels, visa & holidays with best prices, instant confirmation, and 24/7 customer support.",
  copyright: "© {year} Seven Trip. All rights reserved.",
};

const CMSFooter = () => {
  const [contact, setContact] = useState(defaultContactInfo);
  const [social, setSocial] = useState(defaultSocialLinks);
  const [serviceLinks, setServiceLinks] = useState(defaultServiceLinks);
  const [companyLinks, setCompanyLinks] = useState(defaultCompanyLinks);
  const [paymentMethods, setPaymentMethods] = useState(defaultPaymentMethods);
  const [badges, setBadges] = useState(defaultBadges);
  const [newsletter, setNewsletter] = useState(defaultNewsletter);
  const [brand, setBrand] = useState(defaultBrandInfo);

  const handleSave = () => toast.success("Footer settings saved successfully!");

  const addItem = (list: any[], setList: (v: any[]) => void, fields: Record<string, string>) => {
    setList([...list, { id: String(Date.now()), visible: true, ...fields }]);
  };

  const updateItem = (list: any[], setList: (v: any[]) => void, idx: number, key: string, value: string) => {
    const newList = [...list];
    newList[idx] = { ...newList[idx], [key]: value };
    setList(newList);
  };

  const toggleItem = (list: any[], setList: (v: any[]) => void, idx: number) => {
    const newList = [...list];
    newList[idx].visible = !newList[idx].visible;
    setList(newList);
  };

  const removeItem = (list: any[], setList: (v: any[]) => void, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const renderLinkTable = (title: string, items: any[], setItems: (v: any[]) => void) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Button size="sm" onClick={() => addItem(items, setItems, { label: "", href: "" })}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Link
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Label</TableHead>
              <TableHead className="text-xs">URL / Path</TableHead>
              <TableHead className="w-10 text-xs">Show</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={item.id} className={!item.visible ? "opacity-40" : ""}>
                <TableCell className="py-2">
                  <Input value={item.label} onChange={(e) => updateItem(items, setItems, idx, "label", e.target.value)} className="h-8 text-xs" />
                </TableCell>
                <TableCell className="py-2">
                  <Input value={item.href} onChange={(e) => updateItem(items, setItems, idx, "href", e.target.value)} className="h-8 text-xs font-mono" />
                </TableCell>
                <TableCell className="py-2">
                  <Switch checked={item.visible} onCheckedChange={() => toggleItem(items, setItems, idx)} />
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
          <h1 className="text-2xl font-bold">Footer CMS</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage footer links, contact info, social media & more</p>
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

      <Tabs defaultValue="links" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto gap-1">
          <TabsTrigger value="links" className="text-xs">Navigation Links</TabsTrigger>
          <TabsTrigger value="contact" className="text-xs">Contact Info</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social Media</TabsTrigger>
          <TabsTrigger value="newsletter" className="text-xs">Newsletter</TabsTrigger>
          <TabsTrigger value="brand" className="text-xs">Brand & Badges</TabsTrigger>
        </TabsList>

        {/* LINKS */}
        <TabsContent value="links" className="space-y-4">
          {renderLinkTable("Services Column", serviceLinks, setServiceLinks)}
          {renderLinkTable("Company Column", companyLinks, setCompanyLinks)}
        </TabsContent>

        {/* CONTACT */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Information</CardTitle>
              <CardDescription className="text-xs">Displayed in the footer contact section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</Label>
                  <Textarea value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} rows={2} />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</Label>
                    <Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</Label>
                    <Input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="h-9" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp Number</Label>
                <Input value={contact.whatsapp} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} className="h-9 max-w-sm" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIAL */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Social Media Links</CardTitle>
                <Button size="sm" onClick={() => addItem(social, setSocial, { platform: "", url: "", icon: "" })}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Social
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Platform</TableHead>
                    <TableHead className="text-xs">URL</TableHead>
                    <TableHead className="w-10 text-xs">Show</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {social.map((item, idx) => (
                    <TableRow key={item.id} className={!item.visible ? "opacity-40" : ""}>
                      <TableCell className="py-2">
                        <Input value={item.platform} onChange={(e) => updateItem(social, setSocial, idx, "platform", e.target.value)} className="h-8 text-xs" />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input value={item.url} onChange={(e) => updateItem(social, setSocial, idx, "url", e.target.value)} className="h-8 text-xs font-mono" placeholder="https://..." />
                      </TableCell>
                      <TableCell className="py-2">
                        <Switch checked={item.visible} onCheckedChange={() => toggleItem(social, setSocial, idx)} />
                      </TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(social, setSocial, idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEWSLETTER */}
        <TabsContent value="newsletter" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Newsletter Section</CardTitle>
                <Switch checked={newsletter.enabled} onCheckedChange={(v) => setNewsletter({ ...newsletter, enabled: v })} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Heading</Label>
                  <Input value={newsletter.heading} onChange={(e) => setNewsletter({ ...newsletter, heading: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Button Text</Label>
                  <Input value={newsletter.buttonText} onChange={(e) => setNewsletter({ ...newsletter, buttonText: e.target.value })} className="h-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Subtitle</Label>
                <Input value={newsletter.subtitle} onChange={(e) => setNewsletter({ ...newsletter, subtitle: e.target.value })} className="h-9" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRAND */}
        <TabsContent value="brand" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Brand Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Footer Description</Label>
                <Textarea value={brand.description} onChange={(e) => setBrand({ ...brand, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Copyright Text</Label>
                <Input value={brand.copyright} onChange={(e) => setBrand({ ...brand, copyright: e.target.value })} className="h-9" />
                <p className="text-[10px] text-muted-foreground">Use {"{year}"} for dynamic year</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Payment Methods</CardTitle>
                <Button size="sm" onClick={() => addItem(paymentMethods, setPaymentMethods, { name: "" })}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Method Name</TableHead>
                    <TableHead className="w-10 text-xs">Show</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2">
                        <Input value={item.name} onChange={(e) => updateItem(paymentMethods, setPaymentMethods, idx, "name", e.target.value)} className="h-8 text-xs" />
                      </TableCell>
                      <TableCell className="py-2">
                        <Switch checked={item.visible} onCheckedChange={() => toggleItem(paymentMethods, setPaymentMethods, idx)} />
                      </TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(paymentMethods, setPaymentMethods, idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Bottom Bar Badges</CardTitle>
                <Button size="sm" onClick={() => addItem(badges, setBadges, { emoji: "", text: "" })}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Badge
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-20">Emoji</TableHead>
                    <TableHead className="text-xs">Text</TableHead>
                    <TableHead className="w-10 text-xs">Show</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {badges.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2">
                        <Input value={item.emoji} onChange={(e) => updateItem(badges, setBadges, idx, "emoji", e.target.value)} className="h-8 text-xs w-16" />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input value={item.text} onChange={(e) => updateItem(badges, setBadges, idx, "text", e.target.value)} className="h-8 text-xs" />
                      </TableCell>
                      <TableCell className="py-2">
                        <Switch checked={item.visible} onCheckedChange={() => toggleItem(badges, setBadges, idx)} />
                      </TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(badges, setBadges, idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CMSFooter;
