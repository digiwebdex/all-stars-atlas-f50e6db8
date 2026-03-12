/**
 * Admin Markup & Revenue Settings — UIUX spec pages 32-33
 * Manage markup percentages per service type + per-airline overrides
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, Plane, Building2, Car, Globe, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import AirlineMarkupConfig, { type AirlineMarkupEntry } from "@/components/admin/AirlineMarkupConfig";

interface MarkupConfig {
  baseFareMarkup: number;
  baseFareDiscount: number;
  baseFareFixed: number;
  taxMarkup: number;
  taxFixed: number;
  ssrMarkup: number;
  ssrFixed: number;
  minMarkupEnabled: boolean;
  minMarkup: number;
  maxMarkupEnabled: boolean;
  maxMarkup: number;
  ticketIssueCharge: number;
  penaltyMarkup: number;
  fareSummaryDiscount: number;
  fareSummaryAitVat: number;
}

const defaultMarkup: MarkupConfig = {
  baseFareMarkup: 0, baseFareDiscount: 0, baseFareFixed: 0,
  taxMarkup: 0, taxFixed: 0, ssrMarkup: 0, ssrFixed: 0,
  minMarkupEnabled: false, minMarkup: 0,
  maxMarkupEnabled: false, maxMarkup: 0,
  ticketIssueCharge: 0, penaltyMarkup: 0,
  fareSummaryDiscount: 6.30, fareSummaryAitVat: 0.3,
};

const SEGMENTS = [
  { key: "FLIGHT", label: "Flight", icon: Plane },
  { key: "HOTEL", label: "Hotel", icon: Building2 },
  { key: "CAR", label: "Car", icon: Car },
  { key: "VISA", label: "Visa", icon: Globe },
  { key: "TOUR-PACKAGE", label: "Tour Package", icon: Package },
];

const AdminMarkup = () => {
  const { toast } = useToast();
  const [activeSegment, setActiveSegment] = useState("FLIGHT");
  const [markups, setMarkups] = useState<Record<string, MarkupConfig>>({});
  const [airlineMarkups, setAirlineMarkups] = useState<Record<string, AirlineMarkupEntry>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<any>("/admin/settings");
        const saved = data?.settings?.markup_config;
        if (saved && typeof saved === "object") {
          const merged: Record<string, MarkupConfig> = {};
          SEGMENTS.forEach(s => {
            merged[s.key] = { ...defaultMarkup, ...(saved[s.key] || {}) };
          });
          setMarkups(merged);
        } else {
          const init: Record<string, MarkupConfig> = {};
          SEGMENTS.forEach(s => { init[s.key] = { ...defaultMarkup }; });
          setMarkups(init);
        }
        // Load per-airline markups
        const savedAirlines = data?.settings?.airline_markup_config;
        if (savedAirlines && typeof savedAirlines === "object") {
          setAirlineMarkups(savedAirlines);
        }
      } catch {
        const init: Record<string, MarkupConfig> = {};
        SEGMENTS.forEach(s => { init[s.key] = { ...defaultMarkup }; });
        setMarkups(init);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const current = markups[activeSegment] || { ...defaultMarkup };

  const updateField = (field: keyof MarkupConfig, value: number | boolean) => {
    setMarkups(prev => ({
      ...prev,
      [activeSegment]: { ...(prev[activeSegment] || { ...defaultMarkup }), [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", {
        markup_config: markups,
        airline_markup_config: airlineMarkups,
      });
      toast({ title: "Saved", description: `Markup settings updated successfully.` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Markup & Revenue</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
          Save
        </Button>
      </div>

      {/* Segment selector */}
      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map(seg => {
          const Icon = seg.icon;
          return (
            <button
              key={seg.key}
              onClick={() => setActiveSegment(seg.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                activeSegment === seg.key
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card border-border hover:border-accent/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              {seg.label}
              <Badge variant="outline" className="text-[9px] ml-1">Markup Setup</Badge>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update {activeSegment} Markup & Revenue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* On Base Fare */}
          <div>
            <h4 className="text-sm font-bold mb-3">On Base Fare</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Markup %</Label>
                <Input type="number" step="0.01" value={current.baseFareMarkup} onChange={(e) => updateField("baseFareMarkup", parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discount %</Label>
                <Input type="number" step="0.01" value={current.baseFareDiscount} onChange={(e) => updateField("baseFareDiscount", parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Additional Markup (BDT Fixed)</Label>
                <Input type="number" step="0.01" value={current.baseFareFixed} onChange={(e) => updateField("baseFareFixed", parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
            </div>
          </div>

          <Separator />

          {/* On Tax */}
          <div>
            <h4 className="text-sm font-bold mb-3">On Tax</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Markup %</Label>
                <Input type="number" step="0.01" value={current.taxMarkup} onChange={(e) => updateField("taxMarkup", parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Additional Markup (BDT Fixed)</Label>
                <Input type="number" step="0.01" value={current.taxFixed} onChange={(e) => updateField("taxFixed", parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
            </div>
          </div>

          <Separator />

          {/* On SSR */}
          <div>
            <h4 className="text-sm font-bold mb-3">On SSR (Ancillaries)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Markup %</Label>
                <Input type="number" step="0.01" value={current.ssrMarkup} onChange={(e) => updateField("ssrMarkup", parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Additional Markup (BDT Fixed)</Label>
                <Input type="number" step="0.01" value={current.ssrFixed} onChange={(e) => updateField("ssrFixed", parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Minimum / Maximum Markup */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">Minimum Markup</h4>
                <Switch checked={current.minMarkupEnabled} onCheckedChange={(v) => updateField("minMarkupEnabled", v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Minimum Markup (BDT Fixed)</Label>
                <Input type="number" step="0.01" value={current.minMarkup} onChange={(e) => updateField("minMarkup", parseFloat(e.target.value) || 0)} className="h-9" disabled={!current.minMarkupEnabled} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">Maximum Markup</h4>
                <Switch checked={current.maxMarkupEnabled} onCheckedChange={(v) => updateField("maxMarkupEnabled", v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Maximum Markup (BDT Fixed)</Label>
                <Input type="number" step="0.01" value={current.maxMarkup} onChange={(e) => updateField("maxMarkup", parseFloat(e.target.value) || 0)} className="h-9" disabled={!current.maxMarkupEnabled} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Fare Summary Display Settings */}
          <div>
            <h4 className="text-sm font-bold mb-3">Fare Summary Display (Global Defaults)</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Discount on Base Fare (%)</Label>
                <Input type="number" step="0.01" value={current.fareSummaryDiscount ?? 6.30} onChange={(e) => updateField("fareSummaryDiscount", parseFloat(e.target.value) || 0)} className="h-9" />
                <p className="text-[10px] text-muted-foreground">Default discount for all airlines unless overridden below</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">AIT VAT on Base Fare after Discount (%)</Label>
                <Input type="number" step="0.01" value={current.fareSummaryAitVat ?? 0.3} onChange={(e) => updateField("fareSummaryAitVat", parseFloat(e.target.value) || 0)} className="h-9" />
                <p className="text-[10px] text-muted-foreground">Universal AIT VAT — applies to all airlines</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Ticket Issue Charge + Penalty */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Ticket Issue Charge (BDT Fixed)</Label>
              <Input type="number" step="0.01" value={current.ticketIssueCharge} onChange={(e) => updateField("ticketIssueCharge", parseFloat(e.target.value) || 0)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Penalty Markup %</Label>
              <Input type="number" step="0.01" value={current.penaltyMarkup} onChange={(e) => updateField("penaltyMarkup", parseFloat(e.target.value) || 0)} className="h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-airline markup — only for FLIGHT segment */}
      {activeSegment === "FLIGHT" && (
        <AirlineMarkupConfig
          airlineMarkups={airlineMarkups}
          globalDiscount={current.fareSummaryDiscount ?? 6.30}
          globalAitVat={current.fareSummaryAitVat ?? 0.3}
          onChange={setAirlineMarkups}
        />
      )}
    </div>
  );
};

export default AdminMarkup;
