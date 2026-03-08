import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Users, CreditCard, TrendingUp, Plane, Building2, Globe, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useAdminDashboard } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";

const statIcons = [Ticket, Users, CreditCard, TrendingUp];
const statColors = ["text-primary", "text-accent", "text-success", "text-warning"];
const statBgs = ["bg-primary/10", "bg-accent/10", "bg-success/10", "bg-warning/10"];
const statusColors: Record<string, string> = { confirmed: "bg-success/10 text-success", pending: "bg-warning/10 text-warning" };

const AdminDashboard = () => {
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const stats = (data as any)?.stats || [];
  const recentBookings = (data as any)?.recentBookings || [];
  const revenueData = (data as any)?.revenueData || [];
  const topServices = (data as any)?.topServices || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1><p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Welcome back, Super Admin</p></div>
        <Badge variant="outline" className="bg-success/10 text-success text-xs w-fit">System Online</Badge>
      </div>

      <DataLoader isLoading={isLoading} error={error} skeleton="dashboard" retry={refetch}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat: any, i: number) => {
            const Icon = statIcons[i % statIcons.length];
            return (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${statBgs[i % statBgs.length]} flex items-center justify-center ${statColors[i % statColors.length]}`}><Icon className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                  <div className="flex-1 min-w-0"><p className="text-xs text-muted-foreground truncate">{stat.label}</p><p className="text-xl sm:text-2xl font-bold">{stat.value}</p></div>
                  <div className="flex items-center gap-0.5 text-xs font-semibold text-success shrink-0"><ArrowUpRight className="w-3.5 h-3.5" /> {stat.change}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {revenueData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-lg">Revenue This Week</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip /><Bar dataKey="value" fill="hsl(217, 91%, 50%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {topServices.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Top Services</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {topServices.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Plane className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{s.name}</p><p className="text-xs text-muted-foreground">{s.bookings} bookings</p></div>
                    <span className="text-sm font-semibold">{s.revenue}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {recentBookings.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Bookings</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBookings.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {b.type === "Flight" ? <Plane className="w-4 h-4" /> : b.type === "Hotel" ? <Building2 className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{b.customer}</p><p className="text-xs text-muted-foreground truncate">{b.id} • {b.route}</p></div>
                    <Badge variant="outline" className={`text-[10px] capitalize hidden sm:inline-flex ${statusColors[b.status] || ''}`}>{b.status}</Badge>
                    <span className="text-sm font-semibold">{b.amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </DataLoader>
    </div>
  );
};

export default AdminDashboard;
