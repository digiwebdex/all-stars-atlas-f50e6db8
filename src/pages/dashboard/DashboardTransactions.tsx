import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState } from "react";

const transactions = [
  { id: "TXN-001", date: "2025-03-15", description: "Flight Booking - BK-20250001", type: "debit", amount: "৳4,500", method: "bKash", status: "completed" },
  { id: "TXN-002", date: "2025-03-10", description: "Hotel Booking - BK-20250002", type: "debit", amount: "৳17,000", method: "Card", status: "pending" },
  { id: "TXN-003", date: "2025-02-28", description: "Refund - BK-20250005", type: "credit", amount: "৳5,900", method: "bKash", status: "completed" },
  { id: "TXN-004", date: "2025-02-15", description: "Flight Booking - BK-20250004", type: "debit", amount: "৳28,500", method: "Nagad", status: "completed" },
  { id: "TXN-005", date: "2025-01-20", description: "Hotel Booking - BK-20250005", type: "debit", amount: "৳5,900", method: "Card", status: "refunded" },
];

const DashboardTransactions = () => {
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) =>
    t.description.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold mt-1">৳55,900</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Refunds</p>
            <p className="text-2xl font-bold mt-1 text-success">৳5,900</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold mt-1 text-warning">৳17,000</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search transactions..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${txn.type === "credit" ? "bg-success/10" : "bg-primary/10"}`}>
                        {txn.type === "credit" ? <ArrowDownLeft className="w-3.5 h-3.5 text-success" /> : <ArrowUpRight className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <span className="text-sm">{txn.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{txn.date}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{txn.method}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] capitalize ${
                      txn.status === "completed" ? "bg-success/10 text-success" :
                      txn.status === "pending" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold text-sm ${txn.type === "credit" ? "text-success" : ""}`}>
                    {txn.type === "credit" ? "+" : "-"}{txn.amount}
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

export default DashboardTransactions;
