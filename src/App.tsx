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

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";

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

          {/* Auth Routes (no header/footer) */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* Customer Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
