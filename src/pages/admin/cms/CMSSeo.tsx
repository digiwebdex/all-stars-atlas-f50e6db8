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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Globe, Search, FileText, Code, Share2, AlertCircle, CheckCircle2,
  Plus, Trash2, ExternalLink, Eye
} from "lucide-react";
import { toast } from "sonner";

const defaultGlobalSeo = {
  siteTitle: "Seven Trip - Bangladesh's Most Trusted Travel Platform",
  siteTitleSuffix: " | Seven Trip",
  metaDescription: "Book flights, hotels, visa & holiday packages at best prices. IATA accredited, 24/7 support, instant confirmation. Bangladesh's #1 travel platform.",
  metaKeywords: "flights, hotels, visa, travel, Bangladesh, Seven Trip, holiday packages, flight booking, hotel reservation",
  canonicalUrl: "https://seventrip.com.bd",
  language: "en",
  favicon: "/favicon.png",
  ogImage: "https://seventrip.com.bd/images/og-default.jpg",
};

const defaultRobots = {
  allowIndexing: true,
  allowFollowing: true,
  sitemapUrl: "https://seventrip.com.bd/sitemap.xml",
  customRules: "User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /admin/\nDisallow: /auth/\n\nSitemap: https://seventrip.com.bd/sitemap.xml",
};

const defaultJsonLd = {
  enabled: true,
  type: "TravelAgency",
  name: "Seven Trip",
  url: "https://seventrip.com.bd",
  logo: "https://seventrip.com.bd/images/seven-trip-logo.png",
  phone: "+880 1234-567890",
  email: "support@seventrip.com",
  address: "123 Travel Street, Dhaka 1205, Bangladesh",
  priceRange: "৳৳",
};

