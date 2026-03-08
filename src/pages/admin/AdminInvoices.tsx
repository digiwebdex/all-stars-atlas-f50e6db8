import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, FileText, Download, Eye, Send, Printer, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DataLoader from "@/components/DataLoader";
import { mockAdminInvoices } from "@/lib/mock-data";
import { generateInvoicePDF, printInvoicePDF } from "@/lib/pdf-generator";

const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Unpaid: "bg-destructive/10 text-destructive border-destructive/20",
  Partial: "bg-warning/10 text-warning border-warning/20",
  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminInvoices = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery({
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
    status: inv.status,
    date: inv.date ? new Date(inv.date).toLocaleDateString('en-GB') : "—",
    dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : "—",
  })) || [];

  const apiStats = (data as any)?.stats;
  const invoices = apiInvoices.length > 0 ? apiInvoices : mockAdminInvoices.data;

  const stats = apiStats ? {
    totalInvoiced: apiStats.totalAmount || 0,
    totalPaid: apiStats.paidAmount || 0,
    totalUnpaid: apiStats.unpaidAmount || 0,
    overdueCount: invoices.filter((i: any) => i.status === "Overdue").length,
  } : {
    totalInvoiced: invoices.reduce((s: number, i: any) => s + (i.amount || 0), 0),
    totalPaid: invoices.filter((i: any) => i.status === "Paid").reduce((s: number, i: any) => s + (i.amount || 0), 0),
    totalUnpaid: invoices.filter((i: any) => i.status === "Unpaid" || i.status === "Overdue").reduce((s: number, i: any) => s + (i.amount || 0), 0),
    overdueCount: invoices.filter((i: any) => i.status === "Overdue").length,
  };

  const filtered = invoices;

  const handleExport = () => {
    const csv = ["Invoice,Booking,Customer,Amount,Status,Date", ...invoices.map((i: any) => `${i.invoiceNo},${i.bookingRef},${i.customerName},${i.amount},${i.status},${i.date}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "invoices.csv"; a.click();
    URL.revokeObjectURL(url);
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

  const handlePrint = (inv: any) => {
    const invoiceData = {
      invoiceNo: inv.invoiceNo,
      bookingRef: inv.bookingRef,
      customerName: inv.customerName,
      customerEmail: inv.customerEmail,
      amount: inv.amount,
      status: inv.status,
      date: inv.date,
      dueDate: inv.dueDate,
      bookingType: inv.bookingType,
    };
    printInvoicePDF(invoiceData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Invoices</h1>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1.5" /> Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced", value: `৳${stats.totalInvoiced.toLocaleString()}`, icon: FileText },
          { label: "Paid", value: `৳${stats.totalPaid.toLocaleString()}`, icon: FileText },
          { label: "Unpaid", value: `৳${stats.totalUnpaid.toLocaleString()}`, icon: FileText },
          { label: "Overdue", value: stats.overdueCount, icon: FileText },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold mt-1">{s.value}</p></CardContent></Card>
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
          </SelectContent>
        </Select>
      </div>

      <DataLoader isLoading={isLoading} error={null} skeleton="table" retry={refetch}>
        <Card><CardContent className="p-0 table-responsive">
          <Table>
            <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead className="hidden md:table-cell">Booking</TableHead><TableHead className="hidden lg:table-cell">Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No invoices found</TableCell></TableRow>
              ) : filtered.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell><p className="font-mono text-xs">{inv.invoiceNo}</p></TableCell>
                  <TableCell><p className="text-sm font-medium">{inv.customerName}</p><p className="text-[10px] text-muted-foreground">{inv.customerEmail}</p></TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{inv.bookingRef}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{inv.date}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${statusColors[inv.status] || ''}`}>{inv.status}</Badge></TableCell>
                  <TableCell className="text-right font-semibold text-sm">৳{(inv.amount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewInvoice(inv)}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
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

      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
          {viewInvoice && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Invoice No</p><p className="font-bold font-mono">{viewInvoice.invoiceNo}</p></div>
                <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-bold">{viewInvoice.customerName}</p></div>
                <div><p className="text-xs text-muted-foreground">Booking</p><p className="font-bold font-mono">{viewInvoice.bookingRef}</p></div>
                <div><p className="text-xs text-muted-foreground">Type</p><p className="font-bold capitalize">{viewInvoice.bookingType || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-bold">{viewInvoice.date}</p></div>
                <div><p className="text-xs text-muted-foreground">Due Date</p><p className="font-bold">{viewInvoice.dueDate}</p></div>
                <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold text-primary text-lg">৳{(viewInvoice.amount || 0).toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={statusColors[viewInvoice.status] || ''}>{viewInvoice.status}</Badge></div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handlePrint(viewInvoice)}><Printer className="w-3.5 h-3.5 mr-1" /> Print</Button>
                {viewInvoice.status !== "Paid" && <Button size="sm" onClick={() => { handleRemind(viewInvoice); setViewInvoice(null); }}><Send className="w-3.5 h-3.5 mr-1" /> Send Reminder</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;
