import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import AdminLayout from "@/pages/admin/AdminLayout";

// Public Pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import FlightResults from "@/pages/flights/FlightResults";
import HotelResults from "@/pages/hotels/HotelResults";
import VisaServices from "@/pages/visa/VisaServices";
import HolidayPackages from "@/pages/holidays/HolidayPackages";

// Dashboard Pages
import DashboardHome from "@/pages/dashboard/DashboardHome";
import DashboardBookings from "@/pages/dashboard/DashboardBookings";
import DashboardTransactions from "@/pages/dashboard/DashboardTransactions";
import DashboardPayments from "@/pages/dashboard/DashboardPayments";
import DashboardTravellers from "@/pages/dashboard/DashboardTravellers";
import DashboardSettings from "@/pages/dashboard/DashboardSettings";

// Admin Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminReports from "@/pages/admin/AdminReports";
import CMSPages from "@/pages/admin/cms/CMSPages";
import CMSPromotions from "@/pages/admin/cms/CMSPromotions";
import CMSMedia from "@/pages/admin/cms/CMSMedia";
import AdminVisa from "@/pages/admin/AdminVisa";
import AdminSettings from "@/pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/flights" element={<FlightResults />} />
            <Route path="/hotels" element={<HotelResults />} />
            <Route path="/visa" element={<VisaServices />} />
            <Route path="/holidays" element={<HolidayPackages />} />
          </Route>

          {/* User Auth (public) */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* Hidden Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Customer Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="bookings" element={<DashboardBookings />} />
            <Route path="transactions" element={<DashboardTransactions />} />
            <Route path="payments" element={<DashboardPayments />} />
            <Route path="travellers" element={<DashboardTravellers />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="cms/pages" element={<CMSPages />} />
            <Route path="cms/promotions" element={<CMSPromotions />} />
            <Route path="cms/media" element={<CMSMedia />} />
            <Route path="visa" element={<AdminVisa />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
