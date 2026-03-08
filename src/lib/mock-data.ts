// Comprehensive demo data for when backend API is unreachable

export const mockDashboardStats = {
  stats: [
    { label: "Total Bookings", value: "12", change: "+8%" },
    { label: "Active Trips", value: "2", change: "+1" },
    { label: "Total Spent", value: "৳85,400", change: "+12%" },
    { label: "Pending", value: "3", change: "-2" },
  ],
  user: { name: "User" },
  upcomingTrip: {
    title: "Dhaka → Bangkok",
    date: "March 25, 2026",
    daysLeft: 17,
    flight: "BG-347",
    duration: "5 days",
  },
  spendingData: [
    { month: "Oct", amount: 12000 },
    { month: "Nov", amount: 8500 },
    { month: "Dec", amount: 15200 },
    { month: "Jan", amount: 9800 },
    { month: "Feb", amount: 22000 },
    { month: "Mar", amount: 17900 },
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
    { id: "BK-260301", title: "Dhaka → Cox's Bazar", type: "flight", date: "2026-03-15", status: "confirmed", amount: "৳8,500", pnr: "ABC123", pax: 2, ticketNo: "TK-001" },
    { id: "BK-260302", title: "Sea Pearl Resort", type: "hotel", date: "2026-03-16", status: "pending", amount: "৳12,000", pnr: "—", pax: 2, ticketNo: "—" },
    { id: "BK-260303", title: "Dhaka → Bangkok", type: "flight", date: "2026-04-01", status: "confirmed", amount: "৳32,000", pnr: "XYZ789", pax: 1, ticketNo: "TK-002" },
    { id: "BK-260304", title: "Thailand Visa", type: "visa", date: "2026-03-20", status: "In Progress", amount: "৳5,500", pnr: "—", pax: 1, ticketNo: "—" },
    { id: "BK-260305", title: "Dhaka → Singapore", type: "flight", date: "2026-04-10", status: "confirmed", amount: "৳28,000", pnr: "SGP456", pax: 2, ticketNo: "TK-003" },
  ],
  total: 5,
  tabCounts: { All: 5, Confirmed: 3, Pending: 1, "In Progress": 1 },
};

export const mockTransactions = {
  transactions: [
    { id: "TXN-001", entryType: "AirTicket", reference: "BK-260301", numAmount: -8500, runningBalance: 91500, date: "2026-03-15", createdBy: "System", description: "Flight booking DAC-CXB", type: "debit" },
    { id: "TXN-002", entryType: "BKash", reference: "PAY-001", numAmount: 50000, runningBalance: 100000, date: "2026-03-10", createdBy: "System", description: "Account top-up via bKash", type: "credit" },
    { id: "TXN-003", entryType: "AirTicket", reference: "BK-260303", numAmount: -32000, runningBalance: 59500, date: "2026-04-01", createdBy: "System", description: "Flight booking DAC-BKK", type: "debit" },
    { id: "TXN-004", entryType: "Nagad", reference: "PAY-002", numAmount: 25000, runningBalance: 84500, date: "2026-03-18", createdBy: "System", description: "Account top-up via Nagad", type: "credit" },
    { id: "TXN-005", entryType: "Hotel", reference: "BK-260302", numAmount: -12000, runningBalance: 72500, date: "2026-03-16", createdBy: "System", description: "Hotel booking Sea Pearl", type: "debit" },
    { id: "TXN-006", entryType: "Visa", reference: "BK-260304", numAmount: -5500, runningBalance: 67000, date: "2026-03-20", createdBy: "System", description: "Visa processing Thailand", type: "debit" },
  ],
  summary: { totalSpent: "৳85,400", totalRefunds: "৳5,000", balance: "৳67,000" },
  total: 6,
};

// ========== ADMIN ==========

