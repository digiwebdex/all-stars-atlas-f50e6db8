import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Plus, Eye, PenLine, MoreHorizontal, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { EMAIL_TEMPLATES } from "@/lib/content-data";
import { getCollection, addToCollection, updateInCollection, removeFromCollection } from "@/lib/local-store";
import { toast } from "sonner";

const STORE_KEY = "cms_email_templates";
const emptyTemplate = { name: "", subject: "", trigger: "", active: true, lastEdited: "", body: "" };

const CMSEmailTemplates = () => {
  const [templates, setTemplates] = useState(() => getCollection(STORE_KEY, EMAIL_TEMPLATES.map(t => ({ ...t, id: String(t.id), body: "" }))));
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingTpl, setEditingTpl] = useState<any>(null);
  const [form, setForm] = useState(emptyTemplate);
  const [previewTpl, setPreviewTpl] = useState<any>(null);

  const defaults = EMAIL_TEMPLATES.map(t => ({ ...t, id: String(t.id), body: "" }));
  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.trigger.toLowerCase().includes(search.toLowerCase()));

  const toggleActive = (id: string) => {
    const tpl = templates.find(t => String(t.id) === id);
    if (!tpl) return;
    const updated = updateInCollection(STORE_KEY, defaults, id, { active: !tpl.active });
    setTemplates([...updated]);
  };

  const openNew = () => { setEditingTpl(null); setForm(emptyTemplate); setShowDialog(true); };
  const openEdit = (t: any) => {
    setEditingTpl(t);
    setForm({ name: t.name, subject: t.subject, trigger: t.trigger, active: t.active, lastEdited: t.lastEdited, body: t.body || "" });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name || !form.subject) { toast.error("Name and Subject are required"); return; }
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (editingTpl) {
      const updated = updateInCollection(STORE_KEY, defaults, editingTpl.id, { ...form, lastEdited: now });
      setTemplates([...updated]);
      toast.success(`"${form.name}" updated`);
    } else {
      const newTpl = { ...form, id: `tpl-${Date.now()}`, lastEdited: now };
      const updated = addToCollection(STORE_KEY, defaults, newTpl);
      setTemplates([...updated]);
      toast.success(`"${form.name}" created`);
    }
    setShowDialog(false);
  };

  const handleDelete = (t: any) => {
    const updated = removeFromCollection(STORE_KEY, defaults, String(t.id));
    setTemplates([...updated]);
    toast.success(`"${t.name}" deleted`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Email Templates</h1><p className="text-sm text-muted-foreground mt-1">{templates.length} templates • {templates.filter(t => t.active).length} active</p></div>
        <Button className="font-bold" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Template</Button>
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search templates..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="space-y-3">
        {filtered.map((t) => (
          <Card key={t.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0"><Mail className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{t.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[9px]">{t.trigger}</Badge>
                  <span className="text-[10px] text-muted-foreground">Edited {t.lastEdited}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={t.active} onCheckedChange={() => toggleActive(String(t.id))} />
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setPreviewTpl(t)}><Eye className="w-4 h-4 mr-2" /> Preview</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(t)}><PenLine className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) setEditingTpl(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTpl ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5"><Label>Template Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Subject Line *</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Trigger Event</Label><Input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} placeholder="e.g. On Booking Confirmation" /></div>
            <div className="space-y-1.5"><Label>Email Body (HTML)</Label><Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={6} className="font-mono text-xs" placeholder="<html>...</html>" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSave}>{editingTpl ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTpl} onOpenChange={() => setPreviewTpl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Preview: {previewTpl?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm"><span className="text-muted-foreground">Subject:</span> <strong>{previewTpl?.subject}</strong></div>
            <div className="text-sm"><span className="text-muted-foreground">Trigger:</span> {previewTpl?.trigger}</div>
            <div className="border rounded-lg p-4 bg-muted/30 min-h-[120px]">
              {previewTpl?.body ? (
                <div className="text-xs font-mono whitespace-pre-wrap">{previewTpl.body}</div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No body content yet. Edit the template to add HTML content.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMSEmailTemplates;
