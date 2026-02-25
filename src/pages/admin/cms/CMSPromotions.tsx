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
import { Search, Plus, MoreHorizontal, Edit2, Trash2, Copy, Eye } from "lucide-react";

const promotions = [
  { id: 1, title: "Summer Flash Sale", code: "SUMMER25", discount: "25%", type: "Percentage", usageLimit: 500, used: 234, status: "active", expires: "2025-06-30" },
  { id: 2, title: "Student Discount", code: "STUDENT15", discount: "15%", type: "Percentage", usageLimit: 1000, used: 412, status: "active", expires: "2025-12-31" },
  { id: 3, title: "First Booking Bonus", code: "WELCOME500", discount: "৳500", type: "Fixed", usageLimit: 2000, used: 1847, status: "active", expires: "2025-12-31" },
  { id: 4, title: "Bank Card Offer", code: "VISA10", discount: "10%", type: "Percentage", usageLimit: 300, used: 300, status: "expired", expires: "2025-02-28" },
  { id: 5, title: "Eid Special", code: "EID2025", discount: "20%", type: "Percentage", usageLimit: 800, used: 0, status: "scheduled", expires: "2025-04-15" },
];

const CMSPromotions = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <Button><Plus className="w-4 h-4 mr-1.5" /> Create Promotion</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Promotions", value: "3" },
          { label: "Total Redemptions", value: "2,493" },
          { label: "Revenue Impact", value: "৳4.2L" },
          { label: "Avg. Discount", value: "18%" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold mt-1">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search promotions..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promotion</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="hidden md:table-cell">Discount</TableHead>
                <TableHead className="hidden lg:table-cell">Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Expires</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-bold">{p.code}</code>
                      <button className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{p.discount} ({p.type})</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{p.used}/{p.usageLimit}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${
                      p.status === "active" ? "bg-success/10 text-success" :
                      p.status === "scheduled" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.expires}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                        <DropdownMenuItem><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
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

export default CMSPromotions;
