import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, PenLine, MoreHorizontal, Trash2, Star, Building2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

const emptyDest = { name: "", country: "", type: "domestic" as const, hotels: 0, img: "", featured: false, description: "" };

const CMSDestinations = () => {
  const { data: apiData } = useQuery({ queryKey: ['cms', 'destinations'], queryFn: () => api.get('/cms/destinations'), retry: 1 });
  const [destinations, setDestinations] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [filter, setFilter] = useState<"all" | "domestic" | "international">("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingDest, setEditingDest] = useState<any>(null);
  const [form, setForm] = useState(emptyDest);

  useEffect(() => {
    if (apiData && !initialized) {
      const raw = (apiData as any)?.data || (apiData as any)?.destinations || [];
      setDestinations(raw.map((d: any) => ({ ...d, id: String(d.id) })));
      setInitialized(true);
    }
  }, [apiData, initialized]);

  const filtered = filter === "all" ? destinations : destinations.filter(d => d.type === filter);

  const openNew = () => { setEditingDest(null); setForm(emptyDest); setShowDialog(true); };
  const openEdit = (d: any) => {
    setEditingDest(d);
    setForm({ name: d.name, country: d.country, type: d.type, hotels: d.hotels, img: d.img, featured: d.featured, description: d.description });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    try {
      if (editingDest) {
        await api.put(`/cms/destinations/${editingDest.id}`, form);
        setDestinations(prev => prev.map(d => d.id === editingDest.id ? { ...d, ...form } : d));
        toast.success(`"${form.name}" updated`);
      } else {
        const result = await api.post('/cms/destinations', form) as any;
        const newDest = { ...form, id: result?.id || `dest-${Date.now()}` };
        setDestinations(prev => [newDest, ...prev]);
        toast.success(`"${form.name}" added`);
      }
    } catch {
      toast.error("Failed to save destination");
    }
    setShowDialog(false);
  };

  const handleDelete = async (d: any) => {
    try { await api.delete(`/cms/destinations/${d.id}`); } catch {}
    setDestinations(prev => prev.filter(x => x.id !== d.id));
    toast.success(`"${d.name}" removed`);
  };

  const toggleFeatured = async (d: any) => {
    try { await api.put(`/cms/destinations/${d.id}`, { featured: !d.featured }); } catch {}
    setDestinations(prev => prev.map(x => x.id === d.id ? { ...x, featured: !x.featured } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Destinations</h1><p className="text-sm text-muted-foreground mt-1">{destinations.length} destinations • {destinations.filter(d => d.featured).length} featured</p></div>
        <Button className="font-bold" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Add Destination</Button>
      </div>
      <div className="flex gap-2">
        {(["all", "domestic", "international"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-semibold border capitalize transition-all ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/40"}`}>{f}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <Card key={d.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="relative h-36">
              <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                <div><h3 className="text-white font-bold text-sm">{d.name}</h3><p className="text-white/60 text-[11px]">{d.country}</p></div>
                <Badge className={d.type === "domestic" ? "bg-accent/80 text-accent-foreground text-[10px]" : "bg-primary/80 text-primary-foreground text-[10px]"}>{d.type}</Badge>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{d.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {d.hotels.toLocaleString()} hotels</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Featured: <Switch checked={d.featured} onCheckedChange={() => toggleFeatured(d)} className="scale-75" /></span>
                </div>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(d)}><PenLine className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(d)}><Trash2 className="w-4 h-4 mr-2" /> Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) setEditingDest(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingDest ? "Edit Destination" : "Add Destination"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="domestic">Domestic</SelectItem><SelectItem value="international">International</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Hotels Count</Label><Input type="number" value={form.hotels} onChange={e => setForm(f => ({ ...f, hotels: Number(e.target.value) }))} /></div>
              <div className="flex items-end gap-2 pb-0.5"><Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} /><Label className="text-xs">Featured</Label></div>
            </div>
            <div className="space-y-1.5"><Label>Image URL</Label><Input value={form.img} onChange={e => setForm(f => ({ ...f, img: e.target.value }))} placeholder="https://..." /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSave}>{editingDest ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMSDestinations;
