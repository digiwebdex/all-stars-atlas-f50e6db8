import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";

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
import About from "@/pages/static/About";
import Contact from "@/pages/static/Contact";
import Terms from "@/pages/static/Terms";
import Privacy from "@/pages/static/Privacy";
import RefundPolicy from "@/pages/static/RefundPolicy";
import FlightBooking from "@/pages/flights/FlightBooking";
import HotelDetail from "@/pages/hotels/HotelDetail";
import HolidayDetail from "@/pages/holidays/HolidayDetail";
import VisaApplication from "@/pages/visa/VisaApplication";
import BookingConfirmation from "@/pages/booking/BookingConfirmation";

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
import CMSBlog from "@/pages/admin/cms/CMSBlog";
import CMSEmailTemplates from "@/pages/admin/cms/CMSEmailTemplates";
import CMSDestinations from "@/pages/admin/cms/CMSDestinations";
import AdminVisa from "@/pages/admin/AdminVisa";
import AdminSettings from "@/pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
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
            <Route path="/flights/book" element={<FlightBooking />} />
            <Route path="/hotels" element={<HotelResults />} />
            <Route path="/hotels/:id" element={<HotelDetail />} />
            <Route path="/visa" element={<VisaServices />} />
            <Route path="/visa/apply" element={<VisaApplication />} />
            <Route path="/holidays" element={<HolidayPackages />} />
            <Route path="/holidays/:id" element={<HolidayDetail />} />
            <Route path="/booking/confirmation" element={<BookingConfirmation />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
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
            <Route path="cms/blog" element={<CMSBlog />} />
            <Route path="cms/email-templates" element={<CMSEmailTemplates />} />
            <Route path="cms/destinations" element={<CMSDestinations />} />
            <Route path="visa" element={<AdminVisa />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