export const mockAdminDashboard = {
  stats: [
    { label: "Total Users", value: "1,247", change: "+12%" },
    { label: "Total Bookings", value: "3,891", change: "+8%" },
    { label: "Revenue", value: "৳24.5M", change: "+15%" },
    { label: "Active Visas", value: "156", change: "+5%" },
  ],
  recentBookings: [
    { id: "BK-001", customer: "Rahim Ahmed", email: "rahim@gmail.com", type: "Flight", route: "DAC → CXB", date: "2026-03-15", status: "confirmed", amount: "৳8,500" },
    { id: "BK-002", customer: "Fatema Khatun", email: "fatema@gmail.com", type: "Hotel", route: "Cox's Bazar", date: "2026-03-16", status: "pending", amount: "৳12,000" },
    { id: "BK-003", customer: "Kamal Hossain", email: "kamal@gmail.com", type: "Flight", route: "DAC → BKK", date: "2026-04-01", status: "confirmed", amount: "৳32,000" },
    { id: "BK-004", customer: "Nasrin Akter", email: "nasrin@gmail.com", type: "Holiday", route: "Maldives Package", date: "2026-03-25", status: "confirmed", amount: "৳85,000" },
    { id: "BK-005", customer: "Tanvir Islam", email: "tanvir@gmail.com", type: "Flight", route: "DAC → DXB", date: "2026-04-05", status: "pending", amount: "৳45,000" },
  ],
  revenueData: [
    { day: "Mon", value: 320000 },
    { day: "Tue", value: 450000 },
    { day: "Wed", value: 280000 },
    { day: "Thu", value: 520000 },
    { day: "Fri", value: 680000 },
    { day: "Sat", value: 410000 },
    { day: "Sun", value: 350000 },
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
    { id: "BK-001", customer: "Rahim Ahmed", email: "rahim@gmail.com", type: "Flight", route: "DAC → CXB", date: "2026-03-15", status: "confirmed", amount: "৳8,500" },
    { id: "BK-002", customer: "Fatema Khatun", email: "fatema@gmail.com", type: "Hotel", route: "Cox's Bazar", date: "2026-03-16", status: "pending", amount: "৳12,000" },
    { id: "BK-003", customer: "Kamal Hossain", email: "kamal@gmail.com", type: "Flight", route: "DAC → BKK", date: "2026-04-01", status: "confirmed", amount: "৳32,000" },
    { id: "BK-004", customer: "Nasrin Akter", email: "nasrin@gmail.com", type: "Visa", route: "Thailand Tourist", date: "2026-03-20", status: "confirmed", amount: "৳5,500" },
    { id: "BK-005", customer: "Tanvir Islam", email: "tanvir@gmail.com", type: "Flight", route: "DAC → DXB", date: "2026-04-05", status: "pending", amount: "৳45,000" },
    { id: "BK-006", customer: "Anika Rahman", email: "anika@gmail.com", type: "Holiday", route: "Maldives 5D/4N", date: "2026-04-12", status: "confirmed", amount: "৳125,000" },
    { id: "BK-007", customer: "Sohel Rana", email: "sohel@gmail.com", type: "Hotel", route: "Radisson Dhaka", date: "2026-03-22", status: "cancelled", amount: "৳18,000" },
  ],
  stats: { total: 3891, confirmed: 2456, pending: 892, cancelled: 543 },
  total: 7,
};

export const mockAdminUsers = {
  users: [
    { id: "1", name: "Rahim Ahmed", email: "rahim@gmail.com", phone: "+880171234567", role: "customer", status: "active", bookings: 12, totalSpent: "৳85,400", joined: "Jan 15, 2026" },
    { id: "2", name: "Fatema Khatun", email: "fatema@gmail.com", phone: "+880181234567", role: "customer", status: "active", bookings: 8, totalSpent: "৳52,000", joined: "Feb 20, 2026" },
    { id: "3", name: "Kamal Hossain", email: "kamal@gmail.com", phone: "+880191234567", role: "customer", status: "active", bookings: 15, totalSpent: "৳120,000", joined: "Dec 5, 2025" },
    { id: "4", name: "Nasrin Akter", email: "nasrin@gmail.com", phone: "+880161234567", role: "customer", status: "active", bookings: 5, totalSpent: "৳35,200", joined: "Jan 28, 2026" },
    { id: "5", name: "Tanvir Islam", email: "tanvir@gmail.com", phone: "+880151234567", role: "customer", status: "suspended", bookings: 3, totalSpent: "৳15,000", joined: "Feb 10, 2026" },
    { id: "6", name: "Anika Rahman", email: "anika@gmail.com", phone: "+880141234567", role: "customer", status: "active", bookings: 22, totalSpent: "৳245,000", joined: "Nov 15, 2025" },
  ],
  stats: { total: 1247, active: 1198, suspended: 49, newThisMonth: 87 },
  total: 1247,
};

