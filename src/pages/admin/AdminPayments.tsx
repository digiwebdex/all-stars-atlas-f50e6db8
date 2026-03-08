import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Eye, CheckCircle2, XCircle, Download, DollarSign, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useAdminPayments } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";

const statusMap: Record<string, { label: string; class: string }> = {
  completed: { label: "Completed", class: "bg-success/10 text-success" },
  pending: { label: "Pending", class: "bg-warning/10 text-warning" },
  pending_verification: { label: "Needs Verification", class: "bg-secondary/10 text-secondary" },
  refunded: { label: "Refunded", class: "bg-muted text-muted-foreground" },
  failed: { label: "Failed", class: "bg-destructive/10 text-destructive" },
};

const AdminPayments = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useAdminPayments({ search: search || undefined });
  const payments = (data as any)?.payments || [];
  const stats = (data as any)?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Payments</h1>
        <Button variant="outline" size="sm" className="w-full sm:w-auto"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Total Revenue", value: stats.totalRevenue || "৳0", icon: DollarSign, color: "text-success" }, { label: "This Month", value: stats.thisMonth || "৳0", icon: TrendingUp, color: "text-primary" }, { label: "Pending", value: stats.pending || "৳0", icon: Clock, color: "text-warning" }, { label: "Needs Verification", value: stats.needsVerification || "0", icon: AlertTriangle, color: "text-secondary" }].map((s, i) => (
          <Card key={i}><CardContent className="flex items-center gap-3 p-4"><div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></div><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div></CardContent></Card>
        ))}
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search payments..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <DataLoader isLoading={isLoading} error={error} skeleton="table" retry={refetch}>
        <Card><CardContent className="p-0 table-responsive">
          <Table>
            <TableHeader><TableRow><TableHead>Payment ID</TableHead><TableHead>Customer</TableHead><TableHead className="hidden md:table-cell">Method</TableHead><TableHead className="hidden lg:table-cell">Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No payments found</TableCell></TableRow>
              ) : payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell><p className="font-mono text-xs">{p.id}</p><p className="text-xs text-muted-foreground">{p.booking}</p></TableCell>
                  <TableCell className="text-sm font-medium">{p.customer}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{p.method}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{p.date}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${statusMap[p.status]?.class || ''}`}>{statusMap[p.status]?.label || p.status}</Badge></TableCell>
                  <TableCell className="text-right font-semibold text-sm">{p.amount}</TableCell>
                  <TableCell>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end"><DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem><DropdownMenuItem><CheckCircle2 className="w-4 h-4 mr-2" /> Approve</DropdownMenuItem><DropdownMenuItem className="text-destructive"><XCircle className="w-4 h-4 mr-2" /> Reject</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </DataLoader>
    </div>
  );
};

export default AdminPayments;
