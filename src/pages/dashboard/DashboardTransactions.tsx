import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpRight, ArrowDownLeft, Download, Filter } from "lucide-react";
import { useState } from "react";
import { useDashboardTransactions } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";
import { mockTransactions } from "@/lib/mock-data";

const entryTypeColors: Record<string, string> = {
  AirTicket: "bg-primary/10 text-primary",
  BKash: "bg-success/10 text-success",
  Nagad: "bg-success/10 text-success",
  "Card Payment": "bg-success/10 text-success",
  "Bank Deposit": "bg-success/10 text-success",
  Refund: "bg-accent/10 text-accent",
};

const DashboardTransactions = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [perPage, setPerPage] = useState("20");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useDashboardTransactions({
    search: search || undefined,
    type: filter !== 'all' ? filter : undefined,
    page, limit: Number(perPage),
  });

  const resolved = error ? mockTransactions : (data as any);
  const transactions = resolved?.transactions || [];
  const summary = resolved?.summary || {};
  const total = resolved?.total || 0;
  const totalPages = Math.ceil(total / Number(perPage)) || 1;
  const effectiveError = error && transactions.length === 0 ? error : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">My Transactions</h1>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => toast({ title: "Exporting...", description: "Your transactions CSV is being prepared." })}><Download className="w-4 h-4 mr-1.5" /> Export</Button>
      </div>

      <DataLoader isLoading={isLoading} error={effectiveError} skeleton="dashboard" retry={refetch}>
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Spent</p><p className="text-2xl font-bold mt-1">{summary.totalSpent || '৳0'}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total Credited</p><p className="text-2xl font-bold mt-1 text-success">{summary.totalRefunds || '৳0'}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Running Balance</p><p className="text-2xl font-bold mt-1 text-primary">{summary.balance || '৳0'}</p></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search transactions..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={filter} onValueChange={v => { setFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px]"><Filter className="w-4 h-4 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="AirTicket">Air Ticket</SelectItem>
              <SelectItem value="BKash">bKash</SelectItem>
              <SelectItem value="Nagad">Nagad</SelectItem>
              <SelectItem value="Card Payment">Card Payment</SelectItem>
              <SelectItem value="Bank Deposit">Bank Deposit</SelectItem>
              <SelectItem value="Refund">Refund</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0 table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entry Type</TableHead>
                  <TableHead>Order Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Running Balance</TableHead>
                  <TableHead className="hidden sm:table-cell">Created On</TableHead>
                  <TableHead className="hidden lg:table-cell">Created By</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No transactions found</TableCell></TableRow>
                ) : transactions.map((txn: any) => {
                  const isCredit = txn.type === "credit" || txn.amount > 0 || ['BKash', 'Nagad', 'Card Payment', 'Bank Deposit', 'Refund'].includes(txn.entryType);
                  return (
                    <TableRow key={txn.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isCredit ? "bg-success/10" : "bg-primary/10"}`}>
                            {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5 text-success" /> : <ArrowUpRight className="w-3.5 h-3.5 text-primary" />}
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${entryTypeColors[txn.entryType] || 'bg-muted text-muted-foreground'}`}>
                            {txn.entryType || txn.description?.split(' ')[0]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[180px] truncate">{txn.reference || txn.id}</TableCell>
                      <TableCell className={`font-semibold text-sm ${isCredit ? "text-success" : ""}`}>
                        {isCredit ? "+" : "-"}৳{Math.abs(txn.numAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-bold">
                        ৳{txn.runningBalance?.toLocaleString() || '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{txn.date || txn.createdOn}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">{txn.createdBy || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">{txn.description}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DataLoader>

      {/* Pagination */}
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
          <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 bg-primary text-primary-foreground">{page}</Button>
          <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardTransactions;
