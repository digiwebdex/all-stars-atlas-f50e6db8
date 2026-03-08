import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Ticket, Download, Plane, Search, Eye, Printer, Calendar, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDashboardTickets } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";
import { mockTickets } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  used: "bg-muted text-muted-foreground",
  expired: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
};

const DashboardTickets = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useDashboardTickets({ search: search || undefined });
  const resolved = error ? mockTickets : (data as any);
  const tickets = resolved?.tickets || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-xl sm:text-2xl font-bold">E-Tickets</h1><p className="text-sm text-muted-foreground">Download and manage your e-tickets</p></div>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by PNR, ticket ID or name..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataLoader isLoading={isLoading} error={null} skeleton="cards" retry={refetch}>
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-semibold">No tickets found</p></CardContent></Card>
          ) : tickets.map((ticket: any) => (
            <Card key={ticket.id} className="overflow-hidden hover:shadow-md transition-all">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-1 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">{ticket.airline}</span>
                        <span className="text-xs text-muted-foreground">{ticket.flightNo}</span>
                      </div>
                      <Badge className={`text-[10px] ${statusColors[ticket.status] || ''}`}>{ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center"><p className="text-xl font-black">{ticket.from}</p><p className="text-[10px] text-muted-foreground">{ticket.time}</p></div>
                      <div className="flex-1 h-px bg-border relative"><Plane className="w-3.5 h-3.5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                      <div className="text-center"><p className="text-xl font-black">{ticket.to}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ticket.date}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {ticket.passenger}</span>
                      <span>PNR: <strong className="text-foreground">{ticket.pnr}</strong></span>
                      <span>Seat: <strong className="text-foreground">{ticket.seat}</strong></span>
                      <span>{ticket.class}</span>
                    </div>
                  </div>
                  <div className="sm:w-44 border-t sm:border-t-0 sm:border-l border-border p-4 flex sm:flex-col items-center justify-center gap-2 bg-muted/30">
                    <Dialog>
                      <DialogTrigger asChild><Button variant="outline" size="sm" className="text-xs gap-1.5"><Eye className="w-3.5 h-3.5" /> View</Button></DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>E-Ticket — {ticket.id}</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="p-4 bg-muted/50 rounded-xl text-center">
                            <p className="text-sm text-muted-foreground">{ticket.airline} — {ticket.flightNo}</p>
                            <div className="flex items-center justify-center gap-6 my-3">
                              <div><p className="text-2xl font-black">{ticket.from}</p><p className="text-xs text-muted-foreground">{ticket.time}</p></div>
                              <Plane className="w-5 h-5 text-primary" />
                              <div><p className="text-2xl font-black">{ticket.to}</p></div>
                            </div>
                            <p className="text-sm font-semibold">{ticket.date}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><p className="text-muted-foreground text-xs">Passenger</p><p className="font-bold">{ticket.passenger}</p></div>
                            <div><p className="text-muted-foreground text-xs">PNR</p><p className="font-bold">{ticket.pnr}</p></div>
                            <div><p className="text-muted-foreground text-xs">Seat</p><p className="font-bold">{ticket.seat}</p></div>
                            <div><p className="text-muted-foreground text-xs">Class</p><p className="font-bold">{ticket.class}</p></div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button className="flex-1 font-bold" onClick={() => toast({ title: "Downloading...", description: "E-Ticket PDF is being prepared." })}><Download className="w-4 h-4 mr-1" /> Download PDF</Button>
                            <Button variant="outline" className="flex-1" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" className="text-xs gap-1.5 font-bold" onClick={() => toast({ title: "Downloading...", description: "E-Ticket PDF is being prepared." })}><Download className="w-3.5 h-3.5" /> Download</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DataLoader>
    </div>
  );
};

export default DashboardTickets;
