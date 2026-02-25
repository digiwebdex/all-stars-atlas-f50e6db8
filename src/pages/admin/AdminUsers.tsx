import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Eye, Ban, CheckCircle2, UserPlus, Download } from "lucide-react";

const mockUsers = [
  { id: 1, name: "Rafiq Ahmed", email: "rafiq@mail.com", phone: "+880171XXXXXXX", joined: "2025-01-15", bookings: 12, status: "active" },
  { id: 2, name: "Fatema Khatun", email: "fatema@mail.com", phone: "+880181XXXXXXX", joined: "2025-02-01", bookings: 5, status: "active" },
  { id: 3, name: "Kamal Hossain", email: "kamal@mail.com", phone: "+880191XXXXXXX", joined: "2025-02-10", bookings: 3, status: "active" },
  { id: 4, name: "Nusrat Jahan", email: "nusrat@mail.com", phone: "+880161XXXXXXX", joined: "2025-01-20", bookings: 8, status: "suspended" },
  { id: 5, name: "Sohel Rana", email: "sohel@mail.com", phone: "+880171XXXXXXX", joined: "2024-12-05", bookings: 21, status: "active" },
];

const AdminUsers = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
          <Button size="sm"><UserPlus className="w-4 h-4 mr-1.5" /> Add User</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: "3,482" },
          { label: "Active", value: "3,210" },
          { label: "Suspended", value: "48" },
          { label: "New (30d)", value: "215" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold mt-1">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="hidden sm:table-cell">Bookings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{u.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{u.joined}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{u.bookings}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] capitalize ${
                      u.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View Profile</DropdownMenuItem>
                        <DropdownMenuItem><CheckCircle2 className="w-4 h-4 mr-2" /> Activate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Ban className="w-4 h-4 mr-2" /> Suspend</DropdownMenuItem>
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

export default AdminUsers;
