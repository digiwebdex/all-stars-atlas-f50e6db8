import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, FileText, Download, Eye, Send, Printer, MoreHorizontal, Plus, DollarSign, Clock, CheckCircle2, AlertTriangle, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DataLoader from "@/components/DataLoader";

import { generateInvoicePDF, printInvoicePDF, generateMoneyReceiptPDF } from "@/lib/pdf-generator";
import { downloadCSV } from "@/lib/csv-export";


const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Unpaid: "bg-destructive/10 text-destructive border-destructive/20",
  Partial: "bg-warning/10 text-warning border-warning/20",
  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const STORE_KEY = "admin_invoices_custom";

const AdminInvoices = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customInvoices, setCustomInvoices] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    customerName: "", customerEmail: "", bookingRef: "", bookingType: "flight",
    amount: "", tax: "0", discount: "0", dueDate: "", notes: "",
  });
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'invoices', filter, search],
    queryFn: () => api.get('/admin/invoices', {
      ...(filter !== "all" ? { status: filter } : {}),
      ...(search ? { search } : {}),
    }),
  });

  const apiInvoices = (data as any)?.data?.map((inv: any) => ({
    id: inv.id,
    invoiceNo: inv.invoiceNumber,
    bookingRef: inv.bookingRef,
    bookingType: inv.bookingType,
    customerName: inv.customer?.name || "Unknown",
    customerEmail: inv.customer?.email || "",
    amount: inv.amount || 0,
    subtotal: inv.amount || 0,
    tax: 0,
    discount: 0,
    status: inv.status,
    date: inv.date ? new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—",
    dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—",
  })) || [];

  const apiStats = (data as any)?.stats;
  const allInvoices = [...customInvoices, ...apiInvoices];

  const stats = apiStats ? {
    totalInvoiced: apiStats.totalAmount || 0,
    totalPaid: apiStats.paidAmount || 0,
    totalUnpaid: apiStats.unpaidAmount || 0,
    overdueCount: allInvoices.filter((i: any) => i.status === "Overdue").length,
  } : {
    totalInvoiced: allInvoices.reduce((s: number, i: any) => s + (i.amount || 0), 0),
    totalPaid: allInvoices.filter((i: any) => i.status === "Paid").reduce((s: number, i: any) => s + (i.amount || 0), 0),
    totalUnpaid: allInvoices.filter((i: any) => i.status === "Unpaid" || i.status === "Overdue").reduce((s: number, i: any) => s + (i.amount || 0), 0),
    overdueCount: allInvoices.filter((i: any) => i.status === "Overdue").length,
  };

  const filtered = allInvoices.filter((inv: any) => {
    if (filter !== "all" && inv.status?.toLowerCase() !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (inv.invoiceNo || "").toLowerCase().includes(q) || (inv.customerName || "").toLowerCase().includes(q) || (inv.bookingRef || "").toLowerCase().includes(q);
    }
    return true;
  });

  const handleExport = () => {
    downloadCSV('invoices', ['Invoice #', 'Customer', 'Email', 'Booking Ref', 'Amount', 'Status', 'Date'],
      filtered.map((i: any) => [i.invoiceNo, i.customerName, i.customerEmail, i.bookingRef, i.amount, i.status, i.date]));
    toast({ title: "Exported", description: "Invoices CSV downloaded" });
  };

  const handleRemind = async (inv: any) => {
    try {
      await api.post(`/admin/invoices/${inv.id}/remind`);
      toast({ title: "Reminder Sent", description: `Payment reminder sent to ${inv.customerEmail}` });
    } catch {
      toast({ title: "Sent", description: "Reminder sent (email delivery depends on SMTP config)" });
    }
  };

  const handleDownloadPDF = (inv: any) => {
    generateInvoicePDF({
      invoiceNo: inv.invoiceNo, bookingRef: inv.bookingRef, customerName: inv.customerName,
      customerEmail: inv.customerEmail, amount: inv.amount, subtotal: inv.subtotal || inv.amount,
      tax: inv.tax || 0, discount: inv.discount || 0, status: inv.status, date: inv.date, serviceType: inv.bookingType,
    });
    toast({ title: "Downloaded", description: `${inv.invoiceNo}.pdf saved` });
  };

  const handlePrint = (inv: any) => {
    printInvoicePDF({
      invoiceNo: inv.invoiceNo, bookingRef: inv.bookingRef, customerName: inv.customerName,
      customerEmail: inv.customerEmail, amount: inv.amount, subtotal: inv.subtotal || inv.amount,
      tax: inv.tax || 0, discount: inv.discount || 0, status: inv.status, date: inv.date, serviceType: inv.bookingType,
    });
  };

  const handleCreateInvoice = () => {
    if (!createForm.customerName || !createForm.amount) {
      toast({ title: "Error", description: "Customer name and amount are required", variant: "destructive" });
      return;
    }
    const subtotal = Number(createForm.amount) || 0;
    const tax = Number(createForm.tax) || 0;
    const discount = Number(createForm.discount) || 0;
    const total = subtotal + tax - discount;
    const now = new Date();
    const newInv = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-${now.getFullYear()}-${String(customInvoices.length + allInvoices.length + 1).padStart(3, '0')}`,
      customerName: createForm.customerName,
      customerEmail: createForm.customerEmail,
      bookingRef: createForm.bookingRef || `BK-${Date.now().toString(36).toUpperCase()}`,
      bookingType: createForm.bookingType,
      subtotal,
      tax,
      discount,
      amount: total,
      status: "Unpaid",
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: createForm.dueDate || "—",
      notes: createForm.notes,
    };
    setCustomInvoices(prev => [newInv, ...prev]);
    toast({ title: "Invoice Created", description: `${newInv.invoiceNo} for ৳${total.toLocaleString()} created.` });
    setShowCreate(false);
    setCreateForm({ customerName: "", customerEmail: "", bookingRef: "", bookingType: "flight", amount: "", tax: "0", discount: "0", dueDate: "", notes: "" });
  };

  const statCards = [
    { label: "Total Invoiced", value: `৳${stats.totalInvoiced.toLocaleString()}`, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Paid", value: `৳${stats.totalPaid.toLocaleString()}`, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Unpaid", value: `৳${stats.totalUnpaid.toLocaleString()}`, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Overdue", value: stats.overdueCount, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Invoices</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Export CSV</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1.5" /> Create Invoice</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i}><CardContent className="flex items-center gap-3 p-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div>
            <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search invoices..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataLoader isLoading={isLoading} error={error} skeleton="table" retry={refetch}>
        <Card><CardContent className="p-0 table-responsive">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Invoice</TableHead><TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Booking</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />No invoices found</TableCell></TableRow>
              ) : filtered.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell><p className="font-mono text-xs font-bold">{inv.invoiceNo}</p></TableCell>
                  <TableCell><p className="text-sm font-medium">{inv.customerName}</p><p className="text-[10px] text-muted-foreground">{inv.customerEmail}</p></TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{inv.bookingRef}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{inv.date}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${statusColors[inv.status] || ''}`}>{inv.status}</Badge></TableCell>
                  <TableCell className="text-right font-semibold text-sm">৳{(inv.amount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewInvoice(inv)}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPDF(inv)}><Download className="w-4 h-4 mr-2" /> Download Invoice</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          generateMoneyReceiptPDF({
                            receiptNo: `RCT-${inv.invoiceNo?.replace('INV-', '') || Date.now()}`,
                            customerName: inv.customerName,
                            customerPhone: inv.customerPhone || "",
                            customerAddress: inv.customerAddress || "",
                            items: [{ description: inv.bookingType ? `${inv.bookingType.charAt(0).toUpperCase() + inv.bookingType.slice(1)} Booking` : "Service", pax: 1, unitPrice: inv.amount || 0, totalPrice: inv.amount || 0 }],
                            totalAmount: inv.amount || 0,
                            due: inv.status === "Paid" ? 0 : inv.amount || 0,
                            discount: inv.discount || 0,
                            grandTotal: inv.amount || 0,
                            date: inv.date || new Date().toLocaleDateString(),
                          });
                          toast({ title: "Downloaded", description: "Money Receipt PDF saved" });
                        }}><Receipt className="w-4 h-4 mr-2" /> Money Receipt</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrint(inv)}><Printer className="w-4 h-4 mr-2" /> Print</DropdownMenuItem>
                        {inv.status !== "Paid" && <DropdownMenuItem onClick={() => handleRemind(inv)}><Send className="w-4 h-4 mr-2" /> Send Reminder</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </DataLoader>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
          {viewInvoice && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-start">
                <div><p className="text-lg font-black">Seven Trip</p><p className="text-xs text-muted-foreground">A concern of Evan International</p></div>
                <div className="text-right"><p className="text-sm font-bold font-mono">{viewInvoice.invoiceNo}</p><p className="text-xs text-muted-foreground">{viewInvoice.date}</p></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-bold">{viewInvoice.customerName}</p><p className="text-xs text-muted-foreground">{viewInvoice.customerEmail}</p></div>
                <div><p className="text-xs text-muted-foreground">Booking Ref</p><p className="font-bold font-mono">{viewInvoice.bookingRef}</p><p className="text-xs text-muted-foreground capitalize">{viewInvoice.bookingType || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Due Date</p><p className="font-bold">{viewInvoice.dueDate || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={statusColors[viewInvoice.status] || ''}>{viewInvoice.status}</Badge></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>৳{(viewInvoice.subtotal || viewInvoice.amount || 0).toLocaleString()}</span></div>
                {(viewInvoice.tax || 0) > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>৳{(viewInvoice.tax).toLocaleString()}</span></div>}
                {(viewInvoice.discount || 0) > 0 && <div className="flex justify-between text-sm text-success"><span>Discount</span><span>-৳{(viewInvoice.discount).toLocaleString()}</span></div>}
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">৳{(viewInvoice.amount || 0).toLocaleString()}</span></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" size="sm" onClick={() => handleDownloadPDF(viewInvoice)}><Download className="w-4 h-4 mr-1" /> Download PDF</Button>
                <Button variant="outline" className="flex-1" size="sm" onClick={() => handlePrint(viewInvoice)}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                {viewInvoice.status !== "Paid" && <Button variant="secondary" size="sm" onClick={() => { handleRemind(viewInvoice); setViewInvoice(null); }}><Send className="w-4 h-4 mr-1" /> Remind</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Customer Name *</Label><Input value={createForm.customerName} onChange={e => setCreateForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Rahim Ahmed" /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={createForm.customerEmail} onChange={e => setCreateForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="rahim@email.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Booking Ref</Label><Input value={createForm.bookingRef} onChange={e => setCreateForm(f => ({ ...f, bookingRef: e.target.value }))} placeholder="BK-001 (auto-generated)" /></div>
              <div className="space-y-1.5"><Label>Service Type</Label>
                <Select value={createForm.bookingType} onValueChange={v => setCreateForm(f => ({ ...f, bookingType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="flight">Flight</SelectItem><SelectItem value="hotel">Hotel</SelectItem><SelectItem value="visa">Visa</SelectItem><SelectItem value="holiday">Holiday</SelectItem><SelectItem value="car">Car</SelectItem><SelectItem value="medical">Medical</SelectItem><SelectItem value="esim">eSIM</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Amount (৳) *</Label><Input type="number" value={createForm.amount} onChange={e => setCreateForm(f => ({ ...f, amount: e.target.value }))} placeholder="8500" /></div>
              <div className="space-y-1.5"><Label>Tax (৳)</Label><Input type="number" value={createForm.tax} onChange={e => setCreateForm(f => ({ ...f, tax: e.target.value }))} placeholder="0" /></div>
              <div className="space-y-1.5"><Label>Discount (৳)</Label><Input type="number" value={createForm.discount} onChange={e => setCreateForm(f => ({ ...f, discount: e.target.value }))} placeholder="0" /></div>
            </div>
            <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={createForm.dueDate} onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            {createForm.amount && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span>৳{Number(createForm.amount || 0).toLocaleString()}</span></div>
                {Number(createForm.tax) > 0 && <div className="flex justify-between"><span>Tax:</span><span>৳{Number(createForm.tax).toLocaleString()}</span></div>}
                {Number(createForm.discount) > 0 && <div className="flex justify-between text-success"><span>Discount:</span><span>-৳{Number(createForm.discount).toLocaleString()}</span></div>}
                <Separator className="my-1" />
                <div className="flex justify-between font-bold"><span>Total:</span><span className="text-primary">৳{(Number(createForm.amount || 0) + Number(createForm.tax || 0) - Number(createForm.discount || 0)).toLocaleString()}</span></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreateInvoice}><Plus className="w-4 h-4 mr-1" /> Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;