const defaultPageSeo = [
  { id: "1", path: "/", title: "Seven Trip - Book Flights, Hotels & Holidays", description: "Bangladesh's most trusted travel platform. Best prices on flights, hotels, visa & packages.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "2", path: "/flights", title: "Flight Booking", description: "Search and book cheap flights from Bangladesh. Compare 120+ airlines.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "3", path: "/hotels", title: "Hotel Reservation", description: "Book hotels at best prices. 50,000+ properties worldwide.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "4", path: "/visa", title: "Visa Processing", description: "Fast visa processing for 45+ countries. Apply online now.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "5", path: "/holidays", title: "Holiday Packages", description: "All-inclusive holiday packages. Flights + hotels + sightseeing.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "6", path: "/about", title: "About Us", description: "Learn about Seven Trip - Bangladesh's leading travel platform.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "7", path: "/contact", title: "Contact Us", description: "Get in touch with Seven Trip. 24/7 customer support.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "8", path: "/faq", title: "FAQ", description: "Frequently asked questions about Seven Trip services.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "9", path: "/terms", title: "Terms & Conditions", description: "Seven Trip terms of service and user agreement.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "10", path: "/privacy", title: "Privacy Policy", description: "How Seven Trip collects, uses and protects your data.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "11", path: "/careers", title: "Careers", description: "Join the Seven Trip team. View open positions.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "12", path: "/refund-policy", title: "Refund Policy", description: "Seven Trip refund and cancellation policy.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "13", path: "/esim", title: "eSIM Plans", description: "Buy international eSIM plans for travel. Stay connected abroad.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "14", path: "/cars", title: "Car Rental", description: "Rent cars for travel in Bangladesh and abroad.", ogTitle: "", ogDescription: "", noIndex: false },
  { id: "15", path: "/medical", title: "Medical Tourism", description: "Medical tourism packages. Top hospitals, affordable treatments.", ogTitle: "", ogDescription: "", noIndex: false },
];

const defaultSocialMeta = {
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterSite: "@seventrip",
  fbAppId: "",
};

const CMSSeo = () => {
  const [global, setGlobal] = useState(defaultGlobalSeo);
  const [robots, setRobots] = useState(defaultRobots);
  const [jsonLd, setJsonLd] = useState(defaultJsonLd);
  const [pageSeo, setPageSeo] = useState(defaultPageSeo);
  const [socialMeta, setSocialMeta] = useState(defaultSocialMeta);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  const handleSave = () => toast.success("SEO settings saved successfully!");

  const charCount = (text: string, max: number) => {
    const len = text.length;
    return (
      <span className={`text-[10px] ${len > max ? "text-destructive" : len > max * 0.8 ? "text-warning" : "text-muted-foreground"}`}>
        {len}/{max}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Advanced SEO</h1>
          <p className="text-sm text-muted-foreground mt-1">Meta tags, Open Graph, JSON-LD, robots.txt & per-page SEO</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-1.5" /> Save Changes
        </Button>
      </div>

      <Tabs defaultValue="global" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto gap-1">
          <TabsTrigger value="global" className="text-xs">Global Meta</TabsTrigger>
          <TabsTrigger value="pages" className="text-xs">Page SEO</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social / OG</TabsTrigger>
          <TabsTrigger value="structured" className="text-xs">JSON-LD</TabsTrigger>
          <TabsTrigger value="robots" className="text-xs">Robots & Sitemap</TabsTrigger>
        </TabsList>

        {/* GLOBAL META */}
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" /> Global Meta Tags</CardTitle>
              <CardDescription className="text-xs">Default meta tags applied site-wide (overridden by page-specific settings)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Site Title</Label>
                  {charCount(global.siteTitle, 60)}
                </div>
                <Input value={global.siteTitle} onChange={(e) => setGlobal({ ...global, siteTitle: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Title Suffix (appended to page titles)</Label>
                <Input value={global.siteTitleSuffix} onChange={(e) => setGlobal({ ...global, siteTitleSuffix: e.target.value })} className="h-9 max-w-xs" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Meta Description</Label>
                  {charCount(global.metaDescription, 160)}
                </div>
                <Textarea value={global.metaDescription} onChange={(e) => setGlobal({ ...global, metaDescription: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Meta Keywords</Label>
                <Textarea value={global.metaKeywords} onChange={(e) => setGlobal({ ...global, metaKeywords: e.target.value })} rows={2} />
                <p className="text-[10px] text-muted-foreground">Comma-separated keywords</p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Canonical URL</Label>
                  <Input value={global.canonicalUrl} onChange={(e) => setGlobal({ ...global, canonicalUrl: e.target.value })} className="h-9 font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Language</Label>
                  <Select value={global.language} onValueChange={(v) => setGlobal({ ...global, language: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">Bengali (বাংলা)</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Default OG Image URL</Label>
                  <Input value={global.ogImage} onChange={(e) => setGlobal({ ...global, ogImage: e.target.value })} className="h-9 text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Favicon URL</Label>
                  <Input value={global.favicon} onChange={(e) => setGlobal({ ...global, favicon: e.target.value })} className="h-9 text-xs" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" /> Google Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white dark:bg-muted/50 rounded-lg p-4 border max-w-xl">
                <p className="text-[13px] text-[#1a0dab] font-medium truncate">{global.siteTitle}</p>
                <p className="text-[11px] text-[#006621] font-mono truncate mt-0.5">{global.canonicalUrl}</p>
                <p className="text-[12px] text-[#545454] mt-1 line-clamp-2">{global.metaDescription}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAGE SEO */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Per-Page SEO Settings</CardTitle>
                  <CardDescription className="text-xs">Override global meta for individual pages</CardDescription>
                </div>
                <Button size="sm" onClick={() => {
                  setPageSeo([...pageSeo, { id: String(Date.now()), path: "/new-page", title: "", description: "", ogTitle: "", ogDescription: "", noIndex: false }]);
                }}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Page
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {pageSeo.map((page, idx) => (
                <div key={page.id} className="border rounded-lg">
                  <button
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedPage(expandedPage === page.id ? null : page.id)}
                  >
                    <div className="flex items-center gap-3">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{page.path}</code>
                      <span className="text-sm font-medium truncate max-w-[200px]">{page.title || "Untitled"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.noIndex && <Badge variant="outline" className="text-[9px] text-destructive">noindex</Badge>}
                      {page.title ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-warning" />
                      )}
                    </div>
                  </button>
                  {expandedPage === page.id && (
                    <div className="px-3 pb-3 space-y-3 border-t pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Page Path</Label>
                          <Input value={page.path} onChange={(e) => { const n = [...pageSeo]; n[idx] = { ...n[idx], path: e.target.value }; setPageSeo(n); }} className="h-8 text-xs font-mono" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Page Title</Label>
                            {charCount(page.title, 60)}
                          </div>
                          <Input value={page.title} onChange={(e) => { const n = [...pageSeo]; n[idx] = { ...n[idx], title: e.target.value }; setPageSeo(n); }} className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Meta Description</Label>
                          {charCount(page.description, 160)}
                        </div>
                        <Textarea value={page.description} onChange={(e) => { const n = [...pageSeo]; n[idx] = { ...n[idx], description: e.target.value }; setPageSeo(n); }} rows={2} className="text-xs" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">OG Title (optional override)</Label>
                          <Input value={page.ogTitle} onChange={(e) => { const n = [...pageSeo]; n[idx] = { ...n[idx], ogTitle: e.target.value }; setPageSeo(n); }} className="h-8 text-xs" placeholder="Uses page title if empty" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">OG Description (optional override)</Label>
                          <Input value={page.ogDescription} onChange={(e) => { const n = [...pageSeo]; n[idx] = { ...n[idx], ogDescription: e.target.value }; setPageSeo(n); }} className="h-8 text-xs" placeholder="Uses meta desc if empty" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Switch checked={page.noIndex} onCheckedChange={(v) => { const n = [...pageSeo]; n[idx] = { ...n[idx], noIndex: v }; setPageSeo(n); }} />
                          <Label className="text-xs">noindex (hide from search engines)</Label>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => setPageSeo(pageSeo.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIAL / OG */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Share2 className="w-4 h-4" /> Social Media Meta Tags</CardTitle>
              <CardDescription className="text-xs">Open Graph & Twitter Card settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">OG Type</Label>
                  <Select value={socialMeta.ogType} onValueChange={(v) => setSocialMeta({ ...socialMeta, ogType: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">website</SelectItem>
                      <SelectItem value="article">article</SelectItem>
                      <SelectItem value="product">product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Twitter Card Type</Label>
                  <Select value={socialMeta.twitterCard} onValueChange={(v) => setSocialMeta({ ...socialMeta, twitterCard: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">summary</SelectItem>
                      <SelectItem value="summary_large_image">summary_large_image</SelectItem>
                      <SelectItem value="player">player</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Twitter @username</Label>
                  <Input value={socialMeta.twitterSite} onChange={(e) => setSocialMeta({ ...socialMeta, twitterSite: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Facebook App ID (optional)</Label>
                  <Input value={socialMeta.fbAppId} onChange={(e) => setSocialMeta({ ...socialMeta, fbAppId: e.target.value })} className="h-9" placeholder="Optional" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* JSON-LD */}
        <TabsContent value="structured" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Code className="w-4 h-4" /> JSON-LD Structured Data</CardTitle>
                  <CardDescription className="text-xs">Rich snippets for Google search results</CardDescription>
                </div>
                <Switch checked={jsonLd.enabled} onCheckedChange={(v) => setJsonLd({ ...jsonLd, enabled: v })} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Schema Type</Label>
                  <Select value={jsonLd.type} onValueChange={(v) => setJsonLd({ ...jsonLd, type: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TravelAgency">TravelAgency</SelectItem>
                      <SelectItem value="Organization">Organization</SelectItem>
                      <SelectItem value="LocalBusiness">LocalBusiness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Business Name</Label>
                  <Input value={jsonLd.name} onChange={(e) => setJsonLd({ ...jsonLd, name: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Website URL</Label>
                  <Input value={jsonLd.url} onChange={(e) => setJsonLd({ ...jsonLd, url: e.target.value })} className="h-9 font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Logo URL</Label>
                  <Input value={jsonLd.logo} onChange={(e) => setJsonLd({ ...jsonLd, logo: e.target.value })} className="h-9 text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Phone</Label>
                  <Input value={jsonLd.phone} onChange={(e) => setJsonLd({ ...jsonLd, phone: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email</Label>
                  <Input value={jsonLd.email} onChange={(e) => setJsonLd({ ...jsonLd, email: e.target.value })} className="h-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Address</Label>
                <Input value={jsonLd.address} onChange={(e) => setJsonLd({ ...jsonLd, address: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Price Range</Label>
                <Input value={jsonLd.priceRange} onChange={(e) => setJsonLd({ ...jsonLd, priceRange: e.target.value })} className="h-9 max-w-[100px]" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Preview</Label>
                <pre className="bg-muted rounded-lg p-3 text-[10px] font-mono overflow-x-auto text-muted-foreground">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": jsonLd.type,
  name: jsonLd.name,
  url: jsonLd.url,
  logo: jsonLd.logo,
  telephone: jsonLd.phone,
  email: jsonLd.email,
  address: { "@type": "PostalAddress", streetAddress: jsonLd.address },
  priceRange: jsonLd.priceRange,
}, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROBOTS */}
        <TabsContent value="robots" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Robots.txt & Indexing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Switch checked={robots.allowIndexing} onCheckedChange={(v) => setRobots({ ...robots, allowIndexing: v })} />
                  <div>
                    <p className="text-sm font-medium">Allow Search Engine Indexing</p>
                    <p className="text-[10px] text-muted-foreground">When off, adds noindex to all pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Switch checked={robots.allowFollowing} onCheckedChange={(v) => setRobots({ ...robots, allowFollowing: v })} />
                  <div>
                    <p className="text-sm font-medium">Allow Link Following</p>
                    <p className="text-[10px] text-muted-foreground">When off, adds nofollow to all pages</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Sitemap URL</Label>
                <Input value={robots.sitemapUrl} onChange={(e) => setRobots({ ...robots, sitemapUrl: e.target.value })} className="h-9 font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Custom robots.txt Rules</Label>
                <Textarea value={robots.customRules} onChange={(e) => setRobots({ ...robots, customRules: e.target.value })} rows={8} className="font-mono text-xs" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CMSSeo;