export const mockAdminPayments = {
  payments: [
    { id: "PAY-001", customer: "Rahim Ahmed", booking: "BK-001", method: "bKash", amount: "৳50,000", status: "completed", date: "2026-03-10" },
    { id: "PAY-002", customer: "Fatema Khatun", booking: "BK-002", method: "Card", amount: "৳12,000", status: "pending", date: "2026-03-16" },
    { id: "PAY-003", customer: "Kamal Hossain", booking: "BK-003", method: "Bank Transfer", amount: "৳32,000", status: "completed", date: "2026-04-01" },
    { id: "PAY-004", customer: "Nasrin Akter", booking: "BK-004", method: "Nagad", amount: "৳5,500", status: "pending_verification", date: "2026-03-20" },
    { id: "PAY-005", customer: "Tanvir Islam", booking: "BK-005", method: "bKash", amount: "৳45,000", status: "failed", date: "2026-04-05" },
    { id: "PAY-006", customer: "Anika Rahman", booking: "BK-006", method: "Card", amount: "৳125,000", status: "completed", date: "2026-04-12" },
  ],
  stats: { totalRevenue: "৳2,45,000", thisMonth: "৳1,85,000", pending: "৳57,000", needsVerification: "3" },
  total: 6,
};

export const mockAdminPaymentApprovals = {
  data: [
    { id: "PA-001", reference: "REF-2026031001", customerName: "Rahim Ahmed", customerEmail: "rahim@gmail.com", method: "Bank Deposit", amount: 50000, date: "Mar 10, 2026", status: "Pending", receiptUrl: "https://placehold.co/400x600/e2e8f0/64748b?text=Receipt", bankName: "Dutch-Bangla Bank" },
    { id: "PA-002", reference: "REF-2026031601", customerName: "Fatema Khatun", customerEmail: "fatema@gmail.com", method: "Cheque Deposit", amount: 12000, date: "Mar 16, 2026", status: "Pending", receiptUrl: "https://placehold.co/400x600/e2e8f0/64748b?text=Cheque", chequeNo: "CHQ-45678" },
    { id: "PA-003", reference: "REF-2026032201", customerName: "Kamal Hossain", customerEmail: "kamal@gmail.com", method: "Bank Transfer", amount: 32000, date: "Mar 22, 2026", status: "Approved", receiptUrl: "https://placehold.co/400x600/e2e8f0/64748b?text=Transfer", reviewedBy: "Admin" },
    { id: "PA-004", reference: "REF-2026032001", customerName: "Nasrin Akter", customerEmail: "nasrin@gmail.com", method: "Mobile Banking", amount: 5500, date: "Mar 20, 2026", status: "Rejected", reviewedBy: "Admin" },
    { id: "PA-005", reference: "REF-2026040101", customerName: "Sohel Rana", customerEmail: "sohel@gmail.com", method: "Bank Deposit", amount: 18000, date: "Apr 01, 2026", status: "Pending", receiptUrl: "https://placehold.co/400x600/e2e8f0/64748b?text=Slip", bankName: "BRAC Bank" },
  ],
  stats: { pendingCount: 3, approvedToday: 1, approvedAmount: 32000, rejectedCount: 1 },
};

