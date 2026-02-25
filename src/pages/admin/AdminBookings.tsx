import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Eye, Edit2, Trash2, Download } from "lucide-react";

const mockBookings = [
  { id: "BK-20250001", customer: "Rafiq Ahmed", email: "rafiq@mail.com", type: "Flight", route: "DAC → CXB", date: "2025-03-15", status: "confirmed", amount: "৳4,500" },
  { id: "BK-20250002", customer: "Fatema Khatun", email: "fatema@mail.com", type: "Hotel", route: "Sea Pearl Resort", date: "2025-03-16", status: "pending", amount: "৳17,000" },
  { id: "BK-20250003", customer: "Kamal Hossain", email: "kamal@mail.com", type: "Flight", route: "DAC → BKK", date: "2025-04-01", status: "confirmed", amount: "৳32,000" },
  { id: "BK-20250004", customer: "Nusrat Jahan", email: "nusrat@mail.com", type: "Holiday", route: "Maldives Package", date: "2025-04-10", status: "pending", amount: "৳68,000" },
  { id: "BK-20250005", customer: "Sohel Rana", email: "sohel@mail.com", type: "Flight", route: "DAC → SIN", date: "2025-02-10", status: "cancelled", amount: "৳28,500" },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-primary/10 text-primary",
};

const AdminBookings = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">All Bookings</h1>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: "1,247" },
          { label: "Confirmed", value: "892" },
          { label: "Pending", value: "203" },
          { label: "Cancelled", value: "152" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search bookings..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="flight">Flight</SelectItem>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="holiday">Holiday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Route/Details</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{b.customer}</p>
                      <p className="text-xs text-muted-foreground">{b.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{b.type}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{b.route}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{b.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] capitalize ${statusColors[b.status]}`}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">{b.amount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                        <DropdownMenuItem><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default AdminBookings;
