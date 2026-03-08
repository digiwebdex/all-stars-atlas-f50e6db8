import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, CheckCircle2, XCircle, Eye, Clock, Upload, Building2, Smartphone, CreditCard, FileText, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'payment-approvals', activeTab, search],
    queryFn: () => api.get('/admin/payment-approvals', {
      status: activeTab !== 'All' ? activeTab : undefined,
      search: search || undefined,
    }),
  });

  const approvePayment = useMutation({
    mutationFn: (id: string) => api.put(`/admin/payment-approvals/${id}`, { status: 'Approved' }),
    onSuccess: () => { toast({ title: "Payment Approved" }); qc.invalidateQueries({ queryKey: ['admin', 'payment-approvals'] }); },
  });

  const rejectPayment = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.put(`/admin/payment-approvals/${id}`, { status: 'Rejected', note }),
    onSuccess: () => { toast({ title: "Payment Rejected" }); qc.invalidateQueries({ queryKey: ['admin', 'payment-approvals'] }); setRejectNote(""); },
  });

  const payments = (data as any)?.data || [];
  const stats = (data as any)?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Payment Approvals</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Review and approve customer payment receipts</p>
        </div>
        <Badge variant="outline" className="bg-warning/10 text-warning text-xs h-7 px-3">
          <Clock className="w-3.5 h-3.5 mr-1" /> {stats.pendingCount || 0} Pending
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: stats.pendingCount || 0, color: "text-warning" },
          { label: "Approved Today", value: stats.approvedToday || 0, color: "text-success" },
          { label: "Total Approved Amount", value: `৳${(stats.approvedAmount || 0).toLocaleString()}`, color: "text-success" },
          { label: "Rejected", value: stats.rejectedCount || 0, color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-px">
        {statusTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>{tab}</button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by reference, customer..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataLoader isLoading={isLoading} error={null} skeleton="table" retry={refetch}>
        <Card>
          <CardContent className="p-0 table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="hidden md:table-cell">Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success/30" />No payment requests
                  </TableCell></TableRow>
                ) : payments.map((p: any) => {
                  const Icon = methodIcons[p.method] || CreditCard;
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs font-bold">{p.reference}</TableCell>
                      <TableCell>
                        <div><p className="text-sm font-medium">{p.customerName}</p><p className="text-[10px] text-muted-foreground">{p.customerEmail}</p></div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-sm">{p.method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-semibold text-sm">৳{p.amount?.toLocaleString()}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{p.date}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {p.receiptUrl ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Eye className="w-3 h-3" /> View</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Payment Receipt</DialogTitle></DialogHeader>
                              <div className="py-4">
                                <img src={p.receiptUrl} alt="Receipt" className="w-full rounded-lg border" />
                                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                                  <div><p className="text-xs text-muted-foreground">Reference</p><p className="font-bold">{p.reference}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold">৳{p.amount?.toLocaleString()}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Method</p><p className="font-bold">{p.method}</p></div>
                                  <div><p className="text-xs text-muted-foreground">Date</p><p className="font-bold">{p.date}</p></div>
                                </div>
                                {p.bankName && <div className="mt-2 text-sm"><p className="text-xs text-muted-foreground">Bank</p><p className="font-bold">{p.bankName}</p></div>}
                                {p.chequeNo && <div className="mt-2 text-sm"><p className="text-xs text-muted-foreground">Cheque #</p><p className="font-bold">{p.chequeNo}</p></div>}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[p.status] || ''}`}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "Pending" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" className="h-7 text-xs bg-success hover:bg-success/90" onClick={() => approvePayment.mutate(p.id)}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="h-7 text-xs">
                                  <XCircle className="w-3 h-3 mr-1" /> Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Reject Payment</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                  <p className="text-sm">Reject payment <strong>{p.reference}</strong> of ৳{p.amount?.toLocaleString()}?</p>
                                  <Textarea placeholder="Reason for rejection..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                                  <Button variant="destructive" className="w-full" onClick={() => rejectPayment.mutate({ id: p.id, note: rejectNote })}>
                                    Confirm Rejection
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{p.reviewedBy}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DataLoader>
    </div>
  );
};

export default AdminPaymentApprovals;