export const mockAdminInvoices = {
  data: [
    { id: "inv-1", invoiceNo: "INV-2026-001", customerName: "Rahim Ahmed", customerEmail: "rahim@gmail.com", bookingRef: "BK-001", date: "Mar 15, 2026", amount: 8500, subtotal: 8000, tax: 500, discount: 0, status: "Paid" },
    { id: "inv-2", invoiceNo: "INV-2026-002", customerName: "Fatema Khatun", customerEmail: "fatema@gmail.com", bookingRef: "BK-002", date: "Mar 16, 2026", amount: 12000, subtotal: 11200, tax: 800, discount: 0, status: "Unpaid" },
    { id: "inv-3", invoiceNo: "INV-2026-003", customerName: "Kamal Hossain", customerEmail: "kamal@gmail.com", bookingRef: "BK-003", date: "Apr 01, 2026", amount: 32000, subtotal: 30000, tax: 2000, discount: 0, status: "Paid" },
    { id: "inv-4", invoiceNo: "INV-2026-004", customerName: "Nasrin Akter", customerEmail: "nasrin@gmail.com", bookingRef: "BK-004", date: "Mar 20, 2026", amount: 5500, subtotal: 5000, tax: 500, discount: 0, status: "Overdue" },
    { id: "inv-5", invoiceNo: "INV-2026-005", customerName: "Tanvir Islam", customerEmail: "tanvir@gmail.com", bookingRef: "BK-005", date: "Apr 05, 2026", amount: 45000, subtotal: 42000, tax: 3000, discount: 0, status: "Unpaid" },
    { id: "inv-6", invoiceNo: "INV-2026-006", customerName: "Anika Rahman", customerEmail: "anika@gmail.com", bookingRef: "BK-006", date: "Apr 12, 2026", amount: 125000, subtotal: 118000, tax: 7000, discount: 0, status: "Paid" },
  ],
  stats: { totalInvoiced: 228000, totalPaid: 165500, totalUnpaid: 62500, overdueCount: 1 },
  total: 6,
};

export const mockAdminReports = {
  kpis: [
    { label: "Total Revenue", value: "৳24.5M", change: "+15.3%" },
    { label: "Total Bookings", value: "3,891", change: "+8.2%" },
    { label: "Active Users", value: "1,198", change: "+12.1%" },
    { label: "Avg. Order Value", value: "৳6,297", change: "+3.4%" },
  ],
  revenueData: [
    { month: "Oct", revenue: 1800000 },
    { month: "Nov", revenue: 2100000 },
    { month: "Dec", revenue: 2500000 },
    { month: "Jan", revenue: 2200000 },
    { month: "Feb", revenue: 3100000 },
    { month: "Mar", revenue: 2800000 },
  ],
  bookingData: [
    { month: "Oct", flights: 320, hotels: 140, holidays: 45 },
    { month: "Nov", flights: 380, hotels: 160, holidays: 55 },
    { month: "Dec", flights: 450, hotels: 200, holidays: 80 },
    { month: "Jan", flights: 400, hotels: 175, holidays: 60 },
    { month: "Feb", flights: 480, hotels: 210, holidays: 70 },
    { month: "Mar", flights: 420, hotels: 190, holidays: 65 },
  ],
  pieData: [
    { name: "Flights", value: 62, color: "hsl(217, 91%, 50%)" },
    { name: "Hotels", value: 24, color: "hsl(152, 69%, 41%)" },
    { name: "Visa", value: 9, color: "hsl(24, 100%, 50%)" },
    { name: "Holidays", value: 5, color: "hsl(270, 60%, 50%)" },
  ],
};

