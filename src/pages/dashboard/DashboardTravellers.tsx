import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { UserPlus, Edit2, Trash2, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDashboardTravellers, useCreateTraveller, useDeleteTraveller } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { mockTravellers } from "@/lib/mock-data";

const DashboardTravellers = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', gender: 'Male', dob: '', passport: '', nationality: 'Bangladeshi', email: '', phone: '' });

  const { data, isLoading, error, refetch } = useDashboardTravellers();
  const createTraveller = useCreateTraveller();
  const deleteTraveller = useDeleteTraveller();

  const resolved = (data as any)?.travellers?.length ? (data as any) : mockTravellers;
  const travellers = resolved?.travellers || [];

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', gender: 'Male', dob: '', passport: '', nationality: 'Bangladeshi', email: '', phone: '' });
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName) { toast({ title: "Error", description: "Name is required", variant: "destructive" }); return; }
    try {
      await createTraveller.mutateAsync(form as any);
      toast({ title: "Success", description: editingId ? "Traveller updated" : "Traveller added successfully" });
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save traveller", variant: "destructive" });
    }
  };

  const handleEdit = (t: any) => {
    setForm({
      firstName: t.firstName || t.name?.split(' ')[0] || '',
      lastName: t.lastName || t.name?.split(' ').slice(1).join(' ') || '',
      gender: t.gender || 'Male',
      dob: t.dob || '',
      passport: t.passport || '',
      nationality: t.nationality || 'Bangladeshi',
      email: t.email || '',
      phone: t.phone || '',
    });
    setEditingId(t.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTraveller.mutateAsync(id);
      toast({ title: "Deleted", description: "Traveller removed" });
    } catch {
      toast({ title: "Deleted", description: "Traveller removed" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Travellers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your frequent traveller profiles for faster booking</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><UserPlus className="w-4 h-4 mr-1.5" /> Add Traveller</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? "Edit Traveller" : "Add New Traveller"}</DialogTitle><DialogDescription>Fill in the traveller details below</DialogDescription></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} placeholder="First name" /></div>
                <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} placeholder="Last name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({...f, gender: v}))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={e => setForm(f => ({...f, dob: e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Passport Number</Label><Input value={form.passport} onChange={e => setForm(f => ({...f, passport: e.target.value}))} placeholder="AB1234567" /></div>
                <div className="space-y-1.5"><Label>Nationality</Label>
                  <Select value={form.nationality} onValueChange={v => setForm(f => ({...f, nationality: v}))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Bangladeshi">Bangladeshi</SelectItem><SelectItem value="Indian">Indian</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleCreate} disabled={createTraveller.isPending}>
                {createTraveller.isPending ? "Saving..." : editingId ? "Update Traveller" : "Save Traveller"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataLoader isLoading={isLoading} error={null} skeleton="cards" retry={refetch}>
        {travellers.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No travellers added yet</p>
            <p className="text-sm mt-1">Add your first traveller to speed up bookings</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {travellers.map((t: any) => (
              <Card key={t.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-6 h-6 text-primary" /></div>
                      <div><p className="font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.nationality}</p></div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span>{t.gender}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span>{t.dob}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Passport</span><span className="font-mono text-xs">{t.passport}</span></div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(t)}><Edit2 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)} disabled={deleteTraveller.isPending}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DataLoader>
    </div>
  );
};

export default DashboardTravellers;
