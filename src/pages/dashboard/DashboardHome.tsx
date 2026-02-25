import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, CreditCard, Plane, Clock, ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Total Bookings", value: "5", icon: Ticket, color: "text-primary", bg: "bg-primary/10" },
  { label: "Active Trips", value: "1", icon: Plane, color: "text-accent", bg: "bg-accent/10" },
  { label: "Total Spent", value: "৳87,900", icon: CreditCard, color: "text-success", bg: "bg-success/10" },
  { label: "Pending", value: "1", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
];

const recentBookings = [
  { id: "BK-20250001", title: "Dhaka → Cox's Bazar", date: "Mar 15, 2025", status: "confirmed", amount: "৳4,500" },
  { id: "BK-20250002", title: "Sea Pearl Beach Resort", date: "Mar 16, 2025", status: "pending", amount: "৳17,000" },
  { id: "BK-20250003", title: "Dhaka → Bangkok", date: "Apr 1, 2025", status: "confirmed", amount: "৳32,000" },
];

const quickActions = [
  { label: "Book a Flight", href: "/", icon: Plane },
  { label: "My Bookings", href: "/dashboard/bookings", icon: Ticket },
  { label: "Manage Travellers", href: "/dashboard/travellers", icon: MapPin },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, John 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your travel overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action, i) => (
          <Link key={i} to={action.href}>
            <Card className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold flex-1">{action.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/bookings" className="text-primary text-sm font-medium">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No bookings yet. Start by searching for flights!</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.id} • {b.date}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    b.status === "confirmed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                    {b.status}
                  </span>
                  <span className="text-sm font-semibold hidden sm:block">{b.amount}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