export const mockAdminVisa = {
  applications: [
    {
      id: "VA-001", applicant: "Rahim Ahmed", country: "Thailand", type: "Tourist", status: "processing", fee: "৳5,500", date: "2026-03-01",
      firstName: "Rahim", lastName: "Ahmed", dob: "1990-05-15", gender: "Male", nationality: "Bangladeshi",
      passportNumber: "AB1234567", passportExpiry: "2030-12-31", passportIssueDate: "2020-01-15", passportIssuePlace: "Dhaka",
      email: "rahim@gmail.com", phone: "+880171234567", altPhone: "+880191234567",
      currentAddress: "House 12, Road 5, Dhanmondi, Dhaka-1205", permanentAddress: "Vill: Barabari, Upz: Singair, Dist: Manikganj",
      occupation: "Software Engineer", employer: "Tech Solutions Ltd", monthlyIncome: "৳80,000",
      fatherName: "Abdul Karim Ahmed", motherName: "Salma Begum", spouseName: "Ayesha Ahmed",
      emergencyContact: "Karim Ahmed", emergencyPhone: "+880151234567", emergencyRelation: "Brother",
      travelDate: "2026-04-10", returnDate: "2026-04-20", previousVisits: "Malaysia (2024), India (2023)",
      purposeOfVisit: "Tourism - visiting Bangkok, Pattaya, Chiang Mai",
      hotelName: "Grand Hyatt Bangkok", hotelAddress: "494 Rajdamri Road, Lumpini, Bangkok",
      processingType: "Normal", travellers: 2,
      nidNumber: "1990512345678", tinNumber: "TIN-123456789",
      documents: ["Passport Copy", "Photo (35x45mm)", "Bank Statement (6 months)", "Hotel Booking", "Flight Itinerary", "NID Copy"],
      notes: "Travelling with spouse. Requested window seat preference.",
    },
    {
      id: "VA-002", applicant: "Fatema Khatun", country: "Malaysia", type: "Tourist", status: "approved", fee: "৳4,000", date: "2026-02-25",
      firstName: "Fatema", lastName: "Khatun", dob: "1995-08-20", gender: "Female", nationality: "Bangladeshi",
      passportNumber: "CD7654321", passportExpiry: "2031-06-15", passportIssueDate: "2021-06-15", passportIssuePlace: "Chattogram",
      email: "fatema.k@gmail.com", phone: "+880181234567", altPhone: "",
      currentAddress: "Flat 4B, Green Tower, Nasirabad, Chattogram", permanentAddress: "Same as current",
      occupation: "Teacher", employer: "Sunshine School", monthlyIncome: "৳45,000",
      fatherName: "Mohammad Khatun", motherName: "Rahima Begum", spouseName: "—",
      emergencyContact: "Nasrin Khatun", emergencyPhone: "+880161234567", emergencyRelation: "Sister",
      travelDate: "2026-03-20", returnDate: "2026-03-27", previousVisits: "None",
      purposeOfVisit: "Tourism - visiting Kuala Lumpur and Langkawi",
      hotelName: "Traders Hotel KL", hotelAddress: "Kuala Lumpur City Centre",
      processingType: "Normal", travellers: 1,
      nidNumber: "1995820456789", tinNumber: "",
      documents: ["Passport Copy", "Photo (35x45mm)", "Bank Statement (6 months)", "NOC from Employer"],
      notes: "",
    },
    {
      id: "VA-003", applicant: "Kamal Hossain", country: "Singapore", type: "Business", status: "pending_docs", fee: "৳8,000", date: "2026-03-05",
      firstName: "Kamal", lastName: "Hossain", dob: "1985-03-10", gender: "Male", nationality: "Bangladeshi",
      passportNumber: "EF9876543", passportExpiry: "2029-09-01", passportIssueDate: "2019-09-01", passportIssuePlace: "Sylhet",
      email: "kamal.h@company.com", phone: "+880171112233", altPhone: "+880191112233",
      currentAddress: "Suite 5, Corporate Tower, Banani, Dhaka-1213", permanentAddress: "Moulvibazar, Sylhet Division",
      occupation: "Business Owner", employer: "Hossain Exports Ltd (Self)", monthlyIncome: "৳300,000",
      fatherName: "Late Azizul Hossain", motherName: "Jahanara Hossain", spouseName: "Nusrat Hossain",
      emergencyContact: "Faruk Hossain", emergencyPhone: "+880171445566", emergencyRelation: "Brother",
      travelDate: "2026-04-01", returnDate: "2026-04-08", previousVisits: "Singapore (2022, 2024), UAE (2023)",
      purposeOfVisit: "Business meetings with Singapore trade partners, attending SG Expo",
      hotelName: "Marina Bay Sands", hotelAddress: "10 Bayfront Avenue, Singapore",
      processingType: "Express", travellers: 1,
      nidNumber: "1985310789012", tinNumber: "TIN-987654321",
      documents: ["Passport Copy", "Photo (35x45mm)", "Business Registration", "Invitation Letter", "Bank Statement (12 months)"],
      notes: "Missing invitation letter from Singapore partner. Follow up needed.",
    },
    {
      id: "VA-004", applicant: "Nasrin Akter", country: "UAE", type: "Tourist", status: "approved", fee: "৳12,000", date: "2026-02-20",
      firstName: "Nasrin", lastName: "Akter", dob: "1992-11-05", gender: "Female", nationality: "Bangladeshi",
      passportNumber: "GH1122334", passportExpiry: "2032-01-20", passportIssueDate: "2022-01-20", passportIssuePlace: "Dhaka",
      email: "nasrin.a@hotmail.com", phone: "+880191234567", altPhone: "",
      currentAddress: "House 45, Uttara Sector 7, Dhaka-1230", permanentAddress: "Rangpur Sadar, Rangpur",
      occupation: "Doctor", employer: "United Hospital", monthlyIncome: "৳120,000",
      fatherName: "Abdur Rahim", motherName: "Momena Begum", spouseName: "Tanvir Rahman",
      emergencyContact: "Tanvir Rahman", emergencyPhone: "+880171998877", emergencyRelation: "Husband",
      travelDate: "2026-03-15", returnDate: "2026-03-22", previousVisits: "Thailand (2025), Maldives (2024)",
      purposeOfVisit: "Family vacation to Dubai and Abu Dhabi",
      hotelName: "Atlantis The Palm", hotelAddress: "Crescent Road, The Palm, Dubai",
      processingType: "Normal", travellers: 3,
      nidNumber: "1992105345678", tinNumber: "TIN-445566778",
      documents: ["Passport Copy", "Photo (35x45mm)", "Bank Statement (6 months)", "Hotel Booking", "Flight Itinerary", "Marriage Certificate"],
      notes: "Travelling with husband and child (5 years old).",
    },
    {
      id: "VA-005", applicant: "Sohel Rana", country: "India", type: "Medical", status: "rejected", fee: "৳3,000", date: "2026-03-08",
      firstName: "Sohel", lastName: "Rana", dob: "1978-07-22", gender: "Male", nationality: "Bangladeshi",
      passportNumber: "IJ5566778", passportExpiry: "2028-03-10", passportIssueDate: "2018-03-10", passportIssuePlace: "Rajshahi",
      email: "sohel.rana@yahoo.com", phone: "+880161234567", altPhone: "+880181234567",
      currentAddress: "42/A Shaheb Bazar, Rajshahi", permanentAddress: "Same as current",
      occupation: "Retired", employer: "—", monthlyIncome: "৳25,000 (Pension)",
      fatherName: "Late Abul Kashem", motherName: "Late Amena Begum", spouseName: "Rehana Rana",
      emergencyContact: "Rehana Rana", emergencyPhone: "+880171667788", emergencyRelation: "Wife",
      travelDate: "2026-03-25", returnDate: "2026-04-10", previousVisits: "India (2020, 2018)",
      purposeOfVisit: "Medical treatment - cardiac checkup at Apollo Hospital Chennai",
      hotelName: "Near Apollo Hospital", hotelAddress: "Greams Road, Chennai, India",
      processingType: "Express", travellers: 2,
      nidNumber: "1978722456789", tinNumber: "",
      documents: ["Passport Copy", "Photo (35x45mm)", "Medical Report", "Doctor Referral Letter", "Hospital Appointment Letter"],
      notes: "Rejected due to passport expiring within 6 months of travel. Advised to renew passport first.",
    },
  ],
  countries: [
    { country: "Thailand", processing: "3-5 days", fee: "৳5,500", status: "active" },
    { country: "Malaysia", processing: "3-5 days", fee: "৳4,000", status: "active" },
    { country: "Singapore", processing: "5-7 days", fee: "৳8,000", status: "active" },
    { country: "UAE", processing: "7-10 days", fee: "৳12,000", status: "active" },
    { country: "India", processing: "2-3 days", fee: "৳3,000", status: "active" },
    { country: "UK", processing: "15-20 days", fee: "৳18,000", status: "inactive" },
  ],
};

