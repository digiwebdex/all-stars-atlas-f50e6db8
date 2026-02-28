import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Layouts
import PublicLayout from "@/components/layout/PublicLayout";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import AdminLayout from "@/pages/admin/AdminLayout";

// Public Pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import VerifyOTP from "@/pages/auth/VerifyOTP";
import FlightResults from "@/pages/flights/FlightResults";
import HotelResults from "@/pages/hotels/HotelResults";
import VisaServices from "@/pages/visa/VisaServices";
import HolidayPackages from "@/pages/holidays/HolidayPackages";
import About from "@/pages/static/About";
import Contact from "@/pages/static/Contact";
import Terms from "@/pages/static/Terms";
import Privacy from "@/pages/static/Privacy";
import RefundPolicy from "@/pages/static/RefundPolicy";
import FAQ from "@/pages/static/FAQ";
import Careers from "@/pages/static/Careers";
import FlightBooking from "@/pages/flights/FlightBooking";
import HotelDetail from "@/pages/hotels/HotelDetail";
import HolidayDetail from "@/pages/holidays/HolidayDetail";
import VisaApplication from "@/pages/visa/VisaApplication";
import BookingConfirmation from "@/pages/booking/BookingConfirmation";

// New Service Pages
import MedicalServices from "@/pages/medical/MedicalServices";
import MedicalBooking from "@/pages/medical/MedicalBooking";
import CarRental from "@/pages/cars/CarRental";
import CarBooking from "@/pages/cars/CarBooking";
import ESIMPlans from "@/pages/esim/ESIMPlans";
import ESIMPurchase from "@/pages/esim/ESIMPurchase";
import RechargePage from "@/pages/recharge/RechargePage";
import PayBillPage from "@/pages/paybill/PayBillPage";

// Dashboard Pages
import DashboardHome from "@/pages/dashboard/DashboardHome";
import DashboardBookings from "@/pages/dashboard/DashboardBookings";
import DashboardTransactions from "@/pages/dashboard/DashboardTransactions";
import DashboardPayments from "@/pages/dashboard/DashboardPayments";
import DashboardTravellers from "@/pages/dashboard/DashboardTravellers";
import DashboardSettings from "@/pages/dashboard/DashboardSettings";
import DashboardTickets from "@/pages/dashboard/DashboardTickets";
import DashboardWishlist from "@/pages/dashboard/DashboardWishlist";
import DashboardSearchHistory from "@/pages/dashboard/DashboardSearchHistory";
import DashboardETransactions from "@/pages/dashboard/DashboardETransactions";
import DashboardPayLater from "@/pages/dashboard/DashboardPayLater";
import DashboardInvoices from "@/pages/dashboard/DashboardInvoices";

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
import CMSHomepage from "@/pages/admin/cms/CMSHomepage";
import CMSFooter from "@/pages/admin/cms/CMSFooter";
import CMSSeo from "@/pages/admin/cms/CMSSeo";
import AdminVisa from "@/pages/admin/AdminVisa";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminInvoices from "@/pages/admin/AdminInvoices";
import AdminPaymentApprovals from "@/pages/admin/AdminPaymentApprovals";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
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
                <Route path="/faq" element={<FAQ />} />
                <Route path="/careers" element={<Careers />} />
                {/* New Service Routes */}
                <Route path="/medical" element={<MedicalServices />} />
                <Route path="/medical/book" element={<MedicalBooking />} />
                <Route path="/cars" element={<CarRental />} />
                <Route path="/cars/book" element={<CarBooking />} />
                <Route path="/esim" element={<ESIMPlans />} />
                <Route path="/esim/purchase" element={<ESIMPurchase />} />
                <Route path="/recharge" element={<RechargePage />} />
                <Route path="/paybill" element={<PayBillPage />} />
              </Route>

              {/* User Auth (public) */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/verify-otp" element={<VerifyOTP />} />

              {/* Hidden Admin Login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Customer Dashboard — Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="bookings" element={<DashboardBookings />} />
                <Route path="transactions" element={<DashboardTransactions />} />
                <Route path="payments" element={<DashboardPayments />} />
                <Route path="travellers" element={<DashboardTravellers />} />
                <Route path="settings" element={<DashboardSettings />} />
                <Route path="tickets" element={<DashboardTickets />} />
                <Route path="wishlist" element={<DashboardWishlist />} />
                <Route path="search-history" element={<DashboardSearchHistory />} />
                <Route path="e-transactions" element={<DashboardETransactions />} />
                <Route path="pay-later" element={<DashboardPayLater />} />
                <Route path="invoices" element={<DashboardInvoices />} />
              </Route>

              {/* Admin Dashboard — Admin Protected */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="cms/pages" element={<CMSPages />} />
                <Route path="cms/homepage" element={<CMSHomepage />} />
                <Route path="cms/footer" element={<CMSFooter />} />
                <Route path="cms/seo" element={<CMSSeo />} />
                <Route path="cms/promotions" element={<CMSPromotions />} />
                <Route path="cms/media" element={<CMSMedia />} />
                <Route path="cms/blog" element={<CMSBlog />} />
                <Route path="cms/email-templates" element={<CMSEmailTemplates />} />
                <Route path="cms/destinations" element={<CMSDestinations />} />
                <Route path="visa" element={<AdminVisa />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="invoices" element={<AdminInvoices />} />
                <Route path="payment-approvals" element={<AdminPaymentApprovals />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
