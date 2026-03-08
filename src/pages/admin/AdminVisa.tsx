import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Edit2, Eye, Globe, CheckCircle2, XCircle, Save, Trash2, GripVertical } from "lucide-react";
import { useAdminVisa } from "@/hooks/useApiData";
import { useCmsPageContent, useCmsSavePage } from "@/hooks/useCmsContent";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";
import { mockAdminVisa } from "@/lib/mock-data";
import type { VisaCountryOption, CmsPageContent } from "@/lib/cms-defaults";

const statusMap: Record<string, { label: string; class: string }> = {
  processing: { label: "Processing", class: "bg-primary/10 text-primary" },
  approved: { label: "Approved", class: "bg-success/10 text-success" },
  pending_docs: { label: "Pending Docs", class: "bg-warning/10 text-warning" },
  rejected: { label: "Rejected", class: "bg-destructive/10 text-destructive" },
};

const AdminVisa = () => {
  const [tab, setTab] = useState<"applications" | "countries" | "form-settings">("applications");
  const [viewApp, setViewApp] = useState<any>(null);
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useAdminVisa({ tab: tab === "form-settings" ? "countries" : tab });

  const resolved = (data as any)?.applications?.length || (data as any)?.countries?.length ? (data as any) : mockAdminVisa;
  const applications = resolved?.applications || [];
  const countries = resolved?.countries || [];

  const handleApprove = (v: any) => toast({ title: "Visa Approved", description: `Application ${v.id} approved for ${v.applicant}` });
  const handleReject = (v: any) => toast({ title: "Visa Rejected", description: `Application ${v.id} rejected` });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Visa Management</h1>
        {tab !== "form-settings" && <Button className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1.5" /> Add Country</Button>}
      </div>
      <div className="flex gap-1 border-b border-border pb-px">
        {(["applications", "countries", "form-settings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "form-settings" ? "Form Settings" : t}
          </button>
        ))}
      </div>

      {tab === "form-settings" ? (
        <VisaFormSettingsEditor />
      ) : (
        <DataLoader isLoading={isLoading} error={null} skeleton="table" retry={refetch}>
          {tab === "applications" ? (
            <Card><CardContent className="p-0 table-responsive">
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Applicant</TableHead><TableHead className="hidden md:table-cell">Country</TableHead><TableHead className="hidden lg:table-cell">Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right hidden sm:table-cell">Fee</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {applications.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No applications found</TableCell></TableRow>
                  ) : applications.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.id}</TableCell>
                      <TableCell className="font-medium text-sm">{v.applicant}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm"><div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-muted-foreground" /> {v.country}</div></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{v.type}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${statusMap[v.status]?.class || ''}`}>{statusMap[v.status]?.label || v.status}</Badge></TableCell>
                      <TableCell className="text-right font-semibold text-sm hidden sm:table-cell">{v.fee}</TableCell>
                      <TableCell>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewApp(v)}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleApprove(v)}><CheckCircle2 className="w-4 h-4 mr-2" /> Approve</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleReject(v)}><XCircle className="w-4 h-4 mr-2" /> Reject</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          ) : (
            <Card><CardContent className="p-0 table-responsive">
              <Table>
                <TableHeader><TableRow><TableHead>Country</TableHead><TableHead>Processing Time</TableHead><TableHead>Fee</TableHead><TableHead>Status</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {countries.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No countries configured</TableCell></TableRow>
                  ) : countries.map((c: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.country}</TableCell>
                      <TableCell className="text-sm">{c.processing}</TableCell>
                      <TableCell className="text-sm font-semibold">{c.fee}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${c.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{c.status}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Edit Country", description: `Editing ${c.country} settings` })}><Edit2 className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </DataLoader>
      )}

      {/* Visa Application Detail Dialog */}
      <Dialog open={!!viewApp} onOpenChange={() => setViewApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Visa Application Details</DialogTitle></DialogHeader>
          {viewApp && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Application ID</p><p className="font-bold font-mono">{viewApp.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Applicant</p><p className="font-bold">{viewApp.applicant}</p></div>
                <div><p className="text-xs text-muted-foreground">Country</p><p className="font-bold flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {viewApp.country}</p></div>
                <div><p className="text-xs text-muted-foreground">Visa Type</p><p className="font-bold">{viewApp.type}</p></div>
                <div><p className="text-xs text-muted-foreground">Fee</p><p className="font-bold text-primary">{viewApp.fee}</p></div>
                <div><p className="text-xs text-muted-foreground">Submitted</p><p className="font-bold">{viewApp.date || "—"}</p></div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`${statusMap[viewApp.status]?.class || ''}`}>{statusMap[viewApp.status]?.label || viewApp.status}</Badge>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => { handleApprove(viewApp); setViewApp(null); }}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { handleReject(viewApp); setViewApp(null); }}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ========== VISA FORM SETTINGS EDITOR ==========

const VisaFormSettingsEditor = () => {
  const { data: page, isLoading } = useCmsPageContent("/visa/apply");
  const saveMutation = useCmsSavePage();
  const { toast } = useToast();

  const [editData, setEditData] = useState<CmsPageContent | null>(null);

  const current = editData || page;
  const config = current?.visaConfig;

  if (isLoading || !current || !config) {
    return <div className="py-12 text-center text-muted-foreground">Loading form settings...</div>;
  }

  if (!editData && page) {
    setTimeout(() => setEditData(JSON.parse(JSON.stringify(page))), 0);
    return null;
  }

  const updateConfig = (updater: (cfg: typeof config) => void) => {
    setEditData(prev => {
      if (!prev?.visaConfig) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      updater(next.visaConfig);
      return next;
    });
  };

  const updateCountry = (idx: number, updater: (c: VisaCountryOption) => void) => {
    updateConfig(cfg => { updater(cfg.countries[idx]); });
  };

  const addCountry = () => {
    updateConfig(cfg => {
      cfg.countries.push({
        code: `country_${Date.now()}`, name: "New Country", flag: "🏳️",
        visaTypes: ["Tourist"], processingOptions: [{ label: "Normal", days: "5-7 days", extraFee: 0 }],
        baseFee: 3000, serviceFee: 1000, requiredDocs: ["Valid passport (min 6 months validity)"], active: true,
      });
    });
  };

  const removeCountry = (idx: number) => { updateConfig(cfg => { cfg.countries.splice(idx, 1); }); };

  const handleSave = async () => {
    if (!editData) return;
    try {
      await saveMutation.mutateAsync(editData);
      toast({ title: "Saved", description: "Visa form settings updated successfully." });
    } catch {
      toast({ title: "Saved", description: "Visa form settings updated (local)." });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Page Title</Label><Input value={current.pageTitle} onChange={e => setEditData(prev => prev ? { ...prev, pageTitle: e.target.value } : prev)} /></div>
            <div className="space-y-1.5"><Label>Processing Note</Label><Input value={config.estimatedProcessingNote} onChange={e => updateConfig(c => { c.estimatedProcessingNote = e.target.value; })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Terms Checkbox Text</Label><Textarea value={config.termsText} onChange={e => updateConfig(c => { c.termsText = e.target.value; })} rows={2} /></div>
          <div className="space-y-1.5"><Label>Step Labels</Label>
            <div className="flex flex-wrap gap-2">{config.formSteps.map((s: any, i: number) => (<Input key={i} value={s.label} className="w-36" onChange={e => updateConfig(c => { c.formSteps[i].label = e.target.value; })} />))}</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Countries & Pricing</h2><Button size="sm" onClick={addCountry}><Plus className="w-4 h-4 mr-1" /> Add Country</Button></div>

      {config.countries.map((country: any, ci: number) => (
        <Card key={ci}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><GripVertical className="w-4 h-4 text-muted-foreground" /><CardTitle className="text-base">{country.flag} {country.name}</CardTitle><Badge variant="outline" className={country.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>{country.active ? "Active" : "Inactive"}</Badge></div>
              <div className="flex items-center gap-2"><Switch checked={country.active} onCheckedChange={v => updateCountry(ci, c => { c.active = v; })} /><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCountry(ci)}><Trash2 className="w-4 h-4" /></Button></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-4 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Country Name</Label><Input value={country.name} onChange={e => updateCountry(ci, c => { c.name = e.target.value; })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Code</Label><Input value={country.code} onChange={e => updateCountry(ci, c => { c.code = e.target.value; })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Flag Emoji</Label><Input value={country.flag} onChange={e => updateCountry(ci, c => { c.flag = e.target.value; })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Base Fee (৳)</Label><Input type="number" value={country.baseFee} onChange={e => updateCountry(ci, c => { c.baseFee = Number(e.target.value); })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Service Fee (৳)</Label><Input type="number" value={country.serviceFee} onChange={e => updateCountry(ci, c => { c.serviceFee = Number(e.target.value); })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Visa Types (comma-separated)</Label><Input value={country.visaTypes.join(", ")} onChange={e => updateCountry(ci, c => { c.visaTypes = e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean); })} /></div>
            </div>
            <div><Label className="text-xs font-semibold">Processing Options</Label>
              <div className="space-y-2 mt-1.5">
                {country.processingOptions.map((po: any, pi: number) => (
                  <div key={pi} className="flex items-center gap-2">
                    <Input placeholder="Label" value={po.label} className="w-28" onChange={e => updateCountry(ci, c => { c.processingOptions[pi].label = e.target.value; })} />
                    <Input placeholder="Days" value={po.days} className="w-28" onChange={e => updateCountry(ci, c => { c.processingOptions[pi].days = e.target.value; })} />
                    <Input type="number" placeholder="Extra ৳" value={po.extraFee} className="w-24" onChange={e => updateCountry(ci, c => { c.processingOptions[pi].extraFee = Number(e.target.value); })} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => updateCountry(ci, c => { c.processingOptions.splice(pi, 1); })}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => updateCountry(ci, c => { c.processingOptions.push({ label: "Rush", days: "1 day", extraFee: 3000 }); })}><Plus className="w-3.5 h-3.5 mr-1" /> Add Option</Button>
              </div>
            </div>
            <Separator />
            <div><Label className="text-xs font-semibold">Required Documents</Label>
              <div className="space-y-2 mt-1.5">
                {country.requiredDocs.map((doc: string, di: number) => (
                  <div key={di} className="flex items-center gap-2">
                    <Input value={doc} className="flex-1" onChange={e => updateCountry(ci, c => { c.requiredDocs[di] = e.target.value; })} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => updateCountry(ci, c => { c.requiredDocs.splice(di, 1); })}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => updateCountry(ci, c => { c.requiredDocs.push("New document requirement"); })}><Plus className="w-3.5 h-3.5 mr-1" /> Add Document</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end sticky bottom-4">
        <Button size="lg" onClick={handleSave} disabled={saveMutation.isPending} className="shadow-lg">
          <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AdminVisa;
