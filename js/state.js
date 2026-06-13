// Default Mock Data in memory simulating Google Sheets Backend
const defaultVendorList = [
    {
        vendor_id: "VND-001",
        category: "Venue",
        vendor_name: "Aula Badarusamsi Ditkuad",
        package_name: "Sewa Gedung Sesi Pagi + Charge AC",
        price: 8650000,
        notes: "Termasuk sewa gedung dan charge AC Rp 150rb. Listrik bebas.",
        file_url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/drive/folders/1A_B_C_venue_badarusamsi",
        status: "Selected"
    },
    {
        vendor_id: "VND-001B",
        category: "Venue",
        vendor_name: "Aula LPTQ Jawa Barat",
        package_name: "Sewa Gedung Kosong",
        price: 5500000,
        notes: "Gedung kosong saja. 5.000 Watt (wajib genset luar). Standing AC sendiri.",
        file_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/drive/folders/1_lptq_jabar_docs",
        status: "Eliminated"
    },
    {
        vendor_id: "VND-002",
        category: "Catering",
        vendor_name: "Komala Catering (Lembang)",
        package_name: "Platinum Package 1 (1.000 Pax)",
        price: 33500000,
        notes: "Luar transport Lembang - Bandung kota. Buffet 100%, 3 Stall (60%), 3 Dessert (60%). Free Nasi Punar & Ayam Bakakak.",
        file_url: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/file/d/1_catering_pricelist_komala/view",
        status: "Selected"
    },
    {
        vendor_id: "VND-002B",
        category: "Catering",
        vendor_name: "Puspa Catering",
        package_name: "Package Gold 500 Pax",
        price: 125000000,
        notes: "Termasuk dekorasi buffet utama & dekorasi 4 pondokan makanan.",
        file_url: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/file/d/1_puspa_catering_500pax/view",
        status: "Eliminated"
    },
    {
        vendor_id: "VND-003",
        category: "Decoration",
        vendor_name: "Line Decor",
        package_name: "Paket LOLIA",
        price: 10000000,
        notes: "Backdrop pelaminan 8m, pergola jalan 15m, photobooth, gate masuk, bunga artificial + taman fresh. Free custom warna earth tone.",
        file_url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/drive/folders/1_line_decor_portfolios",
        status: "Selected"
    },
    {
        vendor_id: "VND-003B",
        category: "Decoration",
        vendor_name: "Lotus Design Decor",
        package_name: "Rustic Chic Wedding Theme",
        price: 45000000,
        notes: "Termasuk pergola jalan 4m & dekorasi pelaminan utama panjang 8m.",
        file_url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/drive/folders/1_lotus_design_decor_rustic",
        status: "Eliminated"
    },
    {
        vendor_id: "VND-004",
        category: "MUA & Attire",
        vendor_name: "Azmi Amalia Mua x NESA",
        package_name: "Bride & Groom Attire + MUA",
        price: 9000000,
        notes: "Makeup Akad + Retouch Resepsi, 1 pasang busana Akad & Resepsi, 2 busana ortu, 2 busana pagar ayu. Free melati segar, softlens, fake nails.",
        file_url: "https://images.unsplash.com/photo-1596751303335-742b504853d7?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/file/d/1_mua_nessa_makeup/view",
        status: "Selected"
    },
    {
        vendor_id: "VND-004B",
        category: "MUA & Attire",
        vendor_name: "Anpa Suha & Siger Bride",
        package_name: "Bride & Groom Premium Dress",
        price: 30000000,
        notes: "Sewa pakaian pengantin adat Sunda & MUA stand by retouch 2x.",
        file_url: "https://images.unsplash.com/photo-1596751303335-742b504853d7?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/file/d/1_anpa_suha_attire/view",
        status: "Eliminated"
    },
    {
        vendor_id: "VND-005",
        category: "Documentation",
        vendor_name: "Platinum Wedding",
        package_name: "Classic Photo & Video Documentary",
        price: 5000000,
        notes: "1 Day Coverage (8 jam), 2 Fotografer, 1 Videografer, Album Magazine 20 hal + Box, 300 foto edit, cetak bingkai 16RP (2) & 8R (2), video cinematic (3-4 m), master file di USB.",
        file_url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/drive/folders/1_platinum_docs",
        status: "Selected"
    },
    {
        vendor_id: "VND-005B",
        category: "Documentation",
        vendor_name: "Vera Photography",
        package_name: "Classic Photo & Video Documentary",
        price: 15000000,
        notes: "2 fotografer, 1 videografer, teaser 1 menit, album kolase 30 halaman.",
        file_url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/file/d/1_vera_photo_classic/view",
        status: "Eliminated"
    },
    {
        vendor_id: "VND-006",
        category: "Entertainment & WO",
        vendor_name: "Dienisa MC",
        package_name: "Paket C (Promo)",
        price: 2200000,
        notes: "MC + 4 Kru WO hari H. Konsultasi rundown. WO dimaksimalkan untuk Bride Assistant dan alur foto tamu.",
        file_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/file/d/1_dienisa_rundown_mc/view",
        status: "Selected"
    },
    {
        vendor_id: "VND-006B",
        category: "Entertainment & WO",
        vendor_name: "Kahitna Light Orchestra",
        package_name: "Acoustic Band Setup",
        price: 65000000,
        notes: "Live acoustic band, sound system 3000W, MC kawakan berpengalaman.",
        file_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
        drive_url: "https://drive.google.com/file/d/1_kahitna_orchestra_setup/view",
        status: "Eliminated"
    }
];

