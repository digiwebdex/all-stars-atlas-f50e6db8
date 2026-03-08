import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, CheckCircle2, XCircle, Eye, Clock, Building2, Smartphone, CreditCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockAdminPaymentApprovals } from "@/lib/mock-data";
import { getCollection, updateInCollection } from "@/lib/local-store";

const STORE_KEY = "admin_payment_approvals";
const defaultData = mockAdminPaymentApprovals.data;

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
  const [payments, setPayments] = useState(() => getCollection(STORE_KEY, defaultData));

  const stats = {
    pendingCount: payments.filter(p => p.status === "Pending").length,
    approvedToday: payments.filter(p => p.status === "Approved").length,
    approvedAmount: payments.filter(p => p.status === "Approved").reduce((s, p) => s + (p.amount || 0), 0),
    rejectedCount: payments.filter(p => p.status === "Rejected").length,
  };

  const filteredPayments = (activeTab === "All" ? payments : payments.filter(p => p.status === activeTab))
    .filter(p => !search || p.reference.toLowerCase().includes(search.toLowerCase()) || p.customerName.toLowerCase().includes(search.toLowerCase()));

  const handleApprove = (id: string) => {
    const updated = updateInCollection(STORE_KEY, defaultData, id, { status: "Approved", reviewedBy: "Admin" });
    setPayments([...updated]);
    toast({ title: "Payment Approved", description: "Payment has been approved successfully" });
  };

  const handleReject = (id: string) => {
    const updated = updateInCollection(STORE_KEY, defaultData, id, { status: "Rejected", reviewedBy: "Admin" });
    setPayments([...updated]);
    setRejectNote("");
    toast({ title: "Payment Rejected", description: "Payment has been rejected" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Payment Approvals</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Review and approve customer payment receipts</p>
        </div>
        <Badge variant="outline" className="bg-warning/10 text-warning text-xs h-7 px-3">
          <Clock className="w-3.5 h-3.5 mr-1" /> {stats.pendingCount} Pending
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: stats.pendingCount, color: "text-warning" },
          { label: "Approved", value: stats.approvedToday, color: "text-success" },
          { label: "Total Approved Amount", value: `৳${stats.approvedAmount.toLocaleString()}`, color: "text-success" },
          { label: "Rejected", value: stats.rejectedCount, color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border pb-px">
        {statusTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{tab}</button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by reference, customer..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

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
              {filteredPayments.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success/30" />No payment requests
                </TableCell></TableRow>
              ) : filteredPayments.map((p: any) => {
                const Icon = methodIcons[p.method] || CreditCard;
                return (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-bold">{p.reference}</TableCell>
                    <TableCell>
                      <div><p className="text-sm font-medium">{p.customerName}</p><p className="text-[10px] text-muted-foreground">{p.customerEmail}</p></div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><span className="text-sm">{p.method}</span></div>
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
                              </div>
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
                          <Button size="sm" className="h-7 text-xs bg-success hover:bg-success/90" onClick={() => handleApprove(p.id)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="h-7 text-xs"><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Reject Payment</DialogTitle></DialogHeader>
                              <div className="space-y-4 py-4">
                                <p className="text-sm">Reject payment <strong>{p.reference}</strong> of ৳{p.amount?.toLocaleString()}?</p>
                                <Textarea placeholder="Reason for rejection..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
                                <Button variant="destructive" className="w-full" onClick={() => handleReject(p.id)}>
                                  Confirm Rejection
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{p.reviewedBy || "—"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentApprovals;
