import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search, FileText, Download, Eye, Send, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockAdminInvoices } from "@/lib/mock-data";
import { getCollection, addToCollection } from "@/lib/local-store";
import { generateInvoicePDF, printInvoicePDF } from "@/lib/pdf-generator";

const STORE_KEY = "admin_invoices";
const defaultInvoices = mockAdminInvoices.data;

const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Unpaid: "bg-destructive/10 text-destructive border-destructive/20",
  Partial: "bg-warning/10 text-warning border-warning/20",
  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminInvoices = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showGenerate, setShowGenerate] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ customerName: "", customerEmail: "", bookingRef: "", amount: "", serviceType: "flight" });
  const { toast } = useToast();
  const [invoices, setInvoices] = useState(() => getCollection(STORE_KEY, defaultInvoices));

  const computeStats = useCallback((list: typeof invoices) => {
    const totalInvoiced = list.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = list.filter(i => i.status === "Paid").reduce((s, i) => s + (i.amount || 0), 0);
    const totalUnpaid = list.filter(i => i.status === "Unpaid" || i.status === "Overdue").reduce((s, i) => s + (i.amount || 0), 0);
    const overdueCount = list.filter(i => i.status === "Overdue").length;
    return { totalInvoiced, totalPaid, totalUnpaid, overdueCount };
  }, []);

  const stats = computeStats(invoices);

  const filtered = invoices.filter(inv => {
    if (filter !== "all" && inv.status.toLowerCase() !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.invoiceNo.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q) || inv.bookingRef.toLowerCase().includes(q);
    }
    return true;
  });

  const handleGenerateInvoice = () => {
    if (!newInvoice.customerName || !newInvoice.amount) {
      toast({ title: "Error", description: "Customer name and amount are required", variant: "destructive" });
      return;
    }
    const amt = Number(newInvoice.amount);
    const tax = Math.round(amt * 0.05);
    const inv = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-2026-${String(invoices.length + 1).padStart(3, "0")}`,
      customerName: newInvoice.customerName,
      customerEmail: newInvoice.customerEmail || "—",
      bookingRef: newInvoice.bookingRef || `BK-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      amount: amt + tax,
      subtotal: amt,
      tax,
      discount: 0,
      status: "Unpaid" as const,
      serviceType: newInvoice.serviceType,
    };
    const updated = addToCollection(STORE_KEY, defaultInvoices, inv);
    setInvoices([...updated]);
    toast({ title: "Invoice Generated", description: `${inv.invoiceNo} created for ${inv.customerName} — ৳${inv.amount.toLocaleString()}` });
    setShowGenerate(false);
    setNewInvoice({ customerName: "", customerEmail: "", bookingRef: "", amount: "", serviceType: "flight" });
  };

  const downloadPDF = (inv: any) => {
    generateInvoicePDF(inv);
    toast({ title: "Downloaded", description: `${inv.invoiceNo}.pdf saved` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Invoice Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{invoices.length} total invoices</p>
        </div>
        <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><FileText className="w-4 h-4 mr-1.5" /> Generate Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Generate New Invoice</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Customer Name *</Label><Input value={newInvoice.customerName} onChange={e => setNewInvoice(p => ({ ...p, customerName: e.target.value }))} placeholder="Full name" /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={newInvoice.customerEmail} onChange={e => setNewInvoice(p => ({ ...p, customerEmail: e.target.value }))} placeholder="Email address" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Booking Reference</Label><Input value={newInvoice.bookingRef} onChange={e => setNewInvoice(p => ({ ...p, bookingRef: e.target.value }))} placeholder="BK-XXXXXX" /></div>
                <div className="space-y-1.5"><Label>Service Type</Label>
                  <Select value={newInvoice.serviceType} onValueChange={v => setNewInvoice(p => ({ ...p, serviceType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flight">Flight</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Amount (BDT) *</Label><Input type="number" value={newInvoice.amount} onChange={e => setNewInvoice(p => ({ ...p, amount: e.target.value }))} placeholder="Enter amount" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleGenerateInvoice}>Generate Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced", value: `৳${stats.totalInvoiced.toLocaleString()}`, color: "text-foreground" },
          { label: "Paid", value: `৳${stats.totalPaid.toLocaleString()}`, color: "text-success" },
          { label: "Unpaid", value: `৳${stats.totalUnpaid.toLocaleString()}`, color: "text-destructive" },
          { label: "Overdue", value: stats.overdueCount, color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 table-responsive">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Booking</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No invoices found</TableCell></TableRow>
              ) : filtered.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs font-bold">{inv.invoiceNo}</TableCell>
                  <TableCell>
                    <div><p className="text-sm font-medium">{inv.customerName}</p><p className="text-[10px] text-muted-foreground">{inv.customerEmail}</p></div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs font-mono">{inv.bookingRef}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{inv.date}</TableCell>
                  <TableCell className="font-semibold text-sm">৳{inv.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[inv.status] || ''}`}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader><DialogTitle>Invoice {inv.invoiceNo}</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex justify-between items-start">
                              <div><p className="text-lg font-black">Seven Trip</p><p className="text-xs text-muted-foreground">Seven Trip Bangladesh Ltd</p></div>
                              <div className="text-right"><p className="text-sm font-bold">{inv.invoiceNo}</p><p className="text-xs text-muted-foreground">{inv.date}</p></div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><p className="text-xs text-muted-foreground">Bill To</p><p className="font-semibold">{inv.customerName}</p><p className="text-xs text-muted-foreground">{inv.customerEmail}</p></div>
                              <div><p className="text-xs text-muted-foreground">Booking Ref</p><p className="font-semibold">{inv.bookingRef}</p></div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm"><span>Subtotal</span><span>৳{inv.subtotal?.toLocaleString()}</span></div>
                              {inv.tax > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>৳{inv.tax?.toLocaleString()}</span></div>}
                              {inv.discount > 0 && <div className="flex justify-between text-sm text-success"><span>Discount</span><span>-৳{inv.discount?.toLocaleString()}</span></div>}
                              <Separator />
                              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>৳{inv.amount?.toLocaleString()}</span></div>
                            </div>
                            <Badge variant="outline" className={`${statusColors[inv.status] || ''}`}>{inv.status}</Badge>
                            <div className="flex gap-2 pt-2">
                              <Button className="flex-1 font-bold" onClick={() => downloadPDF(inv)}><Download className="w-4 h-4 mr-1" /> Download PDF</Button>
                              <Button variant="outline" className="flex-1" onClick={() => printInvoicePDF(inv)}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadPDF(inv)}><Download className="w-4 h-4" /></Button>
                      {(inv.status === "Unpaid" || inv.status === "Overdue") && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Reminder Sent", description: "Payment reminder sent to customer" })}>
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInvoices;
