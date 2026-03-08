import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Download, Eye, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Unpaid: "bg-destructive/10 text-destructive border-destructive/20",
  Partial: "bg-warning/10 text-warning border-warning/20",
  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminInvoices = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'invoices', filter, search, page],
    queryFn: () => api.get('/admin/invoices', {
      status: filter !== 'all' ? filter : undefined,
      search: search || undefined,
      page, limit: 20,
    }),
  });

  const sendReminder = useMutation({
    mutationFn: (id: string) => api.post(`/admin/invoices/${id}/remind`),
    onSuccess: () => { toast({ title: "Reminder Sent", description: "Payment reminder email sent to customer" }); },
  });

  const invoices = (data as any)?.data || [];
  const total = (data as any)?.total || 0;
  const stats = (data as any)?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Invoice Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{total} total invoices</p>
        </div>
        <Button className="w-full sm:w-auto"><FileText className="w-4 h-4 mr-1.5" /> Generate Invoice</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced", value: `৳${(stats.totalInvoiced || 0).toLocaleString()}`, color: "text-foreground" },
          { label: "Paid", value: `৳${(stats.totalPaid || 0).toLocaleString()}`, color: "text-success" },
          { label: "Unpaid", value: `৳${(stats.totalUnpaid || 0).toLocaleString()}`, color: "text-destructive" },
          { label: "Overdue", value: stats.overdueCount || 0, color: "text-destructive" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(1); }}>
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
                {invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No invoices found</TableCell></TableRow>
                ) : invoices.map((inv: any) => (
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
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                        {inv.status === "Unpaid" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => sendReminder.mutate(inv.id)}>
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
      </DataLoader>
    </div>
  );
};

export default AdminInvoices;
