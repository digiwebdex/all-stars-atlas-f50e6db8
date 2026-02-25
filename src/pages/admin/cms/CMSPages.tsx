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
import { Search, Plus, MoreHorizontal, Eye, Edit2, Trash2, FileText, Globe } from "lucide-react";

const pages = [
  { id: 1, title: "About Us", slug: "/about", status: "published", updated: "2025-03-10", views: 1240 },
  { id: 2, title: "Terms & Conditions", slug: "/terms", status: "published", updated: "2025-02-28", views: 856 },
  { id: 3, title: "Privacy Policy", slug: "/privacy", status: "published", updated: "2025-02-28", views: 632 },
  { id: 4, title: "Refund Policy", slug: "/refund-policy", status: "draft", updated: "2025-03-12", views: 0 },
  { id: 5, title: "FAQ", slug: "/faq", status: "published", updated: "2025-03-01", views: 2180 },
  { id: 6, title: "Contact Us", slug: "/contact", status: "published", updated: "2025-01-15", views: 3420 },
  { id: 7, title: "Careers", slug: "/careers", status: "draft", updated: "2025-03-14", views: 0 },
];

const CMSPages = () => {
  const [search, setSearch] = useState("");

  const filtered = pages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Pages</h1>
        <Button><Plus className="w-4 h-4 mr-1.5" /> Create Page</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search pages..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Title</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="hidden sm:table-cell">Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{page.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{page.slug}</code>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{page.views.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${
                      page.status === "published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {page.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{page.updated}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem><Globe className="w-4 h-4 mr-2" /> {page.status === "published" ? "Unpublish" : "Publish"}</DropdownMenuItem>
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

export default CMSPages;
