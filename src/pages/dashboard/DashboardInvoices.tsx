import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Download, Eye, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Unpaid: "bg-destructive/10 text-destructive",
  Partial: "bg-warning/10 text-warning",
};

const DashboardInvoices = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'invoices', filter, search],
    queryFn: () => api.get('/dashboard/invoices', {
      status: filter !== 'all' ? filter : undefined,
      search: search || undefined,
    }),
  });

  const invoices = (data as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">View and download your booking invoices</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by invoice #, booking ref..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataLoader isLoading={isLoading} error={error} skeleton="table" retry={refetch}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />No invoices found
                    </TableCell>
                  </TableRow>
                ) : invoices.map((inv: any) => (
                  <TableRow key={inv.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-bold">{inv.invoiceNo}</TableCell>
                    <TableCell className="text-sm">{inv.bookingRef}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{inv.date}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-[10px] capitalize">{inv.serviceType}</Badge>
                    </TableCell>
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
                                <div>
                                  <p className="text-lg font-black">Seven Trip</p>
                                  <p className="text-xs text-muted-foreground">Seven Trip Bangladesh Ltd</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold">{inv.invoiceNo}</p>
                                  <p className="text-xs text-muted-foreground">{inv.date}</p>
                                </div>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><p className="text-xs text-muted-foreground">Bill To</p><p className="font-semibold">{inv.customerName}</p><p className="text-xs text-muted-foreground">{inv.customerEmail}</p></div>
                                <div><p className="text-xs text-muted-foreground">Booking Ref</p><p className="font-semibold">{inv.bookingRef}</p><p className="text-xs text-muted-foreground capitalize">{inv.serviceType}</p></div>
                              </div>
                              <Separator />
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm"><span>Subtotal</span><span>৳{inv.subtotal?.toLocaleString()}</span></div>
                                {inv.tax > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>৳{inv.tax?.toLocaleString()}</span></div>}
                                {inv.discount > 0 && <div className="flex justify-between text-sm text-success"><span>Discount</span><span>-৳{inv.discount?.toLocaleString()}</span></div>}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>৳{inv.amount?.toLocaleString()}</span></div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button className="flex-1 font-bold" onClick={() => toast({ title: "Downloading...", description: "Invoice PDF is being prepared." })}><Download className="w-4 h-4 mr-1" /> Download PDF</Button>
                                <Button variant="outline" className="flex-1" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Downloading...", description: "Invoice PDF is being prepared." })}><Download className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DataLoader>
    </div>
  );
};

export default DashboardInvoices;