// ========== USER DASHBOARD ==========

export const mockPayments = {
  payments: [
    { id: "PAY-001", method: "bKash", amount: "৳50,000", status: "Approved", date: "2026-03-10", reference: "BK-260301", transactionId: "TXN-BK-001" },
    { id: "PAY-002", method: "Nagad", amount: "৳12,000", status: "Pending", date: "2026-03-16", reference: "BK-260302", transactionId: "TXN-NG-002" },
    { id: "PAY-003", method: "Bank Transfer", amount: "৳32,000", status: "Approved", date: "2026-04-01", reference: "BK-260303", transactionId: "TXN-BK-003" },
  ],
  bankAccounts: [
    { id: "1", bank: "Dutch-Bangla Bank Limited", bankName: "Dutch-Bangla Bank Limited", accName: "Seven Trip Ltd", accountName: "Seven Trip Ltd", accNo: "1234567890123", accountNumber: "1234567890123", branch: "Gulshan Branch", routing: "090261725", routingNumber: "090261725" },
    { id: "2", bank: "BRAC Bank Limited", bankName: "BRAC Bank Limited", accName: "Seven Trip Ltd", accountName: "Seven Trip Ltd", accNo: "9876543210456", accountNumber: "9876543210456", branch: "Banani Branch", routing: "060261103", routingNumber: "060261103" },
  ],
  enabledPaymentMethods: ["bank_deposit", "bank_transfer", "cheque_deposit", "mobile_bkash", "mobile_nagad", "card"],
  total: 3,
};

