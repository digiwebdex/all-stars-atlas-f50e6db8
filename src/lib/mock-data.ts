// Fallback mock data for when backend API is unreachable
// Used by dashboard pages to show UI instead of "Failed to load data"

export const mockDashboardStats = {
  stats: [
    { label: "Total Bookings", value: "12", change: "+8%" },
    { label: "Active Trips", value: "2", change: "+1" },
    { label: "Total Spent", value: "৳85,400", change: "+12%" },
    { label: "Pending", value: "3", change: "-2" },
  ],
  user: { name: "User" },
  upcomingTrip: null,
  spendingData: [
    { month: "Jan", amount: 12000 },
    { month: "Feb", amount: 8500 },
    { month: "Mar", amount: 15200 },
    { month: "Apr", amount: 9800 },
    { month: "May", amount: 22000 },
    { month: "Jun", amount: 17900 },
  ],
  bookingBreakdown: [
    { name: "Flights", value: 55, color: "hsl(217, 91%, 50%)" },
    { name: "Hotels", value: 25, color: "hsl(152, 69%, 41%)" },
    { name: "Visa", value: 12, color: "hsl(24, 100%, 50%)" },
    { name: "Holidays", value: 8, color: "hsl(270, 60%, 50%)" },
  ],
};

export const mockDashboardBookings = {
  bookings: [
    { id: "BK-240301", title: "Dhaka → Cox's Bazar", type: "flight", date: "2024-03-15", status: "confirmed", amount: "৳8,500", pnr: "ABC123", pax: 2, ticketNo: "TK-001" },
    { id: "BK-240302", title: "Sea Pearl Resort", type: "hotel", date: "2024-03-16", status: "pending", amount: "৳12,000", pnr: "—", pax: 2, ticketNo: "—" },
    { id: "BK-240303", title: "Dhaka → Bangkok", type: "flight", date: "2024-04-01", status: "confirmed", amount: "৳32,000", pnr: "XYZ789", pax: 1, ticketNo: "TK-002" },
    { id: "BK-240304", title: "Thailand Visa", type: "visa", date: "2024-03-20", status: "In Progress", amount: "৳5,500", pnr: "—", pax: 1, ticketNo: "—" },
  ],
  total: 4,
  tabCounts: { All: 4, Confirmed: 2, Pending: 1, "In Progress": 1 },
};

export const mockTransactions = {
  transactions: [
    { id: "TXN-001", entryType: "AirTicket", reference: "BK-240301", numAmount: -8500, runningBalance: 91500, date: "2024-03-15", createdBy: "System", description: "Flight booking DAC-CXB", type: "debit" },
    { id: "TXN-002", entryType: "BKash", reference: "PAY-001", numAmount: 50000, runningBalance: 100000, date: "2024-03-10", createdBy: "System", description: "Account top-up via bKash", type: "credit" },
    { id: "TXN-003", entryType: "AirTicket", reference: "BK-240303", numAmount: -32000, runningBalance: 59500, date: "2024-04-01", createdBy: "System", description: "Flight booking DAC-BKK", type: "debit" },
  ],
  summary: { totalSpent: "৳85,400", totalRefunds: "৳5,000", balance: "৳59,500" },
  total: 3,
};

export const mockAdminDashboard = {
  stats: [
    { label: "Total Users", value: "1,247", change: "+12%" },
    { label: "Total Bookings", value: "3,891", change: "+8%" },
    { label: "Revenue", value: "৳24.5M", change: "+15%" },
    { label: "Active Visas", value: "156", change: "+5%" },
  ],
  recentBookings: [
    { id: "BK-001", customer: "Rahim Ahmed", email: "rahim@gmail.com", type: "flight", route: "DAC-CXB", date: "2024-03-15", status: "confirmed", amount: "৳8,500" },
    { id: "BK-002", customer: "Fatema Khatun", email: "fatema@gmail.com", type: "hotel", route: "Cox's Bazar", date: "2024-03-16", status: "pending", amount: "৳12,000" },
    { id: "BK-003", customer: "Kamal Hossain", email: "kamal@gmail.com", type: "flight", route: "DAC-BKK", date: "2024-04-01", status: "confirmed", amount: "৳32,000" },
  ],
  revenueData: [
    { month: "Jan", revenue: 2100000 },
    { month: "Feb", revenue: 1800000 },
    { month: "Mar", revenue: 2500000 },
    { month: "Apr", revenue: 2200000 },
    { month: "May", revenue: 3100000 },
    { month: "Jun", revenue: 2800000 },
  ],
  topServices: [
    { name: "Flights", bookings: 2145, revenue: "৳15.2M", percentage: 62 },
    { name: "Hotels", bookings: 892, revenue: "৳5.8M", percentage: 24 },
    { name: "Visa", bookings: 534, revenue: "৳2.1M", percentage: 9 },
    { name: "Holidays", bookings: 320, revenue: "৳1.4M", percentage: 5 },
  ],
};

