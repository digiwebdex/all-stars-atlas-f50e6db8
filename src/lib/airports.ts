// Comprehensive worldwide airport database
export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
}

export const AIRPORTS: Airport[] = [
  // ===== BANGLADESH =====
  { code: "DAC", city: "Dhaka", name: "Hazrat Shahjalal Intl Airport", country: "BD" },
  { code: "CXB", city: "Cox's Bazar", name: "Cox's Bazar Airport", country: "BD" },
  { code: "CGP", city: "Chattogram", name: "Shah Amanat Intl Airport", country: "BD" },
  { code: "ZYL", city: "Sylhet", name: "Osmani Intl Airport", country: "BD" },
  { code: "JSR", city: "Jashore", name: "Jashore Airport", country: "BD" },
  { code: "RJH", city: "Rajshahi", name: "Shah Makhdum Airport", country: "BD" },
  { code: "SPD", city: "Saidpur", name: "Saidpur Airport", country: "BD" },
  { code: "BZL", city: "Barisal", name: "Barisal Airport", country: "BD" },

  // ===== INDIA =====
  { code: "DEL", city: "New Delhi", name: "Indira Gandhi Intl Airport", country: "IN" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Intl", country: "IN" },
  { code: "BLR", city: "Bangalore", name: "Kempegowda Intl Airport", country: "IN" },
  { code: "MAA", city: "Chennai", name: "Chennai Intl Airport", country: "IN" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose Intl", country: "IN" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi Intl Airport", country: "IN" },
  { code: "COK", city: "Kochi", name: "Cochin Intl Airport", country: "IN" },
  { code: "GOI", city: "Goa", name: "Manohar Intl Airport", country: "IN" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel Intl", country: "IN" },
  { code: "PNQ", city: "Pune", name: "Pune Airport", country: "IN" },
  { code: "JAI", city: "Jaipur", name: "Jaipur Intl Airport", country: "IN" },
  { code: "LKO", city: "Lucknow", name: "Chaudhary Charan Singh Intl", country: "IN" },
  { code: "GAU", city: "Guwahati", name: "Lokpriya Gopinath Bordoloi Intl", country: "IN" },
  { code: "TRV", city: "Thiruvananthapuram", name: "Trivandrum Intl Airport", country: "IN" },
  { code: "IXC", city: "Chandigarh", name: "Chandigarh Intl Airport", country: "IN" },
  { code: "PAT", city: "Patna", name: "Jay Prakash Narayan Intl", country: "IN" },
  { code: "SXR", city: "Srinagar", name: "Sheikh ul-Alam Intl Airport", country: "IN" },
  { code: "VNS", city: "Varanasi", name: "Lal Bahadur Shastri Intl", country: "IN" },
  { code: "IXB", city: "Bagdogra", name: "Bagdogra Airport", country: "IN" },
  { code: "NAG", city: "Nagpur", name: "Dr. Babasaheb Ambedkar Intl", country: "IN" },
  { code: "CCJ", city: "Kozhikode", name: "Calicut Intl Airport", country: "IN" },
  { code: "IXR", city: "Ranchi", name: "Birsa Munda Airport", country: "IN" },
  { code: "VTZ", city: "Visakhapatnam", name: "Visakhapatnam Airport", country: "IN" },
  { code: "IDR", city: "Indore", name: "Devi Ahilyabai Holkar Airport", country: "IN" },
  { code: "BBI", city: "Bhubaneswar", name: "Biju Patnaik Intl Airport", country: "IN" },
  { code: "RPR", city: "Raipur", name: "Swami Vivekananda Airport", country: "IN" },
  { code: "IXM", city: "Madurai", name: "Madurai Airport", country: "IN" },
  { code: "TRZ", city: "Tiruchirappalli", name: "Tiruchirappalli Intl Airport", country: "IN" },
  { code: "MYQ", city: "Mysore", name: "Mysore Airport", country: "IN" },
  { code: "UDR", city: "Udaipur", name: "Maharana Pratap Airport", country: "IN" },

  // ===== PAKISTAN =====
  { code: "ISB", city: "Islamabad", name: "Islamabad Intl Airport", country: "PK" },
  { code: "KHI", city: "Karachi", name: "Jinnah Intl Airport", country: "PK" },
  { code: "LHE", city: "Lahore", name: "Allama Iqbal Intl Airport", country: "PK" },
  { code: "PEW", city: "Peshawar", name: "Bacha Khan Intl Airport", country: "PK" },
  { code: "MUX", city: "Multan", name: "Multan Intl Airport", country: "PK" },
  { code: "FSD", city: "Faisalabad", name: "Faisalabad Intl Airport", country: "PK" },
  { code: "SKT", city: "Sialkot", name: "Sialkot Intl Airport", country: "PK" },
  { code: "UET", city: "Quetta", name: "Quetta Intl Airport", country: "PK" },

  // ===== SRI LANKA =====
  { code: "CMB", city: "Colombo", name: "Bandaranaike Intl Airport", country: "LK" },
  { code: "HRI", city: "Mattala", name: "Mattala Rajapaksa Intl Airport", country: "LK" },

  // ===== NEPAL =====
  { code: "KTM", city: "Kathmandu", name: "Tribhuvan Intl Airport", country: "NP" },
  { code: "BWA", city: "Bhairahawa", name: "Gautam Buddha Intl Airport", country: "NP" },
  { code: "PKR", city: "Pokhara", name: "Pokhara Intl Airport", country: "NP" },

  // ===== MALDIVES =====
  { code: "MLE", city: "Malé", name: "Velana Intl Airport", country: "MV" },
  { code: "GAN", city: "Gan Island", name: "Gan Intl Airport", country: "MV" },

  // ===== BHUTAN =====
  { code: "PBH", city: "Paro", name: "Paro Intl Airport", country: "BT" },

  // ===== MYANMAR =====
  { code: "RGN", city: "Yangon", name: "Yangon Intl Airport", country: "MM" },
  { code: "MDL", city: "Mandalay", name: "Mandalay Intl Airport", country: "MM" },

  // ===== THAILAND =====
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "TH" },
  { code: "DMK", city: "Bangkok", name: "Don Mueang Intl Airport", country: "TH" },
  { code: "HKT", city: "Phuket", name: "Phuket Intl Airport", country: "TH" },
  { code: "CNX", city: "Chiang Mai", name: "Chiang Mai Intl Airport", country: "TH" },
  { code: "KBV", city: "Krabi", name: "Krabi Intl Airport", country: "TH" },
  { code: "USM", city: "Koh Samui", name: "Samui Airport", country: "TH" },
  { code: "HDY", city: "Hat Yai", name: "Hat Yai Intl Airport", country: "TH" },

  // ===== MALAYSIA =====
  { code: "KUL", city: "Kuala Lumpur", name: "KLIA Airport", country: "MY" },
  { code: "PEN", city: "Penang", name: "Penang Intl Airport", country: "MY" },
  { code: "LGK", city: "Langkawi", name: "Langkawi Intl Airport", country: "MY" },
  { code: "BKI", city: "Kota Kinabalu", name: "Kota Kinabalu Intl Airport", country: "MY" },
  { code: "KCH", city: "Kuching", name: "Kuching Intl Airport", country: "MY" },
  { code: "JHB", city: "Johor Bahru", name: "Senai Intl Airport", country: "MY" },

  // ===== SINGAPORE =====
  { code: "SIN", city: "Singapore", name: "Changi Airport", country: "SG" },

  // ===== INDONESIA =====
  { code: "CGK", city: "Jakarta", name: "Soekarno-Hatta Intl Airport", country: "ID" },
  { code: "DPS", city: "Bali", name: "Ngurah Rai Intl Airport", country: "ID" },
  { code: "SUB", city: "Surabaya", name: "Juanda Intl Airport", country: "ID" },
  { code: "UPG", city: "Makassar", name: "Sultan Hasanuddin Intl Airport", country: "ID" },
  { code: "JOG", city: "Yogyakarta", name: "Yogyakarta Intl Airport", country: "ID" },
  { code: "KNO", city: "Medan", name: "Kualanamu Intl Airport", country: "ID" },
  { code: "BPN", city: "Balikpapan", name: "Sultan Aji Muhammad Sulaiman Airport", country: "ID" },
  { code: "PDG", city: "Padang", name: "Minangkabau Intl Airport", country: "ID" },
  { code: "PLM", city: "Palembang", name: "Sultan Mahmud Badaruddin II Airport", country: "ID" },

  // ===== PHILIPPINES =====
  { code: "MNL", city: "Manila", name: "Ninoy Aquino Intl Airport", country: "PH" },
  { code: "CEB", city: "Cebu", name: "Mactan-Cebu Intl Airport", country: "PH" },
  { code: "DVO", city: "Davao", name: "Francisco Bangoy Intl Airport", country: "PH" },
  { code: "CRK", city: "Clark", name: "Clark Intl Airport", country: "PH" },
  { code: "ILO", city: "Iloilo", name: "Iloilo Intl Airport", country: "PH" },

  // ===== VIETNAM =====
  { code: "SGN", city: "Ho Chi Minh City", name: "Tan Son Nhat Intl Airport", country: "VN" },
  { code: "HAN", city: "Hanoi", name: "Noi Bai Intl Airport", country: "VN" },
  { code: "DAD", city: "Da Nang", name: "Da Nang Intl Airport", country: "VN" },
  { code: "CXR", city: "Nha Trang", name: "Cam Ranh Intl Airport", country: "VN" },
  { code: "PQC", city: "Phu Quoc", name: "Phu Quoc Intl Airport", country: "VN" },

  // ===== CAMBODIA =====
  { code: "PNH", city: "Phnom Penh", name: "Phnom Penh Intl Airport", country: "KH" },
  { code: "REP", city: "Siem Reap", name: "Siem Reap Intl Airport", country: "KH" },

  // ===== LAOS =====
  { code: "VTE", city: "Vientiane", name: "Wattay Intl Airport", country: "LA" },
  { code: "LPQ", city: "Luang Prabang", name: "Luang Prabang Intl Airport", country: "LA" },

  // ===== CHINA =====
  { code: "PEK", city: "Beijing", name: "Beijing Capital Intl Airport", country: "CN" },
  { code: "PKX", city: "Beijing", name: "Beijing Daxing Intl Airport", country: "CN" },
  { code: "PVG", city: "Shanghai", name: "Pudong Intl Airport", country: "CN" },
  { code: "SHA", city: "Shanghai", name: "Hongqiao Intl Airport", country: "CN" },
  { code: "CAN", city: "Guangzhou", name: "Baiyun Intl Airport", country: "CN" },
  { code: "SZX", city: "Shenzhen", name: "Bao'an Intl Airport", country: "CN" },
  { code: "CTU", city: "Chengdu", name: "Tianfu Intl Airport", country: "CN" },
  { code: "CKG", city: "Chongqing", name: "Jiangbei Intl Airport", country: "CN" },
  { code: "KMG", city: "Kunming", name: "Changshui Intl Airport", country: "CN" },
  { code: "XIY", city: "Xi'an", name: "Xianyang Intl Airport", country: "CN" },
  { code: "HGH", city: "Hangzhou", name: "Xiaoshan Intl Airport", country: "CN" },
  { code: "NKG", city: "Nanjing", name: "Lukou Intl Airport", country: "CN" },
  { code: "WUH", city: "Wuhan", name: "Tianhe Intl Airport", country: "CN" },
  { code: "XMN", city: "Xiamen", name: "Gaoqi Intl Airport", country: "CN" },
  { code: "TSN", city: "Tianjin", name: "Binhai Intl Airport", country: "CN" },
  { code: "DLC", city: "Dalian", name: "Zhoushuizi Intl Airport", country: "CN" },
  { code: "TAO", city: "Qingdao", name: "Jiaodong Intl Airport", country: "CN" },
  { code: "SHE", city: "Shenyang", name: "Taoxian Intl Airport", country: "CN" },
  { code: "CSX", city: "Changsha", name: "Huanghua Intl Airport", country: "CN" },
  { code: "URC", city: "Urumqi", name: "Diwopu Intl Airport", country: "CN" },
  { code: "HRB", city: "Harbin", name: "Taiping Intl Airport", country: "CN" },
  { code: "FOC", city: "Fuzhou", name: "Changle Intl Airport", country: "CN" },
  { code: "CGO", city: "Zhengzhou", name: "Xinzheng Intl Airport", country: "CN" },
  { code: "NNG", city: "Nanning", name: "Wuxu Intl Airport", country: "CN" },
  { code: "HAK", city: "Haikou", name: "Meilan Intl Airport", country: "CN" },
  { code: "SYX", city: "Sanya", name: "Phoenix Intl Airport", country: "CN" },
  { code: "LXA", city: "Lhasa", name: "Gonggar Airport", country: "CN" },

  // ===== HONG KONG / MACAU / TAIWAN =====
  { code: "HKG", city: "Hong Kong", name: "Hong Kong Intl Airport", country: "HK" },
  { code: "MFM", city: "Macau", name: "Macau Intl Airport", country: "MO" },
  { code: "TPE", city: "Taipei", name: "Taiwan Taoyuan Intl Airport", country: "TW" },
  { code: "KHH", city: "Kaohsiung", name: "Kaohsiung Intl Airport", country: "TW" },

  // ===== JAPAN =====
  { code: "NRT", city: "Tokyo", name: "Narita Intl Airport", country: "JP" },
  { code: "HND", city: "Tokyo", name: "Haneda Airport", country: "JP" },
  { code: "KIX", city: "Osaka", name: "Kansai Intl Airport", country: "JP" },
  { code: "ITM", city: "Osaka", name: "Itami Airport", country: "JP" },
  { code: "NGO", city: "Nagoya", name: "Chubu Centrair Intl Airport", country: "JP" },
  { code: "FUK", city: "Fukuoka", name: "Fukuoka Airport", country: "JP" },
  { code: "CTS", city: "Sapporo", name: "New Chitose Airport", country: "JP" },
  { code: "OKA", city: "Okinawa", name: "Naha Airport", country: "JP" },
  { code: "HIJ", city: "Hiroshima", name: "Hiroshima Airport", country: "JP" },
  { code: "SDJ", city: "Sendai", name: "Sendai Airport", country: "JP" },

  // ===== SOUTH KOREA =====
  { code: "ICN", city: "Seoul", name: "Incheon Intl Airport", country: "KR" },
  { code: "GMP", city: "Seoul", name: "Gimpo Intl Airport", country: "KR" },
  { code: "PUS", city: "Busan", name: "Gimhae Intl Airport", country: "KR" },
  { code: "CJU", city: "Jeju", name: "Jeju Intl Airport", country: "KR" },

  // ===== MONGOLIA =====
  { code: "UBN", city: "Ulaanbaatar", name: "Chinggis Khaan Intl Airport", country: "MN" },

  // ===== UAE =====
  { code: "DXB", city: "Dubai", name: "Dubai Intl Airport", country: "AE" },
  { code: "AUH", city: "Abu Dhabi", name: "Zayed Intl Airport", country: "AE" },
  { code: "SHJ", city: "Sharjah", name: "Sharjah Intl Airport", country: "AE" },
  { code: "DWC", city: "Dubai", name: "Al Maktoum Intl Airport", country: "AE" },
  { code: "RKT", city: "Ras Al Khaimah", name: "Ras Al Khaimah Intl Airport", country: "AE" },

  // ===== SAUDI ARABIA =====
  { code: "JED", city: "Jeddah", name: "King Abdulaziz Intl Airport", country: "SA" },
  { code: "RUH", city: "Riyadh", name: "King Khalid Intl Airport", country: "SA" },
  { code: "DMM", city: "Dammam", name: "King Fahd Intl Airport", country: "SA" },
  { code: "MED", city: "Madinah", name: "Prince Mohammad Bin Abdulaziz Intl", country: "SA" },
  { code: "AHB", city: "Abha", name: "Abha Regional Airport", country: "SA" },
  { code: "TIF", city: "Taif", name: "Taif Intl Airport", country: "SA" },
  { code: "TUU", city: "Tabuk", name: "Tabuk Regional Airport", country: "SA" },

  // ===== QATAR =====
  { code: "DOH", city: "Doha", name: "Hamad Intl Airport", country: "QA" },

  // ===== OMAN =====
  { code: "MCT", city: "Muscat", name: "Muscat Intl Airport", country: "OM" },
  { code: "SLL", city: "Salalah", name: "Salalah Airport", country: "OM" },

  // ===== BAHRAIN =====
  { code: "BAH", city: "Bahrain", name: "Bahrain Intl Airport", country: "BH" },

  // ===== KUWAIT =====
  { code: "KWI", city: "Kuwait City", name: "Kuwait Intl Airport", country: "KW" },

  // ===== IRAQ =====
  { code: "BGW", city: "Baghdad", name: "Baghdad Intl Airport", country: "IQ" },
  { code: "EBL", city: "Erbil", name: "Erbil Intl Airport", country: "IQ" },

  // ===== IRAN =====
  { code: "IKA", city: "Tehran", name: "Imam Khomeini Intl Airport", country: "IR" },
  { code: "THR", city: "Tehran", name: "Mehrabad Intl Airport", country: "IR" },
  { code: "SYZ", city: "Shiraz", name: "Shiraz Intl Airport", country: "IR" },
  { code: "MHD", city: "Mashhad", name: "Mashhad Intl Airport", country: "IR" },
  { code: "TBZ", city: "Tabriz", name: "Tabriz Intl Airport", country: "IR" },

  // ===== JORDAN =====
  { code: "AMM", city: "Amman", name: "Queen Alia Intl Airport", country: "JO" },

  // ===== LEBANON =====
  { code: "BEY", city: "Beirut", name: "Rafic Hariri Intl Airport", country: "LB" },

  // ===== ISRAEL =====
  { code: "TLV", city: "Tel Aviv", name: "Ben Gurion Intl Airport", country: "IL" },

  // ===== TURKEY =====
  { code: "IST", city: "Istanbul", name: "Istanbul Airport", country: "TR" },
  { code: "SAW", city: "Istanbul", name: "Sabiha Gökçen Intl Airport", country: "TR" },
  { code: "ESB", city: "Ankara", name: "Esenboğa Intl Airport", country: "TR" },
  { code: "AYT", city: "Antalya", name: "Antalya Airport", country: "TR" },
  { code: "ADB", city: "Izmir", name: "Adnan Menderes Airport", country: "TR" },
  { code: "DLM", city: "Dalaman", name: "Dalaman Airport", country: "TR" },
  { code: "BJV", city: "Bodrum", name: "Milas-Bodrum Airport", country: "TR" },
  { code: "TZX", city: "Trabzon", name: "Trabzon Airport", country: "TR" },

  // ===== EGYPT =====
  { code: "CAI", city: "Cairo", name: "Cairo Intl Airport", country: "EG" },
  { code: "HRG", city: "Hurghada", name: "Hurghada Intl Airport", country: "EG" },
  { code: "SSH", city: "Sharm El Sheikh", name: "Sharm El Sheikh Intl Airport", country: "EG" },
  { code: "LXR", city: "Luxor", name: "Luxor Intl Airport", country: "EG" },
  { code: "ALY", city: "Alexandria", name: "Borg El Arab Airport", country: "EG" },

  // ===== MOROCCO =====
  { code: "CMN", city: "Casablanca", name: "Mohammed V Intl Airport", country: "MA" },
  { code: "RAK", city: "Marrakech", name: "Menara Airport", country: "MA" },
  { code: "TNG", city: "Tangier", name: "Tangier Ibn Battouta Airport", country: "MA" },

  // ===== TUNISIA =====
  { code: "TUN", city: "Tunis", name: "Tunis-Carthage Intl Airport", country: "TN" },

  // ===== ALGERIA =====
  { code: "ALG", city: "Algiers", name: "Houari Boumediene Airport", country: "DZ" },

  // ===== LIBYA =====
  { code: "TIP", city: "Tripoli", name: "Mitiga Intl Airport", country: "LY" },

  // ===== SOUTH AFRICA =====
  { code: "JNB", city: "Johannesburg", name: "O.R. Tambo Intl Airport", country: "ZA" },
  { code: "CPT", city: "Cape Town", name: "Cape Town Intl Airport", country: "ZA" },
  { code: "DUR", city: "Durban", name: "King Shaka Intl Airport", country: "ZA" },

  // ===== KENYA =====
  { code: "NBO", city: "Nairobi", name: "Jomo Kenyatta Intl Airport", country: "KE" },
  { code: "MBA", city: "Mombasa", name: "Moi Intl Airport", country: "KE" },

  // ===== ETHIOPIA =====
  { code: "ADD", city: "Addis Ababa", name: "Bole Intl Airport", country: "ET" },

  // ===== TANZANIA =====
  { code: "DAR", city: "Dar es Salaam", name: "Julius Nyerere Intl Airport", country: "TZ" },
  { code: "ZNZ", city: "Zanzibar", name: "Abeid Amani Karume Intl Airport", country: "TZ" },
  { code: "JRO", city: "Kilimanjaro", name: "Kilimanjaro Intl Airport", country: "TZ" },

  // ===== NIGERIA =====
  { code: "LOS", city: "Lagos", name: "Murtala Muhammed Intl Airport", country: "NG" },
  { code: "ABV", city: "Abuja", name: "Nnamdi Azikiwe Intl Airport", country: "NG" },

  // ===== GHANA =====
  { code: "ACC", city: "Accra", name: "Kotoka Intl Airport", country: "GH" },

  // ===== UGANDA =====
  { code: "EBB", city: "Entebbe", name: "Entebbe Intl Airport", country: "UG" },

  // ===== RWANDA =====
  { code: "KGL", city: "Kigali", name: "Kigali Intl Airport", country: "RW" },

  // ===== MAURITIUS =====
  { code: "MRU", city: "Mauritius", name: "Sir Seewoosagur Ramgoolam Intl", country: "MU" },

  // ===== SEYCHELLES =====
  { code: "SEZ", city: "Mahé", name: "Seychelles Intl Airport", country: "SC" },

  // ===== MADAGASCAR =====
  { code: "TNR", city: "Antananarivo", name: "Ivato Intl Airport", country: "MG" },

  // ===== SENEGAL =====
  { code: "DSS", city: "Dakar", name: "Blaise Diagne Intl Airport", country: "SN" },

  // ===== IVORY COAST =====
  { code: "ABJ", city: "Abidjan", name: "Félix-Houphouët-Boigny Intl", country: "CI" },

  // ===== CAMEROON =====
  { code: "DLA", city: "Douala", name: "Douala Intl Airport", country: "CM" },

  // ===== CONGO =====
  { code: "FIH", city: "Kinshasa", name: "N'Djili Intl Airport", country: "CD" },

  // ===== UNITED KINGDOM =====
  { code: "LHR", city: "London", name: "Heathrow Airport", country: "GB" },
  { code: "LGW", city: "London", name: "Gatwick Airport", country: "GB" },
  { code: "STN", city: "London", name: "Stansted Airport", country: "GB" },
  { code: "LTN", city: "London", name: "Luton Airport", country: "GB" },
  { code: "LCY", city: "London", name: "London City Airport", country: "GB" },
  { code: "MAN", city: "Manchester", name: "Manchester Airport", country: "GB" },
  { code: "BHX", city: "Birmingham", name: "Birmingham Airport", country: "GB" },
  { code: "EDI", city: "Edinburgh", name: "Edinburgh Airport", country: "GB" },
  { code: "GLA", city: "Glasgow", name: "Glasgow Airport", country: "GB" },
  { code: "BRS", city: "Bristol", name: "Bristol Airport", country: "GB" },
  { code: "NCL", city: "Newcastle", name: "Newcastle Airport", country: "GB" },
  { code: "BFS", city: "Belfast", name: "Belfast Intl Airport", country: "GB" },
  { code: "LPL", city: "Liverpool", name: "Liverpool John Lennon Airport", country: "GB" },
  { code: "ABZ", city: "Aberdeen", name: "Aberdeen Airport", country: "GB" },
  { code: "CWL", city: "Cardiff", name: "Cardiff Airport", country: "GB" },

  // ===== IRELAND =====
  { code: "DUB", city: "Dublin", name: "Dublin Airport", country: "IE" },
  { code: "SNN", city: "Shannon", name: "Shannon Airport", country: "IE" },
  { code: "ORK", city: "Cork", name: "Cork Airport", country: "IE" },

  // ===== FRANCE =====
  { code: "CDG", city: "Paris", name: "Charles de Gaulle Airport", country: "FR" },
  { code: "ORY", city: "Paris", name: "Orly Airport", country: "FR" },
  { code: "NCE", city: "Nice", name: "Côte d'Azur Airport", country: "FR" },
  { code: "LYS", city: "Lyon", name: "Lyon-Saint Exupéry Airport", country: "FR" },
  { code: "MRS", city: "Marseille", name: "Marseille Provence Airport", country: "FR" },
  { code: "TLS", city: "Toulouse", name: "Toulouse-Blagnac Airport", country: "FR" },
  { code: "BOD", city: "Bordeaux", name: "Bordeaux-Mérignac Airport", country: "FR" },
  { code: "NTE", city: "Nantes", name: "Nantes Atlantique Airport", country: "FR" },
  { code: "SXB", city: "Strasbourg", name: "Strasbourg Airport", country: "FR" },

  // ===== GERMANY =====
  { code: "FRA", city: "Frankfurt", name: "Frankfurt Airport", country: "DE" },
  { code: "MUC", city: "Munich", name: "Munich Airport", country: "DE" },
  { code: "BER", city: "Berlin", name: "Berlin Brandenburg Airport", country: "DE" },
  { code: "DUS", city: "Düsseldorf", name: "Düsseldorf Airport", country: "DE" },
  { code: "HAM", city: "Hamburg", name: "Hamburg Airport", country: "DE" },
  { code: "CGN", city: "Cologne", name: "Cologne Bonn Airport", country: "DE" },
  { code: "STR", city: "Stuttgart", name: "Stuttgart Airport", country: "DE" },
  { code: "HAJ", city: "Hanover", name: "Hanover Airport", country: "DE" },
  { code: "NUE", city: "Nuremberg", name: "Nuremberg Airport", country: "DE" },
  { code: "LEJ", city: "Leipzig", name: "Leipzig/Halle Airport", country: "DE" },

  // ===== NETHERLANDS =====
  { code: "AMS", city: "Amsterdam", name: "Schiphol Airport", country: "NL" },
  { code: "EIN", city: "Eindhoven", name: "Eindhoven Airport", country: "NL" },

  // ===== BELGIUM =====
  { code: "BRU", city: "Brussels", name: "Brussels Airport", country: "BE" },
  { code: "CRL", city: "Charleroi", name: "Brussels South Charleroi Airport", country: "BE" },

  // ===== LUXEMBOURG =====
  { code: "LUX", city: "Luxembourg", name: "Luxembourg Airport", country: "LU" },

  // ===== SWITZERLAND =====
  { code: "ZRH", city: "Zurich", name: "Zurich Airport", country: "CH" },
  { code: "GVA", city: "Geneva", name: "Geneva Airport", country: "CH" },
  { code: "BSL", city: "Basel", name: "EuroAirport Basel-Mulhouse", country: "CH" },

  // ===== AUSTRIA =====
  { code: "VIE", city: "Vienna", name: "Vienna Intl Airport", country: "AT" },
  { code: "SZG", city: "Salzburg", name: "Salzburg Airport", country: "AT" },
  { code: "INN", city: "Innsbruck", name: "Innsbruck Airport", country: "AT" },

  // ===== ITALY =====
  { code: "FCO", city: "Rome", name: "Fiumicino Airport", country: "IT" },
  { code: "MXP", city: "Milan", name: "Malpensa Airport", country: "IT" },
  { code: "LIN", city: "Milan", name: "Linate Airport", country: "IT" },
  { code: "VCE", city: "Venice", name: "Marco Polo Airport", country: "IT" },
  { code: "NAP", city: "Naples", name: "Naples Intl Airport", country: "IT" },
  { code: "BLQ", city: "Bologna", name: "Guglielmo Marconi Airport", country: "IT" },
  { code: "FLR", city: "Florence", name: "Peretola Airport", country: "IT" },
  { code: "PSA", city: "Pisa", name: "Galileo Galilei Airport", country: "IT" },
  { code: "CTA", city: "Catania", name: "Fontanarossa Airport", country: "IT" },
  { code: "PMO", city: "Palermo", name: "Falcone-Borsellino Airport", country: "IT" },
  { code: "BGY", city: "Bergamo", name: "Orio al Serio Airport", country: "IT" },
  { code: "TRN", city: "Turin", name: "Turin Airport", country: "IT" },
  { code: "CAG", city: "Cagliari", name: "Cagliari Elmas Airport", country: "IT" },
  { code: "OLB", city: "Olbia", name: "Costa Smeralda Airport", country: "IT" },
  { code: "BRI", city: "Bari", name: "Karol Wojtyla Airport", country: "IT" },

  // ===== SPAIN =====
  { code: "MAD", city: "Madrid", name: "Adolfo Suárez Madrid-Barajas", country: "ES" },
  { code: "BCN", city: "Barcelona", name: "El Prat Airport", country: "ES" },
  { code: "PMI", city: "Palma de Mallorca", name: "Palma de Mallorca Airport", country: "ES" },
  { code: "AGP", city: "Málaga", name: "Málaga-Costa del Sol Airport", country: "ES" },
  { code: "ALC", city: "Alicante", name: "Alicante-Elche Airport", country: "ES" },
  { code: "TFS", city: "Tenerife", name: "Tenerife South Airport", country: "ES" },
  { code: "LPA", city: "Gran Canaria", name: "Gran Canaria Airport", country: "ES" },
  { code: "IBZ", city: "Ibiza", name: "Ibiza Airport", country: "ES" },
  { code: "VLC", city: "Valencia", name: "Valencia Airport", country: "ES" },
  { code: "SVQ", city: "Seville", name: "San Pablo Airport", country: "ES" },
  { code: "BIO", city: "Bilbao", name: "Bilbao Airport", country: "ES" },

  // ===== PORTUGAL =====
  { code: "LIS", city: "Lisbon", name: "Humberto Delgado Airport", country: "PT" },
  { code: "OPO", city: "Porto", name: "Francisco Sá Carneiro Airport", country: "PT" },
  { code: "FAO", city: "Faro", name: "Faro Airport", country: "PT" },
  { code: "FNC", city: "Funchal", name: "Madeira Airport", country: "PT" },

  // ===== GREECE =====
  { code: "ATH", city: "Athens", name: "Eleftherios Venizelos Airport", country: "GR" },
  { code: "SKG", city: "Thessaloniki", name: "Makedonia Airport", country: "GR" },
  { code: "HER", city: "Heraklion", name: "Nikos Kazantzakis Airport", country: "GR" },
  { code: "RHO", city: "Rhodes", name: "Diagoras Airport", country: "GR" },
  { code: "CFU", city: "Corfu", name: "Ioannis Kapodistrias Airport", country: "GR" },
  { code: "JMK", city: "Mykonos", name: "Mykonos Airport", country: "GR" },
  { code: "JTR", city: "Santorini", name: "Santorini Airport", country: "GR" },

  // ===== CROATIA =====
  { code: "ZAG", city: "Zagreb", name: "Franjo Tuđman Airport", country: "HR" },
  { code: "SPU", city: "Split", name: "Split Airport", country: "HR" },
  { code: "DBV", city: "Dubrovnik", name: "Dubrovnik Airport", country: "HR" },

  // ===== CZECH REPUBLIC =====
  { code: "PRG", city: "Prague", name: "Václav Havel Airport", country: "CZ" },

  // ===== POLAND =====
  { code: "WAW", city: "Warsaw", name: "Chopin Airport", country: "PL" },
  { code: "KRK", city: "Krakow", name: "John Paul II Intl Airport", country: "PL" },
  { code: "GDN", city: "Gdansk", name: "Lech Wałęsa Airport", country: "PL" },
  { code: "WRO", city: "Wroclaw", name: "Copernicus Airport", country: "PL" },
  { code: "KTW", city: "Katowice", name: "Katowice Airport", country: "PL" },
  { code: "POZ", city: "Poznan", name: "Ławica Airport", country: "PL" },

  // ===== HUNGARY =====
  { code: "BUD", city: "Budapest", name: "Budapest Ferenc Liszt Intl", country: "HU" },

  // ===== ROMANIA =====
  { code: "OTP", city: "Bucharest", name: "Henri Coandă Intl Airport", country: "RO" },
  { code: "CLJ", city: "Cluj-Napoca", name: "Avram Iancu Intl Airport", country: "RO" },

  // ===== BULGARIA =====
  { code: "SOF", city: "Sofia", name: "Sofia Airport", country: "BG" },
  { code: "BOJ", city: "Burgas", name: "Burgas Airport", country: "BG" },
  { code: "VAR", city: "Varna", name: "Varna Airport", country: "BG" },

  // ===== SERBIA =====
  { code: "BEG", city: "Belgrade", name: "Nikola Tesla Airport", country: "RS" },

  // ===== DENMARK =====
  { code: "CPH", city: "Copenhagen", name: "Copenhagen Airport", country: "DK" },

  // ===== SWEDEN =====
  { code: "ARN", city: "Stockholm", name: "Arlanda Airport", country: "SE" },
  { code: "GOT", city: "Gothenburg", name: "Landvetter Airport", country: "SE" },

  // ===== NORWAY =====
  { code: "OSL", city: "Oslo", name: "Oslo Gardermoen Airport", country: "NO" },
  { code: "BGO", city: "Bergen", name: "Bergen Airport Flesland", country: "NO" },

  // ===== FINLAND =====
  { code: "HEL", city: "Helsinki", name: "Helsinki-Vantaa Airport", country: "FI" },

  // ===== ICELAND =====
  { code: "KEF", city: "Reykjavik", name: "Keflavík Intl Airport", country: "IS" },

  // ===== BALTIC STATES =====
  { code: "RIX", city: "Riga", name: "Riga Intl Airport", country: "LV" },
  { code: "VNO", city: "Vilnius", name: "Vilnius Airport", country: "LT" },
  { code: "TLL", city: "Tallinn", name: "Lennart Meri Airport", country: "EE" },

  // ===== RUSSIA =====
  { code: "SVO", city: "Moscow", name: "Sheremetyevo Intl Airport", country: "RU" },
  { code: "DME", city: "Moscow", name: "Domodedovo Intl Airport", country: "RU" },
  { code: "VKO", city: "Moscow", name: "Vnukovo Intl Airport", country: "RU" },
  { code: "LED", city: "St. Petersburg", name: "Pulkovo Airport", country: "RU" },
  { code: "KZN", city: "Kazan", name: "Kazan Intl Airport", country: "RU" },
  { code: "SVX", city: "Yekaterinburg", name: "Koltsovo Airport", country: "RU" },
  { code: "OVB", city: "Novosibirsk", name: "Tolmachevo Airport", country: "RU" },
  { code: "VVO", city: "Vladivostok", name: "Vladivostok Intl Airport", country: "RU" },
  { code: "KRR", city: "Krasnodar", name: "Pashkovsky Airport", country: "RU" },

  // ===== UKRAINE =====
  { code: "KBP", city: "Kyiv", name: "Boryspil Intl Airport", country: "UA" },
  { code: "LWO", city: "Lviv", name: "Lviv Danylo Halytskyi Intl", country: "UA" },
  { code: "ODS", city: "Odesa", name: "Odesa Intl Airport", country: "UA" },

  // ===== GEORGIA =====
  { code: "TBS", city: "Tbilisi", name: "Tbilisi Intl Airport", country: "GE" },
  { code: "BUS", city: "Batumi", name: "Batumi Intl Airport", country: "GE" },

  // ===== ARMENIA =====
  { code: "EVN", city: "Yerevan", name: "Zvartnots Intl Airport", country: "AM" },

  // ===== AZERBAIJAN =====
  { code: "GYD", city: "Baku", name: "Heydar Aliyev Intl Airport", country: "AZ" },

  // ===== KAZAKHSTAN =====
  { code: "NQZ", city: "Astana", name: "Nursultan Nazarbayev Intl", country: "KZ" },
  { code: "ALA", city: "Almaty", name: "Almaty Intl Airport", country: "KZ" },

  // ===== UZBEKISTAN =====
  { code: "TAS", city: "Tashkent", name: "Islam Karimov Tashkent Intl", country: "UZ" },
  { code: "SKD", city: "Samarkand", name: "Samarkand Intl Airport", country: "UZ" },

  // ===== TURKMENISTAN =====
  { code: "ASB", city: "Ashgabat", name: "Ashgabat Intl Airport", country: "TM" },

  // ===== KYRGYZSTAN =====
  { code: "FRU", city: "Bishkek", name: "Manas Intl Airport", country: "KG" },

  // ===== TAJIKISTAN =====
  { code: "DYU", city: "Dushanbe", name: "Dushanbe Intl Airport", country: "TJ" },

  // ===== AFGHANISTAN =====
  { code: "KBL", city: "Kabul", name: "Hamid Karzai Intl Airport", country: "AF" },

  // ===== USA =====
  { code: "JFK", city: "New York", name: "John F. Kennedy Intl Airport", country: "US" },
  { code: "EWR", city: "Newark", name: "Newark Liberty Intl Airport", country: "US" },
  { code: "LGA", city: "New York", name: "LaGuardia Airport", country: "US" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles Intl Airport", country: "US" },
  { code: "ORD", city: "Chicago", name: "O'Hare Intl Airport", country: "US" },
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson Intl Airport", country: "US" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth Intl Airport", country: "US" },
  { code: "DEN", city: "Denver", name: "Denver Intl Airport", country: "US" },
  { code: "SFO", city: "San Francisco", name: "San Francisco Intl Airport", country: "US" },
  { code: "SEA", city: "Seattle", name: "Seattle-Tacoma Intl Airport", country: "US" },
  { code: "MIA", city: "Miami", name: "Miami Intl Airport", country: "US" },
  { code: "FLL", city: "Fort Lauderdale", name: "Fort Lauderdale-Hollywood Intl", country: "US" },
  { code: "MCO", city: "Orlando", name: "Orlando Intl Airport", country: "US" },
  { code: "BOS", city: "Boston", name: "Logan Intl Airport", country: "US" },
  { code: "IAD", city: "Washington DC", name: "Dulles Intl Airport", country: "US" },
  { code: "DCA", city: "Washington DC", name: "Reagan National Airport", country: "US" },
  { code: "IAH", city: "Houston", name: "George Bush Intercontinental", country: "US" },
  { code: "PHX", city: "Phoenix", name: "Phoenix Sky Harbor Intl Airport", country: "US" },
  { code: "MSP", city: "Minneapolis", name: "Minneapolis-Saint Paul Intl", country: "US" },
  { code: "DTW", city: "Detroit", name: "Detroit Metropolitan Airport", country: "US" },
  { code: "PHL", city: "Philadelphia", name: "Philadelphia Intl Airport", country: "US" },
  { code: "CLT", city: "Charlotte", name: "Charlotte Douglas Intl Airport", country: "US" },
  { code: "SLC", city: "Salt Lake City", name: "Salt Lake City Intl Airport", country: "US" },
  { code: "SAN", city: "San Diego", name: "San Diego Intl Airport", country: "US" },
  { code: "TPA", city: "Tampa", name: "Tampa Intl Airport", country: "US" },
  { code: "PDX", city: "Portland", name: "Portland Intl Airport", country: "US" },
  { code: "BWI", city: "Baltimore", name: "Baltimore/Washington Intl", country: "US" },
  { code: "HNL", city: "Honolulu", name: "Daniel K. Inouye Intl Airport", country: "US" },
  { code: "ANC", city: "Anchorage", name: "Ted Stevens Anchorage Intl", country: "US" },
  { code: "LAS", city: "Las Vegas", name: "Harry Reid Intl Airport", country: "US" },
  { code: "AUS", city: "Austin", name: "Austin-Bergstrom Intl Airport", country: "US" },
  { code: "RDU", city: "Raleigh", name: "Raleigh-Durham Intl Airport", country: "US" },
  { code: "BNA", city: "Nashville", name: "Nashville Intl Airport", country: "US" },
  { code: "STL", city: "St. Louis", name: "Lambert-St. Louis Intl Airport", country: "US" },
  { code: "MCI", city: "Kansas City", name: "Kansas City Intl Airport", country: "US" },
  { code: "IND", city: "Indianapolis", name: "Indianapolis Intl Airport", country: "US" },
  { code: "CLE", city: "Cleveland", name: "Cleveland Hopkins Intl Airport", country: "US" },
  { code: "CMH", city: "Columbus", name: "John Glenn Intl Airport", country: "US" },
  { code: "PIT", city: "Pittsburgh", name: "Pittsburgh Intl Airport", country: "US" },
  { code: "CVG", city: "Cincinnati", name: "Cincinnati/Northern Kentucky Intl", country: "US" },
  { code: "MKE", city: "Milwaukee", name: "Milwaukee Mitchell Intl Airport", country: "US" },
  { code: "SAT", city: "San Antonio", name: "San Antonio Intl Airport", country: "US" },
  { code: "JAX", city: "Jacksonville", name: "Jacksonville Intl Airport", country: "US" },
  { code: "OAK", city: "Oakland", name: "Oakland Intl Airport", country: "US" },
  { code: "SJC", city: "San Jose", name: "Norman Y. Mineta San Jose Intl", country: "US" },
  { code: "SMF", city: "Sacramento", name: "Sacramento Intl Airport", country: "US" },
  { code: "RSW", city: "Fort Myers", name: "Southwest Florida Intl Airport", country: "US" },
  { code: "MSY", city: "New Orleans", name: "Louis Armstrong New Orleans Intl", country: "US" },
  { code: "BUF", city: "Buffalo", name: "Buffalo Niagara Intl Airport", country: "US" },
  { code: "ABQ", city: "Albuquerque", name: "Albuquerque Intl Sunport", country: "US" },
  { code: "OMA", city: "Omaha", name: "Eppley Airfield", country: "US" },
  { code: "RIC", city: "Richmond", name: "Richmond Intl Airport", country: "US" },

  // ===== CANADA =====
  { code: "YYZ", city: "Toronto", name: "Pearson Intl Airport", country: "CA" },
  { code: "YVR", city: "Vancouver", name: "Vancouver Intl Airport", country: "CA" },
  { code: "YUL", city: "Montreal", name: "Montréal-Trudeau Intl Airport", country: "CA" },
  { code: "YYC", city: "Calgary", name: "Calgary Intl Airport", country: "CA" },
  { code: "YEG", city: "Edmonton", name: "Edmonton Intl Airport", country: "CA" },
  { code: "YOW", city: "Ottawa", name: "Ottawa Macdonald-Cartier Intl", country: "CA" },
  { code: "YWG", city: "Winnipeg", name: "Winnipeg James Armstrong Richardson Intl", country: "CA" },
  { code: "YHZ", city: "Halifax", name: "Halifax Stanfield Intl Airport", country: "CA" },
  { code: "YQB", city: "Quebec City", name: "Québec City Jean Lesage Intl", country: "CA" },
  { code: "YXE", city: "Saskatoon", name: "Saskatoon John G. Diefenbaker Intl", country: "CA" },
  { code: "YQR", city: "Regina", name: "Regina Intl Airport", country: "CA" },
  { code: "YYJ", city: "Victoria", name: "Victoria Intl Airport", country: "CA" },
  { code: "YKF", city: "Kitchener", name: "Region of Waterloo Intl Airport", country: "CA" },
  { code: "YLW", city: "Kelowna", name: "Kelowna Intl Airport", country: "CA" },
  { code: "YXU", city: "London", name: "London Intl Airport", country: "CA" },

  // ===== MEXICO =====
  { code: "MEX", city: "Mexico City", name: "Benito Juárez Intl Airport", country: "MX" },
  { code: "CUN", city: "Cancún", name: "Cancún Intl Airport", country: "MX" },
  { code: "GDL", city: "Guadalajara", name: "Miguel Hidalgo y Costilla Intl", country: "MX" },
  { code: "MTY", city: "Monterrey", name: "Mariano Escobedo Intl Airport", country: "MX" },
  { code: "TIJ", city: "Tijuana", name: "Tijuana Intl Airport", country: "MX" },
  { code: "SJD", city: "Los Cabos", name: "Los Cabos Intl Airport", country: "MX" },
  { code: "PVR", city: "Puerto Vallarta", name: "Gustavo Díaz Ordaz Intl", country: "MX" },

  // ===== CARIBBEAN =====
  { code: "SJU", city: "San Juan", name: "Luis Muñoz Marín Intl Airport", country: "PR" },
  { code: "NAS", city: "Nassau", name: "Lynden Pindling Intl Airport", country: "BS" },
  { code: "MBJ", city: "Montego Bay", name: "Sangster Intl Airport", country: "JM" },
  { code: "KIN", city: "Kingston", name: "Norman Manley Intl Airport", country: "JM" },
  { code: "POS", city: "Port of Spain", name: "Piarco Intl Airport", country: "TT" },
  { code: "BGI", city: "Bridgetown", name: "Grantley Adams Intl Airport", country: "BB" },
  { code: "SDQ", city: "Santo Domingo", name: "Las Américas Intl Airport", country: "DO" },
  { code: "PUJ", city: "Punta Cana", name: "Punta Cana Intl Airport", country: "DO" },
  { code: "HAV", city: "Havana", name: "José Martí Intl Airport", country: "CU" },
  { code: "AUA", city: "Aruba", name: "Queen Beatrix Intl Airport", country: "AW" },
  { code: "CUR", city: "Curaçao", name: "Hato Intl Airport", country: "CW" },
  { code: "SXM", city: "Sint Maarten", name: "Princess Juliana Intl Airport", country: "SX" },
  { code: "GCM", city: "Grand Cayman", name: "Owen Roberts Intl Airport", country: "KY" },

  // ===== CENTRAL AMERICA =====
  { code: "PTY", city: "Panama City", name: "Tocumen Intl Airport", country: "PA" },
  { code: "SJO", city: "San José", name: "Juan Santamaría Intl Airport", country: "CR" },
  { code: "GUA", city: "Guatemala City", name: "La Aurora Intl Airport", country: "GT" },
  { code: "SAP", city: "San Pedro Sula", name: "Ramón Villeda Morales Intl", country: "HN" },
  { code: "SAL", city: "San Salvador", name: "Monseñor Óscar Romero Intl", country: "SV" },
  { code: "BZE", city: "Belize City", name: "Philip S.W. Goldson Intl Airport", country: "BZ" },
  { code: "MGA", city: "Managua", name: "Augusto C. Sandino Intl Airport", country: "NI" },

  // ===== SOUTH AMERICA =====
  { code: "GRU", city: "São Paulo", name: "Guarulhos Intl Airport", country: "BR" },
  { code: "GIG", city: "Rio de Janeiro", name: "Galeão Intl Airport", country: "BR" },
  { code: "BSB", city: "Brasília", name: "Presidente Juscelino Kubitschek Intl", country: "BR" },
  { code: "CNF", city: "Belo Horizonte", name: "Confins Intl Airport", country: "BR" },
  { code: "SSA", city: "Salvador", name: "Deputado Luís Eduardo Magalhães Intl", country: "BR" },
  { code: "REC", city: "Recife", name: "Guararapes Intl Airport", country: "BR" },
  { code: "FOR", city: "Fortaleza", name: "Pinto Martins Intl Airport", country: "BR" },
  { code: "CWB", city: "Curitiba", name: "Afonso Pena Intl Airport", country: "BR" },
  { code: "POA", city: "Porto Alegre", name: "Salgado Filho Intl Airport", country: "BR" },
  { code: "MAO", city: "Manaus", name: "Eduardo Gomes Intl Airport", country: "BR" },
  { code: "BEL", city: "Belém", name: "Val de Cans Intl Airport", country: "BR" },
  { code: "FLN", city: "Florianópolis", name: "Hercílio Luz Intl Airport", country: "BR" },
  { code: "NAT", city: "Natal", name: "São Gonçalo do Amarante Intl", country: "BR" },

  { code: "EZE", city: "Buenos Aires", name: "Ministro Pistarini Intl Airport", country: "AR" },
  { code: "AEP", city: "Buenos Aires", name: "Jorge Newbery Airfield", country: "AR" },
  { code: "COR", city: "Córdoba", name: "Ingeniero Ambrosio Taravella Airport", country: "AR" },
  { code: "MDZ", city: "Mendoza", name: "El Plumerillo Airport", country: "AR" },
  { code: "BRC", city: "Bariloche", name: "San Carlos de Bariloche Airport", country: "AR" },
  { code: "IGR", city: "Iguazú", name: "Cataratas del Iguazú Intl Airport", country: "AR" },
  { code: "USH", city: "Ushuaia", name: "Malvinas Argentinas Airport", country: "AR" },

  { code: "SCL", city: "Santiago", name: "Arturo Merino Benítez Intl Airport", country: "CL" },
  { code: "IPC", city: "Easter Island", name: "Mataveri Intl Airport", country: "CL" },
  { code: "PUQ", city: "Punta Arenas", name: "Carlos Ibáñez Airport", country: "CL" },

  { code: "BOG", city: "Bogotá", name: "El Dorado Intl Airport", country: "CO" },
  { code: "MDE", city: "Medellín", name: "José María Córdova Intl Airport", country: "CO" },
  { code: "CLO", city: "Cali", name: "Alfonso Bonilla Aragón Intl", country: "CO" },
  { code: "CTG", city: "Cartagena", name: "Rafael Núñez Intl Airport", country: "CO" },

  { code: "LIM", city: "Lima", name: "Jorge Chávez Intl Airport", country: "PE" },
  { code: "CUZ", city: "Cusco", name: "Alejandro Velasco Astete Intl", country: "PE" },

  { code: "UIO", city: "Quito", name: "Mariscal Sucre Intl Airport", country: "EC" },
  { code: "GYE", city: "Guayaquil", name: "José Joaquín de Olmedo Intl", country: "EC" },
  { code: "GPS", city: "Galápagos", name: "Seymour Airport", country: "EC" },

  { code: "VVI", city: "Santa Cruz", name: "Viru Viru Intl Airport", country: "BO" },
  { code: "LPB", city: "La Paz", name: "El Alto Intl Airport", country: "BO" },

  { code: "CCS", city: "Caracas", name: "Simón Bolívar Intl Airport", country: "VE" },

  { code: "ASU", city: "Asunción", name: "Silvio Pettirossi Intl Airport", country: "PY" },

  { code: "MVD", city: "Montevideo", name: "Carrasco Intl Airport", country: "UY" },

  { code: "GEO", city: "Georgetown", name: "Cheddi Jagan Intl Airport", country: "GY" },

  { code: "PBM", city: "Paramaribo", name: "Johan Adolf Pengel Intl Airport", country: "SR" },

  // ===== AUSTRALIA =====
  { code: "SYD", city: "Sydney", name: "Kingsford Smith Airport", country: "AU" },
  { code: "MEL", city: "Melbourne", name: "Tullamarine Airport", country: "AU" },
  { code: "BNE", city: "Brisbane", name: "Brisbane Airport", country: "AU" },
  { code: "PER", city: "Perth", name: "Perth Airport", country: "AU" },
  { code: "ADL", city: "Adelaide", name: "Adelaide Airport", country: "AU" },
  { code: "CBR", city: "Canberra", name: "Canberra Airport", country: "AU" },
  { code: "OOL", city: "Gold Coast", name: "Gold Coast Airport", country: "AU" },
  { code: "CNS", city: "Cairns", name: "Cairns Airport", country: "AU" },
  { code: "HBA", city: "Hobart", name: "Hobart Airport", country: "AU" },
  { code: "DRW", city: "Darwin", name: "Darwin Intl Airport", country: "AU" },

  // ===== NEW ZEALAND =====
  { code: "AKL", city: "Auckland", name: "Auckland Airport", country: "NZ" },
  { code: "WLG", city: "Wellington", name: "Wellington Airport", country: "NZ" },
  { code: "CHC", city: "Christchurch", name: "Christchurch Intl Airport", country: "NZ" },
  { code: "ZQN", city: "Queenstown", name: "Queenstown Airport", country: "NZ" },

  // ===== PACIFIC ISLANDS =====
  { code: "NAN", city: "Nadi", name: "Nadi Intl Airport", country: "FJ" },
  { code: "PPT", city: "Papeete", name: "Fa'a'ā Intl Airport", country: "PF" },
  { code: "NOU", city: "Nouméa", name: "La Tontouta Intl Airport", country: "NC" },
  { code: "APW", city: "Apia", name: "Faleolo Intl Airport", country: "WS" },
  { code: "TBU", city: "Nuku'alofa", name: "Fuaʻamotu Intl Airport", country: "TO" },
  { code: "GUM", city: "Guam", name: "Antonio B. Won Pat Intl Airport", country: "GU" },

  // ===== CYPRUS / MALTA =====
  { code: "LCA", city: "Larnaca", name: "Larnaca Intl Airport", country: "CY" },
  { code: "PFO", city: "Paphos", name: "Paphos Intl Airport", country: "CY" },
  { code: "MLA", city: "Malta", name: "Malta Intl Airport", country: "MT" },

  // ===== ADDITIONAL AFRICAN AIRPORTS =====
  { code: "WDH", city: "Windhoek", name: "Hosea Kutako Intl Airport", country: "NA" },
  { code: "LUN", city: "Lusaka", name: "Kenneth Kaunda Intl Airport", country: "ZM" },
  { code: "HRE", city: "Harare", name: "Robert Gabriel Mugabe Intl", country: "ZW" },
  { code: "MPM", city: "Maputo", name: "Maputo Intl Airport", country: "MZ" },
  { code: "BLZ", city: "Blantyre", name: "Chileka Intl Airport", country: "MW" },

  // ===== SLOVENIA / SLOVAKIA / BOSNIA =====
  { code: "LJU", city: "Ljubljana", name: "Ljubljana Jože Pučnik Airport", country: "SI" },
  { code: "BTS", city: "Bratislava", name: "M. R. Štefánik Airport", country: "SK" },
  { code: "SJJ", city: "Sarajevo", name: "Sarajevo Intl Airport", country: "BA" },

  // ===== NORTH MACEDONIA / ALBANIA / MONTENEGRO / KOSOVO =====
  { code: "SKP", city: "Skopje", name: "Skopje Intl Airport", country: "MK" },
  { code: "TIA", city: "Tirana", name: "Tirana Intl Airport", country: "AL" },
  { code: "TGD", city: "Podgorica", name: "Podgorica Airport", country: "ME" },
  { code: "PRN", city: "Pristina", name: "Pristina Intl Airport", country: "XK" },

  // ===== MOLDOVA =====
  { code: "KIV", city: "Chișinău", name: "Chișinău Intl Airport", country: "MD" },

  // ===== BELARUS =====
  { code: "MSQ", city: "Minsk", name: "Minsk National Airport", country: "BY" },
];