export const mockTravellers = {
  travellers: [
    { id: "1", name: "Rahim Ahmed", firstName: "Rahim", lastName: "Ahmed", email: "rahim@gmail.com", phone: "+880171234567", passport: "AB1234567", nationality: "Bangladeshi", dob: "1990-05-15", type: "Adult", gender: "Male" },
    { id: "2", name: "Ayesha Ahmed", firstName: "Ayesha", lastName: "Ahmed", email: "ayesha@gmail.com", phone: "+880181234567", passport: "CD7654321", nationality: "Bangladeshi", dob: "1992-08-20", type: "Adult", gender: "Female" },
  ],
  total: 2,
};

export const mockTickets = {
  tickets: [
    { id: "TKT-001", airline: "Biman Bangladesh", flightNo: "BG-347", from: "DAC", to: "CXB", date: "Mar 15, 2026", time: "08:30", passenger: "Rahim Ahmed", pnr: "ABC123", seat: "12A", class: "Economy", status: "active" },
    { id: "TKT-002", airline: "US-Bangla Airlines", flightNo: "BS-141", from: "DAC", to: "BKK", date: "Apr 01, 2026", time: "14:00", passenger: "Rahim Ahmed", pnr: "XYZ789", seat: "5C", class: "Business", status: "active" },
    { id: "TKT-003", airline: "Singapore Airlines", flightNo: "SQ-447", from: "DAC", to: "SIN", date: "Apr 10, 2026", time: "22:15", passenger: "Rahim Ahmed", pnr: "SGP456", seat: "22F", class: "Economy", status: "active" },
  ],
  total: 3,
};

export const mockWishlist = {
  items: [
    { id: "1", title: "Cox's Bazar Beach Resort", subtitle: "3 nights • Sea-facing room", type: "hotel", price: "৳12,000", rating: 4.5, image: "https://placehold.co/400x300/0ea5e9/ffffff?text=Cox%27s+Bazar", saved: "2 days ago" },
    { id: "2", title: "Dhaka → Bangkok", subtitle: "Round trip • Mar 25-30", type: "flight", price: "৳32,000", rating: 4.2, image: "https://placehold.co/400x300/8b5cf6/ffffff?text=Bangkok", saved: "5 days ago" },
    { id: "3", title: "Maldives Paradise Package", subtitle: "5D/4N • All-inclusive", type: "holiday", price: "৳85,000", rating: 4.8, image: "https://placehold.co/400x300/f59e0b/ffffff?text=Maldives", saved: "1 week ago" },
  ],
  total: 3,
};

