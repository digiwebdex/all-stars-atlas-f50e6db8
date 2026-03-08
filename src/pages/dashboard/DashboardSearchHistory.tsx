import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plane, Building2, Globe, Palmtree, Trash2, RotateCcw, Calendar, MapPin, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DataLoader from "@/components/DataLoader";

const typeIcons: Record<string, typeof Plane> = {
  flight: Plane, hotel: Building2, visa: Globe, holiday: Palmtree,
};

const DashboardSearchHistory = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'search-history', filter, search],
    queryFn: () => api.get('/dashboard/search-history', {
      type: filter !== 'all' ? filter : undefined,
      search: search || undefined,
    }),
  });

  const clearHistory = useMutation({
    mutationFn: () => api.delete('/dashboard/search-history'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'search-history'] }),
  });

  const repeatSearch = (item: any) => {
    const params = new URLSearchParams(item.params);
    window.location.href = `/${item.type}s?${params.toString()}`;
  };

  const searches = (data as any)?.data || [];
  const total = (data as any)?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Search History</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{total} searches recorded</p>
        </div>
        <Button variant="destructive" size="sm" className="w-full sm:w-auto" onClick={() => clearHistory.mutate()} disabled={clearHistory.isPending}>
          <Trash2 className="w-4 h-4 mr-1.5" /> Clear All
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by destination, route..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[150px]"><Filter className="w-4 h-4 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="flight">Flights</SelectItem>
            <SelectItem value="hotel">Hotels</SelectItem>
            <SelectItem value="holiday">Holidays</SelectItem>
            <SelectItem value="visa">Visa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataLoader isLoading={isLoading} error={error} skeleton="table" retry={refetch}>
        <Card>
          <CardContent className="p-0 table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Search Details</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Results</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No search history found
                    </TableCell>
                  </TableRow>
                ) : searches.map((item: any) => {
                  const Icon = typeIcons[item.type] || Plane;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{item.summary}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.origin && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" /> {item.origin} → {item.destination}
                              </span>
                            )}
                            {item.dates && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" /> {item.dates}
                              </span>
                            )}
                            {item.travellers && (
                              <span className="text-[10px] text-muted-foreground">{item.travellers} pax</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{item.searchedAt}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{item.resultsCount} found</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => repeatSearch(item)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Search Again
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DataLoader>
    </div>
  );
};

export default DashboardSearchHistory;
