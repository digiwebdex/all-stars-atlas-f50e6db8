// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_VERIFY_OTP: '/auth/verify-otp',
  AUTH_RESET_PASSWORD: '/auth/reset-password',

  // Flights
  FLIGHTS_SEARCH: '/flights/search',
  FLIGHTS_DETAILS: '/flights',
  FLIGHTS_BOOK: '/flights/book',

  // Hotels
  HOTELS_SEARCH: '/hotels/search',
  HOTELS_DETAILS: '/hotels',
  HOTELS_BOOK: '/hotels/book',

  // Holidays
  HOLIDAYS_SEARCH: '/holidays/search',
  HOLIDAYS_DETAILS: '/holidays',
  HOLIDAYS_BOOK: '/holidays/book',

  // Visa
  VISA_COUNTRIES: '/visa/countries',
  VISA_APPLY: '/visa/apply',
  VISA_APPLICATIONS: '/visa/applications',

  // Medical
  MEDICAL_SEARCH: '/medical/search',
  MEDICAL_HOSPITALS: '/medical/hospitals',
  MEDICAL_BOOK: '/medical/book',

  // Cars
  CARS_SEARCH: '/cars/search',
  CARS_DETAILS: '/cars',
  CARS_BOOK: '/cars/book',

  // eSIM
  ESIM_PLANS: '/esim/plans',
  ESIM_PURCHASE: '/esim/purchase',

  // Recharge
  RECHARGE_OPERATORS: '/recharge/operators',
  RECHARGE_SUBMIT: '/recharge/submit',

  // Pay Bill
  PAYBILL_CATEGORIES: '/paybill/categories',
  PAYBILL_BILLERS: '/paybill/billers',
  PAYBILL_SUBMIT: '/paybill/submit',

  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_BOOKINGS: '/dashboard/bookings',
  DASHBOARD_TRANSACTIONS: '/dashboard/transactions',
  DASHBOARD_TRAVELLERS: '/dashboard/travellers',
  DASHBOARD_PAYMENTS: '/dashboard/payments',
  DASHBOARD_TICKETS: '/dashboard/tickets',
  DASHBOARD_WISHLIST: '/dashboard/wishlist',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  DASHBOARD_SEARCH_HISTORY: '/dashboard/search-history',
  DASHBOARD_E_TRANSACTIONS: '/dashboard/e-transactions',
  DASHBOARD_PAY_LATER: '/dashboard/pay-later',
  DASHBOARD_INVOICES: '/dashboard/invoices',

  // Admin
  ADMIN_LOGIN: '/auth/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_VISA: '/admin/visa',
  ADMIN_DISCOUNTS: '/admin/discounts',
  ADMIN_INVOICES: '/admin/invoices',
  ADMIN_PAYMENT_APPROVALS: '/admin/payment-approvals',

  // CMS
  CMS_PAGES: '/admin/cms/pages',
  CMS_BLOG: '/admin/cms/blog',
  CMS_PROMOTIONS: '/admin/cms/promotions',
  CMS_DESTINATIONS: '/admin/cms/destinations',
  CMS_MEDIA: '/admin/cms/media',
  CMS_EMAIL_TEMPLATES: '/admin/cms/email-templates',

  // Contact
  CONTACT_SUBMIT: '/contact/submit',
} as const;

// Booking statuses
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  BKASH: 'bkash',
  NAGAD: 'nagad',
  ROCKET: 'rocket',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
} as const;

// User roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

// Visa statuses
export const VISA_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Cabin classes
export const CABIN_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First'] as const;

// Treatment types for medical tourism
export const TREATMENT_TYPES = [
  'General Checkup', 'Cardiac Surgery', 'Orthopedic', 'Dental',
  'Eye Care', 'Cosmetic Surgery', 'Fertility Treatment', 'Cancer Treatment',
  'Neurology', 'Organ Transplant',
] as const;

// Car types
export const CAR_TYPES = [
  'Economy', 'Compact', 'Sedan', 'SUV', 'Luxury', 'Van', 'Minibus',
] as const;

// Recharge operators (BD)
export const RECHARGE_OPERATORS = [
  { id: 'grameenphone', name: 'Grameenphone', logo: '🟢' },
  { id: 'robi', name: 'Robi', logo: '🔴' },
  { id: 'banglalink', name: 'Banglalink', logo: '🟠' },
  { id: 'airtel', name: 'Airtel', logo: '🔵' },
  { id: 'teletalk', name: 'Teletalk', logo: '🟣' },
] as const;

// Bill categories
export const BILL_CATEGORIES = [
  'Electricity', 'Gas', 'Water', 'Internet', 'TV Cable', 'Insurance',
  'Education', 'Government Fees', 'Credit Card',
] as const;

// eSIM data plans
export const ESIM_DATA_PLANS = [
  { id: '1gb-7d', data: '1 GB', duration: '7 Days', price: 500 },
  { id: '3gb-15d', data: '3 GB', duration: '15 Days', price: 1200 },
  { id: '5gb-30d', data: '5 GB', duration: '30 Days', price: 2000 },
  { id: '10gb-30d', data: '10 GB', duration: '30 Days', price: 3500 },
  { id: 'unlimited-30d', data: 'Unlimited', duration: '30 Days', price: 5000 },
] as const;
