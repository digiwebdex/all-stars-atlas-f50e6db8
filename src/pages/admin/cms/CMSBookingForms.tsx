import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, GripVertical, FileText, Plane, Car, Stethoscope, Smartphone } from "lucide-react";
import { useCmsPageContent, useCmsSavePage } from "@/hooks/useCmsContent";
import { useToast } from "@/hooks/use-toast";
import type { CmsPageContent, BookingFormField } from "@/lib/cms-defaults";

const BOOKING_PAGES = [
  { slug: "/flights/book", label: "Flight Booking", icon: Plane },
  { slug: "/cars/book", label: "Car Booking", icon: Car },
  { slug: "/medical/book", label: "Medical Booking", icon: Stethoscope },
  { slug: "/esim/purchase", label: "eSIM Purchase", icon: Smartphone },
];

const FIELD_TYPES = ["text", "email", "tel", "date", "datetime-local", "number", "select", "textarea"] as const;

const CMSBookingForms = () => {
  const [activeSlug, setActiveSlug] = useState(BOOKING_PAGES[0].slug);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Booking Form Editor</h1>
      </div>

      <div className="flex gap-1 border-b border-border pb-px overflow-x-auto">
        {BOOKING_PAGES.map((p) => (
          <button key={p.slug} onClick={() => setActiveSlug(p.slug)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${activeSlug === p.slug ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <p.icon className="w-3.5 h-3.5" />
            {p.label}
          </button>
        ))}
      </div>

      <BookingFormEditor key={activeSlug} slug={activeSlug} />
    </div>
  );
};

const BookingFormEditor = ({ slug }: { slug: string }) => {
  const { data: page, isLoading } = useCmsPageContent(slug);
  const saveMutation = useCmsSavePage();
  const { toast } = useToast();
  const [editData, setEditData] = useState<CmsPageContent | null>(null);

  useEffect(() => {
    if (page && !editData) {
      setEditData(JSON.parse(JSON.stringify(page)));
    }
  }, [page]);

  if (isLoading || !editData?.bookingConfig) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  const config = editData.bookingConfig;

  const updateConfig = (fn: (c: typeof config) => void) => {
    setEditData(prev => {
      if (!prev?.bookingConfig) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      fn(next.bookingConfig);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(editData);
      toast({ title: "Saved", description: "Booking form updated successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* General settings */}
      <Card>
        <CardHeader><CardTitle className="text-base">General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Page Title</Label>
              <Input value={editData.pageTitle} onChange={e => setEditData(prev => prev ? { ...prev, pageTitle: e.target.value } : prev)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Submit Button Text</Label>
              <Input value={config.submitButtonText} onChange={e => updateConfig(c => { c.submitButtonText = e.target.value; })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Amount (৳)</Label>
              <Input type="number" value={config.totalAmount} onChange={e => updateConfig(c => { c.totalAmount = Number(e.target.value); })} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Summary Title</Label>
              <Input value={config.summaryTitle} onChange={e => updateConfig(c => { c.summaryTitle = e.target.value; })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Label</Label>
              <Input value={config.totalLabel} onChange={e => updateConfig(c => { c.totalLabel = e.target.value; })} />
            </div>
          </div>
          {config.paymentMethods && (
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Methods (comma-separated)</Label>
              <Input value={config.paymentMethods.join(", ")} onChange={e => updateConfig(c => { c.paymentMethods = e.target.value.split(",").map(s => s.trim()).filter(Boolean); })} />
            </div>
          )}
          {config.note !== undefined && (
            <div className="space-y-1.5">
              <Label className="text-xs">Note (shown in summary)</Label>
              <Input value={config.note || ""} onChange={e => updateConfig(c => { c.note = e.target.value; })} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Fields */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Summary Sidebar Fields</CardTitle>
            <Button size="sm" variant="outline" onClick={() => updateConfig(c => { c.summaryFields.push({ label: "New Field", value: "৳0" }); })}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {config.summaryFields.map((sf, si) => (
            <div key={si} className="flex items-center gap-2">
              <Input value={sf.label} className="flex-1" placeholder="Label" onChange={e => updateConfig(c => { c.summaryFields[si].label = e.target.value; })} />
              <Input value={sf.value} className="w-32" placeholder="Value" onChange={e => updateConfig(c => { c.summaryFields[si].value = e.target.value; })} />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => updateConfig(c => { c.summaryFields.splice(si, 1); })}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Form Steps & Fields */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Form Steps & Fields</h2>
        <Button size="sm" onClick={() => updateConfig(c => { c.steps.push({ label: "New Step", icon: "FileText", fields: [] }); })}>
          <Plus className="w-4 h-4 mr-1" /> Add Step
        </Button>
      </div>

      {config.steps.map((formStep, si) => (
        <Card key={si}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">Step {si + 1}</Badge>
                <Input value={formStep.label} className="w-48 h-8 text-sm font-semibold" onChange={e => updateConfig(c => { c.steps[si].label = e.target.value; })} />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateConfig(c => { c.steps.splice(si, 1); })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {formStep.fields.map((field, fi) => (
              <div key={fi} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 shrink-0" />
                <div className="flex-1 grid sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Label</Label>
                    <Input value={field.label} className="h-8 text-xs" onChange={e => updateConfig(c => { c.steps[si].fields[fi].label = e.target.value; })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Type</Label>
                    <Select value={field.type} onValueChange={v => updateConfig(c => { c.steps[si].fields[fi].type = v as BookingFormField["type"]; })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Placeholder</Label>
                    <Input value={field.placeholder || ""} className="h-8 text-xs" onChange={e => updateConfig(c => { c.steps[si].fields[fi].placeholder = e.target.value; })} />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <Switch checked={field.visible} onCheckedChange={v => updateConfig(c => { c.steps[si].fields[fi].visible = v; })} className="scale-75" />
                      <span className="text-[10px] text-muted-foreground">Visible</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch checked={field.required} onCheckedChange={v => updateConfig(c => { c.steps[si].fields[fi].required = v; })} className="scale-75" />
                      <span className="text-[10px] text-muted-foreground">Required</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => updateConfig(c => { c.steps[si].fields.splice(fi, 1); })}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}




            <Button variant="outline" size="sm" onClick={() => updateConfig(c => {
              c.steps[si].fields.push({
                id: `field_${Date.now()}`, label: "New Field", type: "text",
                placeholder: "", required: false, visible: true, halfWidth: true,
              });
            })}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Save */}
      <div className="flex justify-end sticky bottom-4">
        <Button size="lg" onClick={handleSave} disabled={saveMutation.isPending} className="shadow-lg">
          <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
};

export default CMSBookingForms;
