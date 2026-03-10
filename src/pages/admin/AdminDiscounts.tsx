import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, MoreHorizontal, Edit2, Trash2, Copy, Eye, Percent, Tag, DollarSign, TrendingDown, TicketCheck, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/* Discounts and price rules are loaded from API — no hardcoded defaults */

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success", scheduled: "bg-primary/10 text-primary",
  expired: "bg-muted text-muted-foreground", draft: "bg-warning/10 text-warning", paused: "bg-warning/10 text-warning",
};

const emptyDiscount = { name: "", code: "", type: "percentage", value: "", minOrder: "", maxDiscount: "", service: "All Services", startDate: "", endDate: "", activate: true };
const emptyRule = { name: "", service: "Flights", type: "markup", value: "", basis: "percentage", appliedTo: "", active: true };

const AdminDiscounts = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDiscount, setShowCreateDiscount] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [dForm, setDForm] = useState(emptyDiscount);
  const [rForm, setRForm] = useState(emptyRule);

  // Fetch from API
  const { data: apiData, isLoading } = useQuery({
    queryKey: ['admin', 'discounts'],
    queryFn: () => api.get<any>('/admin/discounts'),
  });

  const discounts: any[] = apiData?.discounts || [];
  const priceRules: any[] = apiData?.priceRules || [];

  const saveDiscounts = useMutation({
    mutationFn: (newDiscounts: any[]) => api.put('/admin/discounts', { section: 'discounts', discounts: newDiscounts }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'discounts'] }),
  });

  const saveRules = useMutation({
    mutationFn: (newRules: any[]) => api.put('/admin/discounts', { section: 'price_rules', priceRules: newRules }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'discounts'] }),
  });

  const filteredDiscounts = discounts.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (serviceFilter !== "all" && d.service !== serviceFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  const filteredRules = priceRules.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (serviceFilter !== "all" && r.service !== serviceFilter) return false;
    return true;
  });

  const totalActive = discounts.filter(d => d.status === "active").length;
  const totalRedemptions = discounts.reduce((sum, d) => sum + (d.usageCount || 0), 0);
  const pctDiscounts = discounts.filter(d => d.type === "percentage");
  const avgDiscount = pctDiscounts.length > 0 ? Math.round(pctDiscounts.reduce((sum, d) => sum + d.value, 0) / pctDiscounts.length) : 0;

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast({ title: "Copied!", description: `Code "${code}" copied.` }); };

  const createDiscount = () => {
    if (!dForm.name || !dForm.code) { toast({ title: "Error", description: "Name and code are required", variant: "destructive" }); return; }
    const newD = {
      id: `DSC-${Date.now()}`, name: dForm.name, code: dForm.code.toUpperCase(), type: dForm.type,
      value: Number(dForm.value) || 0, minOrder: Number(dForm.minOrder) || 0, maxDiscount: Number(dForm.maxDiscount) || 0,
      service: dForm.service, status: dForm.activate ? "active" : "draft", usageCount: 0,
      usageLimit: 500, startDate: dForm.startDate || "2026-01-01", endDate: dForm.endDate || "2026-12-31",
    };
    saveDiscounts.mutate([newD, ...discounts]);
    toast({ title: "Discount Created", description: `"${newD.code}" created successfully.` });
    setShowCreateDiscount(false);
    setDForm(emptyDiscount);
  };

  const deleteDiscount = (d: any) => {
    saveDiscounts.mutate(discounts.filter(x => x.id !== d.id));
    toast({ title: "Deleted", description: `"${d.code}" removed.`, variant: "destructive" });
  };

  const createRule = () => {
    if (!rForm.name) { toast({ title: "Error", description: "Name is required", variant: "destructive" }); return; }
    const newR = {
      id: `PR-${Date.now()}`, name: rForm.name, service: rForm.service, type: rForm.type,
      value: Number(rForm.value) || 0, basis: rForm.basis, status: rForm.active ? "active" : "paused", appliedTo: rForm.appliedTo || "All",
    };
    saveRules.mutate([newR, ...priceRules]);
    toast({ title: "Price Rule Created", description: `"${newR.name}" saved.` });
    setShowCreateRule(false);
    setRForm(emptyRule);
  };

  const deleteRule = (r: any) => {
    saveRules.mutate(priceRules.filter(x => x.id !== r.id));
    toast({ title: "Deleted", description: `"${r.name}" removed.`, variant: "destructive" });
  };

  const toggleRule = (r: any) => {
    const newStatus = r.status === "active" ? "paused" : "active";
    saveRules.mutate(priceRules.map(x => x.id === r.id ? { ...x, status: newStatus } : x));
    toast({ title: newStatus === "active" ? "Activated" : "Paused", description: `${r.name} is now ${newStatus}.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Discounts & Pricing</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage discount codes, markup rules, and service pricing</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Discounts", value: totalActive, icon: Tag, color: "text-success" },
          { label: "Total Redemptions", value: totalRedemptions.toLocaleString(), icon: TicketCheck, color: "text-primary" },
          { label: "Avg. Discount", value: `${avgDiscount}%`, icon: Percent, color: "text-warning" },
          { label: "Price Rules", value: priceRules.filter(r => r.status === "active").length, icon: DollarSign, color: "text-accent" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="flex items-center gap-3 p-4">
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="discounts" className="space-y-4">
        <TabsList><TabsTrigger value="discounts">Discount Codes</TabsTrigger><TabsTrigger value="pricing">Price Rules</TabsTrigger></TabsList>

        <TabsContent value="discounts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search discounts or codes..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <Select value={serviceFilter} onValueChange={setServiceFilter}><SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Service" /></SelectTrigger><SelectContent><SelectItem value="all">All Services</SelectItem><SelectItem value="Flights">Flights</SelectItem><SelectItem value="Hotels">Hotels</SelectItem><SelectItem value="Holidays">Holidays</SelectItem><SelectItem value="Visa">Visa</SelectItem><SelectItem value="Medical">Medical</SelectItem><SelectItem value="Cars">Cars</SelectItem><SelectItem value="All Services">Universal</SelectItem></SelectContent></Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select>
            </div>
            <Dialog open={showCreateDiscount} onOpenChange={setShowCreateDiscount}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" /> New Discount</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Create Discount Code</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label>Discount Name *</Label><Input value={dForm.name} onChange={e => setDForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Flight Sale" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Code *</Label><Input value={dForm.code} onChange={e => setDForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. SUMMER30" className="uppercase font-mono" /></div>
                    <div className="grid gap-2"><Label>Type</Label><Select value={dForm.type} onValueChange={v => setDForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount (৳)</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Value</Label><Input type="number" value={dForm.value} onChange={e => setDForm(f => ({ ...f, value: e.target.value }))} placeholder="25" /></div>
                    <div className="grid gap-2"><Label>Max Discount (৳)</Label><Input type="number" value={dForm.maxDiscount} onChange={e => setDForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="3000" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Min Order (৳)</Label><Input type="number" value={dForm.minOrder} onChange={e => setDForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="5000" /></div>
                    <div className="grid gap-2"><Label>Service</Label><Select value={dForm.service} onValueChange={v => setDForm(f => ({ ...f, service: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All Services">All Services</SelectItem><SelectItem value="Flights">Flights</SelectItem><SelectItem value="Hotels">Hotels</SelectItem><SelectItem value="Holidays">Holidays</SelectItem><SelectItem value="Visa">Visa</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={dForm.startDate} onChange={e => setDForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                    <div className="grid gap-2"><Label>End Date</Label><Input type="date" value={dForm.endDate} onChange={e => setDForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                  </div>
                  <div className="flex items-center gap-2"><Switch id="activate-now" checked={dForm.activate} onCheckedChange={v => setDForm(f => ({ ...f, activate: v }))} /><Label htmlFor="activate-now" className="text-sm">Activate immediately</Label></div>
                </div>
                <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={createDiscount}>Create Discount</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card><CardContent className="p-0 table-responsive">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Discount</TableHead><TableHead>Code</TableHead><TableHead className="hidden md:table-cell">Value</TableHead><TableHead className="hidden md:table-cell">Service</TableHead><TableHead className="hidden lg:table-cell">Usage</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Validity</TableHead><TableHead className="w-10"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredDiscounts.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">No discounts found</TableCell></TableRow>
                ) : filteredDiscounts.map(d => (
                  <TableRow key={d.id}>
                    <TableCell><div><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-muted-foreground font-mono">{d.id}</p></div></TableCell>
                    <TableCell><div className="flex items-center gap-1.5"><code className="text-xs bg-muted px-2 py-0.5 rounded font-bold">{d.code}</code><button onClick={() => copyCode(d.code)} className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="w-3.5 h-3.5" /></button></div></TableCell>
                    <TableCell className="hidden md:table-cell"><span className="text-sm font-semibold">{d.type === "percentage" ? `${d.value}%` : `৳${d.value.toLocaleString()}`}</span></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{d.service}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{d.usageCount}/{d.usageLimit}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${statusColors[d.status] || ""}`}>{d.status}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground"><div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{d.endDate}</div></TableCell>
                    <TableCell>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyCode(d.code)}><Copy className="w-4 h-4 mr-2" /> Copy Code</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteDiscount(d)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search price rules..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <Dialog open={showCreateRule} onOpenChange={setShowCreateRule}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" /> New Price Rule</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Price Rule</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label>Rule Name *</Label><Input value={rForm.name} onChange={e => setRForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Flight Base Markup" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Service</Label><Select value={rForm.service} onValueChange={v => setRForm(f => ({ ...f, service: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Flights">Flights</SelectItem><SelectItem value="Hotels">Hotels</SelectItem><SelectItem value="Holidays">Holidays</SelectItem><SelectItem value="Visa">Visa</SelectItem><SelectItem value="Medical">Medical</SelectItem><SelectItem value="Cars">Cars</SelectItem><SelectItem value="eSIM">eSIM</SelectItem></SelectContent></Select></div>
                    <div className="grid gap-2"><Label>Type</Label><Select value={rForm.type} onValueChange={v => setRForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="markup">Markup</SelectItem><SelectItem value="commission">Commission</SelectItem><SelectItem value="fixed_fee">Fixed Fee</SelectItem><SelectItem value="convenience">Convenience Fee</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Value</Label><Input type="number" value={rForm.value} onChange={e => setRForm(f => ({ ...f, value: e.target.value }))} placeholder="5" /></div>
                    <div className="grid gap-2"><Label>Basis</Label><Select value={rForm.basis} onValueChange={v => setRForm(f => ({ ...f, basis: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed (৳)</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="grid gap-2"><Label>Apply To</Label><Input value={rForm.appliedTo} onChange={e => setRForm(f => ({ ...f, appliedTo: e.target.value }))} placeholder="e.g. All flights" /></div>
                  <div className="flex items-center gap-2"><Switch id="rule-active" checked={rForm.active} onCheckedChange={v => setRForm(f => ({ ...f, active: v }))} /><Label htmlFor="rule-active" className="text-sm">Active</Label></div>
                </div>
                <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={createRule}>Save Rule</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card><CardContent className="p-0 table-responsive">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Rule Name</TableHead><TableHead>Service</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead className="hidden md:table-cell">Applied To</TableHead><TableHead>Status</TableHead><TableHead className="w-10"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No price rules found</TableCell></TableRow>
                ) : filteredRules.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><div><p className="text-sm font-medium">{r.name}</p><p className="text-xs text-muted-foreground font-mono">{r.id}</p></div></TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{r.service}</Badge></TableCell>
                    <TableCell className="text-sm capitalize">{r.type.replace("_", " ")}</TableCell>
                    <TableCell><span className="text-sm font-semibold">{r.basis === "percentage" ? `${r.value}%` : `৳${r.value}`}</span></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{r.appliedTo}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${statusColors[r.status] || ""}`}>{r.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleRule(r)}><TrendingDown className="w-4 h-4 mr-2" /> {r.status === "active" ? "Pause" : "Activate"}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteRule(r)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDiscounts;
