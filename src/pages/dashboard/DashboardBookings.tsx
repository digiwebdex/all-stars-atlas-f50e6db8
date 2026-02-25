import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plane, Building2, Search, Eye, Download, Filter, Calendar } from "lucide-react";

const tabs = ["All", "Upcoming", "Completed", "Cancelled", "Pending"];

const mockBookings = [
  { id: "BK-20250001", type: "flight", title: "Dhaka → Cox's Bazar", date: "2025-03-15", status: "confirmed", amount: "৳4,500", pax: 2 },
  { id: "BK-20250002", type: "hotel", title: "Sea Pearl Beach Resort", date: "2025-03-16", status: "pending", amount: "৳17,000", pax: 2 },
  { id: "BK-20250003", type: "flight", title: "Dhaka → Bangkok", date: "2025-04-01", status: "confirmed", amount: "৳32,000", pax: 1 },
  { id: "BK-20250004", type: "flight", title: "Dhaka → Singapore", date: "2025-02-10", status: "completed", amount: "৳28,500", pax: 2 },
  { id: "BK-20250005", type: "hotel", title: "Grand Sylhet Hotel", date: "2025-01-20", status: "cancelled", amount: "৳5,900", pax: 3 },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const DashboardBookings = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = mockBookings.filter((b) => {
    if (activeTab !== "All" && b.status !== activeTab.toLowerCase()) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1.5" /> Export
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-border pb-px">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by booking ID or destination..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="flight">Flights</SelectItem>
            <SelectItem value="hotel">Hotels</SelectItem>
            <SelectItem value="holiday">Holidays</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Passengers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((booking) => (
                  <TableRow key={booking.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          {booking.type === "flight" ? <Plane className="w-4 h-4 text-primary" /> : <Building2 className="w-4 h-4 text-primary" />}
                        </div>
                        <span className="font-medium text-sm">{booking.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{booking.date}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{booking.pax}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] capitalize ${statusColors[booking.status]}`}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">{booking.amount}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardBookings;
