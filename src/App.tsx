import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense, useEffect } from "react";

// Layouts (keep eager — they wrap everything)
import PublicLayout from "@/components/layout/PublicLayout";

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Scroll to top on route change
const ScrollToTopOnNav = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// Lazy-loaded pages
const Index = lazy(() => import("@/pages/Index"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const VerifyOTP = lazy(() => import("@/pages/auth/VerifyOTP"));
const FlightResults = lazy(() => import("@/pages/flights/FlightResults"));
const HotelResults = lazy(() => import("@/pages/hotels/HotelResults"));
const VisaServices = lazy(() => import("@/pages/visa/VisaServices"));
const HolidayPackages = lazy(() => import("@/pages/holidays/HolidayPackages"));
const About = lazy(() => import("@/pages/static/About"));
const Contact = lazy(() => import("@/pages/static/Contact"));
const Terms = lazy(() => import("@/pages/static/Terms"));
const Privacy = lazy(() => import("@/pages/static/Privacy"));
const RefundPolicy = lazy(() => import("@/pages/static/RefundPolicy"));
const FAQ = lazy(() => import("@/pages/static/FAQ"));
const Careers = lazy(() => import("@/pages/static/Careers"));
const Blog = lazy(() => import("@/pages/static/Blog"));
const BlogPost = lazy(() => import("@/pages/static/BlogPost"));
const FlightBooking = lazy(() => import("@/pages/flights/FlightBooking"));
const HotelDetail = lazy(() => import("@/pages/hotels/HotelDetail"));
const HolidayDetail = lazy(() => import("@/pages/holidays/HolidayDetail"));
const VisaApplication = lazy(() => import("@/pages/visa/VisaApplication"));
const BookingConfirmation = lazy(() => import("@/pages/booking/BookingConfirmation"));
const MedicalServices = lazy(() => import("@/pages/medical/MedicalServices"));
const MedicalBooking = lazy(() => import("@/pages/medical/MedicalBooking"));
const CarRental = lazy(() => import("@/pages/cars/CarRental"));
const CarBooking = lazy(() => import("@/pages/cars/CarBooking"));
const ESIMPlans = lazy(() => import("@/pages/esim/ESIMPlans"));
const ESIMPurchase = lazy(() => import("@/pages/esim/ESIMPurchase"));
const RechargePage = lazy(() => import("@/pages/recharge/RechargePage"));
const PayBillPage = lazy(() => import("@/pages/paybill/PayBillPage"));

// Dashboard
const DashboardLayout = lazy(() => import("@/pages/dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const DashboardBookings = lazy(() => import("@/pages/dashboard/DashboardBookings"));
const DashboardTransactions = lazy(() => import("@/pages/dashboard/DashboardTransactions"));
const DashboardPayments = lazy(() => import("@/pages/dashboard/DashboardPayments"));
const DashboardTravellers = lazy(() => import("@/pages/dashboard/DashboardTravellers"));
const DashboardSettings = lazy(() => import("@/pages/dashboard/DashboardSettings"));
const DashboardTickets = lazy(() => import("@/pages/dashboard/DashboardTickets"));
const DashboardWishlist = lazy(() => import("@/pages/dashboard/DashboardWishlist"));
const DashboardSearchHistory = lazy(() => import("@/pages/dashboard/DashboardSearchHistory"));
const DashboardETransactions = lazy(() => import("@/pages/dashboard/DashboardETransactions"));
const DashboardPayLater = lazy(() => import("@/pages/dashboard/DashboardPayLater"));
const DashboardInvoices = lazy(() => import("@/pages/dashboard/DashboardInvoices"));
const DashboardRewards = lazy(() => import("@/pages/dashboard/DashboardRewards"));
const PostBookingExtras = lazy(() => import("@/pages/dashboard/PostBookingExtras"));

// Admin
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminBookings = lazy(() => import("@/pages/admin/AdminBookings"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminPayments = lazy(() => import("@/pages/admin/AdminPayments"));
const AdminReports = lazy(() => import("@/pages/admin/AdminReports"));
const CMSPages = lazy(() => import("@/pages/admin/cms/CMSPages"));
const CMSPromotions = lazy(() => import("@/pages/admin/cms/CMSPromotions"));
const CMSPopups = lazy(() => import("@/pages/admin/cms/CMSPopups"));
const CMSMedia = lazy(() => import("@/pages/admin/cms/CMSMedia"));
const CMSBlog = lazy(() => import("@/pages/admin/cms/CMSBlog"));
const CMSEmailTemplates = lazy(() => import("@/pages/admin/cms/CMSEmailTemplates"));
const CMSDestinations = lazy(() => import("@/pages/admin/cms/CMSDestinations"));
const CMSHomepage = lazy(() => import("@/pages/admin/cms/CMSHomepage"));
const CMSFooter = lazy(() => import("@/pages/admin/cms/CMSFooter"));
const CMSSeo = lazy(() => import("@/pages/admin/cms/CMSSeo"));
const AdminVisa = lazy(() => import("@/pages/admin/AdminVisa"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminInvoices = lazy(() => import("@/pages/admin/AdminInvoices"));
const AdminPaymentApprovals = lazy(() => import("@/pages/admin/AdminPaymentApprovals"));
const AdminDiscounts = lazy(() => import("@/pages/admin/AdminDiscounts"));
const CMSBookingForms = lazy(() => import("@/pages/admin/cms/CMSBookingForms"));
const AdminMarkup = lazy(() => import("@/pages/admin/AdminMarkup"));
const AdminCurrency = lazy(() => import("@/pages/admin/AdminCurrency"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as any)?.status;
        // Don't retry auth errors or 404s
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <ScrollToTopOnNav />
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
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
                <Route path="rewards" element={<DashboardRewards />} />
                <Route path="bookings/:id/extras" element={<PostBookingExtras />} />
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
                <Route path="cms/popups" element={<CMSPopups />} />
                <Route path="cms/media" element={<CMSMedia />} />
                <Route path="cms/blog" element={<CMSBlog />} />
                <Route path="cms/email-templates" element={<CMSEmailTemplates />} />
                <Route path="cms/destinations" element={<CMSDestinations />} />
                <Route path="cms/booking-forms" element={<CMSBookingForms />} />
                <Route path="visa" element={<AdminVisa />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="invoices" element={<AdminInvoices />} />
                <Route path="payment-approvals" element={<AdminPaymentApprovals />} />
                <Route path="discounts" element={<AdminDiscounts />} />
                <Route path="markup" element={<AdminMarkup />} />
                <Route path="currency" element={<AdminCurrency />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
