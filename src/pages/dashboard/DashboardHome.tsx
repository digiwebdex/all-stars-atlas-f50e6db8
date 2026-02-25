import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, CreditCard, Plane, Clock } from "lucide-react";

const stats = [
  { label: "Total Bookings", value: "0", icon: Ticket, color: "text-primary" },
  { label: "Active Trips", value: "0", icon: Plane, color: "text-accent" },
  { label: "Total Spent", value: "৳0", icon: CreditCard, color: "text-secondary" },
  { label: "Pending", value: "0", icon: Clock, color: "text-warning" },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No bookings yet. Start by searching for flights!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
