import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Eye, Edit2, Trash2, Download } from "lucide-react";
import { useAdminBookings } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";

const statusColors: Record<string, string> = { confirmed: "bg-success/10 text-success", pending: "bg-warning/10 text-warning", cancelled: "bg-destructive/10 text-destructive", completed: "bg-primary/10 text-primary" };

const AdminBookings = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useAdminBookings({ search: search || undefined });
  const bookings = (data as any)?.bookings || [];
  const stats = (data as any)?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">All Bookings</h1>
        <Button variant="outline" size="sm" className="w-full sm:w-auto"><Download className="w-4 h-4 mr-1.5" /> Export CSV</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: "Total Bookings", value: stats.total || "0" }, { label: "Confirmed", value: stats.confirmed || "0" }, { label: "Pending", value: stats.pending || "0" }, { label: "Cancelled", value: stats.cancelled || "0" }].map((s, i) => (
          <Card key={i}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold mt-1">{s.value}</p></CardContent></Card>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search bookings..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select><SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select>
      </div>
      <DataLoader isLoading={isLoading} error={error} skeleton="table" retry={refetch}>
        <Card><CardContent className="p-0 table-responsive">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead className="hidden md:table-cell">Type</TableHead><TableHead className="hidden lg:table-cell">Route</TableHead><TableHead className="hidden md:table-cell">Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">No bookings found</TableCell></TableRow>
              ) : bookings.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.id}</TableCell>
                  <TableCell><div><p className="text-sm font-medium">{b.customer}</p><p className="text-xs text-muted-foreground">{b.email}</p></div></TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{b.type}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{b.route}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{b.date}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[11px] capitalize ${statusColors[b.status] || ''}`}>{b.status}</Badge></TableCell>
                  <TableCell className="text-right font-semibold text-sm">{b.amount}</TableCell>
                  <TableCell>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end"><DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem><DropdownMenuItem><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Cancel</DropdownMenuItem></DropdownMenuContent>
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

export default AdminBookings;
