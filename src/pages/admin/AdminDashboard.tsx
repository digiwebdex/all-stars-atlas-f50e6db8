import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Users, CreditCard, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total Bookings", value: "0", icon: Ticket, change: "+0%" },
  { label: "Active Users", value: "0", icon: Users, change: "+0%" },
  { label: "Revenue", value: "৳0", icon: CreditCard, change: "+0%" },
  { label: "Pending Payments", value: "0", icon: TrendingUp, change: "0" },
];

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-success">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No bookings to display.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Payments</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No pending payments.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
