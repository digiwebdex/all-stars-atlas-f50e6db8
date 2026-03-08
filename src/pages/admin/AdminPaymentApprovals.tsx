import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, CheckCircle2, XCircle, Eye, Clock, Building2, Smartphone, CreditCard, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DataLoader from "@/components/DataLoader";
import { mockAdminPaymentApprovals } from "@/lib/mock-data";

const statusTabs = ["All", "Pending", "Approved", "Rejected"];
const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning border-warning/20",
  Approved: "bg-success/10 text-success border-success/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const methodIcons: Record<string, typeof CreditCard> = {
  "Bank Deposit": Building2, "Bank Transfer": Building2, "Cheque Deposit": FileText,
  "Mobile Banking": Smartphone, "Credit/Debit Card": CreditCard,
};

const AdminPaymentApprovals = () => {
  const [activeTab, setActiveTab] = useState("Pending");
  const [search, setSearch] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [viewPayment, setViewPayment] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'payment-approvals', activeTab, search],
    queryFn: () => api.get('/admin/payment-approvals', {
      ...(activeTab !== "All" ? { status: activeTab } : {}),
      ...(search ? { search } : {}),
    }),
  });

  const apiData = (data as any)?.data || [];
  const apiStats = (data as any)?.stats;
  const payments = apiData.length > 0 ? apiData.map((p: any) => ({
    id: p.id,
    reference: p.reference,
    customerName: p.customer?.name || "Unknown",
    customerEmail: p.customer?.email || "",
    bookingRef: p.bookingRef || "N/A",
    amount: p.amount || 0,
    method: p.method || "—",
    status: p.status,
    note: p.note || "",
    receiptUrl: p.receiptUrl,
    date: p.date ? new Date(p.date).toLocaleDateString('en-GB') : "—",
  })) : mockAdminPaymentApprovals.data;

  const stats = apiStats || {
    pendingCount: payments.filter((p: any) => p.status === "Pending").length,
    approvedToday: payments.filter((p: any) => p.status === "Approved").length,
    approvedAmount: payments.filter((p: any) => p.status === "Approved").reduce((s: number, p: any) => s + (p.amount || 0), 0),
    rejectedCount: payments.filter((p: any) => p.status === "Rejected").length,
  };

  const filteredPayments = payments.filter((p: any) => !search || p.reference?.toLowerCase().includes(search.toLowerCase()) || p.customerName?.toLowerCase().includes(search.toLowerCase()));

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/payment-approvals/${id}`, { status: 'Approved' });
      toast({ title: "Payment Approved", description: "Payment has been approved successfully" });
      qc.invalidateQueries({ queryKey: ['admin', 'payment-approvals'] });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to approve", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/payment-approvals/${id}`, { status: 'Rejected', note: rejectNote });
      toast({ title: "Payment Rejected", description: "Payment has been rejected" });
      setRejectNote("");
      qc.invalidateQueries({ queryKey: ['admin', 'payment-approvals'] });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to reject", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Payment Approvals</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: stats.pendingCount || stats.pending, icon: Clock, color: "text-warning" },
          { label: "Approved", value: stats.approvedToday || stats.approved, icon: CheckCircle2, color: "text-success" },
          { label: "Approved Amount", value: `৳${(stats.approvedAmount || stats.totalPendingAmount || 0).toLocaleString()}`, icon: CreditCard, color: "text-primary" },
          { label: "Rejected", value: stats.rejectedCount || stats.rejected, icon: XCircle, color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="flex items-center gap-3 p-4"><div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {statusTabs.map(tab => (
            <Button key={tab} variant={activeTab === tab ? "default" : "outline"} size="sm" onClick={() => setActiveTab(tab)}>{tab}</Button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <DataLoader isLoading={isLoading} error={null} skeleton="table" retry={refetch}>
        <Card><CardContent className="p-0 table-responsive">
          <Table>
            <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Customer</TableHead><TableHead className="hidden md:table-cell">Method</TableHead><TableHead className="hidden md:table-cell">Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-28"></TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No payment approvals found</TableCell></TableRow>
              ) : filteredPayments.map((p: any) => {
                const MethodIcon = methodIcons[p.method] || CreditCard;
                return (
                  <TableRow key={p.id}>
                    <TableCell><p className="font-mono text-xs">{p.reference || (typeof p.id === 'string' ? p.id.substring(0, 12) : p.id)}</p><p className="text-[10px] text-muted-foreground">{p.bookingRef}</p></TableCell>
                    <TableCell><p className="text-sm font-medium">{p.customerName}</p><p className="text-[10px] text-muted-foreground">{p.customerEmail}</p></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="flex items-center gap-1.5 text-sm"><MethodIcon className="w-3.5 h-3.5 text-muted-foreground" />{p.method}</div></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.date}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${statusColors[p.status] || ''}`}>{p.status}</Badge></TableCell>
                    <TableCell className="text-right font-semibold text-sm">৳{(p.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {p.status === "Pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-success" onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id}>
                              {actionLoading === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleReject(p.id)} disabled={actionLoading === p.id}>
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewPayment(p)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      </DataLoader>

      <Dialog open={!!viewPayment} onOpenChange={() => setViewPayment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payment Detail</DialogTitle></DialogHeader>
          {viewPayment && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Reference</p><p className="font-bold font-mono">{viewPayment.reference || viewPayment.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-bold">{viewPayment.customerName}</p></div>
                <div><p className="text-xs text-muted-foreground">Booking</p><p className="font-bold font-mono">{viewPayment.bookingRef}</p></div>
                <div><p className="text-xs text-muted-foreground">Method</p><p className="font-bold">{viewPayment.method}</p></div>
                <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold text-primary text-lg">৳{(viewPayment.amount || 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={statusColors[viewPayment.status] || ''}>{viewPayment.status}</Badge></div>
              </div>
              {viewPayment.note && (
                <div><p className="text-xs text-muted-foreground">Note</p><p className="text-sm bg-muted/50 p-2 rounded">{viewPayment.note}</p></div>
              )}
              {viewPayment.status === "Pending" && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => { handleApprove(viewPayment.id); setViewPayment(null); }} disabled={actionLoading === viewPayment.id}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { handleReject(viewPayment.id); setViewPayment(null); }} disabled={actionLoading === viewPayment.id}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentApprovals;
