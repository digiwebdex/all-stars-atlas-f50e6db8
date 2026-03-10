import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, MoreHorizontal, Edit2, Trash2, Copy, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const emptyPromo = { title: "", code: "", discount: "", type: "percentage" as const, used: 0, usageLimit: 100, status: "active" as const, expires: "", description: "" };

const CMSPromotions = () => {
  const [search, setSearch] = useState("");
  const { data: apiData } = useQuery({ queryKey: ['cms', 'promotions'], queryFn: () => api.get('/cms/promotions'), retry: 1 });
  const [promotions, setPromotions] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [form, setForm] = useState(emptyPromo);
  const [viewPromo, setViewPromo] = useState<any>(null);

  useEffect(() => {
    if (apiData && !initialized) {
      const raw = (apiData as any)?.data || (apiData as any)?.promotions || [];
      setPromotions(raw.map((p: any) => ({ ...p, id: String(p.id) })));
      setInitialized(true);
    }
  }, [apiData, initialized]);

  const filtered = promotions.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()));
  const activeCount = promotions.filter(p => p.status === "active").length;
  const totalUsed = promotions.reduce((sum, p) => sum + (p.used || 0), 0);

  const openNew = () => { setEditingPromo(null); setForm(emptyPromo); setShowDialog(true); };
  const openEdit = (p: any) => {
    setEditingPromo(p);
    setForm({ title: p.title, code: p.code, discount: p.discount, type: p.type || "percentage", used: p.used || 0, usageLimit: p.usageLimit || 100, status: p.status, expires: p.expires || "", description: p.description || "" });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.code) { toast.error("Title and Code are required"); return; }
    try {
      if (editingPromo) {
        await api.put(`/cms/promotions/${editingPromo.id}`, form);
        setPromotions(prev => prev.map(p => p.id === editingPromo.id ? { ...p, ...form } : p));
        toast.success(`"${form.title}" updated`);
      } else {
        const result = await api.post('/cms/promotions', form) as any;
        const newPromo = { ...form, id: result?.id || `promo-${Date.now()}`, used: 0 };
        setPromotions(prev => [newPromo, ...prev]);
        toast.success(`"${form.title}" created`);
      }
    } catch {
      toast.error("Failed to save promotion");
    }
    setShowDialog(false);
    setEditingPromo(null);
    setForm(emptyPromo);
  };

  const handleDelete = async (p: any) => {
    try { await api.delete(`/cms/promotions/${p.id}`); } catch {}
    setPromotions(prev => prev.filter(x => x.id !== p.id));
    toast.success(`"${p.title}" deleted`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1.5" /> Create Promotion</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Active Promotions", value: activeCount }, { label: "Total Redemptions", value: totalUsed.toLocaleString() }, { label: "Promo Codes", value: promotions.length }, { label: "Avg. Usage", value: `${Math.round(totalUsed / (promotions.length || 1))}` }].map((s, i) => (
          <Card key={i}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold mt-1">{s.value}</p></CardContent></Card>
        ))}
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search promotions..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Promotion</TableHead><TableHead>Code</TableHead><TableHead className="hidden md:table-cell">Discount</TableHead><TableHead className="hidden lg:table-cell">Usage</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Expires</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No promotions found</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-sm">{p.title}</TableCell>
                <TableCell><div className="flex items-center gap-1"><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-bold">{p.code}</code><button className="text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(p.code); toast.success("Code copied!"); }}><Copy className="w-3 h-3" /></button></div></TableCell>
                <TableCell className="hidden md:table-cell text-sm">{p.discount} ({p.type})</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{p.used}/{p.usageLimit}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${p.status === "active" ? "bg-success/10 text-success" : p.status === "scheduled" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{p.status}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.expires}</TableCell>
                <TableCell>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewPromo(p)}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(p)}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(p)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) { setEditingPromo(null); setForm(emptyPromo); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingPromo ? "Edit Promotion" : "Create Promotion"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Promo Code *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Discount</Label><Input value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="e.g. 15%" /></div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="flat">Flat</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Usage Limit</Label><Input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label>Expiry Date</Label><Input value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))} placeholder="Mar 31, 2026" /></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSave}>{editingPromo ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewPromo} onOpenChange={() => setViewPromo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Promotion Details</DialogTitle></DialogHeader>
          {viewPromo && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-semibold">{viewPromo.title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Code</span><code className="font-bold bg-muted px-2 py-0.5 rounded">{viewPromo.code}</code></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>{viewPromo.discount} ({viewPromo.type})</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Usage</span><span>{viewPromo.used} / {viewPromo.usageLimit}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline" className="capitalize">{viewPromo.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span>{viewPromo.expires || "N/A"}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMSPromotions;
