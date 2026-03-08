import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plane, Building2, Search, Eye, Download, MoreHorizontal, RotateCcw, XCircle, FileText, Globe, Palmtree, CreditCard } from "lucide-react";
import { useDashboardBookings } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";
import { mockDashboardBookings } from "@/lib/mock-data";

const statusTabs = ["All", "On Hold", "Pending", "In Progress", "Confirmed", "Completed", "Void", "Refund", "Exchange", "Expired", "Cancelled", "Un-Confirmed"];

const statusColors: Record<string, string> = {
  "Confirmed": "bg-success/10 text-success border-success/20",
  "confirmed": "bg-success/10 text-success border-success/20",
  "Pending": "bg-warning/10 text-warning border-warning/20",
  "pending": "bg-warning/10 text-warning border-warning/20",
  "In Progress": "bg-primary/10 text-primary border-primary/20",
  "Completed": "bg-muted text-muted-foreground border-border",
  "Cancelled": "bg-destructive/10 text-destructive border-destructive/20",
  "Void": "bg-destructive/10 text-destructive border-destructive/20",
  "Refund": "bg-accent/10 text-accent border-accent/20",
  "Exchange": "bg-primary/10 text-primary border-primary/20",
  "Expired": "bg-muted text-muted-foreground border-border",
  "On Hold": "bg-warning/10 text-warning border-warning/20",
  "Un-Confirmed": "bg-destructive/10 text-destructive border-destructive/20",
};

const typeIcons: Record<string, typeof Plane> = { flight: Plane, hotel: Building2, visa: Globe, holiday: Palmtree };

const DashboardBookings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("10");
  const [page, setPage] = useState(1);
  const [viewBooking, setViewBooking] = useState<any>(null);

  const { data, isLoading, error, refetch } = useDashboardBookings({
    status: activeTab !== "All" ? activeTab : undefined,
    search: search || undefined,
    limit: Number(perPage),
    page,
  });

  const resolved = (data as any)?.bookings?.length ? (data as any) : mockDashboardBookings;
  const bookings = resolved?.bookings || [];
  const total = resolved?.total || 0;
  const tabCounts = resolved?.tabCounts || {};
  const totalPages = Math.ceil(total / Number(perPage)) || 1;
  const effectiveError = error && bookings.length === 0 ? error : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">My Bookings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{total} total bookings</p>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => toast({ title: "Exporting...", description: "Your bookings CSV is being prepared." })}><Download className="w-4 h-4 mr-1.5" /> Export</Button>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-border pb-px -mx-1 px-1">
        {statusTabs.map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {tab}
            {(tabCounts[tab] ?? 0) > 0 && (
              <span className={`text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold ${
                activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{tabCounts[tab]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by booking ID, destination, PNR..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select><SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="flight">Flights</SelectItem><SelectItem value="hotel">Hotels</SelectItem><SelectItem value="visa">Visa</SelectItem><SelectItem value="holiday">Holidays</SelectItem></SelectContent>
        </Select>
      </div>

      <DataLoader isLoading={isLoading} error={effectiveError} skeleton="table" retry={refetch}>
        <Card>
          <CardContent className="p-0 table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead><TableHead>Details</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead><TableHead className="hidden lg:table-cell">PNR</TableHead>
                  <TableHead className="hidden sm:table-cell">Pax</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead><TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <Plane className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />No bookings found
                  </TableCell></TableRow>
                ) : bookings.map((booking: any) => {
                  const Icon = typeIcons[booking.type] || Plane;
                  return (
                    <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-xs font-semibold">{booking.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
                          <div className="min-w-0"><span className="font-medium text-sm block truncate max-w-[150px] sm:max-w-none">{booking.title}</span>
                            {booking.ticketNo && booking.ticketNo !== "—" && <span className="text-[10px] text-muted-foreground font-mono">{booking.ticketNo}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{booking.date}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {booking.pnr && booking.pnr !== "—" ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-bold">{booking.pnr}</code> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{booking.pax}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${statusColors[booking.status] || ""}`}>{booking.status}</Badge></TableCell>
                      <TableCell className="text-right font-semibold text-sm">{booking.amount}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewBooking(booking)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: "Downloading...", description: "E-Ticket PDF is being prepared." })}><FileText className="w-4 h-4 mr-2" /> Download E-Ticket</DropdownMenuItem>
                            {(booking.status === "Confirmed" || booking.status === "confirmed") && (<>
                              <DropdownMenuItem onClick={() => toast({ title: "Request Submitted", description: "Reissue request has been submitted." })}><RotateCcw className="w-4 h-4 mr-2" /> Request Reissue</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => toast({ title: "Request Submitted", description: "Refund request has been submitted." })}><XCircle className="w-4 h-4 mr-2" /> Request Refund</DropdownMenuItem>
                            </>)}
                            {booking.status === "On Hold" && <DropdownMenuItem onClick={() => toast({ title: "Redirecting...", description: "Redirecting to payments." })}><CreditCard className="w-4 h-4 mr-2" /> Pay Now</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
          <Select value={perPage} onValueChange={(v) => { setPerPage(v); setPage(1); }}>
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
          </Select>
          <span className="text-muted-foreground">per page</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" className="h-8 w-8 bg-primary text-primary-foreground">{page}</Button>
          <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Booking Detail Dialog */}
      <Dialog open={!!viewBooking} onOpenChange={() => setViewBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
          {viewBooking && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Booking ID</p><p className="font-bold font-mono">{viewBooking.id}</p></div>
                <div><p className="text-xs text-muted-foreground">Type</p><Badge variant="outline" className="capitalize">{viewBooking.type}</Badge></div>
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Details</p><p className="font-bold">{viewBooking.title}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-bold">{viewBooking.date}</p></div>
                <div><p className="text-xs text-muted-foreground">PNR</p><p className="font-bold font-mono">{viewBooking.pnr || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Passengers</p><p className="font-bold">{viewBooking.pax}</p></div>
                <div><p className="text-xs text-muted-foreground">Ticket No</p><p className="font-bold font-mono">{viewBooking.ticketNo || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-bold text-lg text-primary">{viewBooking.amount}</p></div>
              </div>
              <Separator />
              <Badge variant="outline" className={`${statusColors[viewBooking.status] || ""}`}>{viewBooking.status}</Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardBookings;
