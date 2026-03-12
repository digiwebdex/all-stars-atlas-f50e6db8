import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, CreditCard, Plane, Clock, ArrowRight, MapPin, TrendingUp, Calendar, Globe, Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useDashboardStats, useDashboardBookings } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { motion } from "framer-motion";
import PaymentReminderBanner from "@/components/PaymentReminder";

import { useAuth } from "@/hooks/useAuth";

const quickActions = [
  { label: "Book a Flight", href: "/", icon: Plane, desc: "Search & compare fares", color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20" },
  { label: "My Bookings", href: "/dashboard/bookings", icon: Ticket, desc: "View all bookings", color: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20" },
  { label: "Manage Travellers", href: "/dashboard/travellers", icon: MapPin, desc: "Edit saved profiles", color: "from-emerald-500 to-green-600", shadow: "shadow-emerald-500/20" },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-success/10 text-success border border-success/20",
  pending: "bg-warning/10 text-warning border border-warning/20",
  "in-progress": "bg-primary/10 text-primary border border-primary/20",
  "In Progress": "bg-primary/10 text-primary border border-primary/20",
  completed: "bg-muted text-muted-foreground",
};

const statMeta = [
  { icon: Ticket, gradient: "stat-gradient-blue", iconClass: "icon-glow-blue" },
  { icon: Plane, gradient: "stat-gradient-purple", iconClass: "icon-glow-purple" },
  { icon: CreditCard, gradient: "stat-gradient-green", iconClass: "icon-glow-green" },
  { icon: Clock, gradient: "stat-gradient-orange", iconClass: "icon-glow-orange" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } } };

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "🌤️" };
  if (hour < 21) return { text: "Good Evening", emoji: "🌅" };
  return { text: "Good Night", emoji: "🌙" };
};

const DashboardHome = () => {
  const { user } = useAuth();
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: statsRefetch } = useDashboardStats();
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useDashboardBookings({ limit: 4 });

  const resolvedStats = (statsData as any) || {};
  const resolvedBookings = (bookingsData as any) || {};

  const stats = resolvedStats.stats || [];
  const upcomingTrip = resolvedStats.upcomingTrip;
  const spendingData = resolvedStats.spendingData || [];
  // Normalize pie data — backend may return counts, convert to percentages
  const rawPieData = resolvedStats.bookingBreakdown || [];
  const pieTotal = rawPieData.reduce((s: number, d: any) => s + (d.value || 0), 0);
  const pieData = pieTotal > 0 ? rawPieData.map((d: any) => ({
    ...d,
    value: Math.round((d.value / pieTotal) * 100),
  })) : rawPieData;
  const recentBookings = resolvedBookings.data?.slice(0, 4) || resolvedBookings.bookings?.slice(0, 4) || [];
  const displayName = user?.name || resolvedStats.user?.name || '';
  const greeting = getGreeting();

  return (
    <DataLoader isLoading={statsLoading && bookingsLoading} error={statsError || bookingsError} skeleton="dashboard" retry={statsRefetch}>
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">

        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              {greeting.text}{displayName ? `, ${displayName}` : ''}
              <motion.span
                className="text-2xl"
                initial={{ rotate: -20, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
              >
                {greeting.emoji}
              </motion.span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Here's your travel overview for today</p>
          </div>
          <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 border-0 group btn-elastic">
            <Link to="/">
              <Plane className="w-4 h-4 mr-1.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> Book New Trip
            </Link>
          </Button>
        </motion.div>

        <div>
          {/* Stats */}
          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat: any, i: number) => {
              const meta = statMeta[i % statMeta.length];
              const Icon = meta.icon;
              return (
                <div key={i} className={`dash-stat-card ${meta.gradient} p-4 sm:p-5`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl ${meta.iconClass} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {stat.change && (
                      <div className="flex items-center gap-0.5 text-xs font-bold text-success">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Upcoming Trip Banner */}
          {upcomingTrip && (
            <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 text-white shadow-2xl shadow-primary/20 mt-6">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
              <div className="relative p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-white/20 text-white border-0 text-xs font-bold backdrop-blur-sm">{upcomingTrip.daysLeft} days left</Badge>
                      <span className="text-xs text-white/60">Next Trip</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1">{upcomingTrip.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {upcomingTrip.date}</span>
                      {upcomingTrip.flight && <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> {upcomingTrip.flight}</span>}
                      {upcomingTrip.duration && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {upcomingTrip.duration}</span>}
                    </div>
                  </div>
                  <Button className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg" asChild>
                    <Link to="/dashboard/bookings">View Details <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="grid lg:grid-cols-5 gap-6 mt-6">
            {spendingData.length > 0 && (
              <div className="lg:col-span-3 chart-card p-5 sm:p-6">
                <h3 className="text-base font-bold mb-4">Spending Overview</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={spendingData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(217, 91%, 50%)" />
                        <stop offset="100%" stopColor="hsl(260, 70%, 55%)" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${v / 1000}K`} />
                    <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Spent']} contentStyle={{ borderRadius: '12px', border: '1px solid hsl(220, 13%, 91%)', fontSize: '13px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="amount" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {pieData.length > 0 && (
              <div className="lg:col-span-2 chart-card p-5 sm:p-6">
                <h3 className="text-base font-bold mb-4">Booking Breakdown</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-3">
                  {pieData.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: d.color }} />
                      <span className="text-muted-foreground font-medium">{d.name} {d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <Link key={i} to={action.href}>
              <div className={`dash-card group cursor-pointer p-5 hover:border-primary/20 spotlight`}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg ${action.shadow}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold">{action.label}</span>
                    <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Recent Bookings */}
        <div>
          {recentBookings.length > 0 && (
            <motion.div variants={item} className="chart-card overflow-hidden">
              <div className="flex items-center justify-between p-5 pb-3">
                <h3 className="text-lg font-bold">Recent Bookings</h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/bookings" className="text-primary text-sm font-medium">View All <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
              <div className="px-5 pb-5 space-y-2">
                {recentBookings.map((b: any, idx: number) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary">
                      {b.type === "flight" ? <Plane className="w-4 h-4" /> : b.type === "hotel" ? <MapPin className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{b.title}</p>
                      <p className="text-xs text-muted-foreground">{b.id} • {b.date}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[b.status] || "bg-muted text-muted-foreground"}`}>
                      {b.status}
                    </span>
                    <span className="text-sm font-bold hidden sm:block">{b.amount}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </DataLoader>
  );
};

export default DashboardHome;
