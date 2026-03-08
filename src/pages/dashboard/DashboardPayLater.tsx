import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, AlertCircle, CreditCard, CheckCircle2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DataLoader from "@/components/DataLoader";
import { Link } from "react-router-dom";
import { mockPayLater } from "@/lib/mock-data";

const statusTabs = ["All", "Paid", "Unpaid", "Void", "Refund"];
const statusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Unpaid: "bg-destructive/10 text-destructive",
  Void: "bg-muted text-muted-foreground",
  Refund: "bg-accent/10 text-accent",
};

const DashboardPayLater = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'pay-later', activeTab, search],
    queryFn: () => api.get('/dashboard/pay-later', {
      status: activeTab !== 'All' ? activeTab : undefined,
      search: search || undefined,
    }),
  });

  const resolved = error ? mockPayLater : (data as any);
  const items = resolved?.items || resolved?.data || [];
  const summary = resolved?.summary || {};
  const effectiveError = error && items.length === 0 ? error : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Pay Later</h1>

      <DataLoader isLoading={isLoading} error={effectiveError} skeleton="dashboard" retry={refetch}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-destructive/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Previous Due</p>
                  <p className="text-xl font-bold text-destructive">৳{summary.previousDue?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Due</p>
                  <p className="text-xl font-bold">৳{summary.totalDue?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Today</p>
                  <p className="text-xl font-bold text-primary">৳{summary.dueToday?.toLocaleString() || '0'}</p>
                </div>
              </div>
              {(summary.dueToday || 0) > 0 && (
                <Button size="sm" className="w-full mt-3 font-bold" asChild>
                  <Link to="/dashboard/payments">Pay Now <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-border pb-px">
          {statusTabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>{tab}</button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by reference..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-0 table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success/30" />
                      No records found
                    </TableCell>
                  </TableRow>
                ) : items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-semibold">{item.reference}</TableCell>
                    <TableCell className="text-sm">{item.bookingRef}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{item.dueDate}</TableCell>
                    <TableCell className="font-semibold text-sm">৳{item.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[item.status] || ''}`}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === "Unpaid" && (
                        <Button size="sm" className="h-7 text-xs" asChild>
                          <Link to="/dashboard/payments">Pay</Link>
                        </Button>
                      )}
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

export default DashboardPayLater;
