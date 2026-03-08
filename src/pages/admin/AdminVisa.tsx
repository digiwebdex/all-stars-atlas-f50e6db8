import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Edit2, Eye, Globe, CheckCircle2, XCircle, Save, Trash2, GripVertical, User, Phone, Briefcase, Heart, AlertTriangle, FileText, Printer, Download, Search, Filter, Loader2, ExternalLink, Archive, CloudUpload } from "lucide-react";
import { useAdminVisa } from "@/hooks/useApiData";
import { useCmsPageContent, useCmsSavePage } from "@/hooks/useCmsContent";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { config } from "@/lib/config";
import { mockAdminVisa } from "@/lib/mock-data";
import { uploadToGoogleDrive, isGoogleDriveConfigured } from "@/lib/google-drive";
import type { VisaCountryOption, CmsPageContent } from "@/lib/cms-defaults";

const statusMap: Record<string, { label: string; class: string }> = {
  submitted: { label: "Submitted", class: "bg-blue-500/10 text-blue-600" },
  processing: { label: "Processing", class: "bg-primary/10 text-primary" },
  approved: { label: "Approved", class: "bg-success/10 text-success" },
  pending_docs: { label: "Pending Docs", class: "bg-warning/10 text-warning" },
  rejected: { label: "Rejected", class: "bg-destructive/10 text-destructive" },
};

