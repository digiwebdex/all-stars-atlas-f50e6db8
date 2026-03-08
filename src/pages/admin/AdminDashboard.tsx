import { Badge } from "@/components/ui/badge";
import { Ticket, Users, CreditCard, TrendingUp, Plane, Building2, Globe, ArrowUpRight, Activity, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { useAdminDashboard } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";


const statMeta = [
  { icon: Ticket, gradient: "stat-gradient-blue", iconClass: "icon-glow-blue" },
  { icon: Users, gradient: "stat-gradient-purple", iconClass: "icon-glow-purple" },
  { icon: CreditCard, gradient: "stat-gradient-green", iconClass: "icon-glow-green" },
  { icon: TrendingUp, gradient: "stat-gradient-orange", iconClass: "icon-glow-orange" },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-success/10 text-success border border-success/20",
  pending: "bg-warning/10 text-warning border border-warning/20",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } } };

const AdminDashboard = () => {
  const { data, isLoading, error, refetch } = useAdminDashboard();

  const resolved = (data as any) || {};

  // Map backend response to UI format
  const stats = resolved.stats || [
    { label: 'Total Bookings', value: resolved.totalBookings ?? 0, change: '+12%' },
    { label: 'Total Users', value: resolved.totalUsers ?? 0, change: '+8%' },
    { label: 'Revenue', value: resolved.totalRevenue ? `৳${Number(resolved.totalRevenue).toLocaleString()}` : '৳0', change: '+15%' },
    { label: 'Active Visas', value: resolved.activeVisaApplications ?? 0, change: '+5%' },
  ];

  const revenueData = resolved.revenueData || (resolved.monthlyRevenue || []).map((m: any) => ({
    day: m.month, value: m.revenue,
  }));

  const recentBookings = (resolved.recentBookings || []).map((b: any) => ({
    id: b.bookingRef || b.id,
    customer: b.user?.name || 'Guest',
    type: b.bookingType ? b.bookingType.charAt(0).toUpperCase() + b.bookingType.slice(1) : 'Booking',
    route: `${b.bookingType || 'service'} • ${b.bookingRef || ''}`,
    status: b.status || 'pending',
    amount: `৳${Number(b.totalAmount || 0).toLocaleString()}`,
  }));

  const bookingsByType = resolved.bookingsByType || {};
  const topServices = resolved.topServices || Object.entries(bookingsByType).map(([name, count]: any) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    bookings: count,
    revenue: '',
  }));

  return (
    <DataLoader isLoading={isLoading} error={error} skeleton="dashboard" retry={refetch}>
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              Admin Dashboard
              <Zap className="w-5 h-5 text-warning" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Welcome back, Super Admin</p>
          </div>
          <Badge className="bg-success/10 text-success border-success/20 text-xs w-fit">
            <Activity className="w-3 h-3 mr-1 animate-pulse" /> System Online
          </Badge>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat: any, i: number) => {
            const meta = statMeta[i % statMeta.length];
            const Icon = meta.icon;
            return (
              <div key={i} className={`dash-stat-card ${meta.gradient} p-4 sm:p-5`}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${meta.iconClass} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate font-medium">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-black tracking-tight">{stat.value}</p>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-bold text-success shrink-0 bg-success/10 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3.5 h-3.5" /> {stat.change}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 chart-card p-5 sm:p-6">
            <h3 className="text-lg font-bold mb-4">Revenue This Week</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card p-5 sm:p-6">
            <h3 className="text-lg font-bold mb-4">Top Services</h3>
            <div className="space-y-4">
              {topServices.map((s: any, i: number) => {
                const colors = ["from-blue-500 to-indigo-600", "from-violet-500 to-purple-600", "from-emerald-500 to-green-600", "from-amber-500 to-orange-600"];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white`}>
                      <Plane className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.bookings} bookings</p>
                    </div>
                    <span className="text-sm font-bold">{s.revenue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="chart-card overflow-hidden">
          <div className="p-5 pb-3"><h3 className="text-lg font-bold">Recent Bookings</h3></div>
          <div className="px-5 pb-5 space-y-2">
            {recentBookings.map((b: any, idx: number) => (
              <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {b.type === "Flight" ? <Plane className="w-4 h-4" /> : b.type === "Hotel" ? <Building2 className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{b.customer}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.id} • {b.route}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] font-bold capitalize hidden sm:inline-flex ${statusColors[b.status] || ''}`}>{b.status}</Badge>
                <span className="text-sm font-bold">{b.amount}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </DataLoader>
  );
};

export default AdminDashboard;