export const mockSearchHistory = {
  data: [
    { id: "SH-001", type: "flight", summary: "Dhaka → Bangkok Round Trip", origin: "DAC", destination: "BKK", dates: "Mar 25 - Mar 30", travellers: 2, searchedAt: "Mar 5, 2026", resultsCount: 24, params: { from: "DAC", to: "BKK" } },
    { id: "SH-002", type: "hotel", summary: "Hotels in Cox's Bazar", origin: null, destination: "Cox's Bazar", dates: "Mar 16 - Mar 18", travellers: 2, searchedAt: "Mar 3, 2026", resultsCount: 15, params: { city: "coxs-bazar" } },
    { id: "SH-003", type: "flight", summary: "Dhaka → Dubai One Way", origin: "DAC", destination: "DXB", dates: "Apr 5", travellers: 1, searchedAt: "Mar 1, 2026", resultsCount: 18, params: { from: "DAC", to: "DXB" } },
    { id: "SH-004", type: "holiday", summary: "Maldives Holiday Packages", origin: null, destination: "Maldives", dates: "Apr 15 - Apr 20", travellers: 2, searchedAt: "Feb 28, 2026", resultsCount: 8, params: { dest: "maldives" } },
  ],
  total: 4,
};

export const mockETransactions = {
  transactions: [
    { id: "ET-001", entryType: "BKash", reference: "TRX8G7K4L2M9N", amount: 50000, gatewayFee: 750, transactionAmount: 49250, status: "Completed", createdOn: "Mar 10, 2026", completedOn: "Mar 10, 2026" },
    { id: "ET-002", entryType: "Nagad", reference: "TRX5F2J8P3Q1R", amount: 25000, gatewayFee: 375, transactionAmount: 24625, status: "Completed", createdOn: "Mar 18, 2026", completedOn: "Mar 18, 2026" },
    { id: "ET-003", entryType: "Card Payment", reference: "TRX9A4D6K8W2X", amount: 125000, gatewayFee: 3125, transactionAmount: 121875, status: "Completed", createdOn: "Apr 12, 2026", completedOn: "Apr 12, 2026" },
    { id: "ET-004", entryType: "BKash", reference: "TRX3B7M1N5P9S", amount: 12000, gatewayFee: 180, transactionAmount: 11820, status: "Initiated", createdOn: "Mar 16, 2026", completedOn: null },
  ],
  total: 4,
};

export const mockPayLater = {
  items: [
    { id: "PL-001", reference: "PL-2026-001", bookingRef: "BK-260302", dueDate: "Mar 30, 2026", amount: 12000, status: "Unpaid" },
    { id: "PL-002", reference: "PL-2026-002", bookingRef: "BK-260305", dueDate: "Apr 15, 2026", amount: 28000, status: "Unpaid" },
    { id: "PL-003", reference: "PL-2026-003", bookingRef: "BK-260301", dueDate: "Mar 20, 2026", amount: 8500, status: "Paid" },
  ],
  summary: { previousDue: 12000, totalDue: 40000, dueToday: 12000 },
  total: 3,
};

export const mockInvoices = {
  invoices: [
    { id: "inv-1", invoiceNo: "INV-2026-001", bookingRef: "BK-260301", date: "Mar 15, 2026", serviceType: "flight", amount: 8500, subtotal: 8000, tax: 500, discount: 0, status: "Paid", customerName: "Rahim Ahmed", customerEmail: "rahim@gmail.com" },
    { id: "inv-2", invoiceNo: "INV-2026-002", bookingRef: "BK-260302", date: "Mar 16, 2026", serviceType: "hotel", amount: 12000, subtotal: 11200, tax: 800, discount: 0, status: "Unpaid", customerName: "Rahim Ahmed", customerEmail: "rahim@gmail.com" },
    { id: "inv-3", invoiceNo: "INV-2026-003", bookingRef: "BK-260303", date: "Apr 01, 2026", serviceType: "flight", amount: 32000, subtotal: 30000, tax: 2000, discount: 0, status: "Paid", customerName: "Rahim Ahmed", customerEmail: "rahim@gmail.com" },
  ],
  total: 3,
};

export const mockSettings = {
  user: { name: "Rahim Ahmed", email: "rahim@gmail.com", phone: "+880171234567", avatar: null },
  preferences: { currency: "BDT", language: "en", notifications: true },
};
