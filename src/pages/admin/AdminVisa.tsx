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
import { Search, Plus, MoreHorizontal, Edit2, Eye, Globe, CheckCircle2, Clock, XCircle } from "lucide-react";

const visaApplications = [
  { id: "VSA-001", applicant: "Rafiq Ahmed", country: "Thailand", type: "Tourist", submitted: "2025-03-10", status: "processing", fee: "৳4,500" },
  { id: "VSA-002", applicant: "Fatema Khatun", country: "Malaysia", type: "Business", submitted: "2025-03-08", status: "approved", fee: "৳6,200" },
  { id: "VSA-003", applicant: "Kamal Hossain", country: "Singapore", type: "Tourist", submitted: "2025-03-05", status: "pending_docs", fee: "৳5,800" },
  { id: "VSA-004", applicant: "Nusrat Jahan", country: "UAE", type: "Tourist", submitted: "2025-03-01", status: "approved", fee: "৳8,500" },
  { id: "VSA-005", applicant: "Sohel Rana", country: "India", type: "Medical", submitted: "2025-02-28", status: "rejected", fee: "৳3,200" },
];

const statusMap: Record<string, { label: string; class: string }> = {
  processing: { label: "Processing", class: "bg-primary/10 text-primary" },
  approved: { label: "Approved", class: "bg-success/10 text-success" },
  pending_docs: { label: "Pending Docs", class: "bg-warning/10 text-warning" },
  rejected: { label: "Rejected", class: "bg-destructive/10 text-destructive" },
};

const visaCountries = [
  { country: "Thailand", processing: "3-5 days", fee: "৳4,500", status: "active" },
  { country: "Malaysia", processing: "5-7 days", fee: "৳6,200", status: "active" },
  { country: "Singapore", processing: "5-7 days", fee: "৳5,800", status: "active" },
  { country: "UAE", processing: "3-5 days", fee: "৳8,500", status: "active" },
  { country: "India", processing: "7-10 days", fee: "৳3,200", status: "active" },
  { country: "Turkey", processing: "10-15 days", fee: "৳7,500", status: "paused" },
];

const AdminVisa = () => {
  const [tab, setTab] = useState<"applications" | "countries">("applications");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Visa Management</h1>
        <Button><Plus className="w-4 h-4 mr-1.5" /> Add Country</Button>
      </div>

      <div className="flex gap-1 border-b border-border pb-px">
        {(["applications", "countries"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "applications" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead className="hidden md:table-cell">Country</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Fee</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visaApplications.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.id}</TableCell>
                    <TableCell className="font-medium text-sm">{v.applicant}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" /> {v.country}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{v.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusMap[v.status]?.class}`}>
                        {statusMap[v.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm hidden sm:table-cell">{v.fee}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                          <DropdownMenuItem><CheckCircle2 className="w-4 h-4 mr-2" /> Approve</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive"><XCircle className="w-4 h-4 mr-2" /> Reject</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visaCountries.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.country}</TableCell>
                    <TableCell className="text-sm">{c.processing}</TableCell>
                    <TableCell className="text-sm font-semibold">{c.fee}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize ${
                        c.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminVisa;
