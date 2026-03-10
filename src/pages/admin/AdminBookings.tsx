import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, MoreHorizontal, Eye, Edit2, Download, CheckCircle2, Clock, XCircle, Ticket, Loader2,
  Plane, User, Phone, Mail, CreditCard, FileText, AlertTriangle, Save, CalendarDays, MapPin, Shield,
  Send, Ban, Link2, Archive, Trash2, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminBookings } from "@/hooks/useApiData";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import DataLoader from "@/components/DataLoader";
import { downloadCSV } from "@/lib/csv-export";

const ALL_STATUSES = [
  { value: "on_hold", label: "Reserved", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "pending", label: "Pending", color: "bg-warning/10 text-warning" },
  { value: "confirmed", label: "Confirmed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "ticketed", label: "Ticketed", color: "bg-accent/10 text-accent" },
  { value: "processing", label: "Processing", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "completed", label: "Completed", color: "bg-primary/10 text-primary" },
  { value: "cancelled", label: "Cancelled", color: "bg-destructive/10 text-destructive" },
  { value: "refunded", label: "Refunded", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "partially_refunded", label: "Partially Refunded", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "failed", label: "Failed", color: "bg-destructive/10 text-destructive" },
  { value: "void", label: "Void", color: "bg-muted text-muted-foreground" },
  { value: "exchange", label: "Exchange", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { value: "no_show", label: "No Show", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

// Map DB status to display label
const statusLabel = (status: string) => ALL_STATUSES.find(s => s.value === status)?.label || status?.replace(/_/g, ' ');

const PAYMENT_STATUSES = ["unpaid", "paid", "partial", "refunded", "pending"];
const PAYMENT_METHODS = ["bkash", "nagad", "rocket", "card", "bank_transfer", "pay_later"];

function getStatusStyle(status: string) {
  return ALL_STATUSES.find(s => s.value === status)?.color || "bg-muted text-muted-foreground";
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; }
}

const AdminBookings = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewBooking, setViewBooking] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [issueTicketOpen, setIssueTicketOpen] = useState(false);
  const [cancelFlightOpen, setCancelFlightOpen] = useState(false);
  const [sendPayLinkOpen, setSendPayLinkOpen] = useState(false);
  const [issueNotes, setIssueNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [payLinkEmail, setPayLinkEmail] = useState("");
  const [payLinkName, setPayLinkName] = useState("");
  const [payLinkPlatform, setPayLinkPlatform] = useState("email");
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useAdminBookings({
    ...(search ? { search } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  // Parse passengerInfo safely — it may arrive as a double-stringified JSON string
  const safeParsePax = (pi: any): any[] => {
    let parsed = pi;
    if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch { return []; } }
    if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch { return []; } }
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object' && parsed.passengers) return parsed.passengers;
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return [parsed];
    return [];
  };

  const apiBookings = (data as any)?.data?.map((b: any) => {
    const paxList = safeParsePax(b.passengerInfo);
    // Use first passenger name as customer if user name is missing / just email
    const userName = b.user?.name?.trim() || "";
    const paxName = paxList.length > 0 ? `${paxList[0].title || ''} ${paxList[0].firstName || paxList[0].first_name || ''} ${paxList[0].lastName || paxList[0].last_name || ''}`.trim() : "";
    const customer = (userName && userName !== "undefined undefined" && !userName.includes('@')) ? userName : (paxName || userName || "Unknown");

    // Extract route from nested details structure
    const ob = b.details?.outbound || b.details || {};
    const routeOrigin = ob.origin || b.details?.origin || '';
    const routeDest = ob.destination || b.details?.destination || '';
    const route = routeOrigin && routeDest ? `${routeOrigin} → ${routeDest}` : (b.details?.route || '—');

    return {
      id: b.bookingRef || b.id, rawId: b.id,
      customer, email: b.user?.email || "",
      type: b.bookingType || "flight",
      route,
      date: b.bookedAt ? new Date(b.bookedAt).toLocaleDateString('en-GB') : "—",
      status: b.status, amount: `৳${(b.totalAmount || 0).toLocaleString()}`,
      rawAmount: b.totalAmount || 0, paymentMethod: b.paymentMethod || "—",
      paymentStatus: b.paymentStatus || "—",
      paymentDeadline: b.paymentDeadline,
      details: b.details || {},
      passengerInfo: paxList,
      contactInfo: b.contactInfo || {},
      notes: b.notes || "",
      bookedAt: b.bookedAt,
      updatedAt: b.updatedAt,
    };
  }) || [];

  const bookings = apiBookings;

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b: any) => ["confirmed", "completed", "ticketed"].includes(b.status)).length,
    pending: bookings.filter((b: any) => ["pending", "on_hold", "processing"].includes(b.status)).length,
    cancelled: bookings.filter((b: any) => ["cancelled", "failed", "void", "no_show"].includes(b.status)).length,
  };

  const filtered = bookings.filter((b: any) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.id?.toLowerCase().includes(q) || b.customer?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q) || b.route?.toLowerCase().includes(q);
    }
    return true;
  });

  const updateBooking = async (b: any, updates: Record<string, any>) => {
    setActionLoading(b.rawId || b.id);
    try {
      const result: any = await api.put(`/admin/bookings/${b.rawId || b.id}`, updates);

      if (result?.gdsAction?.skipped) {
        // GDS was intentionally skipped (e.g., TTI has no ticketing API)
        toast({
          title: "✅ Status Updated (Manual)",
          description: `${result.message || 'Booking updated'}. Note: GDS action skipped — ${result.gdsAction.methodUsed || 'no API available'}. Update the airline system manually if needed.`,
        });
      } else if (result?.gdsAction?.success) {
        const tickets = result.gdsAction.ticketNumbers || [];
        toast({
          title: "✅ GDS Action Successful",
          description: tickets.length > 0
            ? `Booking ${b.id} updated. Ticket(s): ${tickets.join(", ")}`
            : `Booking ${b.id} updated via GDS successfully.`,
        });
      } else {
        toast({ title: "Updated", description: `Booking ${b.id} updated successfully` });
      }

      qc.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      refetch();
    } catch (err: any) {
      // Handle 422 GDS failure — status was NOT changed
      const gdsError = err?.gdsError || err?.gdsAction?.error || err?.hint;
      if (err?.status === 422) {
        toast({
          title: "❌ GDS Action Failed — Status NOT Changed",
          description: gdsError 
            ? `${gdsError}. The booking remains in its previous state.`
            : (err?.message || "GDS action failed. Status was not changed."),
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: err?.message || "Could not update booking", variant: "destructive" });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const openDetail = (b: any) => {
    setViewBooking(b);
    setEditMode(false);
    setEditData({
      status: b.status,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod,
      notes: b.notes,
      totalAmount: b.rawAmount,
      passengerInfo: b.passengerInfo,
      contactInfo: b.contactInfo,
    });
  };

  const saveEdits = async () => {
    if (!viewBooking) return;
    await updateBooking(viewBooking, editData);
    setEditMode(false);
    setViewBooking(null);
  };

  const handleExport = () => {
    downloadCSV('bookings', ['ID', 'Customer', 'Email', 'Type', 'Route', 'Date', 'Status', 'Payment', 'Amount'],
      bookings.map((b: any) => [b.id, b.customer, b.email, b.type, b.route, b.date, b.status, b.paymentStatus, b.amount]));
    toast({ title: "Exported", description: "Bookings CSV downloaded" });
  };

  const archiveBooking = async (b: any) => {
    setActionLoading(b.rawId || b.id);
    try {
      await api.patch(`/admin/bookings/${b.rawId || b.id}/archive`, { archived: true });
      toast({ title: "Archived", description: `Booking ${b.id} hidden from dashboards` });
      qc.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to archive", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const deleteBooking = async (b: any) => {
    setActionLoading(b.rawId || b.id);
    try {
      await api.delete(`/admin/bookings/${b.rawId || b.id}`);
      toast({ title: "Deleted", description: `Booking ${b.id} permanently removed` });
      qc.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      setDeleteConfirm(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const statCards = [
    { label: "Total Bookings", value: stats.total, icon: Ticket, color: "text-primary", bg: "bg-primary/10" },
    { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Cancelled", value: stats.cancelled, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  // Passenger info can be array or object
  const getPassengers = (b: any): any[] => {
    if (!b) return [];
    const pi = b.passengerInfo;
    if (Array.isArray(pi)) return pi;
    if (pi && typeof pi === 'object' && pi.passengers) return pi.passengers;
    if (pi && typeof pi === 'object' && Object.keys(pi).length > 0) return [pi];
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">All Bookings</h1>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i}><CardContent className="flex items-center gap-3 p-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold mt-1">{s.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search bookings..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {ALL_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataLoader isLoading={isLoading} error={error} skeleton="table" retry={refetch}>
        <Card><CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Route</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">No bookings found</TableCell></TableRow>
              ) : filtered.map((b: any) => (
                <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(b)}>
                  <TableCell className="font-mono text-xs">{b.id}</TableCell>
                  <TableCell><div><p className="text-sm font-medium">{b.customer}</p><p className="text-xs text-muted-foreground">{b.email}</p></div></TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{b.type}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{b.route}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{b.date}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[11px] capitalize ${getStatusStyle(b.status)}`}>{statusLabel(b.status)}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell"><Badge variant="outline" className="text-[10px] capitalize">{b.paymentStatus}</Badge></TableCell>
                  <TableCell className="text-right font-semibold text-sm">{b.amount}</TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(b); }}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(b); setEditMode(true); }}><Edit2 className="w-4 h-4 mr-2" /> Edit Booking</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {b.status === "on_hold" && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateBooking(b, { status: "confirmed" }); }}><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm</DropdownMenuItem>}
                        {b.status === "pending" && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateBooking(b, { status: "confirmed" }); }}><CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Confirm</DropdownMenuItem>}
                        {b.status === "confirmed" && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateBooking(b, { status: "completed" }); }}><CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed</DropdownMenuItem>}
                        {b.status === "cancelled" && b.details?.lastGdsAction?.statusBlocked && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateBooking(b, { status: "on_hold" }); }}><RotateCcw className="w-4 h-4 mr-2" /> Revert to Reserved</DropdownMenuItem>
                        )}
                        {b.status === "cancelled" && !b.details?.lastGdsAction?.statusBlocked && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateBooking(b, { status: "on_hold" }); }}><RotateCcw className="w-4 h-4 mr-2" /> Revert to Reserved</DropdownMenuItem>
                        )}
                        {!["cancelled", "completed", "refunded", "void", "failed"].includes(b.status) && (
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); updateBooking(b, { status: "cancelled" }); }}><XCircle className="w-4 h-4 mr-2" /> Cancel</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); archiveBooking(b); }}><Archive className="w-4 h-4 mr-2" /> Archive</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(b); }}><Trash2 className="w-4 h-4 mr-2" /> Delete Permanently</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </DataLoader>

      {/* ── Comprehensive Booking Detail Dialog ── */}
      <Dialog open={!!viewBooking} onOpenChange={() => { setViewBooking(null); setEditMode(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" /> Booking {viewBooking?.id}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`capitalize ${getStatusStyle(viewBooking?.status || '')}`}>
                  {statusLabel(viewBooking?.status || '')}
                </Badge>
                {!editMode && (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {viewBooking && (
            <Tabs defaultValue="overview" className="mt-2">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="passengers">Passengers</TabsTrigger>
                <TabsTrigger value="flight">Flight Info</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              {/* ── Overview Tab ── */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div><p className="text-xs text-muted-foreground mb-1">Booking ID</p><p className="font-bold font-mono">{viewBooking.id}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Customer</p><p className="font-bold">{viewBooking.customer}</p><p className="text-xs text-muted-foreground">{viewBooking.email}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Type</p><Badge variant="outline" className="capitalize">{viewBooking.type}</Badge></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Route</p><p className="font-bold">{viewBooking.route}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Booked At</p><p className="font-medium">{fmtDate(viewBooking.bookedAt)}</p></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Last Updated</p><p className="font-medium">{fmtDate(viewBooking.updatedAt)}</p></div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                    {editMode ? (
                      <Input type="number" value={editData.totalAmount} onChange={(e) => setEditData({ ...editData, totalAmount: parseFloat(e.target.value) })} className="h-8" />
                    ) : (
                      <p className="font-black text-lg text-primary">{viewBooking.amount}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                    {editMode ? (
                      <Select value={editData.paymentMethod} onValueChange={(v) => setEditData({ ...editData, paymentMethod: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <p className="font-bold capitalize">{viewBooking.paymentMethod?.replace(/_/g, ' ')}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                    {editMode ? (
                      <Select value={editData.paymentStatus} onValueChange={(v) => setEditData({ ...editData, paymentStatus: v })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="capitalize">{viewBooking.paymentStatus}</Badge>
                    )}
                  </div>
                  {viewBooking.paymentDeadline && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Deadline</p>
                      <p className="font-medium text-warning">{fmtDate(viewBooking.paymentDeadline)}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Contact Info */}
                {viewBooking.contactInfo && Object.keys(viewBooking.contactInfo).length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5"><Phone className="w-4 h-4" /> Contact Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-3">
                      {viewBooking.contactInfo.email && <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{viewBooking.contactInfo.email}</p></div>}
                      {viewBooking.contactInfo.phone && <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{viewBooking.contactInfo.phone}</p></div>}
                      {viewBooking.contactInfo.emergencyContact && <div><p className="text-xs text-muted-foreground">Emergency</p><p className="font-medium">{viewBooking.contactInfo.emergencyContact}</p></div>}
                      {viewBooking.contactInfo.emergencyPhone && <div><p className="text-xs text-muted-foreground">Emergency Phone</p><p className="font-medium">{viewBooking.contactInfo.emergencyPhone}</p></div>}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Admin Notes</h4>
                  {editMode ? (
                    <Textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} placeholder="Add notes about this booking..." rows={3} />
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 min-h-[60px]">{viewBooking.notes || "No notes"}</p>
                  )}
                </div>
              </TabsContent>

              {/* ── Passengers Tab ── */}
              <TabsContent value="passengers" className="space-y-4 mt-4">
                {getPassengers(viewBooking).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No passenger information available</p>
                  </div>
                ) : (
                  getPassengers(viewBooking).map((p: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Passenger {i + 1} {p.type ? `(${p.type})` : ''}</p>
                            <p className="text-xs text-muted-foreground">{p.title || ''} {p.firstName || p.first_name || ''} {p.lastName || p.last_name || ''}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          {(p.firstName || p.first_name) && <div><p className="text-xs text-muted-foreground">First Name</p><p className="font-medium">{p.firstName || p.first_name}</p></div>}
                          {(p.lastName || p.last_name) && <div><p className="text-xs text-muted-foreground">Last Name</p><p className="font-medium">{p.lastName || p.last_name}</p></div>}
                          {p.title && <div><p className="text-xs text-muted-foreground">Title</p><p className="font-medium">{p.title}</p></div>}
                          {p.dob && <div><p className="text-xs text-muted-foreground">Date of Birth</p><p className="font-medium">{p.dob}</p></div>}
                          {p.gender && <div><p className="text-xs text-muted-foreground">Gender</p><p className="font-medium capitalize">{p.gender}</p></div>}
                          {p.nationality && <div><p className="text-xs text-muted-foreground">Nationality</p><p className="font-medium">{p.nationality}</p></div>}
                          {p.passport && <div><p className="text-xs text-muted-foreground">Passport No.</p><p className="font-medium font-mono">{p.passport}</p></div>}
                          {p.passportExpiry && <div><p className="text-xs text-muted-foreground">Passport Expiry</p><p className="font-medium">{p.passportExpiry}</p></div>}
                          {p.documentCountry && <div><p className="text-xs text-muted-foreground">Document Country</p><p className="font-medium">{p.documentCountry}</p></div>}
                          {p.email && <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{p.email}</p></div>}
                          {p.phone && <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{p.phone}</p></div>}
                          {p.frequentFlyer && <div><p className="text-xs text-muted-foreground">Frequent Flyer</p><p className="font-medium font-mono">{p.frequentFlyer}</p></div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* ── Flight Info Tab ── */}
              <TabsContent value="flight" className="space-y-4 mt-4">
                {viewBooking.details && Object.keys(viewBooking.details).length > 0 ? (
                  <div className="space-y-4">
                    {/* Flight overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {viewBooking.details.airline && <div><p className="text-xs text-muted-foreground">Airline</p><p className="font-bold">{viewBooking.details.airline}</p></div>}
                      {viewBooking.details.flightNumber && <div><p className="text-xs text-muted-foreground">Flight Number</p><p className="font-bold font-mono">{viewBooking.details.flightNumber}</p></div>}
                      {viewBooking.details.origin && <div><p className="text-xs text-muted-foreground">Origin</p><p className="font-bold">{viewBooking.details.origin}</p></div>}
                      {viewBooking.details.destination && <div><p className="text-xs text-muted-foreground">Destination</p><p className="font-bold">{viewBooking.details.destination}</p></div>}
                      {viewBooking.details.departureTime && <div><p className="text-xs text-muted-foreground">Departure</p><p className="font-medium">{fmtDate(viewBooking.details.departureTime)}</p></div>}
                      {viewBooking.details.arrivalTime && <div><p className="text-xs text-muted-foreground">Arrival</p><p className="font-medium">{fmtDate(viewBooking.details.arrivalTime)}</p></div>}
                      {viewBooking.details.cabinClass && <div><p className="text-xs text-muted-foreground">Cabin Class</p><p className="font-medium">{viewBooking.details.cabinClass}</p></div>}
                      {viewBooking.details.bookingClass && <div><p className="text-xs text-muted-foreground">Booking Class</p><p className="font-bold">{viewBooking.details.bookingClass}</p></div>}
                      {viewBooking.details.aircraft && <div><p className="text-xs text-muted-foreground">Aircraft</p><p className="font-medium">{viewBooking.details.aircraft}</p></div>}
                      {viewBooking.details.duration && <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{viewBooking.details.duration}</p></div>}
                      {viewBooking.details.baggage && <div><p className="text-xs text-muted-foreground">Baggage</p><p className="font-medium">{viewBooking.details.baggage}</p></div>}
                      {viewBooking.details.pnr && <div><p className="text-xs text-muted-foreground">PNR / GDS Ref</p><p className="font-bold font-mono text-primary">{viewBooking.details.pnr}</p></div>}
                      {viewBooking.details.ttiBookingId && <div><p className="text-xs text-muted-foreground">TTI Booking ID</p><p className="font-mono text-xs">{viewBooking.details.ttiBookingId}</p></div>}
                      {viewBooking.details.source && <div><p className="text-xs text-muted-foreground">Source</p><Badge variant="outline" className="capitalize">{viewBooking.details.source}</Badge></div>}
                    </div>

                    {/* Legs / segments */}
                    {viewBooking.details.legs && Array.isArray(viewBooking.details.legs) && viewBooking.details.legs.length > 0 && (
                      <>
                        <Separator />
                        <h4 className="text-sm font-bold flex items-center gap-1.5"><Plane className="w-4 h-4" /> Flight Segments</h4>
                        {viewBooking.details.legs.map((leg: any, i: number) => (
                          <div key={i} className="bg-muted/30 rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Plane className="w-4 h-4 text-primary" />
                              <span className="font-bold">{leg.origin} → {leg.destination}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-muted-foreground">{leg.flightNumber}</span>
                              {leg.aircraft && <span className="text-muted-foreground">· {leg.aircraft}</span>}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div><span className="text-muted-foreground">Departs:</span> <span className="font-medium">{fmtDate(leg.departureTime)}</span></div>
                              <div><span className="text-muted-foreground">Arrives:</span> <span className="font-medium">{fmtDate(leg.arrivalTime)}</span></div>
                              <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{leg.duration}</span></div>
                              {leg.originTerminal && <div><span className="text-muted-foreground">Terminal:</span> <span className="font-medium">{leg.originTerminal}</span></div>}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Raw details (collapsed) */}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">View Raw Booking Data</summary>
                      <pre className="mt-2 bg-muted/50 rounded-lg p-3 overflow-x-auto text-[10px] max-h-60">{JSON.stringify(viewBooking.details, null, 2)}</pre>
                    </details>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plane className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No flight details available</p>
                  </div>
                )}
              </TabsContent>

              {/* ── Actions Tab ── */}
              <TabsContent value="actions" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5"><Shield className="w-4 h-4" /> Change Booking Status</h4>
                  <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="capitalize">{s.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> Payment Status</h4>
                  <Select value={editData.paymentStatus} onValueChange={(v) => setEditData({ ...editData, paymentStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Admin Notes</h4>
                  <Textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} placeholder="Add notes..." rows={3} />
                </div>

                <Separator />

                {/* GDS Source Indicator */}
                {viewBooking.details?.outbound?.source && (
                  <div className="bg-muted/50 border rounded-lg p-3 flex items-start gap-2">
                    <Plane className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold">GDS Source: <span className="uppercase text-primary">{viewBooking.details.outbound.source}</span></p>
                      {viewBooking.details?.gdsPnr && <p className="text-muted-foreground">PNR: <span className="font-mono font-bold">{viewBooking.details.gdsPnr}</span></p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠️ Status changes (Confirm, Cancel, Void) will call the <span className="font-bold uppercase">{viewBooking.details.outbound.source}</span> GDS API in real-time.
                      </p>
                    </div>
                  </div>
                )}

                {/* Last GDS Action Result */}
                {viewBooking.details?.lastGdsAction && (
                  <div className={`border rounded-lg p-3 flex items-start gap-2 ${viewBooking.details.lastGdsAction.result?.success ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' : 'bg-destructive/10 border-destructive/20'}`}>
                    {viewBooking.details.lastGdsAction.result?.success
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      : <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
                    <div className="text-sm">
                      <p className="font-semibold">Last GDS Action: <span className="capitalize">{viewBooking.details.lastGdsAction.action}</span></p>
                      {viewBooking.details.lastGdsAction.result?.ticketNumbers?.length > 0 && (
                        <p className="text-emerald-700 dark:text-emerald-400 font-mono text-xs">Tickets: {viewBooking.details.lastGdsAction.result.ticketNumbers.join(", ")}</p>
                      )}
                      {viewBooking.details.lastGdsAction.error && (
                        <p className="text-destructive text-xs mt-1">{viewBooking.details.lastGdsAction.error}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        By {viewBooking.details.lastGdsAction.performedBy} at {fmtDate(viewBooking.details.lastGdsAction.timestamp)}
                      </p>
                    </div>
                  </div>
                )}

                <h4 className="text-sm font-bold mb-3">Manage Flight Booking</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="border-accent text-accent" onClick={() => { setIssueTicketOpen(true); }}>
                    <Ticket className="w-4 h-4 mr-1" /> Issue Ticket
                  </Button>
                  <Button variant="outline" size="sm" className="border-destructive text-destructive" onClick={() => { setCancelFlightOpen(true); }}>
                    <Ban className="w-4 h-4 mr-1" /> Cancel Flight
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setPayLinkEmail(viewBooking?.email || ""); setSendPayLinkOpen(true); }}>
                    <Send className="w-4 h-4 mr-1" /> Send Pay Link
                  </Button>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveEdits} disabled={!!actionLoading} className="bg-primary">
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Save Changes
                  </Button>
                  {(viewBooking.status === "on_hold" || viewBooking.status === "pending") && (
                    <Button variant="outline" className="border-emerald-500 text-emerald-600" onClick={() => { updateBooking(viewBooking, { status: "confirmed", paymentStatus: "paid" }); setViewBooking(null); }}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve & Confirm
                    </Button>
                  )}
                  {viewBooking.status === "confirmed" && (
                    <Button variant="outline" className="border-purple-500 text-purple-600" onClick={() => { updateBooking(viewBooking, { status: "ticketed" }); setViewBooking(null); }}>
                      <Ticket className="w-4 h-4 mr-1" /> Mark Ticketed
                    </Button>
                  )}
                  {!["cancelled", "completed", "refunded", "void", "failed"].includes(viewBooking.status) && (
                    <Button variant="destructive" size="sm" onClick={() => { setCancelFlightOpen(true); }}>
                      <XCircle className="w-4 h-4 mr-1" /> Cancel Booking
                    </Button>
                  )}
                </div>

                {viewBooking.status === "on_hold" && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-warning">Booking Reserved</p>
                      <p className="text-muted-foreground">Awaiting payment or admin approval.</p>
                      {viewBooking.paymentDeadline && <p className="text-warning font-medium mt-1">Deadline: {fmtDate(viewBooking.paymentDeadline)}</p>}
                    </div>
                  </div>
                )}

                {viewBooking.status === "cancelled" && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-destructive">Booking Cancelled</p>
                      {viewBooking.details?.lastGdsAction?.statusBlocked && (
                        <p className="text-muted-foreground">⚠️ GDS cancellation failed previously. This booking may still be active in the airline system.</p>
                      )}
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => { updateBooking(viewBooking, { status: "on_hold" }); setViewBooking(null); }}>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Revert to Reserved
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {editMode && (
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEditMode(false)}>Cancel Edit</Button>
              <Button onClick={saveEdits} disabled={!!actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save All Changes
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Issue Ticket Modal */}
      <Dialog open={issueTicketOpen} onOpenChange={setIssueTicketOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Ticket className="w-5 h-5" /> Issue Ticket — {viewBooking?.id}</DialogTitle></DialogHeader>
          {viewBooking?.details?.outbound?.source === 'tti' || viewBooking?.details?.outbound?.airlineCode === '2A' || viewBooking?.details?.outbound?.airlineCode === 'S2' ? (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm space-y-1">
              <p className="font-semibold text-warning">ℹ️ TTI/Air Astra — Manual Ticketing</p>
              <p className="text-muted-foreground">TTI API does not support remote ticketing. This will update the status locally only.</p>
              <p className="text-muted-foreground text-xs">Please ensure the ticket has been issued via Air Astra's back-office/GDS terminal before marking as ticketed.</p>
              {viewBooking?.details?.gdsPnr && <p className="font-mono text-xs">PNR: <span className="font-bold">{viewBooking.details.gdsPnr}</span></p>}
            </div>
          ) : viewBooking?.details?.outbound?.source && viewBooking?.details?.gdsPnr ? (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm">
              <p className="font-semibold text-warning">⚠️ Real GDS API Call</p>
              <p className="text-muted-foreground">This will call the <span className="font-bold uppercase">{viewBooking.details.outbound.source}</span> API to issue a real airline ticket for PNR: <span className="font-mono font-bold">{viewBooking.details.gdsPnr}</span></p>
              <p className="text-destructive text-xs mt-1">This action cannot be undone. Payment will be deducted from your GDS balance.</p>
            </div>
          ) : null}
          <Textarea value={issueNotes} onChange={(e) => setIssueNotes(e.target.value)} placeholder="Type notes..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueTicketOpen(false)}>Close</Button>
            <Button className="bg-accent text-accent-foreground" disabled={!!actionLoading} onClick={() => {
              if (viewBooking) updateBooking(viewBooking, { status: "ticketed", paymentStatus: "paid", notes: issueNotes ? `${viewBooking.notes ? viewBooking.notes + '\n' : ''}[Ticket Issued] ${issueNotes}` : viewBooking.notes });
              setIssueTicketOpen(false); setViewBooking(null);
            }}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Ticket className="w-4 h-4 mr-1" />}
              {(viewBooking?.details?.outbound?.source === 'tti' || viewBooking?.details?.outbound?.airlineCode === '2A') ? 'Mark as Ticketed' : 'Issue Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Flight Modal */}
      <Dialog open={cancelFlightOpen} onOpenChange={setCancelFlightOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><Ban className="w-5 h-5" /> Cancel Flight — {viewBooking?.id}</DialogTitle></DialogHeader>
          {viewBooking?.details?.outbound?.source && viewBooking?.details?.gdsPnr && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
              <p className="font-semibold text-destructive">⚠️ Real GDS Cancellation</p>
              <p className="text-muted-foreground">This will call the <span className="font-bold uppercase">{viewBooking.details.outbound.source}</span> API to cancel PNR: <span className="font-mono font-bold">{viewBooking.details.gdsPnr}</span></p>
              <p className="text-destructive text-xs mt-1">This will cancel the actual airline reservation. This cannot be undone.</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">Type reason to cancel the flight ticket:</p>
          <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Type reason to cancel the booking..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelFlightOpen(false)}>Close</Button>
            <Button variant="destructive" disabled={!!actionLoading} onClick={() => {
              if (viewBooking) updateBooking(viewBooking, { status: "cancelled", notes: cancelReason ? `${viewBooking.notes ? viewBooking.notes + '\n' : ''}[Cancelled] ${cancelReason}` : viewBooking.notes });
              setCancelFlightOpen(false); setViewBooking(null);
            }}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Ban className="w-4 h-4 mr-1" />}
              Cancel Flight
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Pay Link Modal */}
      <Dialog open={sendPayLinkOpen} onOpenChange={setSendPayLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-accent" /> Send Pay Link — {viewBooking?.id}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Enter your name</label>
              <Input value={payLinkName} onChange={(e) => setPayLinkName(e.target.value)} placeholder="Your Name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Select Platform Type</label>
              <Select value={payLinkPlatform} onValueChange={setPayLinkPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Enter Receiver {payLinkPlatform === "email" ? "Email" : "Phone"}</label>
              <Input value={payLinkEmail} onChange={(e) => setPayLinkEmail(e.target.value)} placeholder={payLinkPlatform === "email" ? "email@example.com" : "+880 1XXX"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendPayLinkOpen(false)}>Close</Button>
            <Button className="bg-accent text-accent-foreground" onClick={() => {
              toast({ title: "Pay Link Sent", description: `Payment link sent to ${payLinkEmail}` });
              setSendPayLinkOpen(false);
            }}>Send {payLinkPlatform === "email" ? "Email" : "SMS"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Permanently Delete Booking</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">This will <strong className="text-destructive">permanently delete</strong> booking <strong>{deleteConfirm?.id}</strong> and all related tickets and transactions. This action cannot be undone.</p>
            <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20 text-sm">
              <p><strong>Route:</strong> {deleteConfirm?.route}</p>
              <p><strong>Customer:</strong> {deleteConfirm?.customer}</p>
              <p><strong>Status:</strong> {deleteConfirm?.status}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!!actionLoading} onClick={() => deleteBooking(deleteConfirm)}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />} Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
