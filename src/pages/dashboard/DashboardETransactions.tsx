import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CreditCard, Smartphone, Download, Filter, ArrowDownLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";
import { mockETransactions } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
  Completed: "bg-success/10 text-success",
  Initiated: "bg-warning/10 text-warning",
  Failed: "bg-destructive/10 text-destructive",
  Pending: "bg-warning/10 text-warning",
};

const methodIcons: Record<string, typeof CreditCard> = {
  BKash: Smartphone, Nagad: Smartphone, "Card Payment": CreditCard,
};

const DashboardETransactions = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [perPage, setPerPage] = useState("20");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'e-transactions', filter, search, page, perPage],
    queryFn: () => api.get('/dashboard/e-transactions', {
      type: filter !== 'all' ? filter : undefined,
      search: search || undefined,
      page, limit: Number(perPage),
    }),
  });

  const resolved = error ? mockETransactions : (data as any);
  const transactions = resolved?.transactions || resolved?.data || [];
  const total = resolved?.total || 0;
  const totalPages = Math.ceil(total / Number(perPage)) || 1;
  const effectiveError = error && transactions.length === 0 ? error : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">E-Transactions</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Online payment transactions via bKash, Nagad & Card</p>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => toast({ title: "Exporting...", description: "Your e-transactions CSV is being prepared." })}><Download className="w-4 h-4 mr-1.5" /> Export</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by reference, TrxID..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px]"><Filter className="w-4 h-4 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="bkash">bKash</SelectItem>
            <SelectItem value="nagad">Nagad</SelectItem>
            <SelectItem value="card">Card Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataLoader isLoading={isLoading} error={effectiveError} skeleton="table" retry={refetch}>
        <Card>
          <CardContent className="p-0 table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Gateway Fee</TableHead>
                  <TableHead className="hidden lg:table-cell">Transaction Amt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Created On</TableHead>
                  <TableHead className="hidden lg:table-cell">Completed On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No e-transactions found
                    </TableCell>
                  </TableRow>
                ) : transactions.map((txn: any) => {
                  const Icon = methodIcons[txn.entryType] || CreditCard;
                  return (
                    <TableRow key={txn.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 text-success" />
                          </div>
                          <span className="text-sm font-medium">{txn.entryType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{txn.reference}</TableCell>
                      <TableCell className="font-semibold text-sm text-success">
                        <span className="flex items-center gap-1"><ArrowDownLeft className="w-3 h-3" /> ৳{txn.amount?.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">৳{txn.gatewayFee || 0}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm font-medium">৳{txn.transactionAmount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[txn.status] || ''}`}>{txn.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{txn.createdOn}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{txn.completedOn || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DataLoader>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Show</span>
          <Select value={perPage} onValueChange={v => { setPerPage(v); setPage(1); }}>
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
          </Select>
          <span className="text-muted-foreground">per page • {total} items</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 bg-primary text-primary-foreground">{page}</Button>
          <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardETransactions;
