import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Eye, CheckCircle2, XCircle, Download, DollarSign, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockAdminPayments } from "@/lib/mock-data";
import { getCollection, updateInCollection } from "@/lib/local-store";

const STORE_KEY = "admin_payments";
const defaultPayments = mockAdminPayments.payments;

const statusMap: Record<string, { label: string; class: string }> = {
  completed: { label: "Completed", class: "bg-success/10 text-success" },
  pending: { label: "Pending", class: "bg-warning/10 text-warning" },
  pending_verification: { label: "Needs Verification", class: "bg-secondary/10 text-secondary" },
  refunded: { label: "Refunded", class: "bg-muted text-muted-foreground" },
  failed: { label: "Failed", class: "bg-destructive/10 text-destructive" },
};

const AdminPayments = () => {
  const [search, setSearch] = useState("");
  const [viewPayment, setViewPayment] = useState<any>(null);
  const { toast } = useToast();
  const [payments, setPayments] = useState(() => getCollection(STORE_KEY, defaultPayments));

  const stats = {
    totalRevenue: `৳${payments.filter(p => p.status === "completed").reduce((s, p) => s + parseInt(String(p.amount).replace(/[^\d]/g, "") || "0"), 0).toLocaleString()}`,
    thisMonth: mockAdminPayments.stats.thisMonth,
    pending: `৳${payments.filter(p => p.status === "pending").reduce((s, p) => s + parseInt(String(p.amount).replace(/[^\d]/g, "") || "0"), 0).toLocaleString()}`,
    needsVerification: String(payments.filter(p => p.status === "pending_verification").length),
  };

  const filtered = search ? payments.filter(p => p.id.toLowerCase().includes(search.toLowerCase()) || p.customer.toLowerCase().includes(search.toLowerCase())) : payments;

  const handleExport = () => {
    const csv = ["ID,Customer,Method,Amount,Status,Date", ...payments.map(p => `${p.id},${p.customer},${p.method},${p.amount},${p.status},${p.date}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "payments.csv"; a.click();
    toast({ title: "Exported", description: "Payments CSV downloaded" });
  };

  const handleApprove = (p: any) => {
    const updated = updateInCollection(STORE_KEY, defaultPayments, p.id, { status: "completed" });
    setPayments([...updated]);
    toast({ title: "Payment Approved", description: `Payment ${p.id} has been approved` });
  };

  const handleReject = (p: any) => {
    const updated = updateInCollection(STORE_KEY, defaultPayments, p.id, { status: "failed" });
    setPayments([...updated]);
    toast({ title: "Payment Rejected", description: `Payment ${p.id} has been rejected` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Payments</h1>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Export</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Total Revenue", value: stats.totalRevenue, icon: DollarSign, color: "text-success" }, { label: "This Month", value: stats.thisMonth, icon: TrendingUp, color: "text-primary" }, { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" }, { label: "Needs Verification", value: stats.needsVerification, icon: AlertTriangle, color: "text-secondary" }].map((s, i) => (
          <Card key={i}><CardContent className="flex items-center gap-3 p-4"><div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div></CardContent></Card>
        ))}
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search payments..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Card><CardContent className="p-0 table-responsive">
        <Table>
          <TableHeader><TableRow><TableHead>Payment ID</TableHead><TableHead>Customer</TableHead><TableHead className="hidden md:table-cell">Method</TableHead><TableHead className="hidden lg:table-cell">Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No payments found</TableCell></TableRow>
            ) : filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell><p className="font-mono text-xs">{p.id}</p><p className="text-xs text-muted-foreground">{p.booking}</p></TableCell>
                <TableCell className="text-sm font-medium">{p.customer}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{p.method}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{p.date}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] ${statusMap[p.status]?.class || ''}`}>{statusMap[p.status]?.label || p.status}</Badge></TableCell>
                <TableCell className="text-right font-semibold text-sm">{p.amount}</TableCell>
                <TableCell>
                  <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewPayment(p)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                      {p.status !== "completed" && <DropdownMenuItem onClick={() => handleApprove(p)}><CheckCircle2 className="w-4 h-4 mr-2" /> Approve</DropdownMenuItem>}
                      {p.status !== "failed" && <DropdownMenuItem className="text-destructive" onClick={() => handleReject(p)}><XCircle className="w-4 h-4 mr-2" /> Reject</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Payment Detail Dialog */}
      <Dialog open={!!viewPayment} onOpenChange={() => setViewPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Payment Details</DialogTitle></DialogHeader>
          {viewPayment && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Payment ID</p><p className="font-bold font-mono">{viewPayment.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-bold">{viewPayment.customer}</p></div>
                <div><p className="text-xs text-muted-foreground">Booking Ref</p><p className="font-bold font-mono">{viewPayment.booking}</p></div>
                <div><p className="text-xs text-muted-foreground">Payment Method</p><p className="font-bold">{viewPayment.method}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-bold">{viewPayment.date}</p></div>
                <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold text-lg text-primary">{viewPayment.amount}</p></div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`${statusMap[viewPayment.status]?.class || ''}`}>{statusMap[viewPayment.status]?.label || viewPayment.status}</Badge>
                <div className="flex gap-2">
                  {viewPayment.status !== "completed" && (
                    <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => { handleApprove(viewPayment); setViewPayment(null); }}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  )}
                  {viewPayment.status !== "failed" && (
                    <Button size="sm" variant="destructive" onClick={() => { handleReject(viewPayment); setViewPayment(null); }}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