export const mockAdminBookings = {
  bookings: [
    { id: "BK-001", customer: "Rahim Ahmed", email: "rahim@gmail.com", type: "flight", route: "DAC-CXB", date: "2024-03-15", status: "confirmed", amount: "৳8,500" },
    { id: "BK-002", customer: "Fatema Khatun", email: "fatema@gmail.com", type: "hotel", route: "Cox's Bazar", date: "2024-03-16", status: "pending", amount: "৳12,000" },
    { id: "BK-003", customer: "Kamal Hossain", email: "kamal@gmail.com", type: "flight", route: "DAC-BKK", date: "2024-04-01", status: "confirmed", amount: "৳32,000" },
  ],
  stats: { total: 3891, confirmed: 2456, pending: 892, cancelled: 543 },
  total: 3,
};

export const mockAdminUsers = {
  users: [
    { id: "1", name: "Rahim Ahmed", email: "rahim@gmail.com", phone: "+880171234567", role: "customer", status: "active", bookings: 12, totalSpent: "৳85,400", createdAt: "2024-01-15" },
    { id: "2", name: "Fatema Khatun", email: "fatema@gmail.com", phone: "+880181234567", role: "customer", status: "active", bookings: 8, totalSpent: "৳52,000", createdAt: "2024-02-20" },
  ],
  total: 1247,
};

export const mockAdminPayments = {
  payments: [
    { id: "PAY-001", customer: "Rahim Ahmed", method: "bKash", amount: "৳50,000", status: "completed", date: "2024-03-10", reference: "BK-240301" },
    { id: "PAY-002", customer: "Fatema Khatun", method: "Card", amount: "৳12,000", status: "pending", date: "2024-03-16", reference: "BK-240302" },
  ],
  total: 2,
};

export const mockPayments = {
  payments: [
    { id: "PAY-001", method: "bKash", amount: "৳50,000", status: "completed", date: "2024-03-10", reference: "BK-240301", transactionId: "TXN-BK-001" },
    { id: "PAY-002", method: "Nagad", amount: "৳12,000", status: "pending", date: "2024-03-16", reference: "BK-240302", transactionId: "—" },
  ],
  total: 2,
};

export const mockTravellers = {
  travellers: [
    { id: "1", firstName: "Rahim", lastName: "Ahmed", email: "rahim@gmail.com", phone: "+880171234567", passport: "AB1234567", nationality: "Bangladeshi", dob: "1990-05-15", type: "adult" },
    { id: "2", firstName: "Ayesha", lastName: "Ahmed", email: "ayesha@gmail.com", phone: "+880181234567", passport: "CD7654321", nationality: "Bangladeshi", dob: "1992-08-20", type: "adult" },
  ],
  total: 2,
};

export const mockTickets = { tickets: [], total: 0 };
export const mockWishlist = { items: [], total: 0 };
export const mockSearchHistory = { searches: [], total: 0 };
export const mockETransactions = { transactions: [], total: 0 };
export const mockPayLater = { items: [], total: 0 };
export const mockInvoices = { invoices: [], total: 0 };
export const mockSettings = {
  user: { name: "Rahim Ahmed", email: "rahim@gmail.com", phone: "+880171234567", avatar: null },
  preferences: { currency: "BDT", language: "en", notifications: true },
};
