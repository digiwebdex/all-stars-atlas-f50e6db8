import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Users, CreditCard, TrendingUp, Plane, Building2, Globe, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const stats = [
  { label: "Total Bookings", value: "1,247", icon: Ticket, change: "+12%", color: "text-primary", bg: "bg-primary/10" },
  { label: "Active Users", value: "3,482", icon: Users, change: "+24%", color: "text-accent", bg: "bg-accent/10" },
  { label: "Revenue", value: "৳12.4M", icon: CreditCard, change: "+18%", color: "text-success", bg: "bg-success/10" },
  { label: "Pending Payments", value: "23", icon: TrendingUp, change: "-5%", color: "text-warning", bg: "bg-warning/10" },
];

const recentBookings = [
  { id: "BK-001", customer: "Rafiq Ahmed", type: "Flight", route: "DAC → CXB", amount: "৳4,500", status: "confirmed" },
  { id: "BK-002", customer: "Fatema Khatun", type: "Hotel", route: "Sea Pearl", amount: "৳17,000", status: "pending" },
  { id: "BK-003", customer: "Kamal Hossain", type: "Flight", route: "DAC → BKK", amount: "৳32,000", status: "confirmed" },
  { id: "BK-004", customer: "Nusrat Jahan", type: "Holiday", route: "Maldives", amount: "৳68,000", status: "pending" },
];

const revenueData = [
  { day: "Mon", value: 180000 },
  { day: "Tue", value: 220000 },
  { day: "Wed", value: 310000 },
  { day: "Thu", value: 250000 },
  { day: "Fri", value: 420000 },
  { day: "Sat", value: 380000 },
  { day: "Sun", value: 290000 },
];

const topServices = [
  { name: "Domestic Flights", bookings: 542, revenue: "৳4.2M", icon: Plane },
  { name: "International Flights", bookings: 328, revenue: "৳5.8M", icon: Plane },
  { name: "Hotels", bookings: 234, revenue: "৳1.6M", icon: Building2 },
  { name: "Visa Services", bookings: 143, revenue: "৳0.8M", icon: Globe },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
};

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, Super Admin</p>
        </div>
        <Badge variant="outline" className="bg-success/10 text-success text-xs">System Online</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className="flex items-center gap-0.5 text-xs font-semibold text-success">
                <ArrowUpRight className="w-3.5 h-3.5" /> {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Revenue This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(217, 91%, 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topServices.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.bookings} bookings</p>
                </div>
                <span className="text-sm font-semibold">{s.revenue}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {b.type === "Flight" ? <Plane className="w-4 h-4" /> : b.type === "Hotel" ? <Building2 className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{b.customer}</p>
                  <p className="text-xs text-muted-foreground">{b.id} • {b.route}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] capitalize hidden sm:inline-flex ${statusColors[b.status]}`}>
                  {b.status}
                </Badge>
                <span className="text-sm font-semibold">{b.amount}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