const defaultLogs = [
    { tanggal: new Date(Date.now() - 3600000 * 24 * 3), user: "wp_planner@aurawedding.com", aktivitas: "CREATE_VND", detail: "Mengusulkan Aula Badarusamsi Ditkuad ke Kategori Venue" },
    { tanggal: new Date(Date.now() - 3600000 * 12), user: "tama.decider@sg-corp.com", aktivitas: "STATUS_UPDATE", detail: "Mengubah status Aula Badarusamsi Ditkuad menjadi SELECTED" },
    { tanggal: new Date(Date.now() - 3600000 * 6), user: "indah.adr@gmail.com", aktivitas: "STATUS_UPDATE", detail: "Mengusulkan Line Decor dan disetujui Tama" }
];

const defaultTasks = [
    { id: "TSK-001", title: "Booking Aula Badarusamsi Ditkuad", timeline: "H-9", assignee: "Indah", completed: true },
    { id: "TSK-002", title: "DP Komala Catering Lembang", timeline: "H-9", assignee: "Tama", completed: true },
    { id: "TSK-003", title: "Konsep Rapat Line Decor", timeline: "H-6", assignee: "Aura WO", completed: false },
    { id: "TSK-004", title: "Fitting Busana Azmi Amalia", timeline: "H-3", assignee: "Indah", completed: false },
    { id: "TSK-005", title: "Rapat Rinci Susunan Acara", timeline: "H-3", assignee: "Aura WO", completed: false },
    { id: "TSK-006", title: "Pelunasan Seluruh Vendor", timeline: "H-1", assignee: "Tama", completed: false }
];

const defaultGuests = [
    { id: "GST-001", name: "Budi Santoso & Istri", party: "Indah", rsvp: "Hadir", pax: 2, table_no: "Meja 1" },
    { id: "GST-002", name: "Singgih Prasetyo", party: "Tama", rsvp: "Hadir", pax: 1, table_no: "Meja 3" },
    { id: "GST-003", name: "Rekan Kerja Singapura", party: "Tama", rsvp: "Pending", pax: 4, table_no: null },
    { id: "GST-004", name: "Keluarga Besar Bandung", party: "Keluarga", rsvp: "Hadir", pax: 10, table_no: "Meja Keluarga 1" },
    { id: "GST-005", name: "Keluarga Besar Jakarta", party: "Keluarga", rsvp: "Pending", pax: 5, table_no: null }
];

const defaultProjectsList = [
    {
        id: "WD-AURA-002",
        title: "Indah & Tama's Wedding",
        targetDate: "2027-03-20",
        budgetLimit: 350000000,
        gasApiUrl: "",
        roles: [
            {
                roleName: "client_decider",
                label: "Decider (Tama)",
                email: "tama.decider@sg-corp.com",
                password: "270327",
                permissions: {
                    canEditVendor: true,
                    canEditBudget: true,
                    canEditMilestone: true,
                    canVerifyPayment: true
                }
            },
            {
                roleName: "client_initiator",
                label: "Initiator (Indah)",
                email: "indah.adr@gmail.com",
                password: "270327",
                permissions: {
                    canEditVendor: true,
                    canEditBudget: false,
                    canEditMilestone: false,
                    canVerifyPayment: false
                }
            },
            {
                roleName: "wedding_planner",
                label: "Planner (Aura WO)",
                email: "wp_planner@aurawedding.com",
                password: "270327",
                permissions: {
                    canEditVendor: true,
                    canEditBudget: true,
                    canEditMilestone: true,
                    canVerifyPayment: false
                }
            }
        ]
    }
];

// Active State of Local App
let appState = {
    isLoggedIn: false,
    userEmail: "indah.adr@gmail.com",
    userRole: "client_initiator",
    weddingId: "WD-AURA-002",
    budgetLimit: 350000000,
    vendors: [],
    logs: [],
    tasks: [],
    guests: [],
    payments: [],
    activeCategory: "All",
    activeStatus: "All",
    activeTaskFilter: "All",
    activeGuestFilter: "All",
    activeGuestRSVPFilter: "All",
    gasApiUrl: "",
    projects: []
};

let saActiveProjectId = "";
