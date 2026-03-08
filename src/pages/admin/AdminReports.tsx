import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Users, Plane, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useAdminReports } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { useState } from "react";

const AdminReports = () => {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, error, refetch } = useAdminReports({ period });
  const kpis = (data as any)?.kpis || [];
  const revenueData = (data as any)?.revenueData || [];
  const bookingData = (data as any)?.bookingData || [];
  const pieData = (data as any)?.pieData || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem><SelectItem value="1y">Last year</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
        </div>
      </div>

      <DataLoader isLoading={isLoading} error={null} skeleton="dashboard" retry={refetch}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k: any, i: number) => {
            const icons = [TrendingUp, Plane, Users, Building2];
            const Icon = icons[i % icons.length];
            return (
              <Card key={i}><CardContent className="p-5">
                <div className="flex items-center justify-between mb-2"><Icon className="w-5 h-5 text-primary" /><span className="text-xs font-semibold text-success">{k.change}</span></div>
                <p className="text-2xl font-bold">{k.value}</p><p className="text-xs text-muted-foreground">{k.label}</p>
              </CardContent></Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {revenueData.length > 0 && (
            <Card><CardHeader><CardTitle className="text-lg">Revenue Trend</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}><BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><Tooltip /><Bar dataKey="revenue" fill="hsl(217, 91%, 50%)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            </CardContent></Card>
          )}
          {bookingData.length > 0 && (
            <Card><CardHeader><CardTitle className="text-lg">Bookings by Type</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}><LineChart data={bookingData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><Tooltip /><Line type="monotone" dataKey="flights" stroke="hsl(217, 91%, 50%)" strokeWidth={2} /><Line type="monotone" dataKey="hotels" stroke="hsl(167, 72%, 41%)" strokeWidth={2} /><Line type="monotone" dataKey="holidays" stroke="hsl(24, 100%, 50%)" strokeWidth={2} /></LineChart></ResponsiveContainer>
            </CardContent></Card>
          )}
        </div>

        {pieData.length > 0 && (
          <Card><CardHeader><CardTitle className="text-lg">Revenue Distribution</CardTitle></CardHeader><CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ResponsiveContainer width={200} height={200}><PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>{pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4">{pieData.map((d: any, i: number) => <div key={i} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: d.color }} /><span className="text-sm">{d.name}: <strong>{d.value}%</strong></span></div>)}</div>
            </div>
          </CardContent></Card>
        )}
      </DataLoader>
    </div>
  );
};

export default AdminReports;