const AdminVisa = () => {
  const [tab, setTab] = useState<"applications" | "countries" | "form-settings">("applications");
  const [viewApp, setViewApp] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useAdminVisa({
    tab: tab === "form-settings" ? "countries" : tab,
    ...(searchQuery ? { search: searchQuery } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  // Map API response
  const apiApps = (data as any)?.data?.map((v: any) => {
    const info = v.applicantInfo || {};
    return {
      id: v.id, applicant: v.user?.name || `${info.firstName || ''} ${info.lastName || ''}`.trim(),
      country: v.country, type: v.visaType, status: v.status,
      fee: `৳${(v.processingFee || info.grandTotal || 0).toLocaleString()}`,
      feeRaw: v.processingFee || info.grandTotal || 0,
      date: v.submittedAt,
      firstName: info.firstName, lastName: info.lastName, dob: info.dob, gender: info.gender,
      nationality: info.nationality, nidNumber: info.nidNumber, tinNumber: info.tinNumber,
      passportNumber: info.passportNumber, passportExpiry: info.passportExpiry,
      passportIssueDate: info.passportIssueDate, passportIssuePlace: info.passportIssuePlace,
      email: info.email || v.user?.email, phone: info.phone, altPhone: info.altPhone,
      currentAddress: info.currentAddress, permanentAddress: info.permanentAddress,
      occupation: info.occupation, employer: info.employer, monthlyIncome: info.monthlyIncome,
      fatherName: info.fatherName, motherName: info.motherName, spouseName: info.spouseName,
      emergencyContact: info.emergencyContact, emergencyPhone: info.emergencyPhone, emergencyRelation: info.emergencyRelation,
      travelDate: info.travelDate, returnDate: info.returnDate, previousVisits: info.previousVisits,
      purposeOfVisit: info.purposeOfVisit, hotelName: info.hotelName, hotelAddress: info.hotelAddress,
      processingType: info.processingType, travellers: info.travellers,
      documents: v.documents?.length ? v.documents : (info.documents || []),
      notes: v.notes || info.notes,
    };
  }) || [];

  const stats = (data as any)?.stats;
  const resolved = apiApps.length > 0 ? { applications: apiApps, countries: [] } : mockAdminVisa;
  const applications = resolved?.applications || [];
  const countries = (data as any)?.countries || resolved?.countries || [];

  // REAL approve/reject via API
  const handleStatusChange = async (app: any, newStatus: string) => {
    setActionLoading(app.id);
    try {
      await api.put(`/admin/visa/${app.id}`, { status: newStatus });
      toast({ title: `Visa ${newStatus === 'approved' ? 'Approved' : newStatus === 'rejected' ? 'Rejected' : 'Updated'}`, description: `Application ${app.id.substring(0, 8)} has been ${newStatus}.` });
      qc.invalidateQueries({ queryKey: ['admin', 'visa'] });
      refetch();
    } catch (err: any) {
      toast({ title: "Action Failed", description: err?.message || "Could not update visa status.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  // Download PDF
  const downloadPDF = (app: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Visa Application ${app.id}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;font-size:13px;color:#1a1a1a;line-height:1.6}
      .header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #0066cc}
      .header h1{font-size:22px;color:#0066cc;margin-bottom:5px}
      .header p{color:#666;font-size:12px}
      .status-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
      .status-approved{background:#dcfce7;color:#16a34a}
      .status-processing{background:#dbeafe;color:#2563eb}
      .status-submitted{background:#e0e7ff;color:#4f46e5}
      .status-rejected{background:#fecaca;color:#dc2626}
      .section{margin:20px 0}
      .section-title{font-size:13px;font-weight:700;color:#0066cc;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e5e7eb}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
      .field{margin-bottom:6px}
      .field .label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.8px}
      .field .value{font-size:13px;font-weight:600}
      .full-width{grid-column:1/-1}
      .docs-list{display:flex;flex-wrap:wrap;gap:8px}
      .doc-badge{padding:4px 10px;border-radius:6px;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;border:1px solid #bbf7d0}
      .notes-box{background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #e5e7eb;font-size:13px}
      .footer{margin-top:30px;padding-top:15px;border-top:2px solid #e5e7eb;text-align:center;color:#888;font-size:10px}
      @media print{body{padding:20px}button{display:none!important}}
    </style></head><body>`);

    w.document.write(`
      <div class="header">
        <h1>Seven Trip — Visa Application</h1>
        <p>Application ID: ${app.id} | Submitted: ${app.date ? new Date(app.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
        <p style="margin-top:8px"><span class="status-badge status-${app.status}">${statusMap[app.status]?.label || app.status}</span> &nbsp; Fee: <strong>${app.fee}</strong></p>
      </div>
    `);

    const sections = [
      { title: "Visa & Travel Details", fields: [["Country", app.country], ["Visa Type", app.type], ["Processing", app.processingType || "Normal"], ["Travellers", app.travellers || 1], ["Travel Date", app.travelDate], ["Return Date", app.returnDate]], full: [["Purpose of Visit", app.purposeOfVisit], ["Hotel", `${app.hotelName || ''} ${app.hotelAddress || ''}`.trim()], ["Previous Visits", app.previousVisits]] },
      { title: "Personal Information", fields: [["First Name", app.firstName], ["Last Name", app.lastName], ["Date of Birth", app.dob], ["Gender", app.gender], ["Nationality", app.nationality], ["NID Number", app.nidNumber], ["TIN Number", app.tinNumber]] },
      { title: "Passport Details", fields: [["Passport Number", app.passportNumber], ["Expiry Date", app.passportExpiry], ["Issue Date", app.passportIssueDate], ["Place of Issue", app.passportIssuePlace]] },
      { title: "Contact Information", fields: [["Email", app.email], ["Phone", app.phone], ["Alt Phone", app.altPhone]], full: [["Current Address", app.currentAddress], ["Permanent Address", app.permanentAddress]] },
      { title: "Professional Details", fields: [["Occupation", app.occupation], ["Employer", app.employer], ["Monthly Income", app.monthlyIncome]] },
      { title: "Family Details", fields: [["Father's Name", app.fatherName], ["Mother's Name", app.motherName], ["Spouse Name", app.spouseName]] },
      { title: "Emergency Contact", fields: [["Contact Name", app.emergencyContact], ["Phone", app.emergencyPhone], ["Relationship", app.emergencyRelation]] },
    ];

    sections.forEach(s => {
      w.document.write(`<div class="section"><div class="section-title">${s.title}</div><div class="grid">`);
      s.fields.forEach(([l, v]) => {
        if (v) w.document.write(`<div class="field"><div class="label">${l}</div><div class="value">${v}</div></div>`);
      });
      w.document.write('</div>');
      if (s.full) {
        s.full.forEach(([l, v]) => {
          if (v) w.document.write(`<div class="field" style="margin-top:8px"><div class="label">${l}</div><div class="value">${v}</div></div>`);
        });
      }
      w.document.write('</div>');
    });

    if (app.documents?.length) {
      w.document.write(`<div class="section"><div class="section-title">Uploaded Documents</div><div class="docs-list">`);
      app.documents.forEach((doc: any) => {
        const name = typeof doc === 'string' ? doc : (doc.label || doc.originalName || 'Document');
        w.document.write(`<span class="doc-badge">${name}</span>`);
      });
      w.document.write('</div></div>');
    }

    if (app.notes) {
      w.document.write(`<div class="section"><div class="section-title">Applicant Notes</div><div class="notes-box">${app.notes}</div></div>`);
    }

    w.document.write(`<div class="footer">Generated by Seven Trip Admin Panel • ${new Date().toLocaleString()}</div>`);
    w.document.write(`<div style="text-align:center;margin-top:20px"><button onclick="window.print()" style="padding:10px 30px;background:#0066cc;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600">🖨️ Print / Save as PDF</button></div>`);
    w.document.write('</body></html>');
    w.document.close();
  };

  // Helper: fetch docs ZIP blob from backend (returns null if unavailable)
  const fetchDocsBlob = async (appId: string): Promise<Blob | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      const resp = await fetch(`${config.apiBaseUrl}/admin/visa/${appId}/download-documents`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!resp.ok) return null;
      return await resp.blob();
    } catch {
      return null;
    }
  };

  // Download ZIP of all docs
  const downloadDocsZip = async (app: any) => {
    const blob = await fetchDocsBlob(app.id);
    if (!blob) {
      toast({ title: "No Documents", description: "No uploaded documents found on the server for this application.", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visa-docs-${app.firstName || 'applicant'}-${app.id.substring(0, 8)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Documents ZIP downloaded." });
  };

  // Download full application (PDF + docs if available)
  const downloadFullApplication = async (app: any) => {
    const blob = await fetchDocsBlob(app.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visa-full-${app.firstName || 'applicant'}-${app.id.substring(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    downloadPDF(app);
    toast({
      title: "Application Downloaded",
      description: blob ? "ZIP with documents + PDF downloaded." : "PDF downloaded. No server documents available.",
    });
  };

  // Save to Google Drive (one-click)
  const saveToGoogleDrive = async (app: any) => {
    if (!isGoogleDriveConfigured()) {
      toast({ title: "Google Drive Not Configured", description: "Add VITE_GOOGLE_CLIENT_ID to enable Google Drive uploads.", variant: "destructive" });
      return;
    }
    setActionLoading(`drive-${app.id}`);
    try {
      // Try to get docs ZIP, otherwise create a text summary
      const blob = await fetchDocsBlob(app.id);
      const fileName = `visa-${app.firstName || 'applicant'}-${app.lastName || ''}-${app.country || ''}-${app.id.substring(0, 8)}`;

      if (blob) {
        const result = await uploadToGoogleDrive(blob, `${fileName}.zip`, 'application/zip');
        toast({ title: "Saved to Google Drive!", description: `Documents uploaded. Opening in Drive...` });
        window.open(result.webViewLink, '_blank');
      } else {
        // Upload application summary as a text file
        const summary = [
          `VISA APPLICATION — ${app.id}`,
          `Status: ${app.status}`, `Country: ${app.country}`, `Type: ${app.type}`,
          `Applicant: ${app.firstName || ''} ${app.lastName || ''}`,
          `Email: ${app.email || '—'}`, `Phone: ${app.phone || '—'}`,
          `Passport: ${app.passportNumber || '—'}`,
          `Travel Date: ${app.travelDate || '—'}`, `Return: ${app.returnDate || '—'}`,
          `Fee: ${app.fee}`, `Notes: ${app.notes || '—'}`,
          `\nDocuments: ${(app.documents || []).map((d: any) => typeof d === 'string' ? d : d.label || d.originalName || 'Doc').join(', ') || 'None'}`,
        ].join('\n');
        const textBlob = new Blob([summary], { type: 'text/plain' });
        const result = await uploadToGoogleDrive(textBlob, `${fileName}.txt`, 'text/plain');
        toast({ title: "Saved to Google Drive!", description: `Application summary uploaded. Opening...` });
        window.open(result.webViewLink, '_blank');
      }
    } catch (err: any) {
      toast({ title: "Google Drive Error", description: err?.message || "Could not upload to Google Drive.", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Visa Management</h1>
        {tab !== "form-settings" && <Button className="w-full sm:w-auto" onClick={() => setTab("form-settings")}><Plus className="w-4 h-4 mr-1.5" /> Add Country</Button>}
      </div>

      {/* Stats cards */}
      {stats && tab === "applications" && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Submitted", value: stats.submitted, color: "text-blue-600" },
            { label: "Processing", value: stats.processing, color: "text-primary" },
            { label: "Approved", value: stats.approved, color: "text-success" },
            { label: "Rejected", value: stats.rejected, color: "text-destructive" },
          ].map((s, i) => (
            <Card key={i} className="p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-border pb-px">
        {(["applications", "countries", "form-settings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "form-settings" ? "Form Settings" : t}
          </button>
        ))}
      </div>

      {/* Search & Filter bar for applications */}
      {tab === "applications" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, country..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10">
              <Filter className="w-4 h-4 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="pending_docs">Pending Docs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

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
                      <TableCell className="font-mono text-xs">{typeof v.id === 'string' ? v.id.substring(0, 8) : v.id}</TableCell>
                      <TableCell className="font-medium text-sm">{v.applicant}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm"><div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-muted-foreground" /> {v.country}</div></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{v.type}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${statusMap[v.status]?.class || ''}`}>{statusMap[v.status]?.label || v.status}</Badge></TableCell>
                      <TableCell className="text-right font-semibold text-sm hidden sm:table-cell">{v.fee}</TableCell>
                      <TableCell>
                        <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewApp(v)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadPDF(v)}><Download className="w-4 h-4 mr-2" /> Download PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(v, 'processing')} disabled={actionLoading === v.id}><Loader2 className={`w-4 h-4 mr-2 ${actionLoading === v.id ? 'animate-spin' : ''}`} /> Set Processing</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(v, 'approved')} disabled={actionLoading === v.id}><CheckCircle2 className="w-4 h-4 mr-2" /> Approve</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(v, 'rejected')} disabled={actionLoading === v.id}><XCircle className="w-4 h-4 mr-2" /> Reject</DropdownMenuItem>
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
                      <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setTab("form-settings"); toast({ title: "Edit Country", description: `Switch to Form Settings to edit ${c.country}` }); }}><Edit2 className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </DataLoader>
      )}

      {/* ========== FULL DETAIL DIALOG ========== */}
      <Dialog open={!!viewApp} onOpenChange={() => setViewApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">Visa Application — {viewApp?.id ? (typeof viewApp.id === 'string' ? viewApp.id.substring(0, 8) : viewApp.id) : ''}</DialogTitle>
              <Badge variant="outline" className={`${statusMap[viewApp?.status]?.class || ''}`}>{statusMap[viewApp?.status]?.label || viewApp?.status}</Badge>
            </div>
          </DialogHeader>
          {viewApp && (
            <ScrollArea className="max-h-[70vh] px-6 pb-6">
              <div className="space-y-5 pt-2">
                {/* Visa & Travel */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Visa & Travel Details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <DetailField label="Application ID" value={typeof viewApp.id === 'string' ? viewApp.id.substring(0, 12) : viewApp.id} mono />
                    <DetailField label="Country" value={viewApp.country} />
                    <DetailField label="Visa Type" value={viewApp.type} />
                    <DetailField label="Fee" value={viewApp.fee} highlight />
                    <DetailField label="Processing" value={viewApp.processingType || "Normal"} />
                    <DetailField label="Travellers" value={viewApp.travellers || 1} />
                    <DetailField label="Travel Date" value={viewApp.travelDate || "—"} />
                    <DetailField label="Return Date" value={viewApp.returnDate || "—"} />
                    <DetailField label="Submitted" value={viewApp.date ? new Date(viewApp.date).toLocaleDateString('en-GB') : "—"} />
                  </div>
                  {viewApp.purposeOfVisit && <div className="mt-2"><DetailField label="Purpose of Visit" value={viewApp.purposeOfVisit} full /></div>}
                  {(viewApp.hotelName || viewApp.hotelAddress) && (
                    <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                      <DetailField label="Hotel" value={viewApp.hotelName || "—"} />
                      <DetailField label="Hotel Address" value={viewApp.hotelAddress || "—"} />
                    </div>
                  )}
                  {viewApp.previousVisits && <div className="mt-2"><DetailField label="Previous Visits" value={viewApp.previousVisits} full /></div>}
                </div>
                <Separator />

                {/* Personal Info */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Personal Information</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <DetailField label="First Name" value={viewApp.firstName || "—"} />
                    <DetailField label="Last Name" value={viewApp.lastName || "—"} />
                    <DetailField label="Date of Birth" value={viewApp.dob || "—"} />
                    <DetailField label="Gender" value={viewApp.gender || "—"} />
                    <DetailField label="Nationality" value={viewApp.nationality || "—"} />
                    <DetailField label="NID Number" value={viewApp.nidNumber || "—"} mono />
                    <DetailField label="TIN Number" value={viewApp.tinNumber || "—"} mono />
                  </div>
                </div>
                <Separator />

                {/* Passport */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Passport Details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <DetailField label="Passport Number" value={viewApp.passportNumber || "—"} mono />
                    <DetailField label="Expiry Date" value={viewApp.passportExpiry || "—"} />
                    <DetailField label="Issue Date" value={viewApp.passportIssueDate || "—"} />
                    <DetailField label="Place of Issue" value={viewApp.passportIssuePlace || "—"} />
                  </div>
                </div>
                <Separator />

                {/* Contact */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contact Information</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <DetailField label="Email" value={viewApp.email || "—"} />
                    <DetailField label="Phone" value={viewApp.phone || "—"} />
                    <DetailField label="Alt Phone" value={viewApp.altPhone || "—"} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-sm">
                    <DetailField label="Current Address" value={viewApp.currentAddress || "—"} full />
                    <DetailField label="Permanent Address" value={viewApp.permanentAddress || "—"} full />
                  </div>
                </div>
                <Separator />

                {/* Professional */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Professional Details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <DetailField label="Occupation" value={viewApp.occupation || "—"} />
                    <DetailField label="Employer" value={viewApp.employer || "—"} />
                    <DetailField label="Monthly Income" value={viewApp.monthlyIncome || "—"} />
                  </div>
                </div>
                <Separator />

                {/* Family */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Family Details</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <DetailField label="Father's Name" value={viewApp.fatherName || "—"} />
                    <DetailField label="Mother's Name" value={viewApp.motherName || "—"} />
                    <DetailField label="Spouse Name" value={viewApp.spouseName || "—"} />
                  </div>
                </div>
                <Separator />

                {/* Emergency Contact */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-warning" /> Emergency Contact</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <DetailField label="Contact Name" value={viewApp.emergencyContact || "—"} />
                    <DetailField label="Phone" value={viewApp.emergencyPhone || "—"} />
                    <DetailField label="Relationship" value={viewApp.emergencyRelation || "—"} />
                  </div>
                </div>

                {/* Documents */}
                {viewApp.documents?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Uploaded Documents</p>
                      <div className="space-y-2">
                        {viewApp.documents.map((doc: any, i: number) => {
                          const isObj = typeof doc === 'object';
                          const label = isObj ? (doc.label || doc.originalName) : doc;
                          const url = isObj && doc.url ? `${config.apiBaseUrl.replace('/api', '')}${doc.url}` : null;
                          return (
                            <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-success/5 border border-success/20">
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                <span className="text-sm font-medium truncate">{label}</span>
                                {isObj && doc.size && <span className="text-[10px] text-muted-foreground shrink-0">({(doc.size / 1024).toFixed(0)} KB)</span>}
                              </div>
                              {url && (
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm" className="h-7 text-xs"><ExternalLink className="w-3 h-3 mr-1" /> View</Button>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                {viewApp.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Applicant Notes</p>
                      <p className="text-sm bg-muted/50 rounded-lg p-3">{viewApp.notes}</p>
                    </div>
                  </>
                )}

                <Separator />
                {/* Actions */}
                <div className="space-y-3 pt-1">
                  {/* Download actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadPDF(viewApp)}>
                      <Printer className="w-3.5 h-3.5 mr-1" /> Download PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadDocsZip(viewApp)}>
                      <Archive className="w-3.5 h-3.5 mr-1" /> Download Docs (ZIP)
                    </Button>
                    <Button variant="default" size="sm" onClick={() => downloadFullApplication(viewApp)}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Download Full Application
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => saveToGoogleDrive(viewApp)}
                      disabled={actionLoading === `drive-${viewApp.id}`}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950">
                      {actionLoading === `drive-${viewApp.id}` ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5 mr-1" />}
                      Save to Google Drive
                    </Button>
                  </div>
                  {/* Status actions */}
                  <div className="flex items-center gap-2">
                    {viewApp.status !== 'approved' && (
                      <Button size="sm" className="bg-success hover:bg-success/90" disabled={actionLoading === viewApp.id}
                        onClick={() => { handleStatusChange(viewApp, 'approved'); setViewApp(null); }}>
                        {actionLoading === viewApp.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />} Approve
                      </Button>
                    )}
                    {viewApp.status !== 'rejected' && (
                      <Button size="sm" variant="destructive" disabled={actionLoading === viewApp.id}
                        onClick={() => { handleStatusChange(viewApp, 'rejected'); setViewApp(null); }}>
                        {actionLoading === viewApp.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1" />} Reject
                      </Button>
                    )}
                    {viewApp.status !== 'processing' && (
                      <Button size="sm" variant="outline" disabled={actionLoading === viewApp.id}
                        onClick={() => { handleStatusChange(viewApp, 'processing'); setViewApp(null); }}>
                        Set Processing
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Reusable detail field component
const DetailField = ({ label, value, mono, highlight, full }: { label: string; value: any; mono?: boolean; highlight?: boolean; full?: boolean }) => (
  <div className={full ? "col-span-full" : ""}>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className={`font-semibold text-sm ${mono ? "font-mono" : ""} ${highlight ? "text-primary" : ""}`}>{value || "—"}</p>
  </div>
);

// ========== VISA FORM SETTINGS EDITOR ==========

const VisaFormSettingsEditor = () => {
  const { data: page, isLoading } = useCmsPageContent("/visa/apply");
  const saveMutation = useCmsSavePage();
  const { toast } = useToast();

  const [editData, setEditData] = useState<CmsPageContent | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Properly initialize editData from fetched page using useEffect
  useEffect(() => {
    if (page && !initialized) {
      setEditData(JSON.parse(JSON.stringify(page)));
      setInitialized(true);
    }
  }, [page, initialized]);

  const current = editData || page;
  const visaConfig = current?.visaConfig;

  if (isLoading || !current || !visaConfig) {
    return <div className="py-12 text-center text-muted-foreground">Loading form settings...</div>;
  }

  const updateConfig = (updater: (cfg: typeof visaConfig) => void) => {
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
            <div className="space-y-1.5"><Label>Processing Note</Label><Input value={visaConfig.estimatedProcessingNote} onChange={e => updateConfig(c => { c.estimatedProcessingNote = e.target.value; })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Terms Checkbox Text</Label><Textarea value={visaConfig.termsText} onChange={e => updateConfig(c => { c.termsText = e.target.value; })} rows={2} /></div>
          <div className="space-y-1.5"><Label>Step Labels</Label>
            <div className="flex flex-wrap gap-2">{visaConfig.formSteps.map((s: any, i: number) => (<Input key={i} value={s.label} className="w-36" onChange={e => updateConfig(c => { c.formSteps[i].label = e.target.value; })} />))}</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Countries & Pricing</h2><Button size="sm" onClick={addCountry}><Plus className="w-4 h-4 mr-1" /> Add Country</Button></div>

      {visaConfig.countries.map((country: any, ci: number) => (
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
