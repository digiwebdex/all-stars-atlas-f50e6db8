import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

// ============ DASHBOARD ============

export const useDashboardStats = () =>
  useQuery({ queryKey: ['dashboard', 'stats'], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_STATS) });

export const useDashboardBookings = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['dashboard', 'bookings', params], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_BOOKINGS, params) });

export const useDashboardTransactions = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['dashboard', 'transactions', params], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_TRANSACTIONS, params) });

export const useDashboardTravellers = () =>
  useQuery({ queryKey: ['dashboard', 'travellers'], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_TRAVELLERS) });

export const useCreateTraveller = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.DASHBOARD_TRAVELLERS, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'travellers'] }),
  });
};

export const useDeleteTraveller = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => api.delete(`${API_ENDPOINTS.DASHBOARD_TRAVELLERS}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'travellers'] }),
  });
};

export const useDashboardPayments = () =>
  useQuery({ queryKey: ['dashboard', 'payments'], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_PAYMENTS) });

export const useSubmitPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.DASHBOARD_PAYMENTS, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'payments'] }),
  });
};

export const useDashboardTickets = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['dashboard', 'tickets', params], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_TICKETS, params) });

export const useDashboardWishlist = () =>
  useQuery({ queryKey: ['dashboard', 'wishlist'], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_WISHLIST) });

export const useAddWishlistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.DASHBOARD_WISHLIST, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'wishlist'] }),
  });
};

export const useRemoveWishlistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => api.delete(`${API_ENDPOINTS.DASHBOARD_WISHLIST}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'wishlist'] }),
  });
};

export const useDashboardSettings = () =>
  useQuery({ queryKey: ['dashboard', 'settings'], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_SETTINGS) });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(API_ENDPOINTS.DASHBOARD_SETTINGS, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'settings'] }),
  });
};

export const useChangePassword = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(`${API_ENDPOINTS.DASHBOARD_SETTINGS}/password`, data) });

export const useDashboardSearchHistory = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['dashboard', 'search-history', params], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_SEARCH_HISTORY, params) });

export const useDashboardETransactions = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['dashboard', 'e-transactions', params], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_E_TRANSACTIONS, params) });

export const useDashboardPayLater = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['dashboard', 'pay-later', params], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_PAY_LATER, params) });

export const useDashboardInvoices = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['dashboard', 'invoices', params], queryFn: () => api.get(API_ENDPOINTS.DASHBOARD_INVOICES, params) });

// ============ FLIGHTS ============

export const useFlightSearch = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['flights', 'search', params], queryFn: () => api.get(API_ENDPOINTS.FLIGHTS_SEARCH, params), enabled: !!params });

export const useFlightDetails = (id?: string) =>
  useQuery({ queryKey: ['flights', id], queryFn: () => api.get(`${API_ENDPOINTS.FLIGHTS_DETAILS}/${id}`), enabled: !!id });

export const useBookFlight = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.FLIGHTS_BOOK, data) });

// ============ HOTELS ============

export const useHotelSearch = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['hotels', 'search', params], queryFn: () => api.get(API_ENDPOINTS.HOTELS_SEARCH, params), enabled: !!params });

export const useHotelDetails = (id?: string) =>
  useQuery({ queryKey: ['hotels', id], queryFn: () => api.get(`${API_ENDPOINTS.HOTELS_DETAILS}/${id}`), enabled: !!id });

export const useBookHotel = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.HOTELS_BOOK, data) });

// ============ HOLIDAYS ============

export const useHolidaySearch = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['holidays', 'search', params], queryFn: () => api.get(API_ENDPOINTS.HOLIDAYS_SEARCH, params), enabled: !!params });

export const useHolidayDetails = (id?: string) =>
  useQuery({ queryKey: ['holidays', id], queryFn: () => api.get(`${API_ENDPOINTS.HOLIDAYS_DETAILS}/${id}`), enabled: !!id });

export const useBookHoliday = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.HOLIDAYS_BOOK, data) });

// ============ VISA ============

export const useVisaCountries = () =>
  useQuery({ queryKey: ['visa', 'countries'], queryFn: () => api.get(API_ENDPOINTS.VISA_COUNTRIES) });

export const useSubmitVisaApplication = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.VISA_APPLY, data) });

// ============ MEDICAL ============

export const useMedicalHospitals = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['medical', 'hospitals', params], queryFn: () => api.get(API_ENDPOINTS.MEDICAL_HOSPITALS, params), enabled: !!params });

export const useBookMedical = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.MEDICAL_BOOK, data) });

// ============ CARS ============

export const useCarSearch = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['cars', 'search', params], queryFn: () => api.get(API_ENDPOINTS.CARS_SEARCH, params), enabled: !!params });

export const useBookCar = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.CARS_BOOK, data) });

// ============ ESIM ============

export const useESIMPlans = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['esim', 'plans', params], queryFn: () => api.get(API_ENDPOINTS.ESIM_PLANS, params), enabled: !!params });

export const useESIMCountries = () =>
  useQuery({ queryKey: ['esim', 'countries'], queryFn: () => api.get(API_ENDPOINTS.ESIM_COUNTRIES) });

export const usePurchaseESIM = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.ESIM_PURCHASE, data) });

// ============ RECHARGE ============

export const useRechargeOperators = () =>
  useQuery({ queryKey: ['recharge', 'operators'], queryFn: () => api.get(API_ENDPOINTS.RECHARGE_OPERATORS) });

export const useSubmitRecharge = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.RECHARGE_SUBMIT, data) });

// ============ PAY BILL ============

export const useBillCategories = () =>
  useQuery({ queryKey: ['paybill', 'categories'], queryFn: () => api.get(API_ENDPOINTS.PAYBILL_CATEGORIES) });

export const useSubmitBillPayment = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.PAYBILL_SUBMIT, data) });

// ============ ADMIN ============

export const useAdminDashboard = () =>
  useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => api.get(API_ENDPOINTS.ADMIN_DASHBOARD) });

export const useAdminUsers = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['admin', 'users', params], queryFn: () => api.get(API_ENDPOINTS.ADMIN_USERS, params) });

export const useAdminBookings = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['admin', 'bookings', params], queryFn: () => api.get(API_ENDPOINTS.ADMIN_BOOKINGS, params) });

export const useAdminPayments = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['admin', 'payments', params], queryFn: () => api.get(API_ENDPOINTS.ADMIN_PAYMENTS, params) });

export const useAdminReports = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['admin', 'reports', params], queryFn: () => api.get(API_ENDPOINTS.ADMIN_REPORTS, params) });

export const useAdminSettings = () =>
  useQuery({ queryKey: ['admin', 'settings'], queryFn: () => api.get(API_ENDPOINTS.ADMIN_SETTINGS) });

export const useUpdateAdminSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(API_ENDPOINTS.ADMIN_SETTINGS, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }),
  });
};

export const useAdminVisa = (params?: Record<string, string | number | boolean | undefined>) =>
  useQuery({ queryKey: ['admin', 'visa', params], queryFn: () => api.get(API_ENDPOINTS.ADMIN_VISA, params) });

// ============ CMS ============

export const useCMSPages = () =>
  useQuery({ queryKey: ['cms', 'pages'], queryFn: () => api.get(API_ENDPOINTS.CMS_PAGES) });

export const useCMSBlog = () =>
  useQuery({ queryKey: ['cms', 'blog'], queryFn: () => api.get(API_ENDPOINTS.CMS_BLOG) });

export const useCMSPromotions = () =>
  useQuery({ queryKey: ['cms', 'promotions'], queryFn: () => api.get(API_ENDPOINTS.CMS_PROMOTIONS) });

export const useCMSDestinations = () =>
  useQuery({ queryKey: ['cms', 'destinations'], queryFn: () => api.get(API_ENDPOINTS.CMS_DESTINATIONS) });

export const useCMSMedia = () =>
  useQuery({ queryKey: ['cms', 'media'], queryFn: () => api.get(API_ENDPOINTS.CMS_MEDIA) });

export const useCMSEmailTemplates = () =>
  useQuery({ queryKey: ['cms', 'email-templates'], queryFn: () => api.get(API_ENDPOINTS.CMS_EMAIL_TEMPLATES) });

// ============ CONTACT ============

export const useSubmitContact = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post(API_ENDPOINTS.CONTACT_SUBMIT, data) });
